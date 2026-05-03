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

interface Identity {
  broker_name: string | null;
  specialization: string | null;
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
    admin.from("broker_identity").select("*").eq("tenant_id", tenant.id).maybeSingle(),
    admin.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  return {
    card: cardRes.data as ProfileCard | null,
    links: (linksRes.data || []) as ProfileLink[],
    identity: identityRes.data as Identity | null,
    settings: settingsRes.data,
    slug: tenant.slug,
  };
}

export default async function ProfileCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCardData(slug);
  if (!data || !data.card) notFound();

  return <ProfileCardClient {...data} card={data.card!} />;
}
