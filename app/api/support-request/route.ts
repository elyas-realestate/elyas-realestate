import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// ══════════════════════════════════════════════════════════════
// /api/support-request — إنشاء طلب دعم جديد
// POST: ينشئ سجل في support_requests + (اختياري) ينبّه السكرتير
// GET:  يجلب طلبات الـ tenant الحالي
// ══════════════════════════════════════════════════════════════

interface SupportPayload {
  subject: string;
  message: string;
  category?: string;
  contact_email?: string;
  contact_phone?: string;
  preferred_method?: "whatsapp" | "email" | "phone";
  page_url?: string;
}

const VALID_CATEGORIES = ["general", "bug", "feature_request", "billing", "urgent", "other"];

export async function POST(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  let body: SupportPayload;
  try {
    body = (await req.json()) as SupportPayload;
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }

  // تحقق من الحقول
  const subject = String(body.subject || "")
    .trim()
    .slice(0, 200);
  const message = String(body.message || "")
    .trim()
    .slice(0, 5000);
  if (!subject || !message) {
    return NextResponse.json({ error: "العنوان والرسالة مطلوبان" }, { status: 400 });
  }
  if (subject.length < 3 || message.length < 10) {
    return NextResponse.json({ error: "الرسالة قصيرة جداً" }, { status: 400 });
  }

  const category = VALID_CATEGORIES.includes(body.category || "") ? body.category! : "general";
  const preferred_method = ["whatsapp", "email", "phone"].includes(body.preferred_method || "")
    ? body.preferred_method!
    : "whatsapp";

  // ابحث عن tenant_id
  const { data: t } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  let tenantId = t?.id as string | undefined;
  if (!tenantId) {
    const { data: m } = await supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    tenantId = m?.tenant_id as string | undefined;
  }

  // أنشئ الطلب (RLS يضمن تطابق user_id)
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) || null;

  const { data: created, error } = await supabase
    .from("support_requests")
    .insert({
      tenant_id: tenantId || null,
      user_id: user.id,
      subject,
      message,
      category,
      contact_email: body.contact_email?.slice(0, 200) || user.email || null,
      contact_phone: body.contact_phone?.slice(0, 30) || null,
      preferred_method,
      page_url: body.page_url?.slice(0, 500) || null,
      user_agent: userAgent,
      status: "open",
    })
    .select("id, created_at, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: created.id,
    created_at: created.created_at,
    message: "تم استلام طلبك بنجاح. سنتواصل معك قريباً.",
  });
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { data, error } = await supabase
    .from("support_requests")
    .select("id, subject, category, status, created_at, resolved_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data || [] });
}
