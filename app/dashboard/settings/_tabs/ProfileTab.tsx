// ══════════════════════════════════════════════════════════════
// ProfileTab — تبويب المعلومات الشخصية (avatar + name + email + gender)
// ══════════════════════════════════════════════════════════════

import Link from "next/link";
import { User, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import { SaveBtn } from "../_components/SaveBtn";

interface Profile {
  name: string;
  email: string;
  contact_email: string;
  photo_url: string;
  gender: string;
}

interface ProfileTabProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadingPhoto: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  inputClass: string;
}

export function ProfileTab({
  profile,
  setProfile,
  fileInputRef,
  uploadingPhoto,
  onPhotoChange,
  saving,
  saved,
  onSave,
  inputClass,
}: ProfileTabProps) {
  return (
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
            onChange={onPhotoChange}
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
        <SaveBtn onClick={onSave} saving={saving} saved={saved} />
      </div>
    </div>
  );
}
