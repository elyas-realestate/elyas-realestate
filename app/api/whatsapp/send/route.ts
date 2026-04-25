import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendText, normalizePhone } from "@/lib/whatsapp";

// ══════════════════════════════════════════════════════════════
// /api/whatsapp/send — إرسال رسالة من الداشبورد
// body: { to: "9665xxxxxxxx", text: "..." }
// ══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  // Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // tenant_id
  const { data: tenant } = await supabase
    .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
  let tenantId = tenant?.id;
  if (!tenantId) {
    const { data: m } = await supabase
      .from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
    tenantId = m?.tenant_id;
  }
  if (!tenantId) return NextResponse.json({ error: "لم يُعثر على المستأجر" }, { status: 400 });

  // body
  let body: { to?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  if (!body.to || !body.text) {
    return NextResponse.json({ error: "to و text مطلوبان" }, { status: 400 });
  }
  if (body.text.length > 4000) {
    return NextResponse.json({ error: "النص طويل جداً" }, { status: 400 });
  }

  const result = await sendText({
    tenantId,
    toPhone: normalizePhone(body.to),
    text: body.text,
  });

  if (!result.ok && !result.waMeUrl) {
    return NextResponse.json({ error: result.error || "فشل الإرسال" }, { status: 500 });
  }

  return NextResponse.json(result);
}
