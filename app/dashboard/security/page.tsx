"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Key,
  AlertCircle,
  Smartphone,
  Download,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Stage = "loading" | "off" | "enrolling" | "enrolled";

export default function SecurityPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [enrollment, setEnrollment] = useState<{
    secret: string;
    otpauthUri: string;
    accountName: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, []);

  async function refreshStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStage("off");
      return;
    }
    const { data } = await supabase
      .from("user_2fa_secrets")
      .select("is_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    setStage(data?.is_enabled ? "enrolled" : "off");
  }

  async function startEnrollment() {
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/enroll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل بدء التسجيل");
        return;
      }
      setEnrollment(data);
      setStage("enrolling");
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment() {
    if (!/^\d{6}$/.test(code)) {
      toast.error("أدخل رمزاً من 6 أرقام");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "رمز غير صحيح");
        return;
      }
      toast.success("تم تفعيل المصادقة الثنائية ✓");
      setRecoveryCodes(data.recoveryCodes || []);
      setCode("");
      setEnrollment(null);
      setStage("enrolled");
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function disable2FA() {
    if (!disableCode.trim()) {
      toast.error("أدخل رمز TOTP أو رمز استرداد");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "رمز غير صحيح");
        return;
      }
      toast.success("تم تعطيل المصادقة الثنائية");
      setDisableCode("");
      setShowDisableDialog(false);
      setRecoveryCodes([]);
      setStage("off");
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!enrollment) return;
    navigator.clipboard.writeText(enrollment.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  function copyCodes() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    toast.success("تم نسخ الرموز");
  }

  function downloadCodes() {
    const content = `رموز استرداد المصادقة الثنائية — وسيط برو
========================================
احتفظ بهذه الرموز في مكان آمن. كل رمز يُستخدم مرّة واحدة.
تاريخ الإنشاء: ${new Date().toLocaleString("ar-SA")}

${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waseet-pro-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const qrImg = enrollment
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(enrollment.otpauthUri)}`
    : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Breadcrumb
        crumbs={[{ label: "الإعدادات", href: "/dashboard/settings" }, { label: "الأمان" }]}
      />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Shield className="h-6 w-6 text-[var(--gold-2)]" />
          الأمان والمصادقة الثنائية
        </h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          أضف طبقة حماية إضافية لحسابك برمز يتغيّر كل 30 ثانية من تطبيق المصادقة.
        </p>
      </div>

      {/* ── بطاقة الحالة ── */}
      <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stage === "enrolled" ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">المصادقة الثنائية (2FA)</h2>
              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                {stage === "loading" && "…جارِ التحميل"}
                {stage === "off" && "غير مفعّلة — حسابك محمي بكلمة المرور فقط"}
                {stage === "enrolling" && "في انتظار تأكيد الرمز الأوّل"}
                {stage === "enrolled" && "مفعّلة — حسابك محمي بطبقتين"}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold ${
              stage === "enrolled"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] text-[var(--text-soft)]"
            }`}
          >
            {stage === "enrolled" ? "مفعّلة" : "غير مفعّلة"}
          </span>
        </div>

        {stage === "off" && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
              <div className="space-y-1 text-sm text-blue-200">
                <p className="font-semibold">ستحتاج تطبيق مصادقة:</p>
                <p className="text-[13px]">
                  • Google Authenticator &nbsp;•&nbsp; Microsoft Authenticator &nbsp;•&nbsp; Authy
                  &nbsp;•&nbsp; 1Password
                </p>
              </div>
            </div>
            <button
              onClick={startEnrollment}
              disabled={busy}
              className="rounded-xl bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-4)] px-5 py-2.5 font-bold text-white transition-all hover:from-[#d49f5c] hover:to-[#996a38] disabled:opacity-50"
            >
              {busy ? "…جارِ التوليد" : "ابدأ تفعيل المصادقة الثنائية"}
            </button>
          </div>
        )}

        {stage === "enrolling" && enrollment && (
          <div className="space-y-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="flex-shrink-0 rounded-xl bg-white p-3">
                <img src={qrImg} alt="QR Code" className="h-[220px] w-[220px]" />
              </div>
              <div className="flex-1 space-y-4 text-white">
                <div>
                  <h3 className="mb-1 font-bold">١. امسح الرمز</h3>
                  <p className="text-sm text-[var(--text-soft)]">
                    افتح تطبيق المصادقة وامسح رمز QR.
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-sm text-[var(--text-soft)]">أو أدخل السرّ يدوياً:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] p-2.5 font-mono text-xs break-all text-white">
                      {enrollment.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 transition hover:bg-[#26262C]"
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4 text-[var(--text-soft)]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--overlay-soft)] pt-5">
              <h3 className="mb-1 font-bold text-white">٢. أدخل الرمز من التطبيق</h3>
              <p className="mb-3 text-sm text-[var(--text-soft)]">
                أدخل الرمز المكوّن من 6 أرقام الذي يظهر في تطبيقك.
              </p>
              <div className="flex max-w-sm gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="flex-1 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-4 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-white outline-none focus:border-[var(--gold-2)]"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                <button
                  onClick={verifyEnrollment}
                  disabled={busy || code.length !== 6}
                  className="rounded-lg bg-gradient-to-r from-[var(--gold-2)] to-[var(--gold-4)] px-5 font-bold text-white disabled:opacity-50"
                >
                  {busy ? "…" : "تحقّق وفعّل"}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEnrollment(null);
                setCode("");
                setStage("off");
              }}
              className="text-sm text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
            >
              إلغاء
            </button>
          </div>
        )}

        {stage === "enrolled" && (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
              <div className="text-sm text-emerald-200">
                <p className="mb-1 font-semibold">حسابك محمي بالمصادقة الثنائية</p>
                <p className="text-[13px]">
                  سيُطلب منك إدخال رمز من تطبيقك عند كل تسجيل دخول جديد.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDisableDialog(true)}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
            >
              تعطيل المصادقة الثنائية
            </button>
          </div>
        )}
      </div>

      {/* ── رموز الاسترداد (مرّة واحدة) ── */}
      {recoveryCodes.length > 0 && (
        <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-amber-200">رموز الاسترداد — احفظها الآن</h2>
            </div>
            <p className="text-sm text-amber-300/80">
              <AlertCircle className="ml-1 inline h-4 w-4" />
              هذه الرموز تُعرض مرّة واحدة فقط. استخدمها لو فقدت جهازك. كل رمز يُستخدم مرّة واحدة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--overlay-soft)] bg-[#0E0E11] p-4">
            {recoveryCodes.map((c, i) => (
              <code
                key={i}
                className="rounded bg-[var(--bg-surface-2)] p-2 text-center font-mono text-sm text-white"
              >
                {c}
              </code>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyCodes}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-white transition hover:bg-[#26262C]"
            >
              <Copy className="h-4 w-4" />
              نسخ الكل
            </button>
            <button
              onClick={downloadCodes}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-white transition hover:bg-[#26262C]"
            >
              <Download className="h-4 w-4" />
              تنزيل .txt
            </button>
            <button
              onClick={() => setRecoveryCodes([])}
              className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              حفظت الرموز — أخفها
            </button>
          </div>
        </div>
      )}

      {/* ── حوار التعطيل ── */}
      {showDisableDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowDisableDialog(false)}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-400" />
                <h2 className="text-lg font-bold text-white">تعطيل المصادقة الثنائية</h2>
              </div>
              <button
                onClick={() => setShowDisableDialog(false)}
                className="text-[var(--text-soft)] hover:text-[var(--text-strong)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-soft)]">
              أدخل رمز TOTP حالي (6 أرقام) أو رمز استرداد لتأكيد التعطيل.
            </p>
            <input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="123456 أو XXXX-XXXX-XXXX"
              className="w-full rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-4 py-2.5 font-mono text-white outline-none focus:border-[var(--gold-2)]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDisableDialog(false);
                  setDisableCode("");
                }}
                className="px-4 py-2 text-sm text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
              >
                إلغاء
              </button>
              <button
                onClick={disable2FA}
                disabled={busy || !disableCode.trim()}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {busy ? "…" : "عطّل"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
