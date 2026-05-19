"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Plus,
  X,
  Check,
  Trash2,
  CreditCard,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageCircle,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CFG: Record<
  string,
  { color: string; bg: string; icon: import("lucide-react").LucideIcon }
> = {
  "غير مدفوعة": { color: "var(--danger)", bg: "rgba(248,113,113,0.1)", icon: AlertCircle },
  "مدفوعة جزئياً": { color: "var(--warning)", bg: "rgba(250,204,21,0.1)", icon: Clock },
  مدفوعة: { color: "var(--success)", bg: "rgba(74,222,128,0.1)", icon: CheckCircle },
  ملغاة: { color: "var(--text-faint)", bg: "rgba(90,90,98,0.08)", icon: X },
};

const inp =
  "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--border-1)] focus:outline-none focus:border-[var(--gold-2)] transition";
const lbl = "block text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-wide";

function fmtNum(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString("ar-SA");
}

export default function InvoicesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client_name: "",
    invoice_number: "",
    amount: "",
    vat_amount: "",
    due_date: "",
    notes: "",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error?.message?.includes("does not exist")) {
      setMissingTable(true);
      setLoading(false);
      return;
    }
    setInvoices(data || []);
    setLoading(false);
  }

  async function sendWhatsappReminder(inv: {
    id: string;
    client_id: string | null;
    client_name?: string | null;
    title?: string | null;
    invoice_number: string | null;
    amount: number;
    vat_amount: number | null;
    due_date: string | null;
  }) {
    // حاول تجيب رقم العميل
    let phone: string | null = null;
    if (inv.client_id) {
      const { data: c } = await supabase
        .from("clients")
        .select("phone")
        .eq("id", inv.client_id)
        .maybeSingle();
      phone = c?.phone || null;
    }
    if (!phone) {
      const name = inv.client_name || "";
      if (name) {
        const { data: c } = await supabase
          .from("clients")
          .select("phone")
          .ilike("name", name)
          .maybeSingle();
        phone = c?.phone || null;
      }
    }
    if (!phone) {
      toast.error("لا يوجد رقم جوال للعميل — أضف الرقم في سجل العميل أولاً");
      return;
    }

    const total = (inv.amount || 0) + (inv.vat_amount || 0);
    const dueStr = inv.due_date
      ? new Date(inv.due_date).toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "غير محدد";

    const msg = `السلام عليكم ${inv.client_name || ""}\n\nتذكير ودّي بفاتورة رقم ${inv.invoice_number || "—"}:\n📄 ${inv.title}\n💰 المبلغ: ${total.toLocaleString("ar-SA")} ر.س\n📅 تاريخ الاستحقاق: ${dueStr}\n\nنرجو منكم سداد المستحقات في أقرب وقت. شكراً لتعاونكم 🌹`;

    // تنظيف الرقم: إزالة أي أحرف غير رقمية، تأكد البداية +966 أو مفتاح دولي
    let clean = String(phone).replace(/[^\d+]/g, "");
    if (clean.startsWith("00")) clean = "+" + clean.slice(2);
    if (clean.startsWith("05")) clean = "+966" + clean.slice(1);
    if (clean.startsWith("5") && clean.length === 9) clean = "+966" + clean;
    if (!clean.startsWith("+")) clean = "+" + clean;

    const url = `https://wa.me/${clean.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    toast.success("فتح واتساب لإرسال التذكير");
  }

  async function addInvoice() {
    if (!form.title.trim()) {
      toast.error("أدخل عنوان الفاتورة");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("invoices").insert([
      {
        title: form.title.trim(),
        client_name: form.client_name || null,
        invoice_number: form.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`,
        amount: form.amount ? Number(form.amount) : 0,
        vat_amount: form.vat_amount ? Number(form.vat_amount) : 0,
        due_date: form.due_date || null,
        notes: form.notes || null,
      },
    ]);
    setSaving(false);
    if (error) {
      toast.error("فشل الحفظ: " + error.message);
      return;
    }
    toast.success("تم إنشاء الفاتورة");
    setForm({
      title: "",
      client_name: "",
      invoice_number: "",
      amount: "",
      vat_amount: "",
      due_date: "",
      notes: "",
    });
    setShowForm(false);
    load();
  }

  async function markPaid(id: string) {
    await supabase
      .from("invoices")
      .update({ status: "مدفوعة", paid_at: new Date().toISOString() })
      .eq("id", id);
    toast.success("تم تسجيل الدفع");
    load();
  }

  async function deleteInvoice(id: string) {
    if (!confirm("حذف هذه الفاتورة؟")) return;
    await supabase.from("invoices").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  }

  const kpis = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === "غير مدفوعة");
    const paid = invoices.filter((i) => i.status === "مدفوعة");
    return {
      total: invoices.length,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((s, i) => s + (i.amount || 0) + (i.vat_amount || 0), 0),
      paidAmount: paid.reduce((s, i) => s + (i.amount || 0) + (i.vat_amount || 0), 0),
    };
  }, [invoices]);

  if (loading)
    return (
      <div dir="rtl" className="space-y-4">
        <div className="skeleton mb-6 h-8 w-48 rounded" />
        <div className="mb-6 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  if (missingTable)
    return (
      <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "var(--gold-bg-soft)",
            border: "1px solid var(--gold-bg-hover)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Receipt size={28} style={{ color: "var(--gold-2)" }} />
        </div>
        <h2
          style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)", marginBottom: 12 }}
        >
          يلزم تفعيل جدول الفواتير
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.8 }}>
          شغّل{" "}
          <code
            style={{
              background: "var(--bg-surface-2)",
              padding: "2px 8px",
              borderRadius: 6,
              color: "var(--gold-2)",
            }}
          >
            supabase/009_quotations_invoices.sql
          </code>{" "}
          في Supabase → SQL Editor
        </p>
      </div>
    );

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="mb-1 text-2xl font-bold">الفواتير</h2>
          <p style={{ color: "var(--text-faint)", fontSize: 13 }}>إصدار فواتير وتتبع الدفعات</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold transition"
          style={{
            background: "linear-gradient(135deg,var(--gold-2),var(--gold-3))",
            color: "var(--bg-page)",
            fontSize: 14,
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> فاتورة جديدة
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "إجمالي الفواتير", val: kpis.total, color: "var(--gold-2)" },
          { label: "غير مدفوعة", val: kpis.unpaidCount, color: "var(--danger)" },
          {
            label: "مبالغ مستحقة",
            val: fmtNum(kpis.unpaidAmount) + " ر.س",
            color: "var(--warning)",
          },
          {
            label: "إجمالي المحصّل",
            val: fmtNum(kpis.paidAmount) + " ر.س",
            color: "var(--success)",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-soft)" }}
          >
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 6 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>
              {k.val}
            </p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-surface-1)", border: "1px solid rgba(198,145,76,0.18)" }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-2)", letterSpacing: 1 }}>
              فاتورة جديدة
            </h3>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-faint)",
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={lbl}>عنوان الفاتورة *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inp}
                  placeholder="عمولة صفقة..."
                />
              </div>
              <div>
                <label className={lbl}>اسم العميل</label>
                <input
                  value={form.client_name}
                  onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
                  className={inp}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label className={lbl}>رقم الفاتورة</label>
                <input
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                  className={inp}
                  placeholder="تلقائي"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={lbl}>المبلغ (ر.س)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>الضريبة (ر.س)</label>
                <input
                  type="number"
                  dir="ltr"
                  value={form.vat_amount}
                  onChange={(e) => setForm((f) => ({ ...f, vat_amount: e.target.value }))}
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className={inp}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={addInvoice}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-7 py-3 font-bold transition disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,var(--gold-2),var(--gold-3))",
                  color: "var(--bg-page)",
                  fontSize: 14,
                  cursor: "pointer",
                  border: "none",
                }}
              >
                <Check size={16} /> {saving ? "جاري الحفظ..." : "إصدار الفاتورة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div
          className="rounded-2xl py-20 text-center"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg-soft)" }}
        >
          <Receipt
            size={40}
            style={{ color: "var(--gold-bg-hover)", margin: "0 auto 14px", display: "block" }}
          />
          <p style={{ color: "var(--text-faint)", fontSize: 14 }}>لا توجد فواتير</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const cfg = STATUS_CFG[inv.status] || STATUS_CFG["غير مدفوعة"];
            const StatusIcon = cfg.icon;
            const total = (inv.amount || 0) + (inv.vat_amount || 0);
            const overdue =
              inv.due_date && new Date(inv.due_date) < new Date() && inv.status === "غير مدفوعة";
            return (
              <div
                key={inv.id}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--bg-surface-1)",
                  border: overdue
                    ? "1px solid rgba(248,113,113,0.25)"
                    : "1px solid var(--gold-bg-soft)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-faint)",
                          fontFamily: "monospace",
                        }}
                      >
                        {inv.invoice_number || "—"}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-on-dark)" }}>
                        {inv.title}
                      </h4>
                      <span
                        className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          background: cfg.bg,
                          color: cfg.color,
                        }}
                      >
                        <StatusIcon size={11} />
                        {inv.status}
                      </span>
                      {overdue && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            borderRadius: 6,
                            background: "rgba(248,113,113,0.08)",
                            color: "var(--danger)",
                          }}
                        >
                          ⚠ متأخرة
                        </span>
                      )}
                    </div>
                    <div
                      className="flex flex-wrap gap-4"
                      style={{ fontSize: 12, color: "var(--text-faint)" }}
                    >
                      {inv.client_name && <span>👤 {inv.client_name}</span>}
                      {inv.due_date && (
                        <span>📅 {new Date(inv.due_date).toLocaleDateString("ar-SA")}</span>
                      )}
                      {inv.vat_amount > 0 && <span>🧾 ضريبة: {fmtNum(inv.vat_amount)} ر.س</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p
                      className="font-cairo font-bold"
                      style={{
                        fontSize: 20,
                        color: inv.status === "مدفوعة" ? "var(--success)" : "var(--gold-2)",
                      }}
                    >
                      {fmtNum(total)} <span style={{ fontSize: 12 }}>ر.س</span>
                    </p>
                  </div>
                </div>
                <div
                  className="mt-4 flex flex-wrap gap-2 pt-3"
                  style={{ borderTop: "1px solid var(--gold-bg-soft)" }}
                >
                  {inv.status === "غير مدفوعة" && (
                    <button
                      onClick={() => markPaid(inv.id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: "rgba(74,222,128,0.08)",
                        color: "var(--success)",
                        border: "1px solid rgba(74,222,128,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      <CreditCard size={11} /> تسجيل دفع
                    </button>
                  )}
                  {inv.status === "غير مدفوعة" && (
                    <button
                      onClick={() => sendWhatsappReminder(inv)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        background: overdue ? "rgba(74,222,128,0.12)" : "rgba(74,222,128,0.05)",
                        color: "var(--whatsapp)",
                        border: "1px solid rgba(74,222,128,0.2)",
                        cursor: "pointer",
                      }}
                      title={overdue ? "إرسال تذكير واتساب — فاتورة متأخرة" : "إرسال تذكير واتساب"}
                    >
                      <MessageCircle size={11} /> {overdue ? "تذكير متأخرة" : "تذكير واتساب"}
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`/api/pdf?type=invoice&id=${inv.id}`, "_blank")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: "rgba(96,165,250,0.06)",
                      color: "var(--info)",
                      border: "1px solid rgba(96,165,250,0.15)",
                      cursor: "pointer",
                    }}
                  >
                    <Printer size={11} /> PDF
                  </button>
                  <button
                    onClick={() => window.open(`/api/zatca-xml?id=${inv.id}`, "_blank")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: "rgba(52,211,153,0.06)",
                      color: "var(--success-2)",
                      border: "1px solid rgba(52,211,153,0.15)",
                      cursor: "pointer",
                    }}
                    title="تصدير XML متوافق مع ZATCA Phase 2"
                  >
                    <FileCode size={11} /> XML
                  </button>
                  <button
                    onClick={() => deleteInvoice(inv.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background: "rgba(248,113,113,0.04)",
                      color: "var(--danger)",
                      border: "1px solid rgba(248,113,113,0.1)",
                      cursor: "pointer",
                      marginRight: "auto",
                    }}
                  >
                    <Trash2 size={11} /> حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
