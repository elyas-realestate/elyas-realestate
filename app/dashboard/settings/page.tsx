"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import {
  User,
  Globe,
  Palette,
  Phone,
  Building,
  Loader2,
  Link2,
  Save,
  Check,
  Image,
  Eye,
  FileText,
  MessageSquare,
  Layout,
  Share2,
  Bell,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeSocial } from "@/lib/social-normalize";

// ─── Constants (مُستخرَجة لـ _constants.ts) ─────────────────────
import { SOCIAL_PLATFORMS, COLOR_DEFAULTS, QUICK_THEMES_DARK } from "./_constants";

// ─── Tab Components (مُستخرَجة لـ _tabs/) ────────────────────────
import { ProfileTab } from "./_tabs/ProfileTab";
import { SiteTab } from "./_tabs/SiteTab";
import { DesignTab } from "./_tabs/DesignTab";
import { NotificationsTab } from "./_tabs/NotificationsTab";
import { ContactTab } from "./_tabs/ContactTab";
import { AccountTab } from "./_tabs/AccountTab";

// ─── SITE_SECTIONS تبقى هنا لأنها تستخدم Icon components ────────
const SITE_SECTIONS = [
  { id: "general", label: "معلومات عامة", icon: Globe },
  { id: "identity", label: "الهوية البصرية", icon: Image },
  { id: "licenses", label: "الرخص والاعتمادات", icon: Award },
  { id: "hero", label: "القسم الرئيسي", icon: Palette },
  { id: "navbar", label: "روابط القائمة", icon: Link2 },
  { id: "sections", label: "إظهار / إخفاء الأقسام", icon: Eye },
  { id: "services", label: "الخدمات", icon: FileText },
  { id: "why", label: "لماذا تختارنا", icon: MessageSquare },
  { id: "pages", label: "الصفحات الثابتة", icon: Layout },
  { id: "cta", label: "التواصل والفوتر", icon: Share2 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("profile");
  const [siteSection, setSiteSection] = useState("general");
  const [selectedPage, setSelectedPage] = useState("");
  const [designTab, setDesignTab] = useState<"colors" | "fonts">("colors");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activeTheme, setActiveTheme] = useState<"dark" | "cream">("dark");

  // ── Data ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact_email: "",
    photo_url: "",
    gender: "male",
  });
  const [settings, setSettings] = useState<any>(null);
  const [licenses, setLicenses] = useState({
    commercial_register: "",
    freelance_doc: "",
    vat_number: "",
    zatca_enabled: false,
  });
  const [slug, setSlug] = useState("");
  const [slugInput, setSlugInput] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [heroDragActive, setHeroDragActive] = useState(false);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [slugMsg, setSlugMsg] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  // ── متابعة الثيم العالمي (داكن/كريمي) لتحديث الثيمات السريعة ──
  useEffect(() => {
    function readTheme() {
      const t = (document.documentElement.getAttribute("data-theme") || "dark") as "dark" | "cream";
      setActiveTheme(t === "cream" ? "cream" : "dark");
    }
    readTheme();
    const obs = new MutationObserver(readTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("storage", readTheme);
    return () => {
      obs.disconnect();
      window.removeEventListener("storage", readTheme);
    };
  }, []);

  // ─── Load ─────────────────────────────────────────────────────────────────
  async function loadAll() {
    const [identityRes, userRes, siteRes, tenantRes] = await Promise.all([
      supabase
        .from("broker_identity")
        .select(
          "broker_name, photo_url, commercial_register, freelance_doc, vat_number, zatca_enabled"
        )
        .limit(1)
        .single(),
      supabase.auth.getUser(),
      supabase.from("site_settings").select("*").limit(1).single(),
      supabase.from("tenants").select("slug").limit(1).single(),
    ]);

    const identity = identityRes.data;
    const user = userRes.data.user;
    const site = siteRes.data;
    const tenant = tenantRes.data;

    setProfile((p) => ({
      ...p,
      name: identity?.broker_name || "",
      email: user?.email || "",
      photo_url: identity?.photo_url || "",
      contact_email: site?.contact_email || "",
    }));
    setLicenses({
      commercial_register: identity?.commercial_register || "",
      freelance_doc: identity?.freelance_doc || "",
      vat_number: identity?.vat_number || "",
      zatca_enabled: identity?.zatca_enabled || false,
    });
    if (site) setSettings(site);
    if (tenant?.slug) {
      setSlug(tenant.slug);
      setSlugInput(tenant.slug);
    }
    setLoading(false);
  }

  // ─── Save helpers ─────────────────────────────────────────────────────────

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await supabase
        .from("broker_identity")
        .update({ broker_name: profile.name })
        .not("id", "is", null);
      await supabase
        .from("site_settings")
        .update({ contact_email: profile.contact_email || null })
        .not("id", "is", null);
      toast.success("تم حفظ الملف الشخصي");
      flash();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!settings?.id) return;
    setSaving(true);
    const { id, created_at, ...updateData } = settings;

    // طبّع كل روابط السوشال ميديا قبل الحفظ (defense in depth)
    for (const p of SOCIAL_PLATFORMS) {
      const v = updateData[p.key];
      if (v && typeof v === "string") {
        updateData[p.key] = normalizeSocial(p.platform, v);
      }
    }

    const { error } = await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    if (settings.fal_license !== undefined) {
      await supabase
        .from("broker_identity")
        .update({ fal_license: settings.fal_license })
        .not("id", "is", null);
    }
    setSaving(false);
    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } else {
      toast.success("تم حفظ التغييرات");
      flash();
      // تأكيد تطبيق الـ accent على لوحة التحكم بعد الحفظ
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wasit:brand-update", {
            detail: { accent: settings.color_accent, accentDark: settings.color_accent_dark },
          })
        );
      }
    }
  }

  async function handleSaveLicenses() {
    // validate VAT if provided
    if (licenses.vat_number && !/^3\d{13}3$/.test(licenses.vat_number.trim())) {
      toast.error("الرقم الضريبي غير صالح — يجب 15 رقم يبدأ وينتهي بـ 3");
      return;
    }
    setSaving(true);
    try {
      await supabase
        .from("broker_identity")
        .update({
          commercial_register: licenses.commercial_register || null,
          freelance_doc: licenses.freelance_doc || null,
          vat_number: licenses.vat_number || null,
          zatca_enabled: licenses.zatca_enabled,
        })
        .not("id", "is", null);
      toast.success("تم حفظ الشهادات");
      flash();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  // site_settings shorthand
  function sc(field: string, value: any) {
    setSettings((p: any) => {
      const next = { ...p, [field]: value };
      // Live-apply accent overrides عند تعديل اللون يدوياً
      if (field === "color_accent" || field === "color_accent_dark") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("wasit:brand-update", {
              detail: { accent: next.color_accent, accentDark: next.color_accent_dark },
            })
          );
        }
      }
      return next;
    });
  }

  // ─── Photo upload ─────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── 1) فحص النوع والحجم ──
    if (!file.type.startsWith("image/")) {
      toast.error("الملف يجب أن يكون صورة (JPG/PNG/WebP)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من ٣ ميغابايت");
      return;
    }

    setUploadingPhoto(true);
    try {
      // ── 2) جلب user + tenant_id ──
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("جلستك انتهت — أعد تسجيل الدخول");
        return;
      }

      const { data: t } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();
      const tenantId = t?.id;
      if (!tenantId) {
        toast.error("لا يمكن العثور على ملف منشأتك. تواصل مع الدعم.");
        return;
      }

      // ── 3) رفع الصورة بـ مسار user-scoped ──
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userData.user.id}/photo_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) {
        // ── رسائل خطأ واضحة ──
        const msg = upErr.message || "";
        if (msg.includes("not found") || msg.toLowerCase().includes("bucket")) {
          toast.error("الـ Storage Bucket 'avatars' غير موجود. شغّل migration 045 في Supabase.");
        } else if (
          msg.includes("policy") ||
          msg.includes("403") ||
          msg.toLowerCase().includes("permission")
        ) {
          toast.error("صلاحيات الرفع غير مفعّلة. شغّل migration 045 لإعداد RLS.");
        } else if (msg.includes("size") || msg.includes("too large")) {
          toast.error("الصورة كبيرة جداً");
        } else {
          toast.error("فشل الرفع: " + msg);
        }
        logger.error("[settings] photo upload failed", upErr);
        return;
      }

      // ── 4) جلب الـ public URL ──
      const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pubData?.publicUrl;
      if (!publicUrl) {
        toast.error("الرفع نجح لكن تعذّر إنشاء رابط عام");
        return;
      }

      // ── 5) تحديث broker_identity للـ tenant الصحيح فقط ──
      const { error: updErr } = await supabase
        .from("broker_identity")
        .update({ photo_url: publicUrl })
        .eq("tenant_id", tenantId);

      if (updErr) {
        toast.error("الصورة رُفعت لكن لم تُحفظ في الملف: " + updErr.message);
        logger.error("[settings] photo profile update failed", updErr);
        return;
      }

      setProfile((p) => ({ ...p, photo_url: publicUrl }));
      toast.success("تم رفع الصورة وحفظها ✓");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
      toast.error("فشل الرفع: " + msg);
      logger.error("[settings] photo upload exception", e);
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ─── Logo upload ──────────────────────────────────────────────────────────
  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setLogoError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("assets").getPublicUrl(path);
      sc("site_logo", data.publicUrl);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("not found") || msg.includes("Bucket"))
        setLogoError("الـ bucket غير موجود — أنشئ bucket اسمه 'assets' في Supabase Storage");
      else if (msg.includes("policy") || msg.includes("permission") || msg.includes("403"))
        setLogoError("خطأ في الصلاحيات — راجع إعدادات Storage Policies");
      else setLogoError("خطأ: " + (msg || "تعذّر رفع الشعار"));
    }
    setUploadingLogo(false);
  }

  // ─── Hero image upload ────────────────────────────────────────────────────
  async function handleHeroUpload(file: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setHeroError("الملف يجب أن يكون صورة");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHeroError("حجم الصورة يجب أن يكون أقل من ٥ ميغابايت");
      return;
    }
    setUploadingHero(true);
    setHeroError("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `hero/hero_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("assets")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("assets").getPublicUrl(path);
      sc("hero_image", data.publicUrl);
      toast.success("تم رفع صورة الخلفية");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("not found") || msg.includes("Bucket"))
        setHeroError("الـ bucket غير موجود — أنشئ bucket اسمه 'assets' في Supabase Storage");
      else if (msg.includes("policy") || msg.includes("permission") || msg.includes("403"))
        setHeroError("خطأ في الصلاحيات — راجع إعدادات Storage Policies");
      else setHeroError("خطأ: " + (msg || "تعذّر رفع الصورة"));
    }
    setUploadingHero(false);
  }

  function handleHeroDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setHeroDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleHeroUpload(file);
  }

  // ─── Slug ─────────────────────────────────────────────────────────────────
  async function handleSlugChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugInput(cleaned);
    setSlugStatus("idle");
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!cleaned || cleaned === slug) return;
    slugTimer.current = setTimeout(async () => {
      setSlugStatus("checking");
      const res = await fetch(`/api/slug/check?slug=${cleaned}`);
      const data = await res.json();
      if (data.error) {
        setSlugStatus("invalid");
        setSlugMsg(data.error);
      } else if (data.available) {
        setSlugStatus("available");
        setSlugMsg("متاح ✓");
      } else {
        setSlugStatus("taken");
        setSlugMsg("محجوز من حساب آخر");
      }
    }, 600);
  }

  async function handleSaveSlug() {
    if (!slugInput || slugInput === slug) return;
    setSavingSlug(true);
    try {
      const res = await fetch("/api/slug/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "حدث خطأ");
        return;
      }
      setSlug(slugInput);
      setSlugStatus("idle");
      toast.success("تم تحديث الرابط بنجاح!");
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSavingSlug(false);
    }
  }

  // ─── Services / Why / Navbar ──────────────────────────────────────────────
  function svcChange(i: number, f: string, v: string) {
    const arr = [...(settings.services || [])];
    arr[i] = { ...arr[i], [f]: v };
    sc("services", arr);
  }
  function whyChange(i: number, f: string, v: string) {
    const arr = [...(settings.why_cards || [])];
    arr[i] = { ...arr[i], [f]: v };
    sc("why_cards", arr);
  }
  function navChange(i: number, f: string, v: string) {
    const arr = [...(settings.navbar_links || [])];
    arr[i] = { ...arr[i], [f]: v };
    sc("navbar_links", arr);
  }

  // ─── Design ───────────────────────────────────────────────────────────────
  type QuickTheme = (typeof QUICK_THEMES_DARK)[0];

  // يطبّق ألوان الـ accent على لوحة التحكم فوراً (بدون انتظار حفظ)
  function applyAccentLive(accent?: string, accentDark?: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("wasit:brand-update", {
        detail: { accent, accentDark },
      })
    );
  }

  function applyTheme(theme: QuickTheme) {
    setSettings((p: any) => ({ ...p, ...theme.colors }));
    applyAccentLive(theme.colors.color_accent, theme.colors.color_accent_dark);
    toast.success(`تم تطبيق ثيم ${theme.name} — اضغط حفظ لتأكيد التغيير`);
  }
  function resetDesign() {
    setSettings((p: any) => ({ ...p, ...COLOR_DEFAULTS }));
  }
  function parsePx(val: string | undefined, def: number): number {
    if (!val) return def;
    const n = parseInt(val);
    return isNaN(n) ? def : n;
  }
  function toggleCollapse(id: string) {
    setCollapsed((p) => ({ ...p, [id]: !p[id] }));
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputClass =
    "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-lg px-4 py-3 focus:outline-none focus:border-[var(--gold-2)] transition";

  function SaveBtn({ onClick }: { onClick: () => void }) {
    return (
      <button
        onClick={onClick}
        disabled={saving}
        className={
          "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition " +
          (saved
            ? "bg-green-600 text-white"
            : "bg-[var(--gold-2)] text-[var(--bg-page)] hover:bg-[var(--gold-3)]")
        }
      >
        {saved ? (
          <>
            <Check size={15} /> تم الحفظ
          </>
        ) : saving ? (
          <>
            <Loader2 size={15} className="animate-spin" /> جاري...
          </>
        ) : (
          <>
            <Save size={15} /> حفظ التغييرات
          </>
        )}
      </button>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div dir="rtl" className="space-y-4 p-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );

  // ─── Derived design values ─────────────────────────────────────────────────
  const s = settings || {};
  const accent = s.color_accent || COLOR_DEFAULTS.color_accent;
  const accentDark = s.color_accent_dark || COLOR_DEFAULTS.color_accent_dark;
  const bgPrimary = s.color_bg_primary || COLOR_DEFAULTS.color_bg_primary;
  const bgSecondary = s.color_bg_secondary || COLOR_DEFAULTS.color_bg_secondary;
  const bgCard = s.color_bg_card || COLOR_DEFAULTS.color_bg_card;
  const textPrimary = s.color_text_primary || COLOR_DEFAULTS.color_text_primary;
  const textSec = s.color_text_secondary || COLOR_DEFAULTS.color_text_secondary;
  const textMuted = s.color_text_muted || COLOR_DEFAULTS.color_text_muted;
  const heroSize = s.font_size_hero || COLOR_DEFAULTS.font_size_hero;
  const sectionSize = s.font_size_section_title || COLOR_DEFAULTS.font_size_section_title;
  const bodySize = s.font_size_body || COLOR_DEFAULTS.font_size_body;
  const smallSize = s.font_size_small || COLOR_DEFAULTS.font_size_small;

  const MAIN_TABS = [
    { id: "profile", label: "الملف الشخصي", icon: User },
    { id: "site", label: "الموقع", icon: Globe },
    { id: "design", label: "التصميم", icon: Palette },
    { id: "contact", label: "التواصل", icon: Phone },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "account", label: "الحساب", icon: Building },
  ];

  return (
    <div dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');`}</style>

      <h2 className="mb-6 text-2xl font-bold">الإعدادات</h2>

      {/* ── Main Tabs ── */}
      <div
        className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--gold-bg)]"
        style={{ scrollbarWidth: "none" }}
      >
        {MAIN_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition " +
              (tab === t.id
                ? "border-[var(--gold-2)] text-[var(--gold-2)]"
                : "border-transparent text-[var(--text-soft)] hover:text-[var(--gold-1)]")
            }
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ TAB: الملف الشخصي ════════════════════ */}
      {tab === "profile" && (
        <ProfileTab
          profile={profile}
          setProfile={setProfile}
          fileInputRef={fileInputRef}
          uploadingPhoto={uploadingPhoto}
          onPhotoChange={handlePhotoChange}
          saving={saving}
          saved={saved}
          onSave={handleSaveProfile}
          inputClass={inputClass}
        />
      )}

      {/* ════════════════════ TAB: الموقع ════════════════════ */}
      {tab === "site" && settings && (
        <SiteTab
          s={s}
          sc={sc}
          siteSection={siteSection}
          setSiteSection={setSiteSection}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          saving={saving}
          saved={saved}
          handleSaveSettings={handleSaveSettings}
          uploadingLogo={uploadingLogo}
          logoError={logoError}
          handleLogoUpload={handleLogoUpload}
          uploadingHero={uploadingHero}
          heroError={heroError}
          heroDragActive={heroDragActive}
          setHeroDragActive={setHeroDragActive}
          handleHeroUpload={handleHeroUpload}
          handleHeroDrop={handleHeroDrop}
          svcChange={svcChange}
          whyChange={whyChange}
          navChange={navChange}
          slug={slug}
          inputClass={inputClass}
          SITE_SECTIONS={SITE_SECTIONS}
        />
      )}

      {/* ════════════════════ TAB: التصميم ════════════════════ */}
      {tab === "design" && settings && (
        <DesignTab
          s={s}
          sc={sc}
          designTab={designTab}
          setDesignTab={setDesignTab}
          mobilePreview={mobilePreview}
          setMobilePreview={setMobilePreview}
          activeTheme={activeTheme}
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
          saving={saving}
          saved={saved}
          onSave={handleSaveSettings}
          onReset={resetDesign}
          applyTheme={applyTheme}
          parsePx={parsePx}
        />
      )}

      {/* ════════════════════ TAB: التواصل ════════════════════ */}
      {tab === "contact" && settings && (
        <ContactTab
          s={s}
          sc={sc}
          saving={saving}
          saved={saved}
          onSave={handleSaveSettings}
          inputClass={inputClass}
        />
      )}

      {/* ════════════════════ TAB: الإشعارات ════════════════════ */}
      {tab === "notifications" && <NotificationsTab />}

      {/* ════════════════════ TAB: الحساب ════════════════════ */}
      {tab === "account" && (
        <AccountTab
          profile={profile}
          slug={slug}
          slugInput={slugInput}
          slugStatus={slugStatus}
          slugMsg={slugMsg}
          savingSlug={savingSlug}
          onSlugChange={handleSlugChange}
          onSlugSave={handleSaveSlug}
          licenses={licenses}
          setLicenses={setLicenses}
          saving={saving}
          saved={saved}
          onLicensesSave={handleSaveLicenses}
          inputClass={inputClass}
        />
      )}
    </div>
  );
}
