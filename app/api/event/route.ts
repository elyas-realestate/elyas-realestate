import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/event — تتبّع أحداث خفيفة (vcard download / qr scan / إلخ)
// GET ?type=<event_type>&slug=<slug>&label=<optional>
// يرجع 1×1 GIF شفّاف (pixel beacon) — يعمل من <img> بدون CORS
// أو POST { type, slug, label } لاستدعاء AJAX
// ══════════════════════════════════════════════════════════════

// 1×1 GIF شفّاف (43 byte)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

async function logEvent(params: {
  event_type: string;
  slug?: string;
  label?: string;
  ip?: string | null;
  ua?: string | null;
}) {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ربط الحدث بـ tenant_id إذا كان slug معروف
    let tenant_id: string | null = null;
    if (params.slug) {
      const { data: tenant } = await admin
        .from("tenants")
        .select("id")
        .eq("slug", params.slug)
        .maybeSingle();
      tenant_id = tenant?.id || null;
    }

    await admin.from("site_analytics").insert([
      {
        event_type: params.event_type,
        page: params.slug ? `/${params.slug}` : null,
        element: params.label || params.event_type,
        tenant_id,
      },
    ]);
  } catch (err) {
    console.error("[/api/event] logging failed:", err);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const event_type = (url.searchParams.get("type") || "").trim().slice(0, 60);
  const slug = (url.searchParams.get("slug") || "").trim().slice(0, 80);
  const label = (url.searchParams.get("label") || "").trim().slice(0, 120);

  if (!event_type) {
    // ما زلنا نرجع pixel — لا نرفع 400 لتجنّب أخطاء الـ console
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store",
      },
    });
  }

  // log async (لا ننتظر)
  logEvent({
    event_type,
    slug,
    label,
    ip: req.headers.get("x-forwarded-for") || null,
    ua: req.headers.get("user-agent") || null,
  });

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  let body: { type?: string; slug?: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON غير صالح" }, { status: 400 });
  }

  const event_type = String(body.type || "")
    .trim()
    .slice(0, 60);
  if (!event_type) {
    return NextResponse.json({ ok: false, error: "type مطلوب" }, { status: 400 });
  }

  await logEvent({
    event_type,
    slug: body.slug ? String(body.slug).trim().slice(0, 80) : undefined,
    label: body.label ? String(body.label).trim().slice(0, 120) : undefined,
    ip: req.headers.get("x-forwarded-for") || null,
    ua: req.headers.get("user-agent") || null,
  });

  return NextResponse.json({ ok: true });
}
