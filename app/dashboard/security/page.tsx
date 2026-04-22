"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import {
  Shield, ShieldCheck, ShieldAlert, Copy, Check, Key, AlertCircle,
  Smartphone, Download, X,
} from "lucide-react";
import { toast } from "sonner";

type Stage = "loading" | "off" | "enrolling" | "enrolled";

export default function SecurityPage() {
  const [stage, setStage] = useState<Stage>("loading");
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauthUri: string; accountName: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => { refreshStatus(); }, []);

  async function refreshStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStage("off"); return; }
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
      if (!res.ok) { toast.error(data.error || "فشل بدء التسجيل"); return; }
      setEnrollment(data);
      setStage("enrolling");
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment() {
    if (!/^\d{6}$/.test(code)) { toast.error("أدخل رمزاً من 6 أرقام"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "رمز غير صحيح"); return; }
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
    if (!disableCode.trim()) { toast.error("أدخل رمز TOTP أو رمز استرداد"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "رمز غير صحيح"); return; }
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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: "الإعدادات", href: "/dashboard/settings" }, { label: "الأمان" }]} />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Shield className="h-6 w-6 text-[#C6914C]" />
          الأمان والمصادقة الثنائية
        </h1>
        <p className="text-sm text-[#8A8A92] mt-1">
          أضف طبقة حماية إضافية لحسابك برمز يتغيّر كل 30 ثانية من تطبيق المصادقة.
        </p>
      </div>

      {/* ── بطاقة الحالة ── */}
      <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {stage === "enrolled" ? (
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-amber-400" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-white">المصادقة الثنائية (2FA)</h2>
              <p className="text-xs text-[#8A8A92] mt-0.5">
                {stage === "loading" && "…جارِ التحميل"}
                {stage === "off" && "غير مفعّلة — حسابك محمي بكلمة المرور فقط"}
                {stage === "enrolling" && "في انتظار تأكيد الرمز الأوّل"}
                {stage === "enrolled" && "مفعّلة — حسابك محمي بطبقتين"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              stage === "enrolled"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-[#1F1F24] text-[#8A8A92] border-[rgba(255,255,255,0.05)]"
            }`}
          >
            {stage === "enrolled" ? "مفعّلة" : "غير مفعّلة"}
          </span>
        </div>

        {stage === "off" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 flex gap-3">
              <Smartphone className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200 space-y-1">
                <p className="font-semibold">ستحتاج تطبيق مصادقة:</p>
                <p className="text-[13px]">• Google Authenticator &nbsp;•&nbsp; Microsoft Authenticator &nbsp;•&nbsp; Authy &nbsp;•&nbsp; 1Password</p>
              </div>
            </div>
            <button
              onClick={startEnrollment}
              disabled={busy}
              className="px-5 py-2.5 bg-gradient-to-r from-[#C6914C] to-[#8A5F2E] hover:from-[#d49f5c] hover:to-[#996a38] text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {busy ? "…جارِ التوليد" : "ابدأ تفعيل المصادقة الثنائية"}
            </button>
          </div>
        )}

        {stage === "enrolling" && enrollment && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="bg-white p-3 rounded-xl flex-shrink-0">
                <img src={qrImg} alt="QR Code" className="w-[220px] h-[220px]" />
              </div>
              <div className="flex-1 space-y-4 text-white">
                <div>
                  <h3 className="font-bold mb-1">١. امسح الرمز</h3>
                  <p className="text-sm text-[#8A8A92]">افتح تطبيق المصادقة وامسح رمز QR.</p>
                </div>
                <div>
                  <p className="text-sm text-[#8A8A92] mb-2">أو أدخل السرّ يدوياً:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] p-2.5 rounded-lg text-xs font-mono break-all text-white">
                      {enrollment.secret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="px-3 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg hover:bg-[#26262C] transition"
                    >
                      {copiedSecret ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-[#8A8A92]" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgba(255,255,255,0.05)] pt-5">
              <h3 className="font-bold text-white mb-1">٢. أدخل الرمز من التطبيق</h3>
              <p className="text-sm text-[#8A8A92] mb-3">أدخل الرمز المكوّن من 6 أرقام الذي يظهر في تطبيقك.</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="flex-1 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg px-4 py-2.5 text-white font-mono text-lg text-center tracking-[0.4em] focus:border-[#C6914C] outline-none"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                />
                <button
                  onClick={verifyEnrollment}
                  disabled={busy || code.length !== 6}
                  className="px-5 bg-gradient-to-r from-[#C6914C] to-[#8A5F2E] text-white font-bold rounded-lg disabled:opacity-50"
                >
                  {busy ? "…" : "تحقّق وفعّل"}
                </button>
              </div>
            </div>

            <button
              onClick={() => { setEnrollment(null); setCode(""); setStage("off"); }}
              className="text-sm text-[#8A8A92] hover:text-white transition"
            >
              إلغاء
            </button>
          </div>
        )}

        {stage === "enrolled" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-200">
                <p className="font-semibold mb-1">حسابك محمي بالمصادقة الثنائية</p>
                <p className="text-[13px]">سيُطلب منك إدخال رمز من تطبيقك عند كل تسجيل دخول جديد.</p>
              </div>
            </div>
            <button
              onClick={() => setShowDisableDialog(true)}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition"
            >
              تعطيل المصادقة الثنائية
            </button>
          </div>
        )}
      </div>

      {/* ── رموز الاسترداد (مرّة واحدة) ── */}
      {recoveryCodes.length > 0 && (
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/30 p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-amber-200">رموز الاسترداد — احفظها الآن</h2>
            </div>
            <p className="text-sm text-amber-300/80">
              <AlertCircle className="inline h-4 w-4 ml-1" />
              هذه الرموز تُعرض مرّة واحدة فقط. استخدمها لو فقدت جهازك. كل رمز يُستخدم مرّة واحدة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-[#0E0E11] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
            {recoveryCodes.map((c, i) => (
              <code key={i} className="font-mono text-sm p-2 bg-[#1F1F24] rounded text-white text-center">
                {c}
              </code>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={copyCodes}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] rounded-lg text-sm text-white transition"
            >
              <Copy className="h-4 w-4" />
              نسخ الكل
            </button>
            <button
              onClick={downloadCodes}
              className="inline-flex items-center gap-2 px-3 py-2 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] rounded-lg text-sm text-white transition"
            >
              <Download className="h-4 w-4" />
              تنزيل .txt
            </button>
            <button
              onClick={() => setRecoveryCodes([])}
              className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-bold transition"
            >
              حفظت الرموز — أخفها
            </button>
          </div>
        </div>
      )}

      {/* ── حوار التعطيل ── */}
      {showDisableDialog && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDisableDialog(false)}
        >
          <div
            className="bg-[#16161A] border border-[rgba(198,145,76,0.09)] rounded-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-red-400" />
                <h2 className="text-lg font-bold text-white">تعطيل المصادقة الثنائية</h2>
              </div>
              <button onClick={() => setShowDisableDialog(false)} className="text-[#8A8A92] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-[#8A8A92]">
              أدخل رمز TOTP حالي (6 أرقام) أو رمز استرداد لتأكيد التعطيل.
            </p>
            <input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              placeholder="123456 أو XXXX-XXXX-XXXX"
              className="w-full bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg px-4 py-2.5 text-white font-mono focus:border-[#C6914C] outline-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowDisableDialog(false); setDisableCode(""); }}
                className="px-4 py-2 text-[#8A8A92] hover:text-white text-sm transition"
              >
                إلغاء
              </button>
              <button
                onClick={disable2FA}
                disabled={busy || !disableCode.trim()}
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition disabled:opacity-50"
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
