"use client";
import { useState } from "react";
import { User, Users, Building } from "lucide-react";

const tabs = [
  { id: "profile", label: "الملف الشخصي", icon: User },
  { id: "team", label: "الفريق", icon: Users },
  { id: "account", label: "الحساب", icon: Building },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "إلياس الدخيل", email: "", phone: "", gender: "male", avatar: "",
  });

  const [account, setAccount] = useState({
    company_name: "إلياس الدخيل",
    address: "المملكة العربية السعودية، منطقة الرياض",
    fal_license: "",
    commercial_register: "",
    freelance_doc: "",
  });

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C] transition";
  const saveBtn = (
    <button onClick={handleSave} disabled={saving}
      className="bg-[#C6914C] hover:bg-[#A6743A] px-6 py-3 rounded-lg font-medium transition disabled:opacity-50">
      {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ التغييرات"}
    </button>
  );

  return (
    <div dir="rtl">
      <h2 className="text-2xl font-bold mb-8">الإعدادات</h2>

      <div className="flex gap-2 mb-8 border-b border-[rgba(198,145,76,0.12)] overflow-x-auto" style={{ scrollbarWidth:'none', WebkitScrollbar: 'none' } as any}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition " +
              (activeTab === tab.id ? "border-[#C6914C] text-white" : "border-transparent text-[#9A9AA0] hover:text-white")}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ الملف الشخصي ═══ */}
      {activeTab === "profile" && (
        <div className="max-w-2xl">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">المعلومات الشخصية</h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-[#1C1C22] border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-[#C6914C] transition">
                {profile.avatar
                  ? <img src={profile.avatar} className="w-full h-full rounded-full object-cover" />
                  : <User size={32} className="text-[#5A5A62]" />}
              </div>
              <div>
                <p className="text-sm font-medium mb-1">صورة الملف الشخصي</p>
                <p className="text-xs text-[#9A9AA0]">اضغط لتغيير الصورة</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">الاسم</label>
                <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">البريد الإلكتروني</label>
                <input value={profile.email} onChange={e => setProfile(p => ({...p, email: e.target.value}))} className={inputClass} placeholder="example@email.com" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم الجوال</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} className={inputClass} placeholder="05xxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">الجنس</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="male" checked={profile.gender === "male"} onChange={e => setProfile(p => ({...p, gender: e.target.value}))} className="accent-[#C6914C]" />
                    <span>ذكر</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value="female" checked={profile.gender === "female"} onChange={e => setProfile(p => ({...p, gender: e.target.value}))} className="accent-[#C6914C]" />
                    <span>أنثى</span>
                  </label>
                </div>
              </div>
              {saveBtn}
            </div>
          </div>
        </div>
      )}

      {/* ═══ الفريق ═══ */}
      {activeTab === "team" && (
        <div className="max-w-3xl">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">الفريق</h3>
              <button className="bg-[#C6914C] hover:bg-[#A6743A] px-4 py-2 rounded-lg text-sm transition">
                دعوة عضو جديد
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 360 }}>
              <thead>
                <tr className="text-[#9A9AA0] text-sm border-b border-[rgba(198,145,76,0.12)]">
                  <th className="text-right pb-3">الاسم</th>
                  <th className="text-right pb-3">الصلاحية</th>
                  <th className="text-right pb-3">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4">إلياس الدخيل</td>
                  <td className="py-4">
                    <span className="bg-[rgba(198,145,76,0.1)] text-[#C6914C] text-xs px-2 py-1 rounded">مالك</span>
                  </td>
                  <td className="py-4 text-[#9A9AA0] text-sm">المؤسس</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ الحساب ═══ */}
      {activeTab === "account" && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
            <h3 className="font-bold text-lg mb-6">معلومات الحساب</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">اسم الحساب / الشركة</label>
                <input value={account.company_name} onChange={e => setAccount(a => ({...a, company_name: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">العنوان</label>
                <input value={account.address} onChange={e => setAccount(a => ({...a, address: e.target.value}))} className={inputClass} />
              </div>
              {saveBtn}
            </div>
          </div>

          <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-6">
            <h3 className="font-bold text-lg mb-2">الشهادات والتراخيص</h3>
            <p className="text-[#5A5A62] text-sm mb-6">
              هذه المعلومات تُستخدم داخلياً — لعرض رخصة فال في الموقع اذهب إلى
              <a href="/dashboard/site-settings" className="text-[#C6914C] hover:underline mr-1">إعدادات الموقع</a>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم رخصة فال</label>
                <input value={account.fal_license} onChange={e => setAccount(a => ({...a, fal_license: e.target.value}))} className={inputClass} placeholder="مثال: 7001234567" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم السجل التجاري</label>
                <input value={account.commercial_register} onChange={e => setAccount(a => ({...a, commercial_register: e.target.value}))} className={inputClass} placeholder="أدخل رقم السجل التجاري" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم وثيقة العمل الحر</label>
                <input value={account.freelance_doc} onChange={e => setAccount(a => ({...a, freelance_doc: e.target.value}))} className={inputClass} placeholder="أدخل رقم وثيقة العمل الحر" />
              </div>
              {saveBtn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
