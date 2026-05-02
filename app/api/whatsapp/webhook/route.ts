import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logIncomingMessage, sendText } from "@/lib/whatsapp";
import { generateText, type AIProvider } from "@/lib/ai-call";
import { sendPushToTenant } from "@/lib/push";
import { buildEmployeeContext, logEmployeeActivity } from "@/lib/ai-org-context";
import { checkAndMaybeSubmit } from "@/lib/approval-gates";
import { assertSystemActive, incrementCallCount } from "@/lib/system-gate";

// ══════════════════════════════════════════════════════════════
// /api/whatsapp/webhook — Meta Cloud API receiver
//
// GET  → التحقق من Meta challenge (مرة واحدة عند ربط الـ webhook)
// POST → استقبال الرسائل الواردة + dispatch للـ auto-reply
//
// متغيرات البيئة المطلوبة:
//   META_WEBHOOK_VERIFY_TOKEN   ← قيمة عشوائية تختارها أنت وتدخلها في Meta
//   SUPABASE_SERVICE_ROLE_KEY   ← متاح أصلاً
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// GET: Meta verification challenge
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN || "";

  if (mode === "subscribe" && token && expected && token === expected) {
    return new NextResponse(challenge || "", { status: 200 });
  }

  return new NextResponse("forbidden", { status: 403 });
}

// ─────────────────────────────────────────────────────────────
// POST: incoming messages
// ─────────────────────────────────────────────────────────────
interface MetaWebhookPayload {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: { phone_number_id?: string; display_phone_number?: string };
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          image?: { id?: string; caption?: string };
          location?: { latitude?: number; longitude?: number };
          interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
        }>;
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        statuses?: Array<{ id?: string; status?: string; recipient_id?: string }>;
      };
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  let body: MetaWebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // أعد 200 سريعاً ثم عالج (Meta يرسل retries لو ما رجع 200 خلال 20ث)
  // معالجة Async بدون انتظار لكن نرجع 200 مباشرة
  processWebhook(body).catch((e) => {
    console.error("[whatsapp/webhook] processing error:", e);
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function processWebhook(body: MetaWebhookPayload) {
  if (body.object !== "whatsapp_business_account") return;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      // اعثر على tenant_id
      const { data: tid } = await admin.rpc("tenant_by_whatsapp_phone_id", { pn_id: phoneNumberId });
      if (!tid) {
        console.warn(`[whatsapp/webhook] no tenant for phone_number_id=${phoneNumberId}`);
        continue;
      }
      const tenantId = tid as string;

      // ── status updates (delivered/read/failed) ──
      for (const s of value.statuses || []) {
        if (!s.id || !s.status) continue;
        await admin
          .from("whatsapp_messages")
          .update({ status: s.status })
          .eq("meta_message_id", s.id);
      }

      // ── incoming messages ──
      for (const msg of value.messages || []) {
        if (!msg.from) continue;

        const contactProfile = (value.contacts || []).find((c) => c.wa_id === msg.from);
        const contactName = contactProfile?.profile?.name;

        let bodyText = "";
        let messageType: "text" | "image" | "location" | "interactive" = "text";

        if (msg.type === "text") {
          bodyText = msg.text?.body || "";
        } else if (msg.type === "image") {
          bodyText = msg.image?.caption || "[صورة]";
          messageType = "image";
        } else if (msg.type === "location") {
          bodyText = `[موقع] ${msg.location?.latitude},${msg.location?.longitude}`;
          messageType = "location";
        } else if (msg.type === "interactive") {
          bodyText =
            msg.interactive?.button_reply?.title ||
            msg.interactive?.list_reply?.title ||
            "[رد تفاعلي]";
          messageType = "interactive";
        } else {
          bodyText = `[نوع غير مدعوم: ${msg.type}]`;
        }

        const messageId = await logIncomingMessage({
          tenantId,
          contactPhone: msg.from,
          contactName,
          bodyText,
          messageType,
          metaMessageId: msg.id,
        });

        // ── Push للوسيط بأن فيه رسالة جديدة ──
        sendPushToTenant(tenantId, {
          title: `💬 رسالة جديدة — ${contactName || msg.from}`,
          body: bodyText.slice(0, 100),
          url: "/dashboard/whatsapp/inbox",
          tag: `wa-${msg.from}`,
        }).catch((e) => console.warn("[whatsapp/webhook] push failed:", e));

        // ── Auto-reply (إذا مفعَّل) ──
        if (msg.type === "text" && bodyText) {
          await maybeAutoReply(admin, tenantId, msg.from, bodyText, contactName, messageId);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Auto-reply with property search
// ─────────────────────────────────────────────────────────────
type WAConfig = { auto_reply_enabled?: boolean; ai_provider?: string; ai_model?: string };
type BrokerIdentity = { broker_name?: string; specialization?: string; writing_tone?: string; coverage_areas?: string | string[] };

// ─────────────────────────────────────────────────────────────
// K-9: CEO Assistant routing — يفحص هل المرسل هو CEO (المالك)
// ─────────────────────────────────────────────────────────────
async function isCEOPhone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  tenantId: string,
  phone: string
): Promise<boolean> {
  const { data: cfg } = await admin
    .from("tenant_ai_config")
    .select("ceo_phones")
    .eq("tenant_id", tenantId)
    .eq("target_kind", "employee")
    .not("ceo_phones", "is", null)
    .limit(1)
    .maybeSingle();

  if (!cfg?.ceo_phones || !Array.isArray(cfg.ceo_phones)) return false;
  return cfg.ceo_phones.includes(phone);
}

/**
 * K-9: معالجة رسالة من CEO عبر السكرتير الشخصي (ceo_assistant)
 */
async function handleCEOMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  tenantId: string,
  fromPhone: string,
  text: string,
  contactName: string | undefined,
  inboundMessageId: string | null
) {
  // ✨ بوّاب التشغيل: لو النظام متوقف، لا نرد
  const gate = await assertSystemActive(tenantId);
  if (!gate.ok) {
    await admin.from("org_activity_log").insert({
      tenant_id: tenantId, actor_kind: "system", action: "whatsapp_ceo_skipped",
      details: { reason: gate.reason, gated: true, from: fromPhone }
    });
    return;
  }

  // ── K-9 Phase 2: محاولة استدعاء أداة من الأدوات السبعة قبل LLM ──
  const { detectIntent, executeIntent } = await import("@/lib/ceo-tools");
  const intent = detectIntent(text);
  if (intent !== "none") {
    const toolResult = await executeIntent(intent, tenantId, text);
    if (toolResult) {
      await sendText({ tenantId, toPhone: fromPhone, text: toolResult, contactName });
      if (inboundMessageId) {
        await admin
          .from("whatsapp_messages")
          .update({ ai_intent: `ceo_tool:${intent}`, ai_replied: true } as never)
          .eq("id", inboundMessageId);
      }
      // تسجيل
      const ctx0 = await buildEmployeeContext(tenantId, "ceo_assistant");
      if (ctx0) {
        await logEmployeeActivity({
          tenantId,
          employeeId: ctx0.employee.id,
          action: `ceo_tool_${intent}`,
          details: { from: fromPhone, text_summary: text.slice(0, 200), tool_used: intent },
        });
      }
      return;
    }
  }

  // ── fallback: LLM يولّد رداً (للأسئلة المفتوحة/غير المنظَّمة) ──
  const ctx = await buildEmployeeContext(tenantId, "ceo_assistant");
  if (!ctx) {
    await sendText({
      tenantId,
      toPhone: fromPhone,
      text: "السكرتير غير جاهز حالياً. تواصل عبر الداشبورد.",
      contactName,
    });
    return;
  }

  const userPrompt = `أمر/سؤال من الأستاذ إلياس:
"${text}"

أنت سكرتيره الشخصي المباشر. رد فوراً بأسلوب احترافي ودود (٣ أسطر كحد أقصى).

قواعد مهمّة:
1. لا تطلب توجيه من المدير — أنت السكرتير، تتصرّف باستقلالية.
2. لو السؤال يحتاج بيانات (صفقات، عملاء، عقارات، مهام، طلبات): النظام كان يجب أن يجلبها قبلك تلقائياً. لو وصلتك الرسالة بدون بيانات، فهذا سؤال عام — أجب بمعرفتك العامة عن المنصة.
3. لو السؤال غامض، اقترح ٢-٣ خيارات للتوضيح بدل طلب توجيه فارغ.
4. لو سؤال شخصي/تحفيزي، رد بدفء مهني.

أمثلة:
- "كيف الحال؟" → "بخير الحمد لله، جاهز لخدمتك. اليوم في صفقة قيد المتابعة وعميلين ساخنين."
- "ذكّرني بشي" → "تحب أذكّرك بـ: متابعة عميل، موعد معاينة، أو عقد قرب التوقيع؟"
- "ايش رأيك" → "محتاج تخصّص أكثر — رأيي بـ: عقار معين، صفقة، أو قرار؟"

ابدأ ردّك مباشرة بدون مقدمات. لا تقل "أحتاج توجيه".`;

  let reply = "";
  try {
    reply = await generateText({
      provider: ctx.employee.ai_provider,
      model: ctx.employee.ai_model,
      systemPrompt: ctx.systemPrompt,
      userPrompt,
      maxTokens: 500,
      temperature: 0.5,
    });
    await incrementCallCount(tenantId);
  } catch (e) {
    console.warn("[whatsapp/webhook] CEO assistant generation failed:", e);
    reply = "حدث خلل تقني مؤقت. أعد المحاولة بعد دقيقة.";
  }

  if (!reply || reply.length < 3) return;

  await sendText({
    tenantId,
    toPhone: fromPhone,
    text: reply,
    contactName,
  });

  // تحديث inbound message
  if (inboundMessageId) {
    await admin
      .from("whatsapp_messages")
      .update({
        ai_intent: "ceo_command",
        ai_replied: true,
      } as never)
      .eq("id", inboundMessageId);
  }

  // تسجيل النشاط
  await logEmployeeActivity({
    tenantId,
    employeeId: ctx.employee.id,
    action: "ceo_assistant_replied",
    details: {
      from: fromPhone,
      text_summary: text.slice(0, 200),
      reply_length: reply.length,
      directives_applied: ctx.directiveCount,
      kb_items_loaded: ctx.kbCount,
    },
  });
}

async function maybeAutoReply(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  tenantId: string,
  fromPhone: string,
  text: string,
  contactName: string | undefined,
  inboundMessageId: string | null
) {
  // K-9: لو المرسل هو CEO → معالجة عبر السكرتير الشخصي
  if (await isCEOPhone(admin, tenantId, fromPhone)) {
    return await handleCEOMessage(admin, tenantId, fromPhone, text, contactName, inboundMessageId);
  }

  // تحقق من تفعيل auto_reply
  const { data: cfgData } = await admin
    .from("whatsapp_config")
    .select("auto_reply_enabled, ai_provider, ai_model")
    .eq("tenant_id", tenantId)
    .single();
  const cfg = cfgData as WAConfig | null;
  if (!cfg?.auto_reply_enabled) return;

  // ✨ بوّاب التشغيل: لو النظام متوقف، لا نرد على العملاء
  const clientGate = await assertSystemActive(tenantId);
  if (!clientGate.ok) {
    await admin.from("org_activity_log").insert({
      tenant_id: tenantId, actor_kind: "system", action: "whatsapp_client_skipped",
      details: { reason: clientGate.reason, gated: true, from: fromPhone }
    });
    return;
  }

  // هوية الوسيط للـ system prompt
  const { data: identityData } = await admin
    .from("broker_identity")
    .select("broker_name, specialization, writing_tone, coverage_areas")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  const identity = identityData as BrokerIdentity | null;

  // خطوة 1: استنتاج النية + استخراج معايير البحث
  const intent = await classifyAndExtract(text);

  // خطوة 2: لو كانت رغبة بحث عقاري — اجلب 3 مطابقات
  let matchedProperties: Array<{ id: string; title: string; city?: string; district?: string; price?: number; rooms?: number }> = [];
  if (intent.intent === "property_search") {
    const q = admin.from("properties")
      .select("id, title, city, district, price, rooms, main_category, offer_type")
      .eq("tenant_id", tenantId)
      .eq("is_published", true);

    let query = q;
    if (intent.city) query = query.ilike("city", `%${intent.city}%`);
    if (intent.district) query = query.ilike("district", `%${intent.district}%`);
    if (intent.offer_type) query = query.eq("offer_type", intent.offer_type);
    if (intent.max_price) query = query.lte("price", intent.max_price);

    const { data } = await query.limit(3);
    matchedProperties = (data || []) as typeof matchedProperties;
  }

  // خطوة 3: توليد رد ذكي — استخدام محرّك التوجيهات K-5
  const ctx = await buildEmployeeContext(tenantId, "whatsapp_qualifier");

  const propsContext = matchedProperties.length > 0
    ? "العقارات المطابقة المتوفرة الآن:\n" + matchedProperties.map((p, i) =>
        `${i + 1}. ${p.title} — ${p.district || ""} ${p.city || ""}${p.rooms ? `، ${p.rooms} غرف` : ""}${p.price ? ` — ${Number(p.price).toLocaleString("en-US")} ر.س` : ""}`
      ).join("\n")
    : "";

  // إذا الـ context متاح، نستخدم system prompt الديناميكي. وإلا نرجع للـ prompt القديم
  const systemPrompt = ctx?.systemPrompt
    || `أنت مساعد رد تلقائي لوسيط عقاري سعودي${identity?.broker_name ? ` اسمه ${identity.broker_name}` : ""}.
${identity?.specialization ? `التخصص: ${identity.specialization}.` : ""}
ردّك: قصير (60-100 كلمة)، عربي فصيح، نبرة دافئة احترافية، بدون emojis، لا تختلق معلومات.`;

  // المزوّد والنموذج: من الـ context أو من whatsapp_config (احتياطياً)
  const provider = (ctx?.employee.ai_provider || (cfg.ai_provider as string) || "openai") as AIProvider;
  const model = ctx?.employee.ai_model || cfg.ai_model;

  const userPrompt = `العميل (${contactName || fromPhone}) قال:
"${text}"

${propsContext ? propsContext + "\n\n" : ""}اكتب الرد المناسب فقط (بدون شرح أو عناوين).`;

  let reply = "";
  try {
    reply = await generateText({
      provider,
      model,
      systemPrompt,
      userPrompt,
      maxTokens: 400,
      temperature: 0.7,
    });
    await incrementCallCount(tenantId);
  } catch (e) {
    console.warn("[whatsapp/webhook] AI generation failed:", e);
    reply = identity?.broker_name
      ? `أهلاً وسهلاً، معك ${identity.broker_name}. سأرد عليك خلال دقائق.`
      : "أهلاً وسهلاً، شكراً لتواصلك. سيتم الرد عليك قريباً.";
  }

  if (!reply || reply.length < 5) return;

  // ── خطوة 3.5: بوّابة الموافقة (K-7) ──
  // فحص الرد قبل الإرسال — هل يحتوي إجراءً حرجاً؟
  const riskTags: string[] = [];
  // سعر صريح في الرد
  if (/\b\d{3,}[\s,]*\d*\s*(ر\.?س|ريال|SAR)/i.test(reply) || intent.intent === "price_inquiry") {
    riskTags.push("price_quote", "commit_to_price");
  }
  // وعد قانوني / التزام
  if (/(أتعهّد|أتعهد|نضمن|نلتزم|توقيع|عقد|ملزم|نوقّع)/i.test(reply)) {
    riskTags.push("legal_promise");
  }
  // مشاركة جوال (تسرّب رقم مالك)
  if (/(\+?966|05)\d{8,}/.test(reply)) {
    riskTags.push("share_owner_contact");
  }

  if (riskTags.length > 0) {
    const gate = await checkAndMaybeSubmit({
      tenantId,
      employeeCode: "whatsapp_qualifier",
      ctx: {
        action_kind: "send_whatsapp_reply",
        tags: riskTags,
        summary: `رد مقترح للعميل ${contactName || fromPhone}:\n\n${reply}\n\nرسالة العميل الأصلية: "${text}"`,
        payload: {
          to_phone: fromPhone,
          contact_name: contactName,
          customer_message: text,
          proposed_reply: reply,
          intent: intent.intent,
          matched_property_ids: matchedProperties.map(p => p.id),
        },
      },
      escalationTitle: `رد واتساب يحتاج موافقتك (${riskTags.join("، ")})`,
      escalationDescription: `الموظف whatsapp_qualifier يحاول الرد على ${contactName || fromPhone} برد يحتوي تصنيفات حسّاسة. القرار بانتظارك.`,
      expiresInMinutes: 360, // ٦ ساعات
    });

    if (!gate.allowed) {
      // أرسل رد بديل آمن + سجّل
      const safeReply = identity?.broker_name
        ? `أهلاً وسهلاً، معك ${identity.broker_name}. وصلتني رسالتك وسأرد عليك خلال دقائق بإذن الله.`
        : "أهلاً وسهلاً، وصلتني رسالتك وسأرد عليك خلال دقائق بإذن الله.";

      const safeSend = await sendText({
        tenantId,
        toPhone: fromPhone,
        text: safeReply,
        contactName,
      });

      if (inboundMessageId) {
        await admin
          .from("whatsapp_messages")
          .update({
            ai_intent: intent.intent,
            ai_replied: safeSend.ok,
            matched_property_ids: matchedProperties.map((p) => p.id),
          } as never)
          .eq("id", inboundMessageId);
      }

      if (ctx) {
        await logEmployeeActivity({
          tenantId,
          employeeId: ctx.employee.id,
          action: "approval_required_whatsapp",
          details: {
            contact: fromPhone,
            intent: intent.intent,
            risk_tags: riskTags,
            escalation_id: gate.escalationId,
            verdict: gate.verdict.decision,
          },
        });
      }
      return; // أوقف هنا — CEO سيقرر
    }
  }

  // خطوة 4: إرسال الرد + تسجيله
  const sendResult = await sendText({
    tenantId,
    toPhone: fromPhone,
    text: reply,
    contactName,
  });

  // خطوة 5: تحديث الرسالة الواردة (intent + matched_property_ids + ai_replied)
  if (inboundMessageId) {
    await admin
      .from("whatsapp_messages")
      .update({
        ai_intent: intent.intent,
        ai_replied: sendResult.ok,
        matched_property_ids: matchedProperties.map((p) => p.id),
      } as never)
      .eq("id", inboundMessageId);
  }

  // ✨ تسجيل النشاط (إذا الـ context متاح)
  if (ctx) {
    await logEmployeeActivity({
      tenantId,
      employeeId: ctx.employee.id,
      action: "auto_replied_whatsapp",
      details: {
        contact: fromPhone,
        intent: intent.intent,
        properties_matched: matchedProperties.length,
        directives_applied: ctx.directiveCount,
        kb_items_loaded: ctx.kbCount,
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Intent classification (rule-based first, AI fallback)
// ─────────────────────────────────────────────────────────────
interface IntentResult {
  intent: "greeting" | "property_search" | "price_inquiry" | "general";
  city?: string;
  district?: string;
  offer_type?: string;
  max_price?: number;
}

async function classifyAndExtract(text: string): Promise<IntentResult> {
  const t = text.toLowerCase();

  // Quick rule-based intent
  let intent: IntentResult["intent"] = "general";
  if (/سلام|مرحبا|أهلا|هاي|hi|hello/.test(t)) intent = "greeting";
  if (/ابي|أبي|ابغى|أبغى|بدي|أبحث|ابحث|عقار|شقة|فيلا|أرض|دور|بيت|منزل|محل|مكتب|عمارة/.test(t))
    intent = "property_search";
  if (/كم سعر|كم قيمة|قيمته|الثمن|بكم/.test(t)) intent = "price_inquiry";

  // Quick city extraction (Saudi major cities)
  const cities = ["الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر", "الظهران", "الطائف", "أبها", "تبوك", "بريدة", "حائل", "نجران", "ينبع"];
  let city: string | undefined;
  for (const c of cities) if (text.includes(c)) { city = c; break; }

  // Offer type
  let offerType: string | undefined;
  if (/إيجار|للإيجار|إستئجار|استئجار/.test(text)) offerType = "إيجار";
  else if (/للبيع|بيع|شراء/.test(text)) offerType = "بيع";

  // Max price (search for numbers followed by ريال/ر.س/ك)
  const priceMatch = text.match(/(\d{1,3}(?:[,،]\d{3})*|\d+)\s*(?:الف|ألف|ك|مليون)?/);
  let maxPrice: number | undefined;
  if (priceMatch) {
    const raw = priceMatch[1].replace(/[,،]/g, "");
    let n = parseInt(raw, 10);
    if (/مليون/.test(text)) n = n * 1_000_000;
    else if (/الف|ألف|ك/.test(text)) n = n * 1000;
    if (n > 1000) maxPrice = n;
  }

  return { intent, city, offer_type: offerType, max_price: maxPrice };
}
