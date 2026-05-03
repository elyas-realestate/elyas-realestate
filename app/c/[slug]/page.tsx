import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProfileCardClient from "./ProfileCardClient";

export const revalidate = 60;

// ── أنواع البيانات ──
interface ProfileCard {
  id: string;
  tenant_id: string;
  card_style: string;
  bg_color: string;
  text_color: string;
  accent_color: string;
  avatar_url: string | null;
  display_name: string | null;
  bio: string | null;
  show_direct_contact: boolean;
  show_social: boolean;
  show_licenses: boolean;
  show_hours: boolean;
  show_share_button: boolean;
  show_qr_button: boolean;
  show_powered_by: boolean;
  is_published: boolean;
}

interface ProfileLink {
  id: string;
  link_type: string;
  platform: string | null;
  label: string;
  value: string | null;
  description: string | null;
  icon: string | null;
  bg_color: string | null;
  text_color: string | null;
  is_gradient: boolean;
  gradient_to: string | null;
  display_order: number;
  is_active: boolean;
}

// كائن موحَّد يجمع الحقول من broker_identity + site_settings
// لأن الحقول الاجتماعية والاتصال محفوظة في site_settings فعلياً.
interface Identity {
  broker_name: string | null;
  specialization: string | null;
  photo_url: string | null;
  fal_license: string | null;
  cr_number: string | null;
  vat_number: string | null;
  phone: string | null;
  email: string | null;
  business_hours_weekday: string | null;
  business_hours_weekend: string | null;
  social_x: string | null;
  social_instagram: string | null;
  social_tiktok: string | null;
  social_snapchat: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_threads: string | null;
  social_facebook: string | null;
  social_whatsapp: string | null;
}

async function getCardData(slug: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) return null;

  const [cardRes, linksRes, identityRes, settingsRes] = await Promise.all([
    admin.from("profile_cards").select("*").eq("tenant_id", tenant.id).maybeSingle(),
    admin.from("profile_links").select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("display_order"),
    admin.from("broker_identity").select("broker_name, specialization, photo_url, bio_short, commercial_register, vat_number").eq("tenant_id", tenant.id).maybeSingle(),
    admin.from("site_settings").select("*").eq("tenant_id", tenant.id).maybeSingle(),
  ]);

  // دمج الحقول من المصدرين — site_settings له الأولوية للحقول التواصلية
  const s = settingsRes.data || {} as any;
  const bi = identityRes.data || {} as any;

  const identity: Identity = {
    broker_name:    bi.broker_name || s.site_name || null,
    specialization: bi.specialization || null,
    photo_url:      bi.photo_url || s.site_logo || null,
    fal_license:    s.fal_license || null,
    cr_number:      bi.commercial_register || null,
    vat_number:     bi.vat_number || null,
    phone:          s.phone || null,
    email:          s.email || s.contact_email || null,
    business_hours_weekday: null,  // لاحقاً
    business_hours_weekend: null,
    social_x:         s.social_x || null,
    social_instagram: s.social_instagram || null,
    social_tiktok:    s.social_tiktok || null,
    social_snapchat:  s.social_snapchat || null,
    social_linkedin:  s.social_linkedin || null,
    social_youtube:   s.social_youtube || null,
    social_threads:   s.social_threads || null,
    social_facebook:  s.social_facebook || null,
    social_whatsapp:  s.social_whatsapp || s.whatsapp || null,
  };

  return {
    card: cardRes.data as ProfileCard | null,
    links: (linksRes.data || []) as ProfileLink[],
    identity,
    slug: tenant.slug,
  };
}

export default async function ProfileCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCardData(slug);
  if (!data || !data.card) notFound();

  return <ProfileCardClient {...data} card={data.card!} />;
}
