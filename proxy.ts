import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── إنشاء Supabase client مع إدارة الكوكيز ──
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── التحقق من الجلسة على مستوى الخادم (getUser أكثر أماناً) ──
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtectedRoute) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // ── حماية Admin — السماح فقط للمالك ──
      if (pathname.startsWith("/admin")) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("owner_id")
          .eq("owner_id", user.id)
          .limit(1)
          .single();

        if (!tenant) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch {
      // fail-closed: عند أي خطأ — أعد للدخول
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Security Headers ──
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // ── CSRF: التحقق من Origin في طلبات POST/PUT/DELETE على /api ──
  if (
    pathname.startsWith("/api") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // السماح فقط بالطلبات من نفس الأصل
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: "طلب غير مصرح — CSRF" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Origin غير صالح" },
          { status: 403 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * تشغيل Proxy على كل الطلبات ما عدا:
     * - _next/static (ملفات ثابتة)
     * - _next/image (تحسين الصور)
     * - favicon.ico
     * - ملفات عامة (svg, png, jpg, etc.)
     */
    {
      source:
        "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
