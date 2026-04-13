"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import { User, Users, Building, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";


const tabs = [
  { id: "profile", label: "الملف الشخصي", icon: User },
  { id: "team",    label: "الفريق",        icon: Users },
  { id: "account", label: "الحساب",        icon: Building },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: "إلياس الدخيل", email: "", phone: "", gender: "male", photo_url: "",
  });

  const [account, setAccount] = useState({
    company_name: "إلياس الدخيل",
    address: "المملكة العربية السعودية، منطقة الرياض",
    commercial_register: "",
    freelance_doc: "",
  });

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    const { data: identity } = await supabase
      .from("broker_identity")
      .select("broker_name, photo_url")
      .limit(1)
      .single();

    const { data: { user } } = await supabase.auth.getUser();

    setProfile(p => ({
      ...p,
      name:      identity?.broker_name || p.name,
      email:     user?.email           || p.email,
      photo_url: identity?.photo_url   || "",
    }));
  }

  async function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 3 ميغابايت");
      return;
    }

    setUploadingPhoto(true);
    try {
      const ext  = file.name.split(".").pop();
      const path = `broker-photos/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Save to broker_identity
      await supabase
        .from("broker_identity")
        .update({ photo_url: publicUrl })
        .not("id", "is", null); // update all rows (single-tenant)

      setProfile(p => ({ ...p, photo_url: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch (err: any) {
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await supabase
        .from("broker_identity")
        .update({ broker_name: profile.name })
        .not("id", "is", null);

      toast.success("تم حفظ التغييرات بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C] transition";
  const saveBtn = (
    <button onClick={handleSave} disabled={saving}
      className="bg-[#C6914C] hover:bg-[#A6743A] px-6 py-3 rounded-lg font-medium transition disabled:opacity-50">
      {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
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

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-6">
              <div
                onClick={handlePhotoClick}
                className="relative cursor-pointer group"
                style={{ width: 80, height: 80, flexShrink: 0 }}
              >
                <div
                  className="w-full h-full rounded-full overflow-hidden border-2 border-dashed border-[#3A3A42] group-hover:border-[#C6914C] transition"
                  style={{ background: "#1C1C22" }}
                >
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={32} className="text-[#5A5A62]" />
                    </div>
                  )}
                </div>
                {/* Overlay icon */}
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                >
                  {uploadingPhoto
                    ? <Loader2 size={22} className="text-white animate-spin" />
                    : <Camera size={22} className="text-white" />
                  }
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">صورة الملف الشخصي</p>
                <p className="text-xs text-[#9A9AA0] mb-2">اضغط لرفع صورة — JPG أو PNG بحجم أقصاه 3MB</p>
                {profile.photo_url && (
                  <button
                    className="text-xs text-red-400 hover:text-red-300 transition"
                    onClick={async () => {
                      await supabase.from("broker_identity").update({ photo_url: null }).not("id", "is", null);
                      setProfile(p => ({ ...p, photo_url: "" }));
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">الاسم</label>
                <input value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">البريد الإلكتروني</label>
                <input value={profile.email} disabled className={inputClass + " opacity-50 cursor-not-allowed"} placeholder="example@email.com" />
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
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(198,145,76,0.06)', border: '1px solid rgba(198,145,76,0.12)', color: '#9A9AA0' }}>
                رقم رخصة فال يُدار من
                <a href="/dashboard/site-settings" className="text-[#C6914C] hover:underline mx-1">إعدادات الموقع</a>
                ويظهر تلقائياً في جميع الصفحات
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم السجل التجاري / الرقم الموحد</label>
                <input value={account.commercial_register} onChange={e => setAccount(a => ({...a, commercial_register: e.target.value}))} className={inputClass} placeholder="مثال: 1010000000" maxLength={10} dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-[#9A9AA0] mb-2">رقم وثيقة العمل الحر</label>
                <input value={account.freelance_doc} onChange={e => setAccount(a => ({...a, freelance_doc: e.target.value}))} className={inputClass} placeholder="أدخل رقم وثيقة العمل الحر" dir="ltr" />
              </div>
              {saveBtn}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
