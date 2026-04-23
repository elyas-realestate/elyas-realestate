import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateText, type AIProvider } from "@/lib/ai-call";

// ══════════════════════════════════════════════════════════════
// /api/cron/ai-marketing — موظف التسويق
// يعمل يومياً الساعة 10 صباحاً (Vercel cron)
// لكل مستأجر مفعِّل الميزة:
//   1. يأخذ أفضل 3 عقارات منشورة في آخر 7 أيام
//   2. يُولِّد 3 منشورات (twitter/instagram/whatsapp) لكل عقار
//   3. يحفظها في marketing_queue بحالة pending لمراجعة الوسيط
// الحماية: Authorization: Bearer $CRON_SECRET
// ══════════════════════════════════════════════════════════════

const CHANNELS = ["twitter", "instagram", "whatsapp"] as const;

interface TenantSettings {
  tenant_id: string;
  marketer_enabled: boolean;
  voice_style: string;
  language: string;
  ai_provider: string;
  ai_model: string;
}

interface Property {
  id: string;
  tenant_id: string;
  title: string;
  city?: string | null;
  district?: string | null;
  main_category?: string | null;
  offer_type?: string | null;
  price?: number | null;
  rooms?: number | null;
  land_area?: number | null;
  description?: string | null;
}

function authOK(req: NextRequest): boolean {
  const hdr = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  return process.env.CRON_SECRET ? hdr === expected : true;
}

function channelGuidance(channel: string): string {
  switch (channel) {
    case "twitter":
      return "تغريدة لا تتجاوز 280 حرف، عربي فصيح، عاطفية-احترافية، 2-3 هاشتاقات عقارية سعودية.";
    case "instagram":
      return "منشور إنستجرام 100-150 كلمة، عناوين جذابة، emojis قليلة ومناسبة، 5-8 هاشتاقات.";
    case "whatsapp":
      return "رسالة واتساب مباشرة 60-100 كلمة، بلا هاشتاقات، نبرة ودّية مهنية، دعوة للتواصل في الختام.";
    default:
      return "";
  }
}

function propertyBrief(p: Property): string {
  const parts: string[] = [];
  if (p.title) parts.push(p.title);
  if (p.main_category) parts.push(p.main_category);
  if (p.offer_type) parts.push(p.offer_type);
  if (p.city || p.district) parts.push(`الموقع: ${[p.district, p.city].filter(Boolean).join(", ")}`);
  if (p.price) parts.push(`السعر: ${Number(p.price).toLocaleString("en-US")} ر.س`);
  if (p.rooms) parts.push(`الغرف: ${p.rooms}`);
  if (p.land_area) parts.push(`المساحة: ${p.land_area} م²`);
  if (p.description) parts.push(`الوصف: ${p.description.slice(0, 400)}`);
  return parts.join(" | ");
}

export async function GET(req: NextRequest) {
  if (!authOK(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) المستأجرون المفعِّلون للميزة + نشطون
  const { data: settingsList, error: settingsErr } = await admin
    .from("ai_employee_settings")
    .select("tenant_id, marketer_enabled, voice_style, language, ai_provider, ai_model")
    .eq("marketer_enabled", true);

  if (settingsErr) return NextResponse.json({ error: settingsErr.message }, { status: 500 });

  const tenants = (settingsList || []) as TenantSettings[];
  const results: Array<{ tenant_id: string; ok: boolean; inserted: number; error?: string }> = [];

  for (const t of tenants) {
    try {
      // 2) تحقق أن المستأجر نشط
      const { data: tenantRow } = await admin
        .from("tenants").select("is_active").eq("id", t.tenant_id).single();
      if (!tenantRow?.is_active) continue;

      // 3) هوية الوسيط — للتوجيه الأسلوبي
      const { data: identity } = await admin
        .from("broker_identity")
        .select("broker_name, specialization, writing_tone, brand_keywords, coverage_areas")
        .eq("tenant_id", t.tenant_id)
        .maybeSingle();

      // 4) أحدث 3 عقارات منشورة في آخر 7 أيام
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const { data: properties } = await admin
        .from("properties")
        .select("id, tenant_id, title, city, district, main_category, offer_type, price, rooms, land_area, description")
        .eq("tenant_id", t.tenant_id)
        .eq("is_published", true)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
        .limit(3);

      const props = (properties || []) as Property[];
      if (props.length === 0) {
        results.push({ tenant_id: t.tenant_id, ok: true, inserted: 0 });
        continue;
      }

      // 5) لكل عقار — توليد 3 منشورات
      const brand = [
        identity?.broker_name && `اسم الوسيط: ${identity.broker_name}`,
        identity?.specialization && `التخصص: ${identity.specialization}`,
        identity?.writing_tone && `نبرة الكتابة المفضلة: ${identity.writing_tone}`,
        identity?.brand_keywords && `كلمات مفتاحية: ${Array.isArray(identity.brand_keywords) ? identity.brand_keywords.join(", ") : identity.brand_keywords}`,
      ].filter(Boolean).join("\n");

      const systemPrompt = `أنت موظف تسويق عقاري محترف في السوق السعودي.
${brand}
اكتب بالعربية الفصحى، اجعل المحتوى يجذب المشترين المحتملين، وركّز على فائدة واضحة.
لا تضع معلومات غير واردة في بيانات العقار.
لا تستخدم كلمات مثل "للبيع حصري" إلا إذا كانت فعلاً كذلك.`;

      let insertedForTenant = 0;

      for (const p of props) {
        for (const channel of CHANNELS) {
          const userPrompt = `عقار:
${propertyBrief(p)}

المنصّة: ${channel}
التعليمات للقناة: ${channelGuidance(channel)}

أعطني المنشور مباشرةً بدون أي شرح أو عنوان، فقط المحتوى النهائي الجاهز للنشر.`;

          let content: string;
          try {
            content = await generateText({
              provider: (t.ai_provider || "openai") as AIProvider,
              model: t.ai_model || undefined,
              systemPrompt,
              userPrompt,
              temperature: 0.85,
              maxTokens: 600,
            });
          } catch (e) {
            console.warn(`[ai-marketing] generateText failed for tenant ${t.tenant_id} property ${p.id} channel ${channel}:`, e);
            continue;
          }

          if (!content || content.length < 10) continue;

          // استخراج هاشتاقات من النص (للتخزين المنفصل)
          const hashtags = Array.from(new Set(
            (content.match(/#\S+/g) || []).map(h => h.replace(/[#]/g, "")).filter(Boolean)
          )).slice(0, 10);

          const { error: insErr } = await admin
            .from("marketing_queue")
            .insert({
              tenant_id: t.tenant_id,
              property_id: p.id,
              channel,
              content,
              hashtags,
              status: "pending",
              generated_by_model: `${t.ai_provider || "openai"}:${t.ai_model || "default"}`,
            });

          if (!insErr) insertedForTenant++;
        }
      }

      results.push({ tenant_id: t.tenant_id, ok: true, inserted: insertedForTenant });
    } catch (e) {
      results.push({
        tenant_id: t.tenant_id,
        ok: false,
        inserted: 0,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    ran_at: new Date().toISOString(),
    tenants_processed: tenants.length,
    results,
  });
}
