"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import {
  User,
  Globe,
  Palette,
  Phone,
  Building,
  Camera,
  Loader2,
  Link2,
  CheckCircle2,
  XCircle,
  Save,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Image,
  Upload,
  X,
  Eye,
  FileText,
  MessageSquare,
  Layout,
  Share2,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Type,
  Bell,
  ArrowRight,
  Award,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ThemeSwitcher from "@/app/components/ThemeSwitcher";
import ServiceIcon, { SERVICE_ICON_KEYS } from "@/app/components/ServiceIcon";
import { normalizeSocial, getSmartPlaceholder } from "@/lib/social-normalize";

// ─── Constants (مُستخرَجة لـ _constants.ts) ─────────────────────
import {
  SOCIAL_PLATFORMS,
  STATIC_PAGES,
  COLOR_DEFAULTS,
  COLOR_GROUPS,
  QUICK_THEMES_DARK,
  QUICK_THEMES_CREAM,
  QUICK_THEMES,
  type QuickTheme,
} from "./_constants";

// ─── Tab Components (مُستخرَجة لـ _tabs/) ────────────────────────
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
        console.error("[photo upload] error:", upErr);
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
        console.error("[photo update] error:", updErr);
        return;
      }

      setProfile((p) => ({ ...p, photo_url: publicUrl }));
      toast.success("تم رفع الصورة وحفظها ✓");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ غير متوقع";
      toast.error("فشل الرفع: " + msg);
      console.error("[photo upload] exception:", e);
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
        <div className="max-w-xl">
          <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
            <h3 className="text-lg font-bold text-[var(--gold-2)]">المعلومات الشخصية</h3>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex-shrink-0 cursor-pointer"
                style={{ width: 76, height: 76 }}
              >
                <div
                  className="h-full w-full overflow-hidden rounded-full border-2 border-dashed border-[var(--border-1)] transition group-hover:border-[var(--gold-2)]"
                  style={{ background: "var(--bg-surface-2)" }}
                >
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt="صورة"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={30} className="text-[var(--text-faint)]" />
                    </div>
                  )}
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"
                  style={{ background: "var(--shadow-overlay)" }}
                >
                  {uploadingPhoto ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">صورة الملف الشخصي</p>
                <p className="mb-2 text-xs text-[var(--text-faint)]">JPG أو PNG — حجم أقصاه 3MB</p>
                {profile.photo_url && (
                  <button
                    className="text-xs text-red-400 transition hover:text-red-300"
                    onClick={async () => {
                      await supabase
                        .from("broker_identity")
                        .update({ photo_url: null })
                        .not("id", "is", null);
                      setProfile((p) => ({ ...p, photo_url: "" }));
                      toast.success("تم حذف الصورة");
                    }}
                  >
                    حذف الصورة
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* Fields */}
            <div>
              <label className="mb-2 block text-sm text-[var(--text-soft)]">الاسم</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--text-soft)]">
                البريد الإلكتروني <span className="text-[var(--text-faint)]">(بريد الحساب)</span>
              </label>
              <input
                value={profile.email}
                disabled
                className={inputClass + " cursor-not-allowed opacity-50"}
              />
            </div>
            {/* بريد الإشعارات انتقل لصفحة الإشعارات الخاصة (إزالة تكرار) */}
            <div
              className="flex items-start gap-2 rounded-lg p-3 text-xs"
              style={{
                background: "var(--gold-bg-soft)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-soft)",
              }}
            >
              <span style={{ color: "var(--gold-2)", fontWeight: 700 }}>💡</span>
              <div>
                إعدادات بريد الإشعارات والـ Push انتقلت إلى صفحة مخصَّصة:{" "}
                <Link
                  href="/dashboard/settings/notifications"
                  className="font-bold no-underline"
                  style={{ color: "var(--gold-2)" }}
                >
                  صفحة الإشعارات →
                </Link>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-[var(--text-soft)]">الجنس</label>
              <div className="flex gap-6">
                {[
                  { v: "male", l: "ذكر" },
                  { v: "female", l: "أنثى" },
                ].map((opt) => (
                  <label key={opt.v} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value={opt.v}
                      checked={profile.gender === opt.v}
                      onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                      className="accent-[var(--gold-2)]"
                    />
                    <span className="text-sm">{opt.l}</span>
                  </label>
                ))}
              </div>
            </div>
            <SaveBtn onClick={handleSaveProfile} />
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: الموقع ════════════════════ */}
      {tab === "site" && settings && (
        <div>
          {/* Mobile section selector */}
          <div className="mb-4 md:hidden">
            <select
              value={siteSection}
              onChange={(e) => {
                setSiteSection(e.target.value);
                setSelectedPage("");
              }}
              className="w-full rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
              style={{ color: "var(--text-strong)" }}
            >
              {SITE_SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </select>
          </div>

          <div className="items-start md:flex md:gap-6">
            {/* Desktop sidebar */}
            <div className="hidden w-52 flex-shrink-0 space-y-1 md:block">
              {SITE_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSiteSection(sec.id);
                    setSelectedPage("");
                  }}
                  className={
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-medium transition " +
                    (siteSection === sec.id
                      ? "bg-[var(--gold-2)] text-white"
                      : "text-[var(--text-soft)] hover:bg-[var(--bg-surface-1)] hover:text-[var(--gold-1)]")
                  }
                >
                  <sec.icon size={15} />
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="max-w-2xl min-w-0 flex-1 space-y-5">
              {/* ── معلومات عامة ── */}
              {siteSection === "general" && (
                <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <h3 className="text-lg font-bold text-[var(--gold-2)]">معلومات عامة</h3>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      اسم الموقع / اسمك
                    </label>
                    <input
                      value={s.site_name || ""}
                      onChange={(e) => sc("site_name", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      منطقة التغطية
                    </label>
                    <input
                      value={s.coverage_text || ""}
                      onChange={(e) => sc("coverage_text", e.target.value)}
                      className={inputClass}
                      placeholder="مثال: شمال وشرق الرياض"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      نص زر تسجيل الدخول
                    </label>
                    <input
                      value={s.login_link_text || ""}
                      onChange={(e) => sc("login_link_text", e.target.value)}
                      className={inputClass}
                      placeholder="دخول الفريق"
                    />
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── الهوية البصرية ── */}
              {siteSection === "identity" && (
                <div className="space-y-6 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <h3 className="text-lg font-bold text-[var(--gold-2)]">الهوية البصرية</h3>
                  {/* Logo */}
                  <div>
                    <label className="mb-3 block text-sm text-[var(--text-soft)]">
                      شعار الموقع
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)]">
                        {s.site_logo ? (
                          <img
                            src={s.site_logo}
                            alt="الشعار"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Image size={26} className="text-[var(--text-faint)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <label
                          className={
                            "flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm font-medium text-[var(--text-soft)] transition " +
                            (uploadingLogo
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-[var(--bg-surface-3)]")
                          }
                        >
                          <Upload size={14} />
                          {uploadingLogo ? "جاري الرفع..." : "رفع شعار"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingLogo}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleLogoUpload(f);
                            }}
                          />
                        </label>
                        <p className="mt-2 text-xs text-[var(--text-faint)]">
                          PNG أو SVG — الحجم المثالي 200×200px
                        </p>
                        {logoError && <p className="mt-2 text-xs text-red-400">{logoError}</p>}
                        {s.site_logo && (
                          <button
                            onClick={() => sc("site_logo", "")}
                            className="mt-2 flex items-center gap-1 text-xs text-red-400 transition hover:text-red-300"
                          >
                            <X size={11} /> حذف الشعار
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── الرخص والاعتمادات (sub-section مستقل، بارز) ── */}
              {siteSection === "licenses" && settings && (
                <div className="space-y-4 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--gold-2)]">الرخص والاعتمادات</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
                      هذه الأرقام تظهر تلقائياً على بطاقتك التعريفية{" "}
                      <code
                        className="rounded px-1.5 text-xs"
                        style={{ background: "var(--bg-surface-2)" }}
                      >
                        /c/{slug || "اسمك"}
                      </code>{" "}
                      بدون الحاجة لإدخالها مرة ثانية.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        ◇ رخصة فال
                      </label>
                      <input
                        value={s.fal_license || ""}
                        onChange={(e) => sc("fal_license", e.target.value)}
                        className={inputClass}
                        placeholder="1100167397"
                        maxLength={10}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        📋 السجل التجاري / الرقم الموحَّد{" "}
                        <span className="text-[var(--text-faint)]">(يبدأ بـ 7، عشرة أرقام)</span>
                      </label>
                      <input
                        value={s.cr_number || ""}
                        onChange={(e) =>
                          sc("cr_number", e.target.value.replace(/\D/g, "").slice(0, 10))
                        }
                        className={inputClass}
                        placeholder="7XXXXXXXXX"
                        maxLength={10}
                        inputMode="numeric"
                        dir="ltr"
                      />
                      {s.cr_number && s.cr_number.length === 10 && !s.cr_number.startsWith("7") && (
                        <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>
                          ⚠️ السجل التجاري السعودي عادةً يبدأ بـ 7
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        💼 الرقم الضريبي
                      </label>
                      <input
                        value={s.vat_number || ""}
                        onChange={(e) => sc("vat_number", e.target.value)}
                        className={inputClass}
                        placeholder="3XXXXXXXXXXXXX3"
                        maxLength={15}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        ✅ رخصة معروف
                      </label>
                      <input
                        value={s.maaroof_license || ""}
                        onChange={(e) => sc("maaroof_license", e.target.value)}
                        className={inputClass}
                        placeholder="351692"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        🛡️ رخصة موثوق
                      </label>
                      <input
                        value={s.mowathaq_license || ""}
                        onChange={(e) => sc("mowathaq_license", e.target.value)}
                        className={inputClass}
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        📄 وثيقة العمل الحر
                      </label>
                      <input
                        value={s.freelance_license || ""}
                        onChange={(e) => sc("freelance_license", e.target.value)}
                        className={inputClass}
                        placeholder="FL-XXXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        🏛️ رخصة هيئة العقار
                      </label>
                      <input
                        value={s.gam_license || ""}
                        onChange={(e) => sc("gam_license", e.target.value)}
                        className={inputClass}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── القسم الرئيسي ── */}
              {siteSection === "hero" && (
                <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <h3 className="text-lg font-bold text-[var(--gold-2)]">القسم الرئيسي (Hero)</h3>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      الشارة العلوية{" "}
                      <span className="text-[var(--text-faint)]">(النص الصغير فوق العنوان)</span>
                    </label>
                    <input
                      value={s.hero_badge || ""}
                      onChange={(e) => sc("hero_badge", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      العنوان الرئيسي
                    </label>
                    <input
                      value={s.hero_title || ""}
                      onChange={(e) => sc("hero_title", e.target.value)}
                      className={inputClass + " text-lg font-bold"}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      الوصف التعريفي
                    </label>
                    <textarea
                      value={s.hero_subtitle || ""}
                      onChange={(e) => sc("hero_subtitle", e.target.value)}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-[var(--text-soft)]">
                      صورة الخلفية
                    </label>

                    {/* Drag & drop zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHeroDragActive(true);
                      }}
                      onDragLeave={() => setHeroDragActive(false)}
                      onDrop={handleHeroDrop}
                      className="relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition"
                      style={{
                        background: heroDragActive ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                        borderColor: heroDragActive ? "var(--gold-1)" : "var(--gold-bg-hover)",
                        minHeight: s.hero_image ? 180 : 140,
                      }}
                    >
                      {s.hero_image && !uploadingHero && (
                        <img
                          src={s.hero_image}
                          alt="معاينة"
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: 0.55,
                          }}
                        />
                      )}
                      <div
                        className="relative flex flex-col items-center justify-center gap-2 p-6 text-center"
                        style={{ minHeight: s.hero_image ? 180 : 140 }}
                      >
                        {uploadingHero ? (
                          <>
                            <Loader2
                              size={28}
                              className="animate-spin"
                              style={{ color: "var(--gold-1)" }}
                            />
                            <span className="text-sm" style={{ color: "var(--text-soft)" }}>
                              جاري الرفع…
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload
                              size={26}
                              style={{
                                color: heroDragActive ? "var(--gold-1)" : "var(--text-soft)",
                              }}
                            />
                            <div
                              className="text-sm font-medium"
                              style={{
                                color: s.hero_image ? "#FFFFFF" : "var(--text-strong)",
                                textShadow: s.hero_image ? "0 1px 4px rgba(0,0,0,0.6)" : "none",
                              }}
                            >
                              {s.hero_image ? "استبدال الصورة" : "اسحب صورة هنا أو اضغط للرفع"}
                            </div>
                            <div
                              className="text-xs"
                              style={{
                                color: s.hero_image
                                  ? "rgba(255,255,255,0.85)"
                                  : "var(--text-faint)",
                                textShadow: s.hero_image ? "0 1px 3px rgba(0,0,0,0.6)" : "none",
                              }}
                            >
                              JPG / PNG / WebP — حتى ٥ ميجا
                            </div>
                            <label
                              className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition"
                              style={{
                                background: "var(--gold-bg-hover)",
                                color: "var(--gold-2)",
                                border: "1px solid var(--gold-bg-strong)",
                              }}
                            >
                              <Upload size={13} /> اختيار ملف
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleHeroUpload(f);
                                }}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    {heroError && (
                      <div className="mt-2 text-xs" style={{ color: "var(--danger)" }}>
                        {heroError}
                      </div>
                    )}

                    {/* OR — رابط URL خارجي */}
                    <div className="mt-3">
                      <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                        أو ألصق رابط صورة (اختياري)
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={s.hero_image || ""}
                          onChange={(e) => sc("hero_image", e.target.value)}
                          className={inputClass + " flex-1 text-sm"}
                          dir="ltr"
                          placeholder="https://images.unsplash.com/..."
                        />
                        {s.hero_image && (
                          <button
                            onClick={() => sc("hero_image", "")}
                            className="flex items-center gap-1 rounded-lg px-3 text-xs transition"
                            style={{
                              background: "var(--bg-surface-2)",
                              color: "var(--danger)",
                              border: "1px solid var(--gold-bg)",
                            }}
                            title="إزالة الصورة"
                          >
                            <X size={14} /> إزالة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── روابط القائمة ── */}
              {siteSection === "navbar" && (
                <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--gold-2)]">
                        روابط القائمة العلوية
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-faint)]">
                        الروابط اللي تظهر في النافبار
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        sc("navbar_links", [
                          ...(s.navbar_links || []),
                          { label: "", href: "/", type: "link" },
                        ])
                      }
                      className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                    >
                      <Plus size={13} /> إضافة رابط
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(s.navbar_links || []).map((link: any, i: number) => (
                      <div key={i} className="rounded-xl bg-[var(--bg-surface-2)] p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm text-[var(--text-faint)]">رابط {i + 1}</span>
                          <button
                            onClick={() =>
                              sc(
                                "navbar_links",
                                s.navbar_links.filter((_: any, j: number) => j !== i)
                              )
                            }
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={11} /> حذف
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1 block text-xs text-[var(--text-faint)]">
                              النص
                            </label>
                            <input
                              value={link.label || ""}
                              onChange={(e) => navChange(i, "label", e.target.value)}
                              className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                              placeholder="الرئيسية"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[var(--text-faint)]">
                              الرابط
                            </label>
                            <input
                              value={link.href || ""}
                              onChange={(e) => navChange(i, "href", e.target.value)}
                              className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                              dir="ltr"
                              placeholder="/"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-[var(--text-faint)]">
                              النوع
                            </label>
                            <select
                              value={link.type || "link"}
                              onChange={(e) => navChange(i, "type", e.target.value)}
                              className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                            >
                              <option value="link">رابط صفحة</option>
                              <option value="anchor">رابط قسم (#)</option>
                              <option value="cta">زر بارز (CTA)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <SaveBtn onClick={handleSaveSettings} />
                  </div>
                </div>
              )}

              {/* ── إظهار / إخفاء الأقسام ── */}
              {siteSection === "sections" && (
                <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <h3 className="mb-2 text-lg font-bold text-[var(--gold-2)]">
                    إظهار / إخفاء أقسام الصفحة الرئيسية
                  </h3>
                  <p className="mb-5 text-sm text-[var(--text-faint)]">
                    تحكّم بالأقسام اللي تبيها تظهر
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        field: "show_why_section",
                        label: "قسم لماذا تختارنا",
                        desc: "البطاقات اللي تشرح مميزاتك",
                      },
                      {
                        field: "show_properties_section",
                        label: "قسم العقارات المختارة",
                        desc: "آخر ٣ عقارات منشورة",
                      },
                      {
                        field: "show_services_section",
                        label: "قسم الخدمات",
                        desc: "بطاقات خدماتك العقارية",
                      },
                      {
                        field: "show_cta_section",
                        label: "قسم التواصل (CTA)",
                        desc: "صندوق التواصل مع أزرار الواتساب والاتصال",
                      },
                    ].map((item) => (
                      <div
                        key={item.field}
                        className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-2)] p-4"
                      >
                        <div>
                          <h4 className="text-sm font-medium">{item.label}</h4>
                          <p className="mt-1 text-xs text-[var(--text-faint)]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => sc(item.field, !s[item.field])}
                          className={
                            "relative h-8 w-14 rounded-full transition " +
                            (s[item.field] !== false
                              ? "bg-[var(--gold-2)]"
                              : "bg-[var(--bg-surface-3)]")
                          }
                        >
                          <div
                            className={
                              "absolute top-1 h-6 w-6 rounded-full bg-white transition-all " +
                              (s[item.field] !== false ? "left-1" : "right-1")
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <SaveBtn onClick={handleSaveSettings} />
                  </div>
                </div>
              )}

              {/* ── الخدمات ── */}
              {siteSection === "services" && (
                <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--gold-2)]">الخدمات</h3>
                    <button
                      onClick={() =>
                        sc("services", [
                          ...(s.services || []),
                          { title: "", desc: "", icon: "home" },
                        ])
                      }
                      className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                    >
                      <Plus size={13} /> إضافة خدمة
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(s.services || []).map((svc: any, i: number) => (
                      <div key={i} className="space-y-3 rounded-xl bg-[var(--bg-surface-2)] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-faint)]">خدمة {i + 1}</span>
                          <button
                            onClick={() =>
                              sc(
                                "services",
                                s.services.filter((_: any, j: number) => j !== i)
                              )
                            }
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={11} /> حذف
                          </button>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs text-[var(--text-faint)]">
                            الأيقونة
                          </label>
                          <div
                            className="mb-3 flex flex-wrap gap-1.5 rounded-lg p-2"
                            style={{
                              background: "var(--bg-surface-1)",
                              border: "1px solid var(--gold-bg-hover)",
                            }}
                          >
                            {SERVICE_ICON_KEYS.map((key) => {
                              const isActive = (svc.icon || "home") === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => svcChange(i, "icon", key)}
                                  className="flex items-center justify-center transition"
                                  title={key}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: isActive ? "var(--gold-bg-hover)" : "transparent",
                                    border: isActive
                                      ? "1px solid var(--gold-2)"
                                      : "1px solid transparent",
                                    color: isActive ? "var(--gold-2)" : "var(--text-faint)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <ServiceIcon name={key} size={18} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            اسم الخدمة
                          </label>
                          <input
                            value={svc.title || ""}
                            onChange={(e) => svcChange(i, "title", e.target.value)}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            وصف الخدمة
                          </label>
                          <textarea
                            value={svc.desc || ""}
                            onChange={(e) => svcChange(i, "desc", e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <SaveBtn onClick={handleSaveSettings} />
                  </div>
                </div>
              )}

              {/* ── لماذا تختارنا ── */}
              {siteSection === "why" && (
                <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--gold-2)]">لماذا تختارنا</h3>
                    <button
                      onClick={() =>
                        sc("why_cards", [
                          ...(s.why_cards || []),
                          { title: "", desc: "", icon: "award" },
                        ])
                      }
                      className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface-2)] px-4 py-2 text-sm transition hover:bg-[var(--bg-surface-3)]"
                    >
                      <Plus size={13} /> إضافة بطاقة
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(s.why_cards || []).map((card: any, i: number) => (
                      <div key={i} className="space-y-3 rounded-xl bg-[var(--bg-surface-2)] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-faint)]">بطاقة {i + 1}</span>
                          <button
                            onClick={() =>
                              sc(
                                "why_cards",
                                s.why_cards.filter((_: any, j: number) => j !== i)
                              )
                            }
                            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={11} /> حذف
                          </button>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs text-[var(--text-faint)]">
                            الأيقونة
                          </label>
                          <div
                            className="mb-3 flex flex-wrap gap-1.5 rounded-lg p-2"
                            style={{
                              background: "var(--bg-surface-1)",
                              border: "1px solid var(--gold-bg-hover)",
                            }}
                          >
                            {SERVICE_ICON_KEYS.map((key) => {
                              const isActive = (card.icon || "award") === key;
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => whyChange(i, "icon", key)}
                                  className="flex items-center justify-center transition"
                                  title={key}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 8,
                                    background: isActive ? "var(--gold-bg-hover)" : "transparent",
                                    border: isActive
                                      ? "1px solid var(--gold-2)"
                                      : "1px solid transparent",
                                    color: isActive ? "var(--gold-2)" : "var(--text-faint)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <ServiceIcon name={key} size={18} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            العنوان
                          </label>
                          <input
                            value={card.title || ""}
                            onChange={(e) => whyChange(i, "title", e.target.value)}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-[var(--text-faint)]">
                            الوصف
                          </label>
                          <textarea
                            value={card.desc || ""}
                            onChange={(e) => whyChange(i, "desc", e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] px-3 py-2 text-sm focus:border-[var(--gold-2)] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <SaveBtn onClick={handleSaveSettings} />
                  </div>
                </div>
              )}

              {/* ── الصفحات الثابتة ── */}
              {siteSection === "pages" && !selectedPage && (
                <div>
                  <h3 className="mb-2 text-lg font-bold text-[var(--gold-2)]">الصفحات الثابتة</h3>
                  <p className="mb-5 text-sm text-[var(--text-faint)]">
                    تعديل نصوص الصفحات في موقعك
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {STATIC_PAGES.map((page) => (
                      <button
                        key={page.key}
                        onClick={() => setSelectedPage(page.key)}
                        className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5 text-right transition hover:border-[var(--gold-2)]"
                      >
                        <h4 className="font-bold text-[var(--gold-2)]">{page.label}</h4>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {siteSection === "pages" && selectedPage && (
                <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="font-bold text-[var(--gold-2)]">
                      {STATIC_PAGES.find((p) => p.key === selectedPage)?.label}
                    </h3>
                    <button
                      onClick={() => setSelectedPage("")}
                      className="text-sm text-[var(--text-soft)] transition hover:text-[var(--gold-1)]"
                    >
                      ← رجوع
                    </button>
                  </div>
                  <textarea
                    value={s[selectedPage] || ""}
                    onChange={(e) => sc(selectedPage, e.target.value)}
                    rows={12}
                    className="w-full rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 focus:border-[var(--gold-2)] focus:outline-none"
                    placeholder="اكتب محتوى الصفحة هنا..."
                  />
                  <div className="mt-4">
                    <SaveBtn onClick={handleSaveSettings} />
                  </div>
                </div>
              )}

              {/* ── التواصل والفوتر ── */}
              {siteSection === "cta" && (
                <div className="space-y-5">
                  <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                    <h3 className="text-lg font-bold text-[var(--gold-2)]">قسم التواصل (CTA)</h3>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        عنوان قسم التواصل
                      </label>
                      <input
                        value={s.cta_title || ""}
                        onChange={(e) => sc("cta_title", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        وصف قسم التواصل
                      </label>
                      <textarea
                        value={s.cta_subtitle || ""}
                        onChange={(e) => sc("cta_subtitle", e.target.value)}
                        rows={2}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
                    <h3 className="text-lg font-bold text-[var(--gold-2)]">الفوتر</h3>
                    <div>
                      <label className="mb-2 block text-sm text-[var(--text-soft)]">
                        نص الفوتر التعريفي
                      </label>
                      <textarea
                        value={s.footer_text || ""}
                        onChange={(e) => sc("footer_text", e.target.value)}
                        rows={3}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}
            </div>
            {/* end content */}
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: التصميم ════════════════════ */}
      {tab === "design" && settings && (
        <div>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');`}</style>

          {/* Theme Switcher (Dark/Cream) — يُطبَّق فوراً على كل المنصّة */}
          <ThemeSwitcher />

          {/* Header row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-faint)]">
              غيّر الألوان والخطوط وشاهد النتيجة مباشرة
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={resetDesign}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition"
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--gold-bg)",
                  color: "var(--text-soft)",
                }}
              >
                <RotateCcw size={13} /> إعادة الضبط
              </button>
              <SaveBtn onClick={handleSaveSettings} />
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[3fr_2fr]">
            {/* Live Preview */}
            <div className="order-2 lg:order-1">
              <div
                className="sticky top-20 overflow-hidden rounded-xl"
                style={{ border: "1px solid var(--gold-bg-hover)" }}
              >
                {/* Browser chrome */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    background: "var(--bg-surface-2)",
                    borderBottom: "1px solid var(--gold-bg-soft)",
                  }}
                >
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ background: "var(--danger)" }} />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: "var(--warning-2)" }}
                    />
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ background: "var(--success)" }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                    معاينة مباشرة
                  </span>
                  <div className="flex overflow-hidden rounded-lg border border-[var(--gold-bg)] bg-[var(--bg-page)]">
                    <button
                      onClick={() => setMobilePreview(false)}
                      className={
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs transition " +
                        (!mobilePreview ? "text-[var(--gold-2)]" : "text-[var(--text-faint)]")
                      }
                      style={{ background: !mobilePreview ? "var(--gold-bg)" : "transparent" }}
                    >
                      <Monitor size={12} /> ديسكتوب
                    </button>
                    <button
                      onClick={() => setMobilePreview(true)}
                      className={
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs transition " +
                        (mobilePreview ? "text-[var(--gold-2)]" : "text-[var(--text-faint)]")
                      }
                      style={{ background: mobilePreview ? "var(--gold-bg)" : "transparent" }}
                    >
                      <Smartphone size={12} /> موبايل
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    background: "var(--bg-surface-2)",
                    padding: mobilePreview ? "16px" : "0",
                    minHeight: 500,
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      background: bgPrimary,
                      fontFamily: "'Tajawal', sans-serif",
                      width: mobilePreview ? 375 : "100%",
                      margin: mobilePreview ? "0 auto" : "0",
                      borderRadius: mobilePreview ? 16 : 0,
                      overflow: "hidden",
                      border: mobilePreview ? "1px solid var(--gold-bg-hover)" : "none",
                    }}
                    dir="rtl"
                  >
                    {/* Navbar */}
                    <div
                      className="flex items-center justify-between"
                      style={{
                        padding: "12px 20px",
                        background: bgCard,
                        borderBottom: `1px solid ${accent}20`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: `linear-gradient(135deg,${accent},${accentDark})`,
                            color: bgPrimary,
                            fontSize: 10,
                            fontFamily: "'Noto Kufi Arabic',serif",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          إ
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: textPrimary }}>
                          {s.site_name || "إلياس الدخيل"}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <span style={{ fontSize: 10, color: textSec }}>الرئيسية</span>
                        <span style={{ fontSize: 10, color: textSec }}>العقارات</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: bgPrimary,
                            background: `linear-gradient(135deg,${accent},${accentDark})`,
                            padding: "3px 10px",
                            borderRadius: 6,
                          }}
                        >
                          تواصل
                        </span>
                      </div>
                    </div>
                    {/* Hero */}
                    <div className="text-center" style={{ padding: "36px 20px 24px" }}>
                      <div
                        style={{
                          display: "inline-block",
                          fontSize: 9,
                          color: accent,
                          background: `${accent}15`,
                          border: `1px solid ${accent}30`,
                          borderRadius: 50,
                          padding: "4px 12px",
                          marginBottom: 10,
                        }}
                      >
                        وسيط عقاري مرخّص
                      </div>
                      <h1
                        style={{
                          fontFamily: "'Noto Kufi Arabic',serif",
                          fontSize: heroSize,
                          fontWeight: 900,
                          lineHeight: 1.25,
                          color: textPrimary,
                          marginBottom: 8,
                        }}
                      >
                        نختصر عليك <span style={{ color: accent }}>الطريق</span>
                      </h1>
                      <p
                        style={{
                          fontSize: bodySize,
                          color: textSec,
                          lineHeight: 1.8,
                          maxWidth: 340,
                          margin: "0 auto 18px",
                        }}
                      >
                        {s.hero_subtitle || "من البحث إلى التملّك، خبرة عملية في سوق الرياض"}
                      </p>
                      <div className="flex justify-center gap-2">
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: bgPrimary,
                            background: `linear-gradient(135deg,${accent},${accentDark})`,
                            padding: "7px 18px",
                            borderRadius: 8,
                          }}
                        >
                          واتساب
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: textPrimary,
                            border: `1px solid ${accent}25`,
                            padding: "7px 18px",
                            borderRadius: 8,
                          }}
                        >
                          اتصال
                        </span>
                      </div>
                    </div>
                    {/* Section */}
                    <div style={{ padding: "26px 20px", background: bgSecondary }}>
                      <div className="text-center" style={{ marginBottom: 14 }}>
                        <span style={{ fontSize: 9, color: accent, letterSpacing: 1 }}>
                          — القيمة المضافة —
                        </span>
                        <h2
                          style={{
                            fontFamily: "'Noto Kufi Arabic',serif",
                            fontSize: sectionSize,
                            fontWeight: 800,
                            color: textPrimary,
                            lineHeight: 1.3,
                            marginTop: 4,
                          }}
                        >
                          لماذا تختار إلياس؟
                        </h2>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {[
                          { icon: "🎯", title: "معرفة بالسوق" },
                          { icon: "⚡", title: "سرعة التنفيذ" },
                        ].map((card, i) => (
                          <div
                            key={i}
                            style={{
                              background: bgCard,
                              border: `1px solid ${accent}15`,
                              borderRadius: 10,
                              padding: "12px 10px",
                            }}
                          >
                            <span style={{ fontSize: 16 }}>{card.icon}</span>
                            <h3
                              style={{
                                fontFamily: "'Noto Kufi Arabic',serif",
                                fontSize: bodySize,
                                fontWeight: 700,
                                color: textPrimary,
                                marginTop: 6,
                                marginBottom: 4,
                              }}
                            >
                              {card.title}
                            </h3>
                            <p style={{ fontSize: smallSize, color: textSec, lineHeight: 1.6 }}>
                              خبرة ميدانية في الرياض
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Footer */}
                    <div
                      style={{
                        padding: "12px 20px",
                        background: bgSecondary,
                        borderTop: `1px solid ${accent}12`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: textMuted }}>
                          © {s.site_name || "إلياس الدخيل"}
                        </span>
                        <span style={{ fontSize: 10, color: textMuted }}>رخصة فال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="order-1 space-y-4 lg:order-2">
              <div className="flex gap-2">
                {[
                  { id: "colors", label: "الألوان", icon: <Palette size={14} /> },
                  { id: "fonts", label: "الخطوط", icon: <Type size={14} /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDesignTab(t.id as "colors" | "fonts")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition"
                    style={{
                      background:
                        designTab === t.id ? "var(--gold-bg-hover)" : "var(--bg-surface-1)",
                      color: designTab === t.id ? "var(--gold-2)" : "var(--text-faint)",
                      border:
                        "1px solid " +
                        (designTab === t.id ? "var(--gold-bg-strong)" : "var(--gold-bg)"),
                    }}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {designTab === "colors" && (
                <div className="space-y-3">
                  {/* ملاحظة توضيحية: هذه ألوان موقع الوسيط العام، ليست ثيم لوحة التحكم */}
                  <div
                    className="rounded-xl p-3 text-[11px] leading-relaxed"
                    style={{
                      background: "var(--gold-bg-soft)",
                      border: "1px solid var(--gold-bg)",
                      color: "var(--text-soft)",
                    }}
                  >
                    <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                      ملاحظة:
                    </span>{" "}
                    هذه الألوان تخص{" "}
                    <span className="font-bold" style={{ color: "var(--text-strong)" }}>
                      صفحتك العامة
                    </span>{" "}
                    (الموقع الذي يراه عملاؤك). أما ثيم لوحة التحكم (داكن/كريمي) فيُحفظ تلقائياً من{" "}
                    <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                      المظهر
                    </span>{" "}
                    أعلى الصفحة. اضغط{" "}
                    <span className="font-bold" style={{ color: "var(--gold-2)" }}>
                      «حفظ التغييرات»
                    </span>{" "}
                    بعد تعديل الألوان لتطبيقها على الموقع.
                  </div>

                  {/* Quick themes — ديناميكي حسب الثيم النشط */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--bg-surface-1)",
                      border: "1px solid var(--gold-bg)",
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                        ثيمات سريعة {activeTheme === "cream" ? "(فاتحة)" : "(داكنة)"}
                      </h4>
                      <span className="text-[10px]" style={{ color: "var(--text-faint)" }}>
                        {activeTheme === "cream"
                          ? "متوافقة مع الثيم الكريمي"
                          : "متوافقة مع الثيم الداكن"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(activeTheme === "cream" ? QUICK_THEMES_CREAM : QUICK_THEMES_DARK).map(
                        (theme) => (
                          <button
                            key={theme.name}
                            onClick={() => applyTheme(theme)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition hover:opacity-80"
                            style={{
                              background: theme.colors.color_bg_card,
                              border: `1px solid ${theme.colors.color_accent}30`,
                              color: theme.colors.color_text_primary,
                            }}
                          >
                            <span>{theme.emoji}</span>
                            <span style={{ color: theme.colors.color_accent }}>{theme.name}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {/* Color groups */}
                  {COLOR_GROUPS.map((group) => (
                    <div
                      key={group.id}
                      className="overflow-hidden rounded-xl"
                      style={{
                        background: "var(--bg-surface-1)",
                        border: "1px solid var(--gold-bg)",
                      }}
                    >
                      <button
                        onClick={() => toggleCollapse(group.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold transition hover:bg-[rgba(198,145,76,0.04)]"
                        style={{ color: "var(--gold-2)" }}
                      >
                        <span>{group.label}</span>
                        {collapsed[group.id] ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                      </button>
                      {!collapsed[group.id] && (
                        <div className="space-y-2 px-4 pb-4">
                          {group.fields.map((field) => {
                            const val = s[field.key] || (COLOR_DEFAULTS as any)[field.key];
                            return (
                              <div
                                key={field.key}
                                className="flex items-center gap-3 rounded-lg p-3"
                                style={{ background: "var(--bg-surface-2)" }}
                              >
                                <label className="relative flex-shrink-0 cursor-pointer">
                                  <input
                                    type="color"
                                    value={val}
                                    onChange={(e) => sc(field.key, e.target.value)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  />
                                  <div
                                    className="h-9 w-9 rounded-lg border-2 transition"
                                    style={{
                                      background: val,
                                      borderColor: "var(--gold-bg-strong)",
                                    }}
                                  />
                                </label>
                                <div className="min-w-0 flex-1">
                                  <div
                                    className="truncate text-xs font-medium"
                                    style={{ color: "var(--text-strong)" }}
                                  >
                                    {field.label}
                                  </div>
                                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                                    {field.desc}
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => sc(field.key, e.target.value)}
                                  maxLength={9}
                                  className="w-20 rounded-lg px-2 py-1.5 text-center font-mono text-xs focus:outline-none"
                                  style={{
                                    background: "var(--bg-page)",
                                    border: "1px solid var(--gold-bg)",
                                    color: "var(--text-soft)",
                                  }}
                                  dir="ltr"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {designTab === "fonts" && (
                <div className="space-y-3">
                  {/* Sliders */}
                  <div
                    className="space-y-5 rounded-xl p-4"
                    style={{
                      background: "var(--bg-surface-1)",
                      border: "1px solid var(--gold-bg)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                        أحجام النصوص
                      </h4>
                      <button
                        onClick={() => {
                          sc("font_size_body", COLOR_DEFAULTS.font_size_body);
                          sc("font_size_small", COLOR_DEFAULTS.font_size_small);
                        }}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-faint)" }}
                      >
                        <RotateCcw size={10} /> استعادة
                      </button>
                    </div>
                    {[
                      {
                        key: "font_size_body",
                        label: "حجم النص العادي",
                        desc: "الأوصاف والفقرات",
                        min: 12,
                        max: 20,
                        def: 15,
                      },
                      {
                        key: "font_size_small",
                        label: "حجم النص الصغير",
                        desc: "التواريخ والتفاصيل",
                        min: 10,
                        max: 18,
                        def: 13,
                      },
                    ].map((field) => {
                      const val = parsePx(s[field.key], field.def);
                      return (
                        <div key={field.key}>
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <span
                                className="text-sm font-medium"
                                style={{ color: "var(--text-strong)" }}
                              >
                                {field.label}
                              </span>
                              <span className="mr-2 text-xs" style={{ color: "var(--text-faint)" }}>
                                {field.desc}
                              </span>
                            </div>
                            <span
                              className="font-mono text-sm font-bold"
                              style={{ color: "var(--gold-2)" }}
                            >
                              {val}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={1}
                            value={val}
                            onChange={(e) => sc(field.key, e.target.value + "px")}
                            className="h-1.5 w-full cursor-pointer appearance-none rounded-full"
                            style={{ accentColor: "var(--gold-2)" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Heading presets */}
                  <div
                    className="space-y-4 rounded-xl p-4"
                    style={{
                      background: "var(--bg-surface-1)",
                      border: "1px solid var(--gold-bg)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold" style={{ color: "var(--gold-2)" }}>
                        أحجام العناوين
                      </h4>
                      <button
                        onClick={() => {
                          sc("font_size_hero", COLOR_DEFAULTS.font_size_hero);
                          sc("font_size_section_title", COLOR_DEFAULTS.font_size_section_title);
                        }}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-faint)" }}
                      >
                        <RotateCcw size={10} /> استعادة
                      </button>
                    </div>
                    {[
                      {
                        key: "font_size_hero",
                        label: "العنوان الرئيسي (Hero)",
                        desc: "العنوان الكبير في أعلى الصفحة",
                        presets: [
                          { l: "صغير", v: "clamp(2rem,4vw,3rem)" },
                          { l: "متوسط", v: "clamp(2.4rem,5.5vw,4.2rem)" },
                          { l: "كبير", v: "clamp(3rem,6vw,5rem)" },
                        ],
                      },
                      {
                        key: "font_size_section_title",
                        label: "عناوين الأقسام",
                        desc: "لماذا تختارنا، الخدمات...",
                        presets: [
                          { l: "صغير", v: "clamp(1.4rem,2.5vw,2rem)" },
                          { l: "متوسط", v: "clamp(1.8rem,3.5vw,2.6rem)" },
                          { l: "كبير", v: "clamp(2.2rem,4vw,3.2rem)" },
                        ],
                      },
                    ].map((field) => (
                      <div
                        key={field.key}
                        className="space-y-2 rounded-lg p-3"
                        style={{ background: "var(--bg-surface-2)" }}
                      >
                        <div>
                          <div
                            className="text-sm font-medium"
                            style={{ color: "var(--text-strong)" }}
                          >
                            {field.label}
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                            {field.desc}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {field.presets.map((p) => {
                            const active =
                              (s[field.key] || (COLOR_DEFAULTS as any)[field.key]) === p.v;
                            return (
                              <button
                                key={p.v}
                                onClick={() => sc(field.key, p.v)}
                                className="flex-1 rounded-lg py-2 text-xs font-medium transition"
                                style={{
                                  background: active ? "var(--gold-bg-hover)" : "var(--bg-page)",
                                  color: active ? "var(--gold-2)" : "var(--text-faint)",
                                  border:
                                    "1px solid " +
                                    (active ? "var(--gold-bg-strong)" : "var(--gold-bg-soft)"),
                                }}
                              >
                                {p.l}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
