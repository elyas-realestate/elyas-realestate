// ══════════════════════════════════════════════════════════════
// AccountTab — تبويب الحساب (slug، تراخيص، ZATCA، فريق)
// ══════════════════════════════════════════════════════════════

import { Link2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SaveBtn } from "../_components/SaveBtn";

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface Licenses {
  commercial_register: string;
  freelance_doc: string;
  vat_number: string;
  zatca_enabled: boolean;
}

interface AccountTabProps {
  profile: { name: string; [key: string]: any };
  slug: string;
  slugInput: string;
  slugStatus: SlugStatus;
  slugMsg: string;
  savingSlug: boolean;
  onSlugChange: (val: string) => void;
  onSlugSave: () => void;
  licenses: Licenses;
  setLicenses: React.Dispatch<React.SetStateAction<Licenses>>;
  saving: boolean;
  saved: boolean;
  onLicensesSave: () => void;
  inputClass: string;
}

export function AccountTab({
  profile,
  slug,
  slugInput,
  slugStatus,
  slugMsg,
  savingSlug,
  onSlugChange,
  onSlugSave,
  licenses,
  setLicenses,
  saving,
  saved,
  onLicensesSave,
  inputClass,
}: AccountTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* رابطك الشخصي */}
      <div className="rounded-xl border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-1)] p-6">
        <div className="mb-1 flex items-center gap-2">
          <Link2 size={17} className="text-[var(--gold-2)]" />
          <h3 className="text-lg font-bold">رابطك الشخصي</h3>
        </div>
        <p className="mb-5 text-sm text-[var(--text-faint)]">
          هذا هو رابط صفحتك التي يراها عملاؤك — يجب أن يكون فريداً وباللغة الإنجليزية
        </p>
        {slug && (
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center gap-2 text-sm no-underline"
            style={{ color: "var(--gold-2)" }}
          >
            <span className="text-[var(--text-faint)]">waseet-pro.com/</span>
            <span className="font-bold">{slug}</span>
            <span
              style={{
                fontSize: 11,
                background: "var(--gold-bg)",
                border: "1px solid var(--gold-bg-hover)",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              فتح ↗
            </span>
          </a>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[var(--text-faint)] select-none">
              waseet-pro.com/
            </span>
            <input
              value={slugInput}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="your-slug"
              dir="ltr"
              className={inputClass + " pr-32"}
              style={{ paddingRight: "8.5rem" }}
            />
          </div>
          <button
            onClick={onSlugSave}
            disabled={savingSlug || slugStatus !== "available" || slugInput === slug}
            className="rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-40"
            style={{
              background: "var(--gold-bg-hover)",
              border: "1px solid rgba(198,145,76,0.25)",
              color: "var(--gold-2)",
              whiteSpace: "nowrap",
            }}
          >
            {savingSlug ? <Loader2 size={15} className="animate-spin" /> : "حفظ"}
          </button>
        </div>
        {slugStatus !== "idle" && slugInput !== slug && (
          <div
            className={`mt-2 flex items-center gap-2 text-sm ${slugStatus === "available" ? "text-emerald-400" : slugStatus === "checking" ? "text-[var(--text-soft)]" : "text-red-400"}`}
          >
            {slugStatus === "checking" && <Loader2 size={12} className="animate-spin" />}
            {slugStatus === "available" && <CheckCircle2 size={12} />}
            {(slugStatus === "taken" || slugStatus === "invalid") && <XCircle size={12} />}
            <span>{slugStatus === "checking" ? "جاري الفحص..." : slugMsg}</span>
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--text-faint)]">
          أحرف إنجليزية صغيرة وأرقام وشرطة (-) فقط — 3 إلى 40 حرفاً
        </p>
      </div>

      {/* الشهادات والتراخيص */}
      <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
        <h3 className="text-lg font-bold text-[var(--gold-2)]">الشهادات والتراخيص</h3>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-soft)]">
            رقم السجل التجاري / الرقم الموحد
          </label>
          <input
            value={licenses.commercial_register}
            onChange={(e) => setLicenses((l) => ({ ...l, commercial_register: e.target.value }))}
            className={inputClass}
            placeholder="مثال: 1010000000"
            maxLength={10}
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-soft)]">رقم وثيقة العمل الحر</label>
          <input
            value={licenses.freelance_doc}
            onChange={(e) => setLicenses((l) => ({ ...l, freelance_doc: e.target.value }))}
            className={inputClass}
            placeholder="أدخل رقم وثيقة العمل الحر"
            dir="ltr"
          />
        </div>

        {/* ── ZATCA Compliance ── */}
        <div className="border-t border-[var(--gold-bg)] pt-4">
          <div className="mb-3 flex items-center gap-2">
            <h4 className="text-sm font-bold text-emerald-400">امتثال فاتورة ZATCA</h4>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
              إلزامي للشركات المُسجّلة بضريبة القيمة المضافة
            </span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-[var(--text-soft)]">
                الرقم الضريبي (15 رقم)
              </label>
              <input
                value={licenses.vat_number}
                onChange={(e) =>
                  setLicenses((l) => ({
                    ...l,
                    vat_number: e.target.value.replace(/\D/g, "").slice(0, 15),
                  }))
                }
                className={inputClass}
                placeholder="مثال: 310123456700003"
                maxLength={15}
                dir="ltr"
                inputMode="numeric"
              />
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                {licenses.vat_number &&
                  (/^3\d{13}3$/.test(licenses.vat_number)
                    ? "✅ صيغة صحيحة"
                    : "⚠️ يجب أن يبدأ وينتهي بـ 3 ويكون 15 رقم")}
                {!licenses.vat_number && "يظهر في رأس الفواتير + رمز QR ZATCA"}
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={licenses.zatca_enabled}
                onChange={(e) => setLicenses((l) => ({ ...l, zatca_enabled: e.target.checked }))}
                className="h-4 w-4 accent-emerald-500"
              />
              <span className="text-sm text-[var(--text-soft)]">
                تفعيل QR ZATCA وتصدير XML في الفواتير
              </span>
            </label>
          </div>
        </div>

        <SaveBtn onClick={onLicensesSave} saving={saving} saved={saved} />
      </div>

      {/* الفريق */}
      <div className="rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">الفريق</h3>
          <button className="rounded-lg bg-[var(--gold-2)] px-4 py-2 text-sm transition hover:bg-[var(--gold-3)]">
            دعوة عضو جديد
          </button>
        </div>
        <table className="w-full" style={{ minWidth: 320 }}>
          <thead>
            <tr className="border-b border-[var(--gold-bg)] text-sm text-[var(--text-soft)]">
              <th className="pb-3 text-right">الاسم</th>
              <th className="pb-3 text-right">الصلاحية</th>
              <th className="pb-3 text-right">تاريخ الانضمام</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-4">{profile.name || "—"}</td>
              <td className="py-4">
                <span className="rounded bg-[var(--gold-bg)] px-2 py-1 text-xs text-[var(--gold-2)]">
                  مالك
                </span>
              </td>
              <td className="py-4 text-sm text-[var(--text-soft)]">المؤسس</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
