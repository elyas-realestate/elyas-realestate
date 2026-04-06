"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, Check, Globe, Phone, Share2, FileText, Palette, MessageSquare, Layout, Link2, Eye, Plus, Trash2, Image, Upload, X } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const socialPlatforms = [
  { key: "social_x",         label: "X (تويتر)",   placeholder: "https://x.com/username" },
  { key: "social_instagram", label: "Instagram",    placeholder: "https://instagram.com/username" },
  { key: "social_tiktok",    label: "TikTok",       placeholder: "https://tiktok.com/@username" },
  { key: "social_snapchat",  label: "سناب شات",     placeholder: "https://snapchat.com/add/username" },
  { key: "social_linkedin",  label: "LinkedIn",     placeholder: "https://linkedin.com/in/username" },
  { key: "social_youtube",   label: "يوتيوب",       placeholder: "https://youtube.com/@username" },
  { key: "social_threads",   label: "Threads",      placeholder: "https://threads.net/@username" },
  { key: "social_facebook",  label: "فيسبوك",       placeholder: "https://facebook.com/username" },
  { key: "social_whatsapp",  label: "واتساب (رابط)", placeholder: "https://wa.me/966501234567" },
];

const staticPages = [
  { key: "page_home",     label: "الصفحة الرئيسية",  desc: "المحتوى النصي للصفحة الرئيسية" },
  { key: "page_map",      label: "الخريطة",           desc: "نص صفحة الخريطة" },
  { key: "page_requests", label: "طلبات العقار",      desc: "نص صفحة طلبات العقار" },
  { key: "page_links",    label: "صفحة الروابط",      desc: "نص صفحة الروابط" },
  { key: "page_privacy",  label: "سياسة الخصوصية",   desc: "نص سياسة الخصوصية" },
  { key: "page_terms",    label: "الشروط والأحكام",   desc: "نص الشروط والأحكام" },
];

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const [selectedPage, setSelectedPage] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  }

  function handleChange(field: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  }

  // === Services ===
  function handleServiceChange(index: number, field: string, value: string) {
    const services = [...(settings.services || [])];
    services[index] = { ...services[index], [field]: value };
    setSettings((prev: any) => ({ ...prev, services }));
  }
  function addService() {
    setSettings((prev: any) => ({ ...prev, services: [...(prev.services || []), { title: "", desc: "", icon: "🏠" }] }));
  }
  function removeService(index: number) {
    setSettings((prev: any) => ({ ...prev, services: prev.services.filter((_: any, i: number) => i !== index) }));
  }

  // === Why Cards ===
  function handleWhyChange(index: number, field: string, value: string) {
    const why_cards = [...(settings.why_cards || [])];
    why_cards[index] = { ...why_cards[index], [field]: value };
    setSettings((prev: any) => ({ ...prev, why_cards }));
  }
  function addWhyCard() {
    setSettings((prev: any) => ({ ...prev, why_cards: [...(prev.why_cards || []), { title: "", desc: "", icon: "✨" }] }));
  }
  function removeWhyCard(index: number) {
    setSettings((prev: any) => ({ ...prev, why_cards: prev.why_cards.filter((_: any, i: number) => i !== index) }));
  }

  // === Navbar Links ===
  function handleNavChange(index: number, field: string, value: string) {
    const navbar_links = [...(settings.navbar_links || [])];
    navbar_links[index] = { ...navbar_links[index], [field]: value };
    setSettings((prev: any) => ({ ...prev, navbar_links }));
  }
  function addNavLink() {
    setSettings((prev: any) => ({ ...prev, navbar_links: [...(prev.navbar_links || []), { label: "", href: "/", type: "link" }] }));
  }
  function removeNavLink(index: number) {
    setSettings((prev: any) => ({ ...prev, navbar_links: prev.navbar_links.filter((_: any, i: number) => i !== index) }));
  }

  // === Logo Upload ===
  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setLogoError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `logos/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("assets").getPublicUrl(path);
      handleChange("site_logo", data.publicUrl);
    } catch (e: any) {
      setLogoError("تعذّر رفع الشعار — تأكد من إنشاء bucket اسمه 'assets' في Supabase Storage");
    }
    setUploadingLogo(false);
  }

  // === Save ===
  async function handleSave() {
    setSaving(true);
    const { id, created_at, ...updateData } = settings;
    await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-[#9A9AA0] text-center py-20">جاري التحميل...</div>;
  if (!settings) return <div className="text-red-400 text-center py-20">لم يتم العثور على الإعدادات</div>;

  const inputClass = "w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C] transition";

  const sections = [
    { id: "general",  label: "معلومات عامة",           icon: Globe },
    { id: "identity", label: "الهوية البصرية",          icon: Image },
    { id: "contact",  label: "التواصل والسوشال",        icon: Phone },
    { id: "hero",     label: "القسم الرئيسي",           icon: Palette },
    { id: "navbar",   label: "روابط القائمة",           icon: Link2 },
    { id: "sections", label: "إظهار / إخفاء الأقسام",  icon: Eye },
    { id: "services", label: "الخدمات",                 icon: FileText },
    { id: "why",      label: "لماذا تختارنا",           icon: MessageSquare },
    { id: "pages",    label: "الصفحات الثابتة",         icon: Layout },
    { id: "cta",      label: "التواصل والفوتر",         icon: Share2 },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">إعدادات الموقع</h2>
          <p className="text-[#9A9AA0] text-sm">تحكّم بكل محتوى الصفحة الرئيسية — النصوص، الصور، الروابط، والأقسام</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={"flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition " +
            (saved ? "bg-green-600 text-white" : "bg-[#C9A84C] hover:bg-[#A68A3A] text-[#0A0A0C]")}>
          {saved ? <><Check size={20} /> تم الحفظ</> : saving ? <><Save size={20} className="animate-spin" /> جاري الحفظ...</> : <><Save size={20} /> حفظ التعديلات</>}
        </button>
      </div>

      <div className="flex gap-6">
        {/* القائمة الجانبية */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {sections.map(sec => (
            <button key={sec.id} onClick={() => { setActiveSection(sec.id); setSelectedPage(""); }}
              className={"w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition " +
                (activeSection === sec.id ? "bg-[#C9A84C] text-white" : "text-[#9A9AA0] hover:text-white hover:bg-[#16161A]")}>
              <sec.icon size={16} />{sec.label}
            </button>
          ))}
        </div>

        {/* المحتوى */}
        <div className="flex-1 max-w-3xl">

          {/* ═══ معلومات عامة ═══ */}
          {activeSection === "general" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-5">
              <h3 className="font-bold text-[#C9A84C] text-lg mb-4">معلومات عامة</h3>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">اسم الموقع / اسمك</label>
                <input value={settings.site_name || ""} onChange={e => handleChange("site_name", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">منطقة التغطية</label>
                <input value={settings.coverage_text || ""} onChange={e => handleChange("coverage_text", e.target.value)} className={inputClass} placeholder="مثال: شمال وشرق الرياض" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">
                  نص زر تسجيل الدخول <span className="text-[#5A5A62]">(يظهر في النافبار للفريق)</span>
                </label>
                <input value={settings.login_link_text || ""} onChange={e => handleChange("login_link_text", e.target.value)} className={inputClass} placeholder="دخول الفريق" />
              </div>
            </div>
          )}

          {/* ═══ الهوية البصرية ═══ */}
          {activeSection === "identity" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-6">
              <h3 className="font-bold text-[#C9A84C] text-lg mb-4">الهوية البصرية</h3>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-3">شعار الموقع</label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {settings.site_logo ? (
                      <img src={settings.site_logo} alt="الشعار" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Image size={28} className="text-[#5A5A62]" />
                    )}
                  </div>
                  {/* Upload controls */}
                  <div className="flex-1">
                    <label className={
                      "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium cursor-pointer transition " +
                      (uploadingLogo ? "opacity-50 cursor-not-allowed " : "hover:bg-[#2A2A32] ") +
                      "bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] text-[#9A9AA0] w-fit"
                    }>
                      <Upload size={15} />
                      {uploadingLogo ? "جاري الرفع..." : "رفع شعار"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
                      />
                    </label>
                    <p className="text-[#5A5A62] text-xs mt-2">PNG أو SVG بخلفية شفافة — الحجم المثالي 200×200px</p>
                    {logoError && <p className="text-red-400 text-xs mt-2">{logoError}</p>}
                    {settings.site_logo && (
                      <button onClick={() => handleChange("site_logo", "")} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 mt-2 transition">
                        <X size={12} /> حذف الشعار
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">اللون الرئيسي للموقع</label>
                <div className="flex items-center gap-4">
                  <input type="color" defaultValue="#C9A84C" className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent" />
                  <span className="text-[#9A9AA0] text-sm">
                    للتحكم الكامل بالألوان والخطوط اذهب إلى{" "}
                    <a href="/dashboard/visual-editor" className="text-[#C9A84C] hover:underline">المحرر البصري</a>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم رخصة فال <span className="text-[#5A5A62]">(يظهر في الموقع)</span></label>
                <input value={settings.fal_license || ""} onChange={e => handleChange("fal_license", e.target.value)} className={inputClass} placeholder="مثال: 7001234567" />
              </div>
            </div>
          )}

          {/* ═══ التواصل والسوشال ═══ */}
          {activeSection === "contact" && (
            <div className="space-y-6">
              <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-4">معلومات التواصل العامة</h3>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال <span className="text-[#5A5A62]">(مع مفتاح الدولة)</span></label>
                  <input value={settings.phone || ""} onChange={e => handleChange("phone", e.target.value)} className={inputClass} placeholder="+966501234567" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">رقم الواتساب <span className="text-[#5A5A62]">(بدون + — مثال: 966501234567)</span></label>
                  <input value={settings.whatsapp || ""} onChange={e => handleChange("whatsapp", e.target.value)} className={inputClass} placeholder="966501234567" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">البريد الإلكتروني</label>
                  <input value={settings.email || ""} onChange={e => handleChange("email", e.target.value)} className={inputClass} placeholder="info@example.com" dir="ltr" />
                </div>
              </div>

              <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-4">حسابات السوشال ميديا</h3>
                {socialPlatforms.map(p => (
                  <div key={p.key}>
                    <label className="block text-sm text-[#9A9AA0] mb-2">{p.label}</label>
                    <input value={settings[p.key] || ""} onChange={e => handleChange(p.key, e.target.value)} className={inputClass} placeholder={p.placeholder} dir="ltr" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ القسم الرئيسي (Hero) ═══ */}
          {activeSection === "hero" && (
            <div className="space-y-6">
              <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-4">القسم الرئيسي (Hero)</h3>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الشارة العلوية <span className="text-[#5A5A62]">(النص الصغير فوق العنوان)</span></label>
                  <input value={settings.hero_badge || ""} onChange={e => handleChange("hero_badge", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">العنوان الرئيسي</label>
                  <input value={settings.hero_title || ""} onChange={e => handleChange("hero_title", e.target.value)} className={inputClass + " text-lg font-bold"} />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">الوصف التعريفي</label>
                  <textarea value={settings.hero_subtitle || ""} onChange={e => handleChange("hero_subtitle", e.target.value)} rows={3} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">صورة الخلفية <span className="text-[#5A5A62]">(رابط الصورة — URL)</span></label>
                  <input value={settings.hero_image || ""} onChange={e => handleChange("hero_image", e.target.value)} className={inputClass + " text-sm"} dir="ltr" placeholder="https://images.unsplash.com/..." />
                  {settings.hero_image && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-[rgba(201,168,76,0.15)]" style={{ height: 150 }}>
                      <img src={settings.hero_image} alt="معاينة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-800/50 border border-[rgba(201,168,76,0.12)] rounded-xl p-4">
                <p className="text-[#5A5A62] text-sm">💡 هذه النصوص تظهر في أول شي يشوفه الزائر — اجعلها مؤثرة ومختصرة. صورة الخلفية يُفضل أن تكون بدقة عالية (1920px عرض على الأقل).</p>
              </div>
            </div>
          )}

          {/* ═══ روابط القائمة (Navbar) ═══ */}
          {activeSection === "navbar" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-[#C9A84C] text-lg">روابط القائمة العلوية</h3>
                  <p className="text-[#5A5A62] text-sm mt-1">الروابط اللي تظهر في النافبار — أضف، عدّل، أو احذف</p>
                </div>
                <button onClick={addNavLink} className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <Plus size={14} /> إضافة رابط
                </button>
              </div>
              <div className="space-y-3">
                {(settings.navbar_links || []).map((link: any, i: number) => (
                  <div key={i} className="bg-[#1C1C22] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-[#5A5A62]">رابط {i + 1}</span>
                      <button onClick={() => removeNavLink(i)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[#5A5A62] mb-1">النص</label>
                        <input value={link.label || ""} onChange={e => handleNavChange(i, "label", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" placeholder="الرئيسية" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#5A5A62] mb-1">الرابط</label>
                        <input value={link.href || ""} onChange={e => handleNavChange(i, "href", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" dir="ltr" placeholder="/" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#5A5A62] mb-1">النوع</label>
                        <select value={link.type || "link"} onChange={e => handleNavChange(i, "type", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm">
                          <option value="link">رابط صفحة</option>
                          <option value="anchor">رابط قسم (#)</option>
                          <option value="cta">زر بارز (CTA)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/50 border border-[rgba(201,168,76,0.15)] rounded-xl p-4 mt-4">
                <p className="text-[#5A5A62] text-sm">💡 <strong>رابط صفحة:</strong> ينتقل لصفحة أخرى (مثل /properties). <strong>رابط قسم:</strong> ينزل لقسم في نفس الصفحة (مثل #services). <strong>زر بارز:</strong> يظهر كزر ذهبي مميز.</p>
              </div>
            </div>
          )}

          {/* ═══ إظهار / إخفاء الأقسام ═══ */}
          {activeSection === "sections" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6">
              <h3 className="font-bold text-[#C9A84C] text-lg mb-2">إظهار / إخفاء أقسام الصفحة الرئيسية</h3>
              <p className="text-[#5A5A62] text-sm mb-6">تحكّم بالأقسام اللي تبيها تظهر في الصفحة الرئيسية</p>
              <div className="space-y-4">
                {[
                  { field: "show_why_section",        label: "قسم لماذا تختارنا",       desc: "البطاقات اللي تشرح مميزاتك" },
                  { field: "show_properties_section", label: "قسم العقارات المختارة",   desc: "آخر ٣ عقارات منشورة" },
                  { field: "show_services_section",   label: "قسم الخدمات",             desc: "بطاقات خدماتك العقارية" },
                  { field: "show_cta_section",        label: "قسم التواصل (CTA)",       desc: "صندوق التواصل مع أزرار الواتساب والاتصال" },
                ].map(item => (
                  <div key={item.field} className="flex items-center justify-between bg-[#1C1C22] rounded-xl p-4">
                    <div>
                      <h4 className="font-medium text-sm">{item.label}</h4>
                      <p className="text-[#5A5A62] text-xs mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleChange(item.field, !settings[item.field])}
                      className={"w-14 h-8 rounded-full transition relative " + (settings[item.field] !== false ? "bg-[#C9A84C]" : "bg-[#2A2A32]")}
                    >
                      <div className={"w-6 h-6 bg-white rounded-full absolute top-1 transition-all " + (settings[item.field] !== false ? "left-1" : "right-1")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ الخدمات ═══ */}
          {activeSection === "services" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#C9A84C] text-lg">الخدمات</h3>
                <button onClick={addService} className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <Plus size={14} /> إضافة خدمة
                </button>
              </div>
              <div className="space-y-4">
                {(settings.services || []).map((svc: any, i: number) => (
                  <div key={i} className="bg-[#1C1C22] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#5A5A62]">خدمة {i + 1}</span>
                      <button onClick={() => removeService(i)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs text-[#5A5A62] mb-1">الأيقونة</label>
                        <input value={svc.icon || ""} onChange={e => handleServiceChange(i, "icon", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-[#C9A84C]" />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-xs text-[#5A5A62] mb-1">اسم الخدمة</label>
                        <input value={svc.title || ""} onChange={e => handleServiceChange(i, "title", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#5A5A62] mb-1">وصف الخدمة</label>
                      <textarea value={svc.desc || ""} onChange={e => handleServiceChange(i, "desc", e.target.value)} rows={2} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ لماذا تختارنا ═══ */}
          {activeSection === "why" && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#C9A84C] text-lg">لماذا تختارنا</h3>
                <button onClick={addWhyCard} className="text-sm bg-[#1C1C22] hover:bg-[#2A2A32] px-4 py-2 rounded-lg transition flex items-center gap-2">
                  <Plus size={14} /> إضافة بطاقة
                </button>
              </div>
              <div className="space-y-4">
                {(settings.why_cards || []).map((card: any, i: number) => (
                  <div key={i} className="bg-[#1C1C22] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#5A5A62]">بطاقة {i + 1}</span>
                      <button onClick={() => removeWhyCard(i)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                        <Trash2 size={12} /> حذف
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs text-[#5A5A62] mb-1">الأيقونة</label>
                        <input value={card.icon || ""} onChange={e => handleWhyChange(i, "icon", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-[#C9A84C]" />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-xs text-[#5A5A62] mb-1">العنوان</label>
                        <input value={card.title || ""} onChange={e => handleWhyChange(i, "title", e.target.value)} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#5A5A62] mb-1">الوصف</label>
                      <textarea value={card.desc || ""} onChange={e => handleWhyChange(i, "desc", e.target.value)} rows={2} className="w-full bg-[#16161A] border border-[rgba(201,168,76,0.15)] rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C] text-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ الصفحات الثابتة ═══ */}
          {activeSection === "pages" && !selectedPage && (
            <div>
              <h3 className="font-bold text-[#C9A84C] text-lg mb-2">الصفحات الثابتة</h3>
              <p className="text-[#5A5A62] text-sm mb-6">تعديل نصوص الصفحات الثابتة في الموقع</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staticPages.map(page => (
                  <button key={page.key} onClick={() => setSelectedPage(page.key)}
                    className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-5 text-right hover:border-[#C9A84C] transition">
                    <h4 className="font-bold text-[#C9A84C] mb-2">{page.label}</h4>
                    <p className="text-[#9A9AA0] text-sm">{page.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "pages" && selectedPage && (
            <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-[#C9A84C]">{staticPages.find(p => p.key === selectedPage)?.label}</h3>
                <button onClick={() => setSelectedPage("")} className="text-[#9A9AA0] hover:text-white text-sm transition">رجوع</button>
              </div>
              <textarea
                value={settings[selectedPage] || ""}
                onChange={e => handleChange(selectedPage, e.target.value)}
                rows={12}
                className="w-full bg-[#1C1C22] border border-[rgba(201,168,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C]"
                placeholder="اكتب محتوى الصفحة هنا..."
              />
            </div>
          )}

          {/* ═══ قسم التواصل والفوتر ═══ */}
          {activeSection === "cta" && (
            <div className="space-y-6">
              <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-4">قسم التواصل (CTA)</h3>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">عنوان قسم التواصل</label>
                  <input value={settings.cta_title || ""} onChange={e => handleChange("cta_title", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">وصف قسم التواصل</label>
                  <textarea value={settings.cta_subtitle || ""} onChange={e => handleChange("cta_subtitle", e.target.value)} rows={2} className={inputClass} />
                </div>
              </div>
              <div className="bg-[#16161A] border border-[rgba(201,168,76,0.12)] rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-[#C9A84C] text-lg mb-4">الفوتر</h3>
                <div>
                  <label className="block text-sm text-[#9A9AA0] mb-2">نص الفوتر التعريفي</label>
                  <textarea value={settings.footer_text || ""} onChange={e => handleChange("footer_text", e.target.value)} rows={3} className={inputClass} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
