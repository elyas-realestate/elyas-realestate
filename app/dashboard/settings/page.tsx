"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { User, Globe, Users, Building } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { id: "profile", label: "الملف الشخصي", icon: User },
  { id: "team", label: "الفريق", icon: Users },
  { id: "website", label: "الموقع الإلكتروني", icon: Globe },
  { id: "account", label: "الحساب", icon: Building },
];

const socialLinks = [
  { key: "x", label: "X (تويتر)" },
  { key: "instagram", label: "انستغرام" },
  { key: "tiktok", label: "تيك توك" },
  { key: "snapchat", label: "سناب شات" },
  { key: "linkedin", label: "لينكدإن" },
  { key: "youtube", label: "يوتيوب" },
  { key: "threads", label: "ثريدز" },
  { key: "facebook", label: "فيسبوك" },
  { key: "whatsapp", label: "واتساب" },
];

const websitePages = [
  { key: "home", label: "الصفحة الرئيسية", desc: "تعديل الصفحة الرئيسية لموقعك الإلكتروني" },
  { key: "map", label: "الخريطة", desc: "تعديل صفحة الخريطة في موقعك الإلكتروني" },
  { key: "requests", label: "طلبات العقار", desc: "تعديل صفحة الطلبات في موقعك الإلكتروني" },
  { key: "links", label: "صفحة الروابط", desc: "تعديل صفحة الروابط الخاصة بالمنشأة" },
  { key: "privacy", label: "سياسة الخصوصية", desc: "تعديل صفحة سياسة الخصوصية لموقعك الإلكتروني" },
  { key: "terms", label: "الشروط والأحكام", desc: "تعديل صفحة الشروط والأحكام لموقعك الإلكتروني" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [websiteTab, setWebsiteTab] = useState("pages");
  const [selectedPage, setSelectedPage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "إلياس الدخيل", email: "", phone: "", gender: "male", avatar: "",
  });

  const [social, setSocial] = useState<any>({
    x: "", instagram: "", tiktok: "", snapchat: "", linkedin: "",
    youtube: "", threads: "", facebook: "", whatsapp: "",
  });

  const [account, setAccount] = useState({
    company_name: "إلياس الدخيل", tax_number: "", address: "المملكة العربية السعودية، منطقة الرياض",
    fal_license: "", commercial_register: "", freelance_doc: "",
  });

  const [pageContent, setPageContent] = useState<any>({});

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div dir="rtl">
      <h2 className="text-2xl font-bold mb-8">الإعدادات</h2>

      <div className="flex gap-2 mb-8 border-b border-gray-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition " + (activeTab === tab.id ? "border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-white")}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">المعلومات الشخصية</h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition">
                {profile.avatar ? <img src={profile.avatar} className="w-full h-full rounded-full object-cover" /> : <User size={32} className="text-gray-500" />}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">صورة الملف الشخصي</p>
                <p className="text-xs text-gray-400">اضغط لتغيير الصورة</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">الاسم</label>
                <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">البريد الإلكتروني</label>
                <input value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="example@email.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">رقم الجوال</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="05xxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">الجنس</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="male" checked={profile.gender === "male"} onChange={e => setProfile(p => ({...p, gender: e.target.value}))} className="accent-blue-600" />
                    <span>ذكر</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="female" checked={profile.gender === "female"} onChange={e => setProfile(p => ({...p, gender: e.target.value}))} className="accent-blue-600" />
                    <span>أنثى</span>
                  </label>
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition disabled:opacity-50">
                {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="max-w-3xl">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">الفريق</h3>
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition">دعوة عضو جديد</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-800">
                  <th className="text-right pb-3">الاسم</th>
                  <th className="text-right pb-3">الصلاحية</th>
                  <th className="text-right pb-3">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-4">إلياس الدخيل</td>
                  <td className="py-4"><span className="bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded">مالك</span></td>
                  <td className="py-4 text-gray-400 text-sm">المؤسس</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "website" && (
        <div className="max-w-4xl">
          <div className="flex gap-2 mb-6">
            {[["pages","الصفحات"],["identity","الهوية"],["social","روابط التواصل"]].map(([id, label]) => (
              <button key={id} onClick={() => setWebsiteTab(id)}
                className={"px-4 py-2 rounded-lg text-sm transition " + (websiteTab === id ? "bg-blue-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white")}
              >
                {label}
              </button>
            ))}
          </div>

          {websiteTab === "pages" && !selectedPage && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websitePages.map(page => (
                <button key={page.key} onClick={() => setSelectedPage(page.key)}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-right hover:border-blue-500 transition"
                >
                  <h4 className="font-bold text-blue-400 mb-2">{page.label}</h4>
                  <p className="text-gray-400 text-sm">{page.desc}</p>
                </button>
              ))}
            </div>
          )}

          {websiteTab === "pages" && selectedPage && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold">{websitePages.find(p => p.key === selectedPage)?.label}</h3>
                <button onClick={() => setSelectedPage("")} className="text-gray-400 hover:text-white text-sm">رجوع</button>
              </div>
              <textarea
                value={pageContent[selectedPage] || ""}
                onChange={e => setPageContent((p: any) => ({...p, [selectedPage]: e.target.value}))}
                rows={10}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                placeholder="اكتب محتوى الصفحة هنا..."
              />
              <button onClick={handleSave} disabled={saving} className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          )}

          {websiteTab === "identity" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-6">الهوية البصرية</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">الشعار</label>
                  <div className="w-32 h-32 bg-gray-800 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition">
                    <p className="text-gray-500 text-sm text-center">رفع الشعار</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">اللون الرئيسي</label>
                  <div className="flex items-center gap-4">
                    <input type="color" defaultValue="#2563eb" className="w-12 h-12 rounded-lg cursor-pointer border-0" />
                    <span className="text-gray-400 text-sm">اللون الرئيسي للموقع</span>
                  </div>
                </div>
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                  {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          )}

          {websiteTab === "social" && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-6">روابط التواصل الاجتماعي</h3>
              <div className="space-y-4">
                {socialLinks.map(link => (
                  <div key={link.key}>
                    <label className="block text-sm text-gray-400 mb-2">{link.label}</label>
                    <input
                      value={social[link.key] || ""}
                      onChange={e => setSocial((s: any) => ({...s, [link.key]: e.target.value}))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                      placeholder={"رابط حساب " + link.label}
                    />
                  </div>
                ))}
                <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                  {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "account" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">معلومات الحساب</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">اسم الحساب</label>
                <input value={account.company_name} onChange={e => setAccount(a => ({...a, company_name: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">العنوان</label>
                <input value={account.address} onChange={e => setAccount(a => ({...a, address: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">الشهادات والتراخيص</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">رقم رخصة فال</label>
                <input value={account.fal_license} onChange={e => setAccount(a => ({...a, fal_license: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="أدخل رقم رخصة فال" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">رقم السجل التجاري</label>
                <input value={account.commercial_register} onChange={e => setAccount(a => ({...a, commercial_register: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="أدخل رقم السجل التجاري" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">رقم وثيقة العمل الحر</label>
                <input value={account.freelance_doc} onChange={e => setAccount(a => ({...a, freelance_doc: e.target.value}))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="أدخل رقم وثيقة العمل الحر" />
              </div>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
                {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}