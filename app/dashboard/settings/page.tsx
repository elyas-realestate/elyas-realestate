"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import {
  User, Globe, Palette, Phone, Building, Camera, Loader2,
  Link2, CheckCircle2, XCircle, Save, Check, RotateCcw,
  Plus, Trash2, Image, Upload, X, Eye, FileText,
  MessageSquare, Layout, Share2, Monitor, Smartphone,
  ChevronDown, ChevronUp, Type,
} from "lucide-react";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { key: "social_x",         label: "X (تويتر)",    placeholder: "https://x.com/username" },
  { key: "social_instagram", label: "Instagram",     placeholder: "https://instagram.com/username" },
  { key: "social_tiktok",    label: "TikTok",        placeholder: "https://tiktok.com/@username" },
  { key: "social_snapchat",  label: "سناب شات",      placeholder: "https://snapchat.com/add/username" },
  { key: "social_linkedin",  label: "LinkedIn",      placeholder: "https://linkedin.com/in/username" },
  { key: "social_youtube",   label: "يوتيوب",        placeholder: "https://youtube.com/@username" },
  { key: "social_threads",   label: "Threads",       placeholder: "https://threads.net/@username" },
  { key: "social_facebook",  label: "فيسبوك",        placeholder: "https://facebook.com/username" },
  { key: "social_whatsapp",  label: "واتساب (رابط)", placeholder: "https://wa.me/966501234567" },
];

const STATIC_PAGES = [
  { key: "page_home",     label: "الصفحة الرئيسية" },
  { key: "page_map",      label: "الخريطة" },
  { key: "page_requests", label: "طلبات العقار" },
  { key: "page_links",    label: "صفحة الروابط" },
  { key: "page_privacy",  label: "سياسة الخصوصية" },
  { key: "page_terms",    label: "الشروط والأحكام" },
];

const SITE_SECTIONS = [
  { id: "general",  label: "معلومات عامة",          icon: Globe },
  { id: "identity", label: "الهوية البصرية",         icon: Image },
  { id: "hero",     label: "القسم الرئيسي",          icon: Palette },
  { id: "navbar",   label: "روابط القائمة",          icon: Link2 },
  { id: "sections", label: "إظهار / إخفاء الأقسام", icon: Eye },
  { id: "services", label: "الخدمات",                icon: FileText },
  { id: "why",      label: "لماذا تختارنا",          icon: MessageSquare },
  { id: "pages",    label: "الصفحات الثابتة",        icon: Layout },
  { id: "cta",      label: "التواصل والفوتر",        icon: Share2 },
];

const COLOR_DEFAULTS = {
  color_accent:         "#C6914C",
  color_accent_dark:    "#A6743A",
  color_bg_primary:     "#0A0A0C",
  color_bg_secondary:   "#111114",
  color_bg_card:        "#16161A",
  color_text_primary:   "#F5F5F5",
  color_text_secondary: "#9A9AA0",
  color_text_muted:     "#5A5A62",
  font_size_hero:            "clamp(2.4rem, 5.5vw, 4.2rem)",
  font_size_section_title:   "clamp(1.8rem, 3.5vw, 2.6rem)",
  font_size_body:            "15px",
  font_size_small:           "13px",
};

const COLOR_GROUPS = [
  { id: "accent", label: "اللون الذهبي", fields: [
    { key: "color_accent",      label: "الذهبي الرئيسي", desc: "الأزرار والعناوين" },
    { key: "color_accent_dark", label: "الذهبي الداكن",  desc: "تدرج الأزرار والهوفر" },
  ]},
  { id: "bg", label: "الخلفيات", fields: [
    { key: "color_bg_primary",   label: "الخلفية الرئيسية", desc: "لون الخلفية الأساسي" },
    { key: "color_bg_secondary", label: "الخلفية الفرعية",  desc: "أقسام متناوبة" },
    { key: "color_bg_card",      label: "خلفية البطاقات",   desc: "الكروت والصناديق" },
  ]},
  { id: "text", label: "النصوص", fields: [
    { key: "color_text_primary",   label: "النص الرئيسي", desc: "العناوين والنصوص" },
    { key: "color_text_secondary", label: "النص الثانوي", desc: "الأوصاف والفقرات" },
    { key: "color_text_muted",     label: "النص الخافت",  desc: "التواريخ والتفاصيل" },
  ]},
];

