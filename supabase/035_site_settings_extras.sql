-- ════════════════════════════════════════════════════════════════
-- 035: إضافة أعمدة ناقصة في site_settings
-- ════════════════════════════════════════════════════════════════
-- الهدف:
--  - إضافة روابط التواصل الاجتماعي (٩ منصات)
--  - إضافة روابط الـ navbar + الصفحات الثابتة
--  - إضافة ألوان الـ theme (لو ناقصة)
--  - إضافة hero/cta/footer/services/why_cards (لو ناقصة)
-- آمن للتشغيل المتكرر (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════

-- ── روابط التواصل الاجتماعي ─────────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_x         TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_instagram TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_tiktok    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_snapchat  TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_linkedin  TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_youtube   TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_threads   TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_facebook  TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_whatsapp  TEXT;

-- ── الـ navbar + الصفحات الثابتة ────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS navbar_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_home     TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_map      TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_requests TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_links    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_privacy  TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS page_terms    TEXT;

-- ── ألوان الثيم (للموقع العام للوسيط) ───────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_accent         TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_accent_dark    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_bg_primary     TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_bg_secondary   TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_bg_card        TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_text_primary   TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_text_secondary TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS color_text_muted     TEXT;

-- ── أحجام الخطوط ──────────────────────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS font_size_hero          TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS font_size_section_title TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS font_size_body          TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS font_size_small         TEXT;

-- ── Hero / CTA / Footer ─────────────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_badge    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_title    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_image    TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS cta_title     TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS cta_subtitle  TEXT;

-- ── خدمات وبطاقات لماذا تختارنا ───────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS services   JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS why_cards  JSONB DEFAULT '[]'::jsonb;

-- ── تحكم بإظهار الأقسام ───────────────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_services       BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_why            BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_properties     BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_request_form   BOOLEAN DEFAULT true;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS show_socials        BOOLEAN DEFAULT true;

-- ── معلومات أساسية ─────────────────────────────────────────────────
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_name     TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS site_logo     TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS whatsapp      TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS email         TEXT;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- تأكيد
SELECT 'site_settings extras applied' AS status;
