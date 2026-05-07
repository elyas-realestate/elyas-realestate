import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

// ══════════════════════════════════════════════════════════════════
// /api/beta-feedback — استقبال feedback من الوسطاء
// POST { category, message, severity?, page_url?, user_email?, user_name? }
// ══════════════════════════════════════════════════════════════════

const VALID_CATEGORIES = ["bug", "feature", "question", "compliment", "other"];
const VALID_SEVERITIES = ["low", "normal", "high", "critical"];

interface Payload {
  category: string;
  severity?: string;
  message: string;
  page_url?: string;
  user_email?: string;
  user_name?: string;
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 طلبات بالساعة لكل IP
  const rl = checkRateLimit(getClientKey(req), {
    maxRequests: 5,
    windowSeconds: 60 * 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `تم تجاوز الحد المسموح. حاول بعد ${Math.ceil((rl.retryAfterSeconds || 0) / 60)} دقيقة.`,
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } }
    );
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON غير صالح" }, { status: 400 });
  }

  const category = String(body.category || "").trim().toLowerCase();
  const severity = String(body.severity || "normal").trim().toLowerCase();
  const message = String(body.message || "").trim().slice(0, 4000);

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { ok: false, error: "category غير صالح" },
      { status: 400 }
    );
  }
  if (!VALID_SEVERITIES.includes(severity)) {
    return NextResponse.json(
      { ok: false, error: "severity غير صالح" },
      { status: 400 }
    );
  }
  if (!message || message.length < 5) {
    return NextResponse.json(
      { ok: false, error: "الرسالة قصيرة جداً (5 أحرف على الأقل)" },
      { status: 400 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // محاولة معرفة tenant_id إذا كان مسجّل دخول
  let tenant_id: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: userData } = await supabaseAuth.auth.getUser();
      if (userData.user) {
        const { data: tenant } = await admin
          .from("tenants")
          .select("id")
          .eq("owner_id", userData.user.id)
          .maybeSingle();
        tenant_id = tenant?.id || null;
      }
    } catch {}
  }

  const { error } = await admin.from("beta_feedback").insert([
    {
      tenant_id,
      user_email: body.user_email ? String(body.user_email).slice(0, 200) : null,
      user_name: body.user_name ? String(body.user_name).slice(0, 120) : null,
      category,
      severity,
      message,
      page_url: body.page_url ? String(body.page_url).slice(0, 500) : null,
      user_agent: req.headers.get("user-agent") || null,
      status: "new",
    },
  ]);

  if (error) {
    console.error("[beta-feedback] insert error:", error);
    return NextResponse.json(
      { ok: false, error: "فشل حفظ الملاحظة" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "شكراً! تم استلام ملاحظتك." });
}
