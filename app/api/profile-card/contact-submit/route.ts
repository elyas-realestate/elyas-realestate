import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// نقطة استقبال submissions من نماذج contact في البطاقات العامة (بدون auth)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, link_id, name, phone, email, message } = body;

    if (!slug || !name?.trim()) {
      return NextResponse.json({ error: "slug و name مطلوبان" }, { status: 400 });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!tenant) return NextResponse.json({ error: "tenant غير موجود" }, { status: 404 });

    const { error } = await admin.from("profile_submissions").insert({
      tenant_id: tenant.id,
      link_id: link_id || null,
      visitor_name: name.slice(0, 200),
      phone: phone?.slice(0, 50) || null,
      email: email?.slice(0, 200) || null,
      message: message?.slice(0, 5000) || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "خطأ" }, { status: 500 });
  }
}
