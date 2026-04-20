"use client";
import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  Receipt, Plus, X, Check, Edit3, Trash2, CreditCard, Printer,
  CheckCircle, Clock, AlertCircle, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";

const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  "غير مدفوعة":   { color: "#F87171", bg: "rgba(248,113,113,0.1)", icon: AlertCircle },
  "مدفوعة جزئياً": { color: "#FACC15", bg: "rgba(250,204,21,0.1)",  icon: Clock       },
  "مدفوعة":        { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  icon: CheckCircle },
  "ملغاة":         { color: "#5A5A62", bg: "rgba(90,90,98,0.08)",   icon: X           },
};

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

function fmtNum(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString("ar-SA");
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm] = useState({
    title: "", client_name: "", invoice_number: "", amount: "",
    vat_amount: "", due_date: "", notes: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setInvoices(data || []);
    setLoading(false);
  }

  async function addInvoice() {
    if (!form.title.trim()) { toast.error("أدخل عنوان الفاتورة"); return; }
    setSaving(true);
    const { error } = await supabase.from("invoices").insert([{
      title: form.title.trim(),
      client_name: form.client_name || null,
      invoice_number: form.invoice_number || `INV-${Date.now().toString(36).toUpperCase()}`,
      amount: form.amount ? Number(form.amount) : 0,
      vat_amount: form.vat_amount ? Number(form.vat_amount) : 0,
      due_date: form.due_date || null,
      notes: form.notes || null,
    }]);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success("تم إنشاء الفاتورة");
    setForm({ title: "", client_name: "", invoice_number: "", amount: "", vat_amount: "", due_date: "", notes: "" });
    setShowForm(false);
    load();
  }

  async function markPaid(id: string) {
    await supabase.from("invoices").update({ status: "مدفوعة", paid_at: new Date().toISOString() }).eq("id", id);
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
    const unpaid = invoices.filter(i => i.status === "غير مدفوعة");
    const paid   = invoices.filter(i => i.status === "مدفوعة");
    return {
      total: invoices.length,
      unpaidCount: unpaid.length,
      unpaidAmount: unpaid.reduce((s, i) => s + (i.amount || 0) + (i.vat_amount || 0), 0),
      paidAmount: paid.reduce((s, i) => s + (i.amount || 0) + (i.vat_amount || 0), 0),
    };
  }, [invoices]);

  if (loading) return (
    <div dir="rtl" className="space-y-4">
      <div className="skeleton h-8 rounded w-48 mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </div>
  );

  if (missingTable) return (
    <div dir="rtl" style={{ maxWidth: 520, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Receipt size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل جدول الفواتير</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/009_quotations_invoices.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">الفواتير</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>إصدار فواتير وتتبع الدفعات</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition"
          style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, border: "none", cursor: "pointer" }}>
          <Plus size={16} /> فاتورة جديدة
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الفواتير", val: kpis.total, color: "#C6914C" },
          { label: "غير مدفوعة", val: kpis.unpaidCount, color: "#F87171" },
          { label: "مبالغ مستحقة", val: fmtNum(kpis.unpaidAmount) + " ﷼", color: "#FACC15" },
          { label: "إجمالي المحصّل", val: fmtNum(kpis.paidAmount) + " ﷼", color: "#4ADE80" },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 6 }}>{k.label}</p>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#C6914C", letterSpacing: 1 }}>فاتورة جديدة</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#5A5A62", cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>عنوان الفاتورة *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="عمولة صفقة..." />
              </div>
              <div>
                <label className={lbl}>اسم العميل</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className={lbl}>رقم الفاتورة</label>
                <input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className={inp} placeholder="تلقائي" dir="ltr" />
              </div>
              <div>
                <label className={lbl}>المبلغ (ر.س)</label>
                <input type="number" dir="ltr" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>الضريبة (ر.س)</label>
                <input type="number" dir="ltr" value={form.vat_amount} onChange={e => setForm(f => ({ ...f, vat_amount: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>تاريخ الاستحقاق</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inp} dir="ltr" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={addInvoice} disabled={saving}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, cursor: "pointer", border: "none" }}>
                <Check size={16} /> {saving ? "جاري الحفظ..." : "إصدار الفاتورة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <Receipt size={40} style={{ color: "rgba(198,145,76,0.2)", margin: "0 auto 14px", display: "block" }} />
          <p style={{ color: "#5A5A62", fontSize: 14 }}>لا توجد فواتير</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const cfg = STATUS_CFG[inv.status] || STATUS_CFG["غير مدفوعة"];
            const StatusIcon = cfg.icon;
            const total = (inv.amount || 0) + (inv.vat_amount || 0);
            const overdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.status === "غير مدفوعة";
            return (
              <div key={inv.id} className="rounded-2xl p-5" style={{ background: "#16161A", border: overdue ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(198,145,76,0.09)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span style={{ fontSize: 11, color: "#5A5A62", fontFamily: "monospace" }}>{inv.invoice_number || "—"}</span>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#E5E5E5" }}>{inv.title}</h4>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                        <StatusIcon size={11} />
                        {inv.status}
                      </span>
                      {overdue && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(248,113,113,0.08)", color: "#F87171" }}>⚠ متأخرة</span>}
                    </div>
                    <div className="flex gap-4 flex-wrap" style={{ fontSize: 12, color: "#5A5A62" }}>
                      {inv.client_name && <span>👤 {inv.client_name}</span>}
                      {inv.due_date && <span>📅 {new Date(inv.due_date).toLocaleDateString("ar-SA")}</span>}
                      {inv.vat_amount > 0 && <span>🧾 ضريبة: {fmtNum(inv.vat_amount)} ﷼</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-cairo font-bold" style={{ fontSize: 20, color: inv.status === "مدفوعة" ? "#4ADE80" : "#C6914C" }}>
                      {fmtNum(total)} <span style={{ fontSize: 12 }}>﷼</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
                  {inv.status === "غير مدفوعة" && (
                    <button onClick={() => markPaid(inv.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer" }}>
                      <CreditCard size={11} /> تسجيل دفع
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`/api/pdf?type=invoice&id=${inv.id}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(96,165,250,0.06)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.15)", cursor: "pointer" }}>
                    <Printer size={11} /> PDF
                  </button>
                  <button onClick={() => deleteInvoice(inv.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(248,113,113,0.04)", color: "#F87171", border: "1px solid rgba(248,113,113,0.1)", cursor: "pointer", marginRight: "auto" }}>
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
