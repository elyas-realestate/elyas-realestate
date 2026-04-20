import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { validateSlug } from "@/lib/slug-validation";

export async function POST(req: NextRequest) {
  // ── Auth ──
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const body = await req.json();
  const slug = (body.slug || "").toLowerCase().trim();

  // ── Validation ──
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // ── تحقق أن الـ slug غير مستخدم من شخص آخر ──
  const { data: existing } = await authClient
    .from("tenants")
    .select("id, owner_id")
    .eq("slug", slug)
    .limit(1)
    .single();

  if (existing && existing.owner_id !== user.id) {
    return NextResponse.json({ error: "هذا الرابط محجوز من حساب آخر" }, { status: 409 });
  }

  // ── تحديث ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("tenants")
    .update({ slug })
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: "فشل التحديث — حاول مجدداً" }, { status: 500 });

  return NextResponse.json({ success: true, slug });
}