const QUICK_THEMES = [
  { name: "الذهبي الداكن",  emoji: "🟤", colors: { color_accent:"#C6914C", color_accent_dark:"#A6743A", color_bg_primary:"#0A0A0C", color_bg_secondary:"#111114", color_bg_card:"#16161A", color_text_primary:"#F5F5F5", color_text_secondary:"#9A9AA0", color_text_muted:"#5A5A62" }},
  { name: "الأزرق الملكي",  emoji: "🔵", colors: { color_accent:"#5B8DEF", color_accent_dark:"#3B6DCF", color_bg_primary:"#08090F", color_bg_secondary:"#0E1020", color_bg_card:"#131526", color_text_primary:"#F0F4FF", color_text_secondary:"#8A95B0", color_text_muted:"#525870" }},
  { name: "الأخضر الفاخر",  emoji: "🟢", colors: { color_accent:"#4ADE80", color_accent_dark:"#2AB860", color_bg_primary:"#060C0A", color_bg_secondary:"#0A1510", color_bg_card:"#101A14", color_text_primary:"#F0FFF4", color_text_secondary:"#7AA886", color_text_muted:"#4A6854" }},
  { name: "البنفسجي",        emoji: "🟣", colors: { color_accent:"#A78BFA", color_accent_dark:"#7C5FD4", color_bg_primary:"#080810", color_bg_secondary:"#0F0F1A", color_bg_card:"#141420", color_text_primary:"#F5F0FF", color_text_secondary:"#9590A8", color_text_muted:"#555068" }},
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Settings() {

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState("profile");
  const [siteSection, setSiteSection] = useState("general");
  const [selectedPage, setSelectedPage] = useState("");
  const [designTab, setDesignTab]   = useState<"colors" | "fonts">("colors");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

  // ── Data ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    name: "", email: "", contact_email: "", photo_url: "", gender: "male",
  });
  const [settings, setSettings]   = useState<any>(null);
  const [licenses, setLicenses]   = useState({ commercial_register: "", freelance_doc: "" });
  const [slug, setSlug]           = useState("");
  const [slugInput, setSlugInput] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const [logoError, setLogoError]       = useState("");
  const [slugStatus, setSlugStatus]     = useState<"idle"|"checking"|"available"|"taken"|"invalid">("idle");
  const [slugMsg, setSlugMsg]           = useState("");
  const [savingSlug, setSavingSlug]     = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const slugTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadAll(); }, []);

  // ─── Load ─────────────────────────────────────────────────────────────────
  async function loadAll() {
    const [identityRes, userRes, siteRes, tenantRes] = await Promise.all([
      supabase.from("broker_identity").select("broker_name, photo_url").limit(1).single(),
      supabase.auth.getUser(),
      supabase.from("site_settings").select("*").limit(1).single(),
      supabase.from("tenants").select("slug").limit(1).single(),
    ]);

    const identity = identityRes.data;
    const user     = userRes.data.user;
    const site     = siteRes.data;
    const tenant   = tenantRes.data;

    setProfile(p => ({
      ...p,
      name:          identity?.broker_name       || "",
      email:         user?.email                 || "",
      photo_url:     identity?.photo_url         || "",
      contact_email: site?.contact_email         || "",
    }));
    if (site)    setSettings(site);
    if (tenant?.slug) { setSlug(tenant.slug); setSlugInput(tenant.slug); }
    setLoading(false);
  }

  // ─── Save helpers ─────────────────────────────────────────────────────────

  function flash() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await supabase.from("broker_identity").update({ broker_name: profile.name }).not("id", "is", null);
      await supabase.from("site_settings").update({ contact_email: profile.contact_email || null }).not("id", "is", null);
      toast.success("تم حفظ الملف الشخصي");
      flash();
    } catch { toast.error("حدث خطأ أثناء الحفظ"); }
    finally  { setSaving(false); }
  }

  async function handleSaveSettings() {
    if (!settings?.id) return;
    setSaving(true);
    const { id, created_at, ...updateData } = settings;
    const { error } = await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    if (settings.fal_license !== undefined) {
      await supabase.from("broker_identity").update({ fal_license: settings.fal_license }).not("id", "is", null);
    }
    setSaving(false);
    if (error) { toast.error("حدث خطأ أثناء الحفظ"); }
    else       { toast.success("تم حفظ التغييرات"); flash(); }
  }

  async function handleSaveLicenses() {
    setSaving(true);
    try {
      await supabase.from("broker_identity").update({
        commercial_register: licenses.commercial_register || null,
        freelance_doc:       licenses.freelance_doc       || null,
      }).not("id", "is", null);
      toast.success("تم حفظ الشهادات");
      flash();
    } catch { toast.error("حدث خطأ أثناء الحفظ"); }
    finally  { setSaving(false); }
  }

  // site_settings shorthand
  function sc(field: string, value: any) {
    setSettings((p: any) => ({ ...p, [field]: value }));
  }

  // ─── Photo upload ─────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("حجم الصورة يجب أن يكون أقل من 3 ميغابايت"); return; }
    setUploadingPhoto(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `broker-photos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("broker_identity").update({ photo_url: publicUrl }).not("id", "is", null);
      setProfile(p => ({ ...p, photo_url: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch { toast.error("حدث خطأ أثناء رفع الصورة"); }
    finally  { setUploadingPhoto(false); }
  }

  // ─── Logo upload ──────────────────────────────────────────────────────────
  async function handleLogoUpload(file: File) {
    setUploadingLogo(true); setLogoError("");
    try {
      const ext  = file.name.split(".").pop();
      const path = `logos/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("assets").getPublicUrl(path);
      sc("site_logo", data.publicUrl);
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("not found") || msg.includes("Bucket")) setLogoError("الـ bucket غير موجود — أنشئ bucket اسمه 'assets' في Supabase Storage");
      else if (msg.includes("policy") || msg.includes("permission") || msg.includes("403")) setLogoError("خطأ في الصلاحيات — راجع إعدادات Storage Policies");
      else setLogoError("خطأ: " + (msg || "تعذّر رفع الشعار"));
    }
    setUploadingLogo(false);
  }

  // ─── Slug ─────────────────────────────────────────────────────────────────
  async function handleSlugChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugInput(cleaned); setSlugStatus("idle");
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!cleaned || cleaned === slug) return;
    slugTimer.current = setTimeout(async () => {
      setSlugStatus("checking");
      const res  = await fetch(`/api/slug/check?slug=${cleaned}`);
      const data = await res.json();
      if (data.error)        { setSlugStatus("invalid");   setSlugMsg(data.error); }
      else if (data.available) { setSlugStatus("available"); setSlugMsg("متاح ✓"); }
      else                   { setSlugStatus("taken");     setSlugMsg("محجوز من حساب آخر"); }
    }, 600);
  }

  async function handleSaveSlug() {
    if (!slugInput || slugInput === slug) return;
    setSavingSlug(true);
    try {
      const res  = await fetch("/api/slug/update", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ slug: slugInput }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "حدث خطأ"); return; }
      setSlug(slugInput); setSlugStatus("idle");
      toast.success("تم تحديث الرابط بنجاح!");
    } catch { toast.error("حدث خطأ أثناء الحفظ"); }
    finally  { setSavingSlug(false); }
  }

  // ─── Services / Why / Navbar ──────────────────────────────────────────────
  function svcChange(i: number, f: string, v: string) {
    const arr = [...(settings.services || [])]; arr[i] = { ...arr[i], [f]: v }; sc("services", arr);
  }
  function whyChange(i: number, f: string, v: string) {
    const arr = [...(settings.why_cards || [])]; arr[i] = { ...arr[i], [f]: v }; sc("why_cards", arr);
  }
  function navChange(i: number, f: string, v: string) {
    const arr = [...(settings.navbar_links || [])]; arr[i] = { ...arr[i], [f]: v }; sc("navbar_links", arr);
  }

  // ─── Design ───────────────────────────────────────────────────────────────
  function applyTheme(theme: (typeof QUICK_THEMES)[0]) {
    setSettings((p: any) => ({ ...p, ...theme.colors }));
  }
  function resetDesign() {
    setSettings((p: any) => ({ ...p, ...COLOR_DEFAULTS }));
  }
  function parsePx(val: string | undefined, def: number): number {
    if (!val) return def; const n = parseInt(val); return isNaN(n) ? def : n;
  }
  function toggleCollapse(id: string) {
    setCollapsed(p => ({ ...p, [id]: !p[id] }));
  }

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputClass = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C] transition";

  function SaveBtn({ onClick }: { onClick: () => void }) {
    return (
      <button onClick={onClick} disabled={saving}
        className={"flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition " +
          (saved ? "bg-green-600 text-white" : "bg-[#C6914C] hover:bg-[#A6743A] text-[#0A0A0C]")}>
        {saved ? <><Check size={15}/> تم الحفظ</> : saving ? <><Loader2 size={15} className="animate-spin"/> جاري...</> : <><Save size={15}/> حفظ التغييرات</>}
      </button>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="skeleton h-8 rounded w-48" />
      <div className="skeleton h-12 rounded-xl" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );

  // ─── Derived design values ─────────────────────────────────────────────────
  const s = settings || {};
  const accent      = s.color_accent        || COLOR_DEFAULTS.color_accent;
  const accentDark  = s.color_accent_dark   || COLOR_DEFAULTS.color_accent_dark;
  const bgPrimary   = s.color_bg_primary    || COLOR_DEFAULTS.color_bg_primary;
  const bgSecondary = s.color_bg_secondary  || COLOR_DEFAULTS.color_bg_secondary;
  const bgCard      = s.color_bg_card       || COLOR_DEFAULTS.color_bg_card;
  const textPrimary = s.color_text_primary  || COLOR_DEFAULTS.color_text_primary;
  const textSec     = s.color_text_secondary|| COLOR_DEFAULTS.color_text_secondary;
  const textMuted   = s.color_text_muted    || COLOR_DEFAULTS.color_text_muted;
  const heroSize    = s.font_size_hero      || COLOR_DEFAULTS.font_size_hero;
  const sectionSize = s.font_size_section_title || COLOR_DEFAULTS.font_size_section_title;
  const bodySize    = s.font_size_body      || COLOR_DEFAULTS.font_size_body;
  const smallSize   = s.font_size_small     || COLOR_DEFAULTS.font_size_small;

  const MAIN_TABS = [
    { id: "profile", label: "الملف الشخصي", icon: User },
    { id: "site",    label: "الموقع",        icon: Globe },
    { id: "design",  label: "التصميم",       icon: Palette },
    { id: "contact", label: "التواصل",       icon: Phone },
    { id: "account", label: "الحساب",        icon: Building },
  ];

  return (
    <div dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');`}</style>

      <h2 className="text-2xl font-bold mb-6">الإعدادات</h2>

      {/* ── Main Tabs ── */}
      <div className="flex gap-1 mb-8 border-b border-[rgba(198,145,76,0.12)] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap " +
              (tab === t.id ? "border-[#C6914C] text-white" : "border-transparent text-[#9A9AA0] hover:text-white")}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </div>


      {/* ════════════════════ TAB: الملف الشخصي ════════════════════ */}
      {tab === "profile" && (
        <div className="max-w-xl">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-lg text-[#C6914C]">المعلومات الشخصية</h3>

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group flex-shrink-0" style={{ width:76, height:76 }}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-dashed border-[#3A3A42] group-hover:border-[#C6914C] transition" style={{ background:"#1C1C22" }}>
                  {profile.photo_url
                    ? <img src={profile.photo_url} alt="صورة" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><User size={30} className="text-[#5A5A62]" /></div>}
                </div>
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition" style={{ background:"rgba(0,0,0,0.5)" }}>
                  {uploadingPhoto ? <Loader2 size={20} className="text-white animate-spin"/> : <Camera size={20} className="text-white"/>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">صورة الملف الشخصي</p>
                <p className="text-xs text-[#5A5A62] mb-2">JPG أو PNG — حجم أقصاه 3MB</p>
                {profile.photo_url && (
                  <button className="text-xs text-red-400 hover:text-red-300 transition" onClick={async () => {
                    await supabase.from("broker_identity").update({ photo_url: null }).not("id","is",null);
                    setProfile(p => ({ ...p, photo_url: "" }));
                    toast.success("تم حذف الصورة");
                  }}>حذف الصورة</button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
            </div>

            {/* Fields */}
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الاسم</label>
              <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">البريد الإلكتروني <span className="text-[#5A5A62]">(بريد الحساب)</span></label>
              <input value={profile.email} disabled className={inputClass + " opacity-50 cursor-not-allowed"} />
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">بريد الإشعارات</label>
              <input value={profile.contact_email} onChange={e => setProfile(p => ({...p, contact_email: e.target.value}))}
                className={inputClass} placeholder="notifications@example.com" type="email" dir="ltr" />
              <p className="text-xs text-[#5A5A62] mt-1">يُستخدم لاستقبال إشعارات الطلبات الجديدة — اتركه فارغاً لإيقاف الإشعارات</p>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">الجنس</label>
              <div className="flex gap-6">
                {[{v:"male",l:"ذكر"},{v:"female",l:"أنثى"}].map(opt => (
                  <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={opt.v} checked={profile.gender === opt.v}
                      onChange={e => setProfile(p => ({...p, gender: e.target.value}))} className="accent-[#C6914C]" />
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
          <div className="md:hidden mb-4">
            <select value={siteSection} onChange={e => { setSiteSection(e.target.value); setSelectedPage(""); }}
              className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.2)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C6914C]"
              style={{ color:"#F5F5F5" }}>
              {SITE_SECTIONS.map(sec => <option key={sec.id} value={sec.id}>{sec.label}</option>)}
            </select>
          </div>

          <div className="md:flex md:gap-6 items-start">
            {/* Desktop sidebar */}
            <div className="hidden md:block w-52 flex-shrink-0 space-y-1">
              {SITE_SECTIONS.map(sec => (
                <button key={sec.id} onClick={() => { setSiteSection(sec.id); setSelectedPage(""); }}
                  className={"w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition " +
                    (siteSection === sec.id ? "bg-[#C6914C] text-white" : "text-[#9A9AA0] hover:text-white hover:bg-[#16161A]")}>
                  <sec.icon size={15} />{sec.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 max-w-2xl space-y-5">

              {/* ── معلومات عامة ── */}
              {siteSection === "general" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
                  <h3 className="font-bold text-[#C6914C] text-lg">معلومات عامة</h3>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">اسم الموقع / اسمك</label>
                    <input value={s.site_name || ""} onChange={e => sc("site_name", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">منطقة التغطية</label>
                    <input value={s.coverage_text || ""} onChange={e => sc("coverage_text", e.target.value)} className={inputClass} placeholder="مثال: شمال وشرق الرياض" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">نص زر تسجيل الدخول</label>
                    <input value={s.login_link_text || ""} onChange={e => sc("login_link_text", e.target.value)} className={inputClass} placeholder="دخول الفريق" />
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── الهوية البصرية ── */}
              {siteSection === "identity" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-6">
                  <h3 className="font-bold text-[#C6914C] text-lg">الهوية البصرية</h3>
                  {/* Logo */}
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-3">شعار الموقع</label>
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-24 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {s.site_logo ? <img src={s.site_logo} alt="الشعار" className="w-full h-full object-contain p-1" /> : <Image size={26} className="text-[#5A5A62]" />}
                      </div>
                      <div className="flex-1">
                        <label className={"flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] text-[#9A9AA0] w-fit " + (uploadingLogo ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2A2A32]")}>
                          <Upload size={14} />
                          {uploadingLogo ? "جاري الرفع..." : "رفع شعار"}
                          <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
                        </label>
                        <p className="text-[#5A5A62] text-xs mt-2">PNG أو SVG — الحجم المثالي 200×200px</p>
                        {logoError && <p className="text-red-400 text-xs mt-2">{logoError}</p>}
                        {s.site_logo && (
                          <button onClick={() => sc("site_logo", "")} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-2 transition">
                            <X size={11} /> حذف الشعار
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">رقم رخصة فال <span className="text-[#5A5A62]">(يظهر في الموقع)</span></label>
                    <input value={s.fal_license || ""} onChange={e => sc("fal_license", e.target.value)} className={inputClass} placeholder="مثال: 1100000000" maxLength={10} dir="ltr" />
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── القسم الرئيسي ── */}
              {siteSection === "hero" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
                  <h3 className="font-bold text-[#C6914C] text-lg">القسم الرئيسي (Hero)</h3>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">الشارة العلوية <span className="text-[#5A5A62]">(النص الصغير فوق العنوان)</span></label>
                    <input value={s.hero_badge || ""} onChange={e => sc("hero_badge", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">العنوان الرئيسي</label>
                    <input value={s.hero_title || ""} onChange={e => sc("hero_title", e.target.value)} className={inputClass + " text-lg font-bold"} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">الوصف التعريفي</label>
                    <textarea value={s.hero_subtitle || ""} onChange={e => sc("hero_subtitle", e.target.value)} rows={3} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9A9AA0] mb-2">صورة الخلفية (رابط URL)</label>
                    <input value={s.hero_image || ""} onChange={e => sc("hero_image", e.target.value)} className={inputClass + " text-sm"} dir="ltr" placeholder="https://images.unsplash.com/..." />
                    {s.hero_image && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-[rgba(198,145,76,0.15)]" style={{ height:140 }}>
                        <img src={s.hero_image} alt="معاينة" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

              {/* ── روابط القائمة ── */}
              {siteSection === "navbar" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-[#C6914C] text-lg">روابط القائمة العلوية</h3>
                      <p className="text-[#5A5A62] text-sm mt-1">الروابط اللي تظهر في النافبار</p>
                    </div>
                    <button onClick={() => sc("navbar_links", [...(s.navbar_links||[]), {label:"",href:"/",type:"link"}])}
                      className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                      <Plus size={13} /> إضافة رابط
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(s.navbar_links || []).map((link: any, i: number) => (
                      <div key={i} className="bg-[#1C1C22] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-[#5A5A62]">رابط {i+1}</span>
                          <button onClick={() => sc("navbar_links", s.navbar_links.filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                            <Trash2 size={11}/> حذف
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-[#5A5A62] mb-1">النص</label>
                            <input value={link.label||""} onChange={e=>navChange(i,"label",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm" placeholder="الرئيسية"/>
                          </div>
                          <div>
                            <label className="block text-xs text-[#5A5A62] mb-1">الرابط</label>
                            <input value={link.href||""} onChange={e=>navChange(i,"href",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm" dir="ltr" placeholder="/"/>
                          </div>
                          <div>
                            <label className="block text-xs text-[#5A5A62] mb-1">النوع</label>
                            <select value={link.type||"link"} onChange={e=>navChange(i,"type",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm">
                              <option value="link">رابط صفحة</option>
                              <option value="anchor">رابط قسم (#)</option>
                              <option value="cta">زر بارز (CTA)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4"><SaveBtn onClick={handleSaveSettings} /></div>
                </div>
              )}

              {/* ── إظهار / إخفاء الأقسام ── */}
              {siteSection === "sections" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
                  <h3 className="font-bold text-[#C6914C] text-lg mb-2">إظهار / إخفاء أقسام الصفحة الرئيسية</h3>
                  <p className="text-[#5A5A62] text-sm mb-5">تحكّم بالأقسام اللي تبيها تظهر</p>
                  <div className="space-y-3">
                    {[
                      { field:"show_why_section",        label:"قسم لماذا تختارنا",      desc:"البطاقات اللي تشرح مميزاتك" },
                      { field:"show_properties_section", label:"قسم العقارات المختارة",  desc:"آخر ٣ عقارات منشورة" },
                      { field:"show_services_section",   label:"قسم الخدمات",            desc:"بطاقات خدماتك العقارية" },
                      { field:"show_cta_section",        label:"قسم التواصل (CTA)",      desc:"صندوق التواصل مع أزرار الواتساب والاتصال" },
                    ].map(item => (
                      <div key={item.field} className="flex items-center justify-between bg-[#1C1C22] rounded-xl p-4">
                        <div>
                          <h4 className="font-medium text-sm">{item.label}</h4>
                          <p className="text-[#5A5A62] text-xs mt-1">{item.desc}</p>
                        </div>
                        <button onClick={() => sc(item.field, !s[item.field])}
                          className={"w-14 h-8 rounded-full transition relative " + (s[item.field]!==false ? "bg-[#C6914C]" : "bg-[#2A2A32]")}>
                          <div className={"w-6 h-6 bg-white rounded-full absolute top-1 transition-all " + (s[item.field]!==false ? "left-1" : "right-1")} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5"><SaveBtn onClick={handleSaveSettings} /></div>
                </div>
              )}

              {/* ── الخدمات ── */}
              {siteSection === "services" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-[#C6914C] text-lg">الخدمات</h3>
                    <button onClick={() => sc("services", [...(s.services||[]), {title:"",desc:"",icon:"🏠"}])}
                      className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                      <Plus size={13}/> إضافة خدمة
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(s.services||[]).map((svc:any,i:number)=>(
                      <div key={i} className="bg-[#1C1C22] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#5A5A62]">خدمة {i+1}</span>
                          <button onClick={() => sc("services", s.services.filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={11}/> حذف</button>
                        </div>
                        <div className="flex gap-3">
                          <div style={{width:52,flexShrink:0}}>
                            <label className="block text-xs text-[#5A5A62] mb-1">الأيقونة</label>
                            <input value={svc.icon||""} onChange={e=>svcChange(i,"icon",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-2 py-2 text-center text-xl focus:outline-none focus:border-[#C6914C]"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs text-[#5A5A62] mb-1">اسم الخدمة</label>
                            <input value={svc.title||""} onChange={e=>svcChange(i,"title",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm"/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-[#5A5A62] mb-1">وصف الخدمة</label>
                          <textarea value={svc.desc||""} onChange={e=>svcChange(i,"desc",e.target.value)} rows={2} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm"/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4"><SaveBtn onClick={handleSaveSettings} /></div>
                </div>
              )}

              {/* ── لماذا تختارنا ── */}
              {siteSection === "why" && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-[#C6914C] text-lg">لماذا تختارنا</h3>
                    <button onClick={() => sc("why_cards", [...(s.why_cards||[]), {title:"",desc:"",icon:"✨"}])}
                      className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                      <Plus size={13}/> إضافة بطاقة
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(s.why_cards||[]).map((card:any,i:number)=>(
                      <div key={i} className="bg-[#1C1C22] rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#5A5A62]">بطاقة {i+1}</span>
                          <button onClick={() => sc("why_cards", s.why_cards.filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 size={11}/> حذف</button>
                        </div>
                        <div className="flex gap-3">
                          <div style={{width:52,flexShrink:0}}>
                            <label className="block text-xs text-[#5A5A62] mb-1">الأيقونة</label>
                            <input value={card.icon||""} onChange={e=>whyChange(i,"icon",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-2 py-2 text-center text-xl focus:outline-none focus:border-[#C6914C]"/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs text-[#5A5A62] mb-1">العنوان</label>
                            <input value={card.title||""} onChange={e=>whyChange(i,"title",e.target.value)} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm"/>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-[#5A5A62] mb-1">الوصف</label>
                          <textarea value={card.desc||""} onChange={e=>whyChange(i,"desc",e.target.value)} rows={2} className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C6914C] text-sm"/>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4"><SaveBtn onClick={handleSaveSettings} /></div>
                </div>
              )}

              {/* ── الصفحات الثابتة ── */}
              {siteSection === "pages" && !selectedPage && (
                <div>
                  <h3 className="font-bold text-[#C6914C] text-lg mb-2">الصفحات الثابتة</h3>
                  <p className="text-[#5A5A62] text-sm mb-5">تعديل نصوص الصفحات في موقعك</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STATIC_PAGES.map(page => (
                      <button key={page.key} onClick={() => setSelectedPage(page.key)}
                        className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 text-right hover:border-[#C6914C] transition">
                        <h4 className="font-bold text-[#C6914C]">{page.label}</h4>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {siteSection === "pages" && selectedPage && (
                <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-[#C6914C]">{STATIC_PAGES.find(p=>p.key===selectedPage)?.label}</h3>
                    <button onClick={() => setSelectedPage("")} className="text-[#9A9AA0] hover:text-white text-sm transition">← رجوع</button>
                  </div>
                  <textarea value={s[selectedPage]||""} onChange={e=>sc(selectedPage,e.target.value)} rows={12}
                    className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C]"
                    placeholder="اكتب محتوى الصفحة هنا..." />
                  <div className="mt-4"><SaveBtn onClick={handleSaveSettings} /></div>
                </div>
              )}

              {/* ── التواصل والفوتر ── */}
              {siteSection === "cta" && (
                <div className="space-y-5">
                  <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
                    <h3 className="font-bold text-[#C6914C] text-lg">قسم التواصل (CTA)</h3>
                    <div>
                      <label className="block text-sm text-[#9A9AA0] mb-2">عنوان قسم التواصل</label>
                      <input value={s.cta_title||""} onChange={e=>sc("cta_title",e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-sm text-[#9A9AA0] mb-2">وصف قسم التواصل</label>
                      <textarea value={s.cta_subtitle||""} onChange={e=>sc("cta_subtitle",e.target.value)} rows={2} className={inputClass} />
                    </div>
                  </div>
                  <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
                    <h3 className="font-bold text-[#C6914C] text-lg">الفوتر</h3>
                    <div>
                      <label className="block text-sm text-[#9A9AA0] mb-2">نص الفوتر التعريفي</label>
                      <textarea value={s.footer_text||""} onChange={e=>sc("footer_text",e.target.value)} rows={3} className={inputClass} />
                    </div>
                  </div>
                  <SaveBtn onClick={handleSaveSettings} />
                </div>
              )}

            </div>{/* end content */}
          </div>
        </div>
      )}


      {/* ════════════════════ TAB: التصميم ════════════════════ */}
      {tab === "design" && settings && (
        <div>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700;900&family=Noto+Kufi+Arabic:wght@700;900&display=swap');`}</style>

          {/* Header row */}
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="text-[#5A5A62] text-sm">غيّر الألوان والخطوط وشاهد النتيجة مباشرة</p>
            <div className="flex items-center gap-2">
              <button onClick={resetDesign}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition"
                style={{ background:"#16161A", border:"1px solid rgba(198,145,76,0.12)", color:"#9A9AA0" }}>
                <RotateCcw size={13}/> إعادة الضبط
              </button>
              <SaveBtn onClick={handleSaveSettings} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

            {/* Live Preview */}
            <div className="order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden sticky top-20" style={{ border:"1px solid rgba(198,145,76,0.15)" }}>
                {/* Browser chrome */}
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background:"#1C1C22", borderBottom:"1px solid rgba(198,145,76,0.08)" }}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background:"#F87171" }}/>
                    <div className="w-3 h-3 rounded-full" style={{ background:"#FBBF24" }}/>
                    <div className="w-3 h-3 rounded-full" style={{ background:"#4ADE80" }}/>
                  </div>
                  <span className="text-xs font-bold" style={{ color:"#C6914C" }}>معاينة مباشرة</span>
                  <div className="flex bg-[#0A0A0C] rounded-lg overflow-hidden border border-[rgba(198,145,76,0.12)]">
                    <button onClick={()=>setMobilePreview(false)} className={"flex items-center gap-1 px-2.5 py-1.5 text-xs transition " + (!mobilePreview?"text-[#C6914C]":"text-[#5A5A62]")} style={{ background:!mobilePreview?"rgba(198,145,76,0.12)":"transparent" }}><Monitor size={12}/> ديسكتوب</button>
                    <button onClick={()=>setMobilePreview(true)}  className={"flex items-center gap-1 px-2.5 py-1.5 text-xs transition " + ( mobilePreview?"text-[#C6914C]":"text-[#5A5A62]")} style={{ background: mobilePreview?"rgba(198,145,76,0.12)":"transparent" }}><Smartphone size={12}/> موبايل</button>
                  </div>
                </div>
                <div style={{ background:"#1C1C22", padding:mobilePreview?"16px":"0", minHeight:500, overflowY:"auto" }}>
                  <div style={{ background:bgPrimary, fontFamily:"'Tajawal', sans-serif", width:mobilePreview?375:"100%", margin:mobilePreview?"0 auto":"0", borderRadius:mobilePreview?16:0, overflow:"hidden", border:mobilePreview?"1px solid rgba(198,145,76,0.2)":"none" }} dir="rtl">
                    {/* Navbar */}
                    <div className="flex items-center justify-between" style={{ padding:"12px 20px", background:bgCard, borderBottom:`1px solid ${accent}20` }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width:26, height:26, borderRadius:8, background:`linear-gradient(135deg,${accent},${accentDark})`, color:bgPrimary, fontSize:10, fontFamily:"'Noto Kufi Arabic',serif", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>إ</div>
                        <span style={{ fontSize:12, fontWeight:700, color:textPrimary }}>{s.site_name||"إلياس الدخيل"}</span>
                      </div>
                      <div className="flex gap-3">
                        <span style={{ fontSize:10, color:textSec }}>الرئيسية</span>
                        <span style={{ fontSize:10, color:textSec }}>العقارات</span>
                        <span style={{ fontSize:10, fontWeight:700, color:bgPrimary, background:`linear-gradient(135deg,${accent},${accentDark})`, padding:"3px 10px", borderRadius:6 }}>تواصل</span>
                      </div>
                    </div>
                    {/* Hero */}
                    <div className="text-center" style={{ padding:"36px 20px 24px" }}>
                      <div style={{ display:"inline-block", fontSize:9, color:accent, background:`${accent}15`, border:`1px solid ${accent}30`, borderRadius:50, padding:"4px 12px", marginBottom:10 }}>وسيط عقاري مرخّص</div>
                      <h1 style={{ fontFamily:"'Noto Kufi Arabic',serif", fontSize:heroSize, fontWeight:900, lineHeight:1.25, color:textPrimary, marginBottom:8 }}>نختصر عليك <span style={{ color:accent }}>الطريق</span></h1>
                      <p style={{ fontSize:bodySize, color:textSec, lineHeight:1.8, maxWidth:340, margin:"0 auto 18px" }}>{s.hero_subtitle||"من البحث إلى التملّك، خبرة عملية في سوق الرياض"}</p>
                      <div className="flex justify-center gap-2">
                        <span style={{ fontSize:11, fontWeight:700, color:bgPrimary, background:`linear-gradient(135deg,${accent},${accentDark})`, padding:"7px 18px", borderRadius:8 }}>واتساب</span>
                        <span style={{ fontSize:11, fontWeight:600, color:textPrimary, border:`1px solid ${accent}25`, padding:"7px 18px", borderRadius:8 }}>اتصال</span>
                      </div>
                    </div>
                    {/* Section */}
                    <div style={{ padding:"26px 20px", background:bgSecondary }}>
                      <div className="text-center" style={{ marginBottom:14 }}>
                        <span style={{ fontSize:9, color:accent, letterSpacing:1 }}>— القيمة المضافة —</span>
                        <h2 style={{ fontFamily:"'Noto Kufi Arabic',serif", fontSize:sectionSize, fontWeight:800, color:textPrimary, lineHeight:1.3, marginTop:4 }}>لماذا تختار إلياس؟</h2>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[{icon:"🎯",title:"معرفة بالسوق"},{icon:"⚡",title:"سرعة التنفيذ"}].map((card,i)=>(
                          <div key={i} style={{ background:bgCard, border:`1px solid ${accent}15`, borderRadius:10, padding:"12px 10px" }}>
                            <span style={{ fontSize:16 }}>{card.icon}</span>
                            <h3 style={{ fontFamily:"'Noto Kufi Arabic',serif", fontSize:bodySize, fontWeight:700, color:textPrimary, marginTop:6, marginBottom:4 }}>{card.title}</h3>
                            <p style={{ fontSize:smallSize, color:textSec, lineHeight:1.6 }}>خبرة ميدانية في الرياض</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ padding:"12px 20px", background:bgSecondary, borderTop:`1px solid ${accent}12` }}>
                      <div className="flex justify-between items-center">
                        <span style={{ fontSize:10, color:textMuted }}>© {s.site_name||"إلياس الدخيل"}</span>
                        <span style={{ fontSize:10, color:textMuted }}>رخصة فال</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="order-1 lg:order-2 space-y-4">
              <div className="flex gap-2">
                {[{id:"colors",label:"الألوان",icon:<Palette size={14}/>},{id:"fonts",label:"الخطوط",icon:<Type size={14}/>}].map(t=>(
                  <button key={t.id} onClick={()=>setDesignTab(t.id as "colors"|"fonts")}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition flex-1 justify-center"
                    style={{ background:designTab===t.id?"rgba(198,145,76,0.15)":"#16161A", color:designTab===t.id?"#C6914C":"#5A5A62", border:"1px solid "+(designTab===t.id?"rgba(198,145,76,0.3)":"rgba(198,145,76,0.12)") }}>
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {designTab === "colors" && (
                <div className="space-y-3">
                  {/* Quick themes */}
                  <div className="rounded-xl p-4" style={{ background:"#16161A", border:"1px solid rgba(198,145,76,0.12)" }}>
                    <h4 className="text-xs font-bold mb-3" style={{ color:"#C6914C" }}>ثيمات سريعة</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_THEMES.map(theme=>(
                        <button key={theme.name} onClick={()=>applyTheme(theme)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition hover:opacity-80"
                          style={{ background:theme.colors.color_bg_card, border:`1px solid ${theme.colors.color_accent}30`, color:theme.colors.color_text_primary }}>
                          <span>{theme.emoji}</span>
                          <span style={{ color:theme.colors.color_accent }}>{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Color groups */}
                  {COLOR_GROUPS.map(group=>(
                    <div key={group.id} className="rounded-xl overflow-hidden" style={{ background:"#16161A", border:"1px solid rgba(198,145,76,0.12)" }}>
                      <button onClick={()=>toggleCollapse(group.id)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition hover:bg-[rgba(198,145,76,0.04)]" style={{ color:"#C6914C" }}>
                        <span>{group.label}</span>
                        {collapsed[group.id]?<ChevronDown size={15}/>:<ChevronUp size={15}/>}
                      </button>
                      {!collapsed[group.id] && (
                        <div className="px-4 pb-4 space-y-2">
                          {group.fields.map(field=>{
                            const val = s[field.key]||(COLOR_DEFAULTS as any)[field.key];
                            return (
                              <div key={field.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background:"#1C1C22" }}>
                                <label className="relative cursor-pointer flex-shrink-0">
                                  <input type="color" value={val} onChange={e=>sc(field.key,e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/>
                                  <div className="w-9 h-9 rounded-lg border-2 transition" style={{ background:val, borderColor:"rgba(198,145,76,0.3)" }}/>
                                </label>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate" style={{ color:"#F5F5F5" }}>{field.label}</div>
                                  <div className="text-xs" style={{ color:"#5A5A62" }}>{field.desc}</div>
                                </div>
                                <input type="text" value={val} onChange={e=>sc(field.key,e.target.value)} maxLength={9} className="w-20 text-center text-xs rounded-lg px-2 py-1.5 focus:outline-none font-mono" style={{ background:"#0A0A0C", border:"1px solid rgba(198,145,76,0.12)", color:"#9A9AA0" }} dir="ltr"/>
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
                  <div className="rounded-xl p-4 space-y-5" style={{ background:"#16161A", border:"1px solid rgba(198,145,76,0.12)" }}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold" style={{ color:"#C6914C" }}>أحجام النصوص</h4>
                      <button onClick={()=>{ sc("font_size_body",COLOR_DEFAULTS.font_size_body); sc("font_size_small",COLOR_DEFAULTS.font_size_small); }} className="flex items-center gap-1 text-xs" style={{ color:"#5A5A62" }}><RotateCcw size={10}/> استعادة</button>
                    </div>
                    {[
                      { key:"font_size_body",  label:"حجم النص العادي",  desc:"الأوصاف والفقرات", min:12, max:20, def:15 },
                      { key:"font_size_small", label:"حجم النص الصغير", desc:"التواريخ والتفاصيل", min:10, max:18, def:13 },
                    ].map(field=>{
                      const val = parsePx(s[field.key], field.def);
                      return (
                        <div key={field.key}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="text-sm font-medium" style={{ color:"#F5F5F5" }}>{field.label}</span>
                              <span className="text-xs mr-2" style={{ color:"#5A5A62" }}>{field.desc}</span>
                            </div>
                            <span className="text-sm font-bold font-mono" style={{ color:"#C6914C" }}>{val}px</span>
                          </div>
                          <input type="range" min={field.min} max={field.max} step={1} value={val} onChange={e=>sc(field.key, e.target.value+"px")}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor:"#C6914C" }}/>
                        </div>
                      );
                    })}
                  </div>
                  {/* Heading presets */}
                  <div className="rounded-xl p-4 space-y-4" style={{ background:"#16161A", border:"1px solid rgba(198,145,76,0.12)" }}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold" style={{ color:"#C6914C" }}>أحجام العناوين</h4>
                      <button onClick={()=>{ sc("font_size_hero",COLOR_DEFAULTS.font_size_hero); sc("font_size_section_title",COLOR_DEFAULTS.font_size_section_title); }} className="flex items-center gap-1 text-xs" style={{ color:"#5A5A62" }}><RotateCcw size={10}/> استعادة</button>
                    </div>
                    {[
                      { key:"font_size_hero",         label:"العنوان الرئيسي (Hero)", desc:"العنوان الكبير في أعلى الصفحة", presets:[{l:"صغير",v:"clamp(2rem,4vw,3rem)"},{l:"متوسط",v:"clamp(2.4rem,5.5vw,4.2rem)"},{l:"كبير",v:"clamp(3rem,6vw,5rem)"}] },
                      { key:"font_size_section_title", label:"عناوين الأقسام",         desc:"لماذا تختارنا، الخدمات...",   presets:[{l:"صغير",v:"clamp(1.4rem,2.5vw,2rem)"},{l:"متوسط",v:"clamp(1.8rem,3.5vw,2.6rem)"},{l:"كبير",v:"clamp(2.2rem,4vw,3.2rem)"}] },
                    ].map(field=>(
                      <div key={field.key} className="p-3 rounded-lg space-y-2" style={{ background:"#1C1C22" }}>
                        <div>
                          <div className="text-sm font-medium" style={{ color:"#F5F5F5" }}>{field.label}</div>
                          <div className="text-xs" style={{ color:"#5A5A62" }}>{field.desc}</div>
                        </div>
                        <div className="flex gap-2">
                          {field.presets.map(p=>{
                            const active = (s[field.key]||(COLOR_DEFAULTS as any)[field.key]) === p.v;
                            return (
                              <button key={p.v} onClick={()=>sc(field.key,p.v)}
                                className="flex-1 py-2 rounded-lg text-xs font-medium transition"
                                style={{ background:active?"rgba(198,145,76,0.15)":"#0A0A0C", color:active?"#C6914C":"#5A5A62", border:"1px solid "+(active?"rgba(198,145,76,0.3)":"rgba(198,145,76,0.08)") }}>
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
        <div className="max-w-2xl space-y-5">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-[#C6914C] text-lg">معلومات التواصل العامة</h3>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال <span className="text-[#5A5A62]">(مع مفتاح الدولة)</span></label>
              <input value={s.phone||""} onChange={e=>sc("phone",e.target.value)} className={inputClass} placeholder="+966501234567" dir="ltr"/>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم الواتساب <span className="text-[#5A5A62]">(بدون + — مثال: 966501234567)</span></label>
              <input value={s.whatsapp||""} onChange={e=>sc("whatsapp",e.target.value)} className={inputClass} placeholder="966501234567" dir="ltr"/>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">البريد الإلكتروني العام <span className="text-[#5A5A62]">(يظهر في الموقع)</span></label>
              <input value={s.email||""} onChange={e=>sc("email",e.target.value)} className={inputClass} placeholder="info@example.com" dir="ltr"/>
            </div>
          </div>
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-[#C6914C] text-lg">حسابات السوشال ميديا</h3>
            {SOCIAL_PLATFORMS.map(p => (
              <div key={p.key}>
                <label className="block text-sm text-[#9A9AA0] mb-2">{p.label}</label>
                <input value={s[p.key]||""} onChange={e=>sc(p.key,e.target.value)} className={inputClass} placeholder={p.placeholder} dir="ltr"/>
              </div>
            ))}
          </div>
          <SaveBtn onClick={handleSaveSettings} />
        </div>
      )}


      {/* ════════════════════ TAB: الحساب ════════════════════ */}
      {tab === "account" && (
        <div className="max-w-2xl space-y-6">

          {/* رابطك الشخصي */}
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.2)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <Link2 size={17} className="text-[#C6914C]"/>
              <h3 className="font-bold text-lg">رابطك الشخصي</h3>
            </div>
            <p className="text-[#5A5A62] text-sm mb-5">هذا هو رابط صفحتك التي يراها عملاؤك — يجب أن يكون فريداً وباللغة الإنجليزية</p>
            {slug && (
              <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-4 text-sm no-underline" style={{ color:"#C6914C" }}>
                <span className="text-[#5A5A62]">waseet-pro.com/</span>
                <span className="font-bold">{slug}</span>
                <span style={{ fontSize:11, background:"rgba(198,145,76,0.1)", border:"1px solid rgba(198,145,76,0.2)", padding:"2px 8px", borderRadius:6 }}>فتح ↗</span>
              </a>
            )}
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A5A62] text-sm select-none pointer-events-none">waseet-pro.com/</span>
                <input value={slugInput} onChange={e=>handleSlugChange(e.target.value)} placeholder="your-slug" dir="ltr" className={inputClass + " pr-32"} style={{ paddingRight:"8.5rem" }}/>
              </div>
              <button onClick={handleSaveSlug} disabled={savingSlug || slugStatus !== "available" || slugInput === slug}
                className="px-4 py-3 rounded-lg text-sm font-medium transition disabled:opacity-40"
                style={{ background:"rgba(198,145,76,0.15)", border:"1px solid rgba(198,145,76,0.25)", color:"#C6914C", whiteSpace:"nowrap" }}>
                {savingSlug ? <Loader2 size={15} className="animate-spin"/> : "حفظ"}
              </button>
            </div>
            {slugStatus !== "idle" && slugInput !== slug && (
              <div className={`flex items-center gap-2 mt-2 text-sm ${slugStatus==="available"?"text-emerald-400":slugStatus==="checking"?"text-[#9A9AA0]":"text-red-400"}`}>
                {slugStatus==="checking" && <Loader2 size={12} className="animate-spin"/>}
                {slugStatus==="available" && <CheckCircle2 size={12}/>}
                {(slugStatus==="taken"||slugStatus==="invalid") && <XCircle size={12}/>}
                <span>{slugStatus==="checking"?"جاري الفحص...":slugMsg}</span>
              </div>
            )}
            <p className="text-[#5A5A62] text-xs mt-3">أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط — 3 إلى 40 حرفاً</p>
          </div>

          {/* الشهادات والتراخيص */}
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6 space-y-5">
            <h3 className="font-bold text-lg text-[#C6914C]">الشهادات والتراخيص</h3>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم السجل التجاري / الرقم الموحد</label>
              <input value={licenses.commercial_register} onChange={e=>setLicenses(l=>({...l,commercial_register:e.target.value}))} className={inputClass} placeholder="مثال: 1010000000" maxLength={10} dir="ltr"/>
            </div>
            <div>
              <label className="block text-sm text-[#9A9AA0] mb-2">رقم وثيقة العمل الحر</label>
              <input value={licenses.freelance_doc} onChange={e=>setLicenses(l=>({...l,freelance_doc:e.target.value}))} className={inputClass} placeholder="أدخل رقم وثيقة العمل الحر" dir="ltr"/>
            </div>
            <SaveBtn onClick={handleSaveLicenses} />
          </div>

          {/* الفريق */}
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg">الفريق</h3>
              <button className="bg-[#C6914C] hover:bg-[#A6743A] px-4 py-2 rounded-lg text-sm transition">دعوة عضو جديد</button>
            </div>
            <table className="w-full" style={{ minWidth:320 }}>
              <thead>
                <tr className="text-[#9A9AA0] text-sm border-b border-[rgba(198,145,76,0.12)]">
                  <th className="text-right pb-3">الاسم</th>
                  <th className="text-right pb-3">الصلاحية</th>
                  <th className="text-right pb-3">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">{profile.name || "—"}</td>
                  <td className="py-4"><span className="bg-[rgba(198,145,76,0.1)] text-[#C6914C] text-xs px-2 py-1 rounded">مالك</span></td>
                  <td className="py-4 text-[#9A9AA0] text-sm">المؤسس</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
}
