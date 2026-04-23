import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * فحص أن المستخدم الحالي super_admin.
 * يعيد { user, supabase } عند النجاح، أو NextResponse (401/403) عند الفشل.
 *
 * استخدم في كل API route داخل /app/api/admin/*:
 *   const check = await requireSuperAdmin(req);
 *   if (check instanceof NextResponse) return check;
 *   const { supabase, user } = check;
 */
export async function requireSuperAdmin(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          /* no-op — response cookies تُدار في proxy */
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { data: isSa, error } = await supabase.rpc("is_super_admin");

  if (error || !isSa) {
    return NextResponse.json({ error: "ممنوع — مالك المنصة فقط" }, { status: 403 });
  }

  return { supabase, user };
}
