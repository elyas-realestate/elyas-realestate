import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// يحمي مسارات /dashboard عبر فرض المصادقة الثنائية (إن كانت مفعّلة على الحساب).
// لا يُلزم المستخدمين الذين لم يفعّلوا 2FA — يتم تطبيقها فقط عندما يُفعّلها المستخدم طوعاً.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // استثناءات: روابط API الخاصة بـ 2FA + صفحة تحدّي 2FA نفسها + ملفات static
  if (
    pathname.startsWith("/api/2fa/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // نطبّق الفحص على مسارات /dashboard فقط
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // إذا كان cookie `2fa_passed` موجوداً → مرّر الطلب (تفادي فحص DB لكل صفحة)
  if (req.cookies.get("2fa_passed")?.value === "1") {
    return NextResponse.next();
  }

  // فحص DB: هل هذا المستخدم مفعّل 2FA؟
  const res = NextResponse.next();
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll(); },
          setAll(cookies) {
            cookies.forEach((c) => res.cookies.set(c.name, c.value, c.options));
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return res; // غير مسجّل — يترك للصفحة نفسها أن تتعامل معه

    const { data } = await supabase
      .from("user_2fa_secrets")
      .select("is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.is_enabled) {
      // 2FA مفعّل ولم يتم اجتيازه → حوّل لصفحة التحدّي
      const url = req.nextUrl.clone();
      url.pathname = "/login/2fa";
      return NextResponse.redirect(url);
    }
  } catch {
    // في حالة فشل الفحص لا نُغلق الوصول (fail-open) — الموازنة بين الأمان والاتاحة
  }
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
