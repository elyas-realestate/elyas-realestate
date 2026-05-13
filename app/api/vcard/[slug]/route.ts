import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════
// /api/vcard/[slug] — تحميل vCard (.vcf) للوسيط
// GET → ملف .vcf يحفظ مباشرة في contacts الجوّال
// ══════════════════════════════════════════════════════════════

function escapeVCard(value: string): string {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return new NextResponse("Bad Request", { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── جلب tenant + identity + settings ──
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!tenant?.id) return new NextResponse("Not Found", { status: 404 });

  const [identityRes, settingsRes] = await Promise.all([
    admin.from("broker_identity").select("*").eq("tenant_id", tenant.id).maybeSingle(),
    admin.from("site_settings").select("*").eq("tenant_id", tenant.id).maybeSingle(),
  ]);

  const identity = identityRes.data || ({} as Record<string, string>);
  const settings = settingsRes.data || ({} as Record<string, string>);

  // ── بناء الـ vCard ──
  const fullName = (identity.broker_name as string) || (settings.site_name as string) || slug;
  const org = (identity.vcard_org as string) || (settings.site_name as string) || "";
  const title =
    (identity.vcard_title as string) || (identity.specialization as string) || "وسيط عقاري";
  const phone = (settings.phone as string) || "";
  const whatsapp = (settings.whatsapp as string) || phone;
  const email = (settings.email as string) || (settings.contact_email as string) || "";
  const website =
    (identity.vcard_website as string) || `https://elyas-realestate.vercel.app/${slug}`;
  const address = (identity.vcard_address as string) || "";
  const photoUrl = (identity.photo_url as string) || (settings.site_logo as string) || "";

  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(fullName)}`,
    `N:${escapeVCard(fullName)};;;;`,
  ];

  if (org) lines.push(`ORG:${escapeVCard(org)}`);
  if (title) lines.push(`TITLE:${escapeVCard(title)}`);
  if (phone) lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
  if (whatsapp && whatsapp !== phone) lines.push(`TEL;TYPE=WORK,VOICE:${whatsapp}`);
  if (email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(email)}`);
  if (website) lines.push(`URL:${escapeVCard(website)}`);
  if (address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(address)};;;;`);
  if (photoUrl && photoUrl.startsWith("http")) {
    lines.push(`PHOTO;VALUE=URL:${photoUrl}`);
  }

  // فال license كملاحظة
  if (identity.commercial_register || settings.fal_license) {
    const note: string[] = [];
    if (settings.fal_license) note.push(`فال: ${settings.fal_license}`);
    if (identity.commercial_register) note.push(`سجل تجاري: ${identity.commercial_register}`);
    lines.push(`NOTE:${escapeVCard(note.join(" — "))}`);
  }

  lines.push(`REV:${new Date().toISOString()}`);
  lines.push("END:VCARD");

  const vcfBody = lines.join("\r\n");
  const filename = `${slug}.vcf`;

  return new NextResponse(vcfBody, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
