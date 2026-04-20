import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validateSlug } from "@/lib/slug-validation";

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get("slug")?.toLowerCase().trim() || "";

  // تحقق من الصيغة أولاً
  const validation = validateSlug(slug);
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error });
  }

  // تحقق من التوفر في DB
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );

  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .limit(1)
    .single();

  return NextResponse.json({ available: !data });
}
