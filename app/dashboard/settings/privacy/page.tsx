"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Loader2,
  FileText,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";

// ══════════════════════════════════════════════════════════════════
// /dashboard/settings/privacy — حقوق المستخدم (PDPL)
// تصدير + حذف بيانات
// ══════════════════════════════════════════════════════════════════

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ confirm: "", reason: "" });
  const [deleteSubmitted, setDeleteSubmitted] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        toast.error("جلسة غير صالحة. سجّل دخول مرة أخرى.");
        return;
      }
      const res = await fetch("/api/pdpl/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "فشل التصدير");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wasit-pro-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("✅ تم تنزيل بياناتك");
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    if (deleteForm.confirm !== "DELETE_MY_ACCOUNT") {
      toast.error('اكتب "DELETE_MY_ACCOUNT" بالضبط');
      return;
    }
    setDeleting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        toast.error("جلسة غير صالحة");
        return;
      }
      const res = await fetch("/api/pdpl/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(deleteForm),
      });
      const j = await res.json();
      if (j.ok) {
        setDeleteSubmitted(true);
      } else {
        toast.error(j.error || "فشل");
      }
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1 text-xs no-underline"
        style={{ color: "var(--text-faint)" }}
      >
        <ChevronRight size={12} /> العودة للإعدادات
      </Link>

      <div>
        <h1
          className="flex items-center gap-2 text-2xl font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          <Shield size={22} style={{ color: "var(--gold-2)" }} /> الخصوصية وحقوقك
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
          حقوقك وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL)
        </p>
      </div>

      {/* PDPL info box */}
      <div
        className="flex items-start gap-3 rounded-xl p-4"
        style={{
          background: "var(--gold-bg-soft)",
          border: "1px solid var(--gold-bg)",
        }}
      >
        <Lock size={18} style={{ color: "var(--gold-2)", marginTop: 2, flexShrink: 0 }} />
        <div className="text-sm" style={{ color: "var(--text-soft)", lineHeight: 1.8 }}>
          <strong style={{ color: "var(--text-strong)" }}>حقوقك بصفتك مالك بيانات</strong>
          <ul style={{ marginTop: 8, paddingRight: 16, listStyle: "disc" }}>
            <li>الحصول على نسخة من بياناتك بصيغة JSON قابلة للقراءة</li>
            <li>طلب حذف بياناتك وحسابك بالكامل</li>
            <li>تعديل أي بيانات شخصية في أي وقت</li>
            <li>سحب الموافقة على معالجة البيانات</li>
          </ul>
          <Link
            href="/privacy"
            target="_blank"
            style={{
              display: "inline-block",
              marginTop: 8,
              color: "var(--gold-2)",
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            اقرأ سياسة الخصوصية الكاملة ←
          </Link>
        </div>
      </div>

      {/* تصدير البيانات */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: "var(--text-strong)" }}
            >
              <Download size={16} style={{ color: "var(--gold-2)" }} /> تصدير بياناتك
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
              نزّل نسخة كاملة من كل بياناتك (عقارات، عملاء، مدفوعات، إعدادات...) بصيغة JSON.
            </p>
          </div>
        </div>
        <button
          onClick={exportData}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold"
          style={{
            background: exporting
              ? "var(--bg-surface-2)"
              : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: exporting ? "var(--text-faint)" : "var(--bg-page)",
            border: "none",
            cursor: exporting ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download size={14} />
              تنزيل بياناتي (JSON)
            </>
          )}
        </button>
      </div>

      {/* حذف الحساب */}
      <div
        className="rounded-xl p-5"
        style={{
          background: "var(--bg-surface-1)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2
              className="flex items-center gap-2 text-base font-bold"
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={16} /> حذف الحساب نهائياً
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
              سيُحذف حسابك وكل بياناتك خلال ٣٠ يوماً وفقاً لـ PDPL.
              <strong style={{ color: "#ef4444" }}> لا يمكن التراجع.</strong>
            </p>
          </div>
        </div>

        {!showDeleteForm ? (
          <button
            onClick={() => setShowDeleteForm(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold"
            style={{
              background: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            بدء عملية الحذف
          </button>
        ) : deleteSubmitted ? (
          <div
            className="flex items-start gap-3 rounded-lg p-4"
            style={{
              background: "rgba(74,222,128,0.08)",
              border: "1px solid rgba(74,222,128,0.2)",
            }}
          >
            <CheckCircle2 size={20} style={{ color: "var(--success, #4ade80)", flexShrink: 0 }} />
            <div className="text-sm" style={{ color: "var(--text-strong)" }}>
              <strong>تم استلام طلبك.</strong> سيتم تنفيذ الحذف خلال ٣٠ يوماً. ستصلك رسالة تأكيد على
              بريدك. تقدر تتراجع خلال ٧ أيام بمراسلتنا.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex items-start gap-2 rounded-lg p-3"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <AlertTriangle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
              <div className="text-xs" style={{ color: "var(--text-soft)" }}>
                هذا الإجراء سيحذف: ملفك، عقاراتك، عملاءك، صفقاتك، فواتيرك، واتساب، البطاقة
                التعريفية، وكل البيانات المرتبطة. <strong>لا يمكن التراجع بعد التنفيذ.</strong>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                سبب الحذف (اختياري — يساعدنا للتحسين)
              </label>
              <textarea
                value={deleteForm.reason}
                onChange={(e) => setDeleteForm({ ...deleteForm, reason: e.target.value })}
                rows={2}
                placeholder="مثال: لم تعد تناسب احتياجاتي..."
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--gold-bg)",
                  borderRadius: 8,
                  color: "var(--text-strong)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                للتأكيد، اكتب:{" "}
                <code
                  style={{
                    direction: "ltr",
                    background: "var(--bg-surface-2)",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                  }}
                >
                  DELETE_MY_ACCOUNT
                </code>
              </label>
              <input
                type="text"
                value={deleteForm.confirm}
                onChange={(e) => setDeleteForm({ ...deleteForm, confirm: e.target.value })}
                placeholder="DELETE_MY_ACCOUNT"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--gold-bg)",
                  borderRadius: 8,
                  color: "var(--text-strong)",
                  fontSize: 13,
                  fontFamily: "monospace",
                  direction: "ltr",
                }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={deleteAccount}
                disabled={deleting || deleteForm.confirm !== "DELETE_MY_ACCOUNT"}
                className="flex-1 rounded-lg py-2.5 text-sm font-bold"
                style={{
                  background:
                    deleting || deleteForm.confirm !== "DELETE_MY_ACCOUNT"
                      ? "var(--bg-surface-2)"
                      : "#ef4444",
                  color:
                    deleting || deleteForm.confirm !== "DELETE_MY_ACCOUNT"
                      ? "var(--text-faint)"
                      : "#fff",
                  border: "none",
                  cursor:
                    deleting || deleteForm.confirm !== "DELETE_MY_ACCOUNT"
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {deleting ? "جاري الإرسال..." : "تأكيد طلب الحذف"}
              </button>
              <button
                onClick={() => {
                  setShowDeleteForm(false);
                  setDeleteForm({ confirm: "", reason: "" });
                }}
                className="rounded-lg px-4 py-2.5 text-sm"
                style={{
                  background: "var(--bg-surface-2)",
                  border: "1px solid var(--gold-bg)",
                  color: "var(--text-faint)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      {/* روابط ذات صلة */}
      <div className="pt-4 text-center">
        <Link
          href="/dashboard/help"
          style={{
            color: "var(--text-faint)",
            textDecoration: "none",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <FileText size={12} /> أسئلة عن الخصوصية؟ راسلنا عبر مركز المساعدة
        </Link>
      </div>
    </div>
  );
}
