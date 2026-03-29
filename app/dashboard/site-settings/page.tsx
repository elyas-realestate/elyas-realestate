"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Save, Check, Globe, Phone, Share2, FileText, Palette, MessageSquare } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from("site_settings").select("*").limit(1).single();
    if (data) setSettings(data);
    setLoading(false);
  }

  function handleChange(field: string, value: any) {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  }

  function handleServiceChange(index: number, field: string, value: string) {
    const services = [...(settings.services || [])];
    services[index] = { ...services[index], [field]: value };
    setSettings((prev: any) => ({ ...prev, services }));
  }

  function addService() {
    const services = [...(settings.services || []), { title: "", desc: "", icon: "🏠" }];
    setSettings((prev: any) => ({ ...prev, services }));
  }

  function removeService(index: number) {
    const services = (settings.services || []).filter((_: any, i: number) => i !== index);
    setSettings((prev: any) => ({ ...prev, services }));
  }

  function handleWhyChange(index: number, field: string, value: string) {
    const why_cards = [...(settings.why_cards || [])];
    why_cards[index] = { ...why_cards[index], [field]: value };
    setSettings((prev: any) => ({ ...prev, why_cards }));
  }

  function addWhyCard() {
    const why_cards = [...(settings.why_cards || []), { title: "", desc: "", icon: "✨" }];
    setSettings((prev: any) => ({ ...prev, why_cards }));
  }

  function removeWhyCard(index: number) {
    const why_cards = (settings.why_cards || []).filter((_: any, i: number) => i !== index);
    setSettings((prev: any) => ({ ...prev, why_cards }));
  }

  async function handleSave() {
    setSaving(true);
    const { id, created_at, ...updateData } = settings;
    await supabase.from("site_settings").update(updateData).eq("id", settings.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;
  if (!settings) return <div className="text-red-400 text-center py-20">لم يتم العثور على الإعدادات</div>;

  const sections = [
    { id: "general", label: "معلومات عامة", icon: Globe },
    { id: "contact", label: "التواصل والسوشال", icon: Phone },
    { id: "hero", label: "القسم الرئيسي", icon: Palette },
    { id: "services", label: "الخدمات", icon: FileText },
    { id: "why", label: "لماذا تختارنا", icon: MessageSquare },
    { id: "cta", label: "قسم التواصل والفوتر", icon: Share2 },
  ];

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">إعدادات الموقع</h2>
          <p className="text-gray-400 text-sm">تحكّم بكل محتوى الصفحة الرئيسية — النصوص، الأرقام، الخدمات، وروابط التواصل</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={"flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition " + (saved ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700")}
        >
          {saved ? <><Check size={20} /> تم الحفظ</> : saving ? <><Save size={20} className="animate-spin" /> جاري الحفظ...</> : <><Save size={20} /> حفظ التعديلات</>}
        </button>
      </div>

      <div className="flex gap-6">
        {/* القائمة الجانبية */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={"w-full text-right flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition " + (activeSection === sec.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-900")}
            >
              <sec.icon size={16} />
              {sec.label}
            </button>
          ))}
        </div>

        {/* المحتوى */}
        <div className="flex-1 max-w-3xl">

          {/* ═══════ معلومات عامة ═══════ */}
          {activeSection === "general" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">معلومات عامة</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">اسم الموقع / اسمك</label>
                  <input value={settings.site_name || ""} onChange={e => handleChange("site_name", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">رقم رخصة فال</label>
                  <input value={settings.fal_license || ""} onChange={e => handleChange("fal_license", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="مثال: 7001234567" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">منطقة التغطية</label>
                  <input value={settings.coverage_text || ""} onChange={e => handleChange("coverage_text", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="مثال: شمال وشرق الرياض" />
                </div>
              </div>
            </div>
          )}

          {/* ═══════ التواصل والسوشال ═══════ */}
          {activeSection === "contact" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">أرقام التواصل</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">رقم الجوال <span className="text-gray-600">(مع مفتاح الدولة — مثال: +966501234567)</span></label>
                  <input value={settings.phone || ""} onChange={e => handleChange("phone", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="+966501234567" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">رقم الواتساب <span className="text-gray-600">(بدون + أو أصفار — مثال: 966501234567)</span></label>
                  <input value={settings.whatsapp || ""} onChange={e => handleChange("whatsapp", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="966501234567" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
                  <input value={settings.email || ""} onChange={e => handleChange("email", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="info@example.com" dir="ltr" />
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">حسابات السوشال ميديا</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">X (تويتر) <span className="text-gray-600">(الرابط كامل)</span></label>
                  <input value={settings.social_x || ""} onChange={e => handleChange("social_x", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://x.com/username" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Instagram</label>
                  <input value={settings.social_instagram || ""} onChange={e => handleChange("social_instagram", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://instagram.com/username" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">TikTok</label>
                  <input value={settings.social_tiktok || ""} onChange={e => handleChange("social_tiktok", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://tiktok.com/@username" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                  <input value={settings.social_linkedin || ""} onChange={e => handleChange("social_linkedin", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://linkedin.com/in/username" dir="ltr" />
                </div>
              </div>
            </div>
          )}

          {/* ═══════ القسم الرئيسي (Hero) ═══════ */}
          {activeSection === "hero" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">القسم الرئيسي (Hero)</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">الشارة العلوية <span className="text-gray-600">(النص الصغير فوق العنوان)</span></label>
                  <input value={settings.hero_badge || ""} onChange={e => handleChange("hero_badge", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">العنوان الرئيسي</label>
                  <input value={settings.hero_title || ""} onChange={e => handleChange("hero_title", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 text-lg font-bold" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">الوصف التعريفي</label>
                  <textarea value={settings.hero_subtitle || ""} onChange={e => handleChange("hero_subtitle", e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4">
                <p className="text-gray-500 text-sm">💡 هذه النصوص تظهر في أول شي يشوفه الزائر عند دخوله موقعك — اجعلها مؤثرة ومختصرة.</p>
              </div>
            </div>
          )}

          {/* ═══════ الخدمات ═══════ */}
          {activeSection === "services" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-blue-400 text-lg">الخدمات</h3>
                  <button onClick={addService} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">+ إضافة خدمة</button>
                </div>
                <div className="space-y-4">
                  {(settings.services || []).map((svc: any, i: number) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">خدمة {i + 1}</span>
                        <button onClick={() => removeService(i)} className="text-xs text-red-400 hover:text-red-300">حذف</button>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">الأيقونة</label>
                          <input value={svc.icon || ""} onChange={e => handleServiceChange(i, "icon", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-5">
                          <label className="block text-xs text-gray-500 mb-1">اسم الخدمة</label>
                          <input value={svc.title || ""} onChange={e => handleServiceChange(i, "title", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">وصف الخدمة</label>
                        <textarea value={svc.desc || ""} onChange={e => handleServiceChange(i, "desc", e.target.value)} rows={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ لماذا تختارنا ═══════ */}
          {activeSection === "why" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-blue-400 text-lg">لماذا تختارنا</h3>
                  <button onClick={addWhyCard} className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition">+ إضافة بطاقة</button>
                </div>
                <div className="space-y-4">
                  {(settings.why_cards || []).map((card: any, i: number) => (
                    <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">بطاقة {i + 1}</span>
                        <button onClick={() => removeWhyCard(i)} className="text-xs text-red-400 hover:text-red-300">حذف</button>
                      </div>
                      <div className="grid grid-cols-6 gap-3">
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">الأيقونة</label>
                          <input value={card.icon || ""} onChange={e => handleWhyChange(i, "icon", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-center text-xl focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="col-span-5">
                          <label className="block text-xs text-gray-500 mb-1">العنوان</label>
                          <input value={card.title || ""} onChange={e => handleWhyChange(i, "title", e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">الوصف</label>
                        <textarea value={card.desc || ""} onChange={e => handleWhyChange(i, "desc", e.target.value)} rows={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ قسم التواصل والفوتر ═══════ */}
          {activeSection === "cta" && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">قسم التواصل (CTA)</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">عنوان قسم التواصل</label>
                  <input value={settings.cta_title || ""} onChange={e => handleChange("cta_title", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">وصف قسم التواصل</label>
                  <textarea value={settings.cta_subtitle || ""} onChange={e => handleChange("cta_subtitle", e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
                <h3 className="font-bold text-blue-400 text-lg mb-4">الفوتر</h3>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">نص الفوتر التعريفي</label>
                  <textarea value={settings.footer_text || ""} onChange={e => handleChange("footer_text", e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
