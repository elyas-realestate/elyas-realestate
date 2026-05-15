// ══════════════════════════════════════════════════════════════
// ContactTab — تبويب التواصل (هاتف، واتساب، إيميل، social)
// ══════════════════════════════════════════════════════════════

import Link from "next/link";
import { normalizeSocial, getSmartPlaceholder } from "@/lib/social-normalize";
import { SOCIAL_PLATFORMS } from "../_constants";
import { SaveBtn } from "../_components/SaveBtn";

interface ContactTabProps {
  s: any; // settings alias
  sc: (field: string, value: any) => void;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
  inputClass: string;
}

export function ContactTab({ s, sc, saving, saved, onSave, inputClass }: ContactTabProps) {
  return (
    <div className="max-w-2xl space-y-5">
      {/* تنبيه: تكامل WhatsApp Cloud API له صفحة منفصلة (Tokens, Phone IDs, Templates) */}
      <div
        className="flex items-start gap-2 rounded-xl p-3 text-xs"
        style={{
          background: "rgba(37,211,102,0.08)",
          border: "1px solid rgba(37,211,102,0.30)",
          color: "var(--text-soft)",
        }}
      >
        <span style={{ color: "rgb(37,211,102)", fontWeight: 700, fontSize: 14 }}>💬</span>
        <div>
          للتكامل المتقدّم مع WhatsApp Business (إرسال OTP، Templates، تكامل API):{" "}
          <Link
            href="/dashboard/whatsapp/settings"
            className="font-bold no-underline"
            style={{ color: "rgb(37,211,102)" }}
          >
            إعدادات واتساب الكاملة →
          </Link>
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
        <h3 className="text-lg font-bold text-[var(--gold-2)]">معلومات التواصل العامة</h3>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-soft)]">
            رقم الجوال <span className="text-[var(--text-faint)]">(مع مفتاح الدولة)</span>
          </label>
          <input
            value={s.phone || ""}
            onChange={(e) => sc("phone", e.target.value)}
            className={inputClass}
            placeholder="+966501234567"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-soft)]">
            رقم الواتساب{" "}
            <span className="text-[var(--text-faint)]">(بدون + — مثال: 966501234567)</span>
          </label>
          <input
            value={s.whatsapp || ""}
            onChange={(e) => sc("whatsapp", e.target.value)}
            className={inputClass}
            placeholder="966501234567"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-soft)]">
            البريد الإلكتروني العام{" "}
            <span className="text-[var(--text-faint)]">(يظهر في الموقع)</span>
          </label>
          <input
            value={s.email || ""}
            onChange={(e) => sc("email", e.target.value)}
            className={inputClass}
            placeholder="info@example.com"
            dir="ltr"
          />
        </div>
      </div>
      <div className="space-y-4 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-6">
        <h3 className="text-lg font-bold text-[var(--gold-2)]">حسابات السوشال ميديا</h3>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          ✨ اكتب اسم المستخدم فقط (مثلاً{" "}
          <code style={{ background: "var(--bg-surface-2)", padding: "1px 6px", borderRadius: 4 }}>
            elyasad1
          </code>
          )، النظام يحوّله لرابط كامل تلقائياً عند الحفظ.
        </p>
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key}>
            <label className="mb-2 block text-sm text-[var(--text-soft)]">{p.label}</label>
            <input
              value={s[p.key] || ""}
              onChange={(e) => sc(p.key, e.target.value)}
              onBlur={(e) => {
                const normalized = normalizeSocial(p.platform, e.target.value);
                if (normalized !== e.target.value) sc(p.key, normalized);
              }}
              className={inputClass}
              placeholder={getSmartPlaceholder(p.platform)}
              dir="ltr"
            />
          </div>
        ))}
      </div>
      <SaveBtn onClick={onSave} saving={saving} saved={saved} />
    </div>
  );
}
