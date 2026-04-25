import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { encrypt } from "@/lib/crypto";

// ══════════════════════════════════════════════════════════════
// /api/whatsapp/encrypt-token — تشفير access_token قبل حفظه في DB
// نفصل هذا عن صفحة الإعدادات عشان نستفيد من ENCRYPTION_SECRET في الخادم
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

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON غير صالح" }, { status: 400 });
  }
  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "token مطلوب" }, { status: 400 });
  }
  if (body.token.length > 1000) {
    return NextResponse.json({ error: "token طويل جداً" }, { status: 400 });
  }

  try {
    const encrypted = await encrypt(body.token);
    return NextResponse.json({ encrypted });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "فشل التشفير"
    }, { status: 500 });
  }
}
