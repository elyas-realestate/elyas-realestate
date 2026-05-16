"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  ArrowRight,
  Save,
  Loader2,
  Crown,
  Phone,
  Mail,
  User,
  Plus,
  Trash2,
  Star,
  MessageCircle,
  ChevronLeft,
  BookOpen,
} from "lucide-react";

type Tone = "professional" | "friendly" | "mixed";

interface PhoneEntry {
  label: string;
  number: string;
  is_primary: boolean;
}

interface Identity {
  id?: string;
  tenant_id?: string;
  user_id?: string;
  full_name: string;
  title: string;
  email: string | null;
  photo_url: string | null;
  phones: PhoneEntry[];
  preferred_address: string;
  tone_preference: Tone;
  assistant_employee_code: string;
  notes: string | null;
}

const DEFAULT_IDENTITY: Identity = {
  full_name: "",
  title: "الرئيس التنفيذي",
  email: null,
  photo_url: null,
  phones: [],
  preferred_address: "الأستاذ",
  tone_preference: "professional",
  assistant_employee_code: "ceo_assistant",
  notes: null,
};

export default function CEOIdentityPage() {
  const [identity, setIdentity] = useState<Identity>(DEFAULT_IDENTITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/ceo-identity", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.identity) {
        setIdentity({
          ...DEFAULT_IDENTITY,
          ...data.identity,
          phones: Array.isArray(data.identity.phones) ? data.identity.phones : [],
        });
      }
    } catch (e) {
      logger.error("[ceo/identity] load failed", e);
      toast.error("فشل تحميل الهوية");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!identity.full_name?.trim()) {
      toast.error("الاسم الكامل مطلوب");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/ceo-identity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(identity),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحفظ");
      toast.success(data.action === "created" ? "تم إنشاء الهوية ✓" : "تم تحديث الهوية ✓");
      if (data.identity) {
        setIdentity({
          ...DEFAULT_IDENTITY,
          ...data.identity,
          phones: Array.isArray(data.identity.phones) ? data.identity.phones : [],
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  function addPhone() {
    setIdentity({
      ...identity,
      phones: [
        ...identity.phones,
        { label: "", number: "", is_primary: identity.phones.length === 0 },
      ],
    });
  }

  function updatePhone(idx: number, field: keyof PhoneEntry, value: string | boolean) {
    const next = [...identity.phones];
    next[idx] = { ...next[idx], [field]: value };

    // لو وضعنا رقم primary، نلغي primary من الباقي
    if (field === "is_primary" && value === true) {
      next.forEach((p, i) => {
        if (i !== idx) p.is_primary = false;
      });
    }
    setIdentity({ ...identity, phones: next });
  }

  function removePhone(idx: number) {
    const next = identity.phones.filter((_, i) => i !== idx);
    // لو حذفنا الأساسي، اجعل الأول أساسياً
    if (next.length > 0 && !next.some((p) => p.is_primary)) {
      next[0].is_primary = true;
    }
    setIdentity({ ...identity, phones: next });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5" dir="rtl">
      {/* عنوان الصفحة */}
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Crown size={20} color="#0A0A0C" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-strong)" }}>
            هوية الرئيس التنفيذي
          </h1>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            مصدر موحَّد للتعرّف على المالك عبر كل قنوات المنصة (واتساب، إيميل، داشبورد).
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-2 rounded-xl p-3 text-xs"
        style={{
          background: "var(--gold-bg-soft)",
          border: "1px solid var(--gold-bg)",
          color: "var(--text-soft)",
        }}
      >
        <BookOpen size={14} style={{ color: "var(--gold-2)", flexShrink: 0, marginTop: 2 }} />
        <div>
          أي رقم تضيفه هنا، السكرتير الذكي يتعرّف عليه تلقائياً ويعاملك كرئيس تنفيذي عبر واتساب — مع
          أدواته السبعة (صفقات، عملاء، عقارات، مهام، طلبات، فواتير، تقارير). ولن يرد على عملاء
          عاديين بهذا الأسلوب.
        </div>
      </div>

      {/* تنبيه التوريث — الاسم/الصورة من الإعدادات إذا تركتهما فارغين */}
      <div
        className="flex items-start gap-2 rounded-xl p-3 text-xs"
        style={{
          background: "var(--bg-surface-2)",
          border: "1px solid var(--gold-bg)",
          color: "var(--text-faint)",
        }}
      >
        <span style={{ color: "var(--gold-2)", fontWeight: 700 }}>💡</span>
        <div>
          <strong>المصدر الموحَّد:</strong> اسمك وصورتك الأساسيان في{" "}
          <em>الإعدادات → الملف الشخصي</em>. الحقول هنا تُستخدم لشخصية CEO فقط — اتركها فارغة إذا
          تريدها نفس بيانات الإعدادات.
        </div>
      </div>

      {/* Section: Identity */}
      <section
        className="space-y-3 rounded-xl p-4"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <h2
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          <User size={14} style={{ color: "var(--gold-2)" }} /> الهوية الأساسية
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="الاسم الكامل *" required>
            <input
              type="text"
              value={identity.full_name}
              onChange={(e) => setIdentity({ ...identity, full_name: e.target.value })}
              placeholder="مثال: إلياس الدخيل"
              style={inputStyle}
            />
          </Field>

          <Field label="المسمى">
            <input
              type="text"
              value={identity.title}
              onChange={(e) => setIdentity({ ...identity, title: e.target.value })}
              placeholder="مثال: المؤسس / الرئيس التنفيذي"
              style={inputStyle}
            />
          </Field>

          <Field label="البريد الإلكتروني">
            <input
              type="email"
              value={identity.email || ""}
              onChange={(e) => setIdentity({ ...identity, email: e.target.value || null })}
              placeholder="example@domain.com"
              style={inputStyle}
            />
          </Field>

          <Field label="رابط الصورة الشخصية (اختياري)">
            <input
              type="url"
              value={identity.photo_url || ""}
              onChange={(e) => setIdentity({ ...identity, photo_url: e.target.value || null })}
              placeholder="https://..."
              style={inputStyle}
            />
          </Field>
        </div>
      </section>

      {/* Section: Phones */}
      <section
        className="space-y-3 rounded-xl p-4"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <Phone size={14} style={{ color: "var(--gold-2)" }} /> أرقام الجوّال
            <span className="text-xs font-normal" style={{ color: "var(--text-faint)" }}>
              ({identity.phones.length})
            </span>
          </h2>
          <button
            onClick={addPhone}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs"
            style={{
              background: "var(--gold-bg)",
              color: "var(--gold-2)",
              border: "1px solid var(--gold-2)",
            }}
          >
            <Plus size={12} /> إضافة رقم
          </button>
        </div>

        {identity.phones.length === 0 ? (
          <div className="py-4 text-center text-xs" style={{ color: "var(--text-faint)" }}>
            لا توجد أرقام مسجَّلة. أضف رقمك ليتعرّف عليك السكرتير عبر واتساب.
          </div>
        ) : (
          <div className="space-y-2">
            {identity.phones.map((p, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-lg p-2"
                style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)" }}
              >
                <input
                  type="text"
                  value={p.label}
                  onChange={(e) => updatePhone(idx, "label", e.target.value)}
                  placeholder="مسمى (شخصي / عمل)"
                  style={{ ...inputStyle, flex: "0 1 140px" }}
                />
                <input
                  type="text"
                  value={p.number}
                  onChange={(e) => updatePhone(idx, "number", e.target.value)}
                  placeholder="966539920003 أو 0539920003"
                  style={{ ...inputStyle, flex: "1 1 200px", direction: "ltr" }}
                />
                <button
                  onClick={() => updatePhone(idx, "is_primary", !p.is_primary)}
                  title={p.is_primary ? "أساسي" : "ضغط للتعيين كأساسي"}
                  className="rounded p-1.5"
                  style={{
                    background: p.is_primary ? "var(--gold-bg)" : "transparent",
                    color: p.is_primary ? "var(--gold-2)" : "var(--text-faint)",
                    border: `1px solid ${p.is_primary ? "var(--gold-2)" : "var(--gold-bg)"}`,
                  }}
                >
                  <Star size={14} fill={p.is_primary ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => removePhone(idx)}
                  className="rounded p-1.5"
                  style={{
                    background: "transparent",
                    color: "var(--danger)",
                    border: "1px solid var(--gold-bg)",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs" style={{ color: "var(--text-faint)" }}>
          الأرقام تُحفظ تلقائياً بصيغة دولية (966...). تقبل: 0539920003، 966539920003، +966 53 992
          0003.
        </div>
      </section>

      {/* Section: Communication */}
      <section
        className="space-y-3 rounded-xl p-4"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <h2
          className="flex items-center gap-2 text-sm font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          <MessageCircle size={14} style={{ color: "var(--gold-2)" }} /> أسلوب التخاطب
        </h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="اللقب المفضل في المخاطبة">
            <input
              type="text"
              value={identity.preferred_address}
              onChange={(e) => setIdentity({ ...identity, preferred_address: e.target.value })}
              placeholder="الأستاذ / الأخ / أبو فلان"
              style={inputStyle}
            />
          </Field>

          <Field label="نبرة الردود">
            <select
              value={identity.tone_preference}
              onChange={(e) =>
                setIdentity({ ...identity, tone_preference: e.target.value as Tone })
              }
              style={inputStyle}
            >
              <option value="professional">رسمية</option>
              <option value="friendly">ودية</option>
              <option value="mixed">مختلطة (مهنية ودافئة)</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Section: Notes */}
      <section
        className="space-y-3 rounded-xl p-4"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <h2 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          ملاحظات إضافية
        </h2>
        <textarea
          value={identity.notes || ""}
          onChange={(e) => setIdentity({ ...identity, notes: e.target.value || null })}
          placeholder="أي معلومات تساعد السكرتير في التعامل معك بشكل أفضل (مثلاً: تفضيل المختصرات، مواعيد العمل، إلخ)"
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </section>

      {/* Save bar */}
      <div
        className="sticky bottom-3 flex items-center justify-between gap-3 rounded-xl p-3"
        style={{
          background: "var(--bg-surface-1)",
          border: "1px solid var(--gold-2)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div className="text-xs" style={{ color: "var(--text-faint)" }}>
          سيُحفظ في DB ويستخدم فوراً عبر السكرتير الذكي.
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
            color: "#0A0A0C",
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "جارٍ الحفظ..." : "حفظ الهوية"}
        </button>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
        <Link
          href="/dashboard/organization"
          className="flex items-center justify-between rounded-lg p-3 no-underline"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              السكرتير الذكي
            </div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              توجيهات + Knowledge Base
            </div>
          </div>
          <ChevronLeft size={14} style={{ color: "var(--gold-2)" }} />
        </Link>
        <Link
          href="/dashboard/ceo/operations"
          className="flex items-center justify-between rounded-lg p-3 no-underline"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              مركز التحكم التشغيلي
            </div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              master switch + حدود
            </div>
          </div>
          <ChevronLeft size={14} style={{ color: "var(--gold-2)" }} />
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  background: "var(--bg-surface-2)",
  border: "1px solid var(--gold-bg)",
  color: "var(--text-strong)",
  fontSize: 13,
  fontFamily: "inherit",
};

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-xs"
        style={{ color: required ? "var(--gold-2)" : "var(--text-faint)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
