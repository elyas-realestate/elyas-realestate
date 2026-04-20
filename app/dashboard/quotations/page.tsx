"use client";
import { formatSAR } from "@/lib/format";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import {
  FileText, Plus, X, Check, Edit3, Trash2, Send, Clock, Printer,
  CheckCircle, XCircle, ArrowLeft, Eye,
} from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";

const STATUS_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  "مسودة":  { color: "#9A9AA0", bg: "rgba(90,90,98,0.1)",    icon: Edit3       },
  "مُرسل": { color: "#60A5FA", bg: "rgba(96,165,250,0.1)",  icon: Send        },
  "مقبول":  { color: "#4ADE80", bg: "rgba(74,222,128,0.1)",  icon: CheckCircle },
  "مرفوض":  { color: "#F87171", bg: "rgba(248,113,113,0.1)", icon: XCircle     },
  "منتهي":  { color: "#5A5A62", bg: "rgba(90,90,98,0.08)",   icon: Clock       },
};

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

function fmtNum(n: number) {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "م";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "ألف";
  return n.toLocaleString("ar-SA");
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    title: "", client_name: "", client_phone: "", amount: "",
    valid_until: "", notes: "", status: "مسودة",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase.from("quotations").select("*").order("created_at", { ascending: false });
    if (error?.message?.includes("does not exist")) { setMissingTable(true); setLoading(false); return; }
    setQuotations(data || []);
    setLoading(false);
  }

  async function addQuotation() {
    if (!form.title.trim()) { toast.error("أدخل عنوان العرض"); return; }
    setSaving(true);
    const { error } = await supabase.from("quotations").insert([{
      title: form.title.trim(),
      client_name: form.client_name || null,
      client_phone: form.client_phone || null,
      amount: form.amount ? Number(form.amount) : 0,
      valid_until: form.valid_until || null,
      notes: form.notes || null,
      status: form.status,
    }]);
    setSaving(false);
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    toast.success("تم إنشاء عرض السعر");
    setForm({ title: "", client_name: "", client_phone: "", amount: "", valid_until: "", notes: "", status: "مسودة" });
    setShowForm(false);
    load();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("quotations").update({ status }).eq("id", id);
    toast.success("تم تحديث الحالة");
    load();
  }

  async function deleteQuotation(id: string) {
    if (!confirm("حذف هذا العرض؟")) return;
    await supabase.from("quotations").delete().eq("id", id);
    toast.success("تم الحذف");
    load();
  }

  const kpis = useMemo(() => ({
    total: quotations.length,
    pending: quotations.filter(q => q.status === "مُرسل").length,
    accepted: quotations.filter(q => q.status === "مقبول").length,
    totalAmount: quotations.filter(q => q.status === "مقبول").reduce((s, q) => s + (q.amount || 0), 0),
  }), [quotations]);

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
        <FileText size={28} style={{ color: "#C6914C" }} />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F5F5F5", marginBottom: 12 }}>يلزم تفعيل جدول عروض الأسعار</h2>
      <p style={{ fontSize: 13, color: "#9A9AA0", lineHeight: 1.8 }}>
        شغّل <code style={{ background: "#1C1C22", padding: "2px 8px", borderRadius: 6, color: "#C6914C" }}>supabase/009_quotations_invoices.sql</code> في Supabase → SQL Editor
      </p>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">عروض الأسعار</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>إنشاء وإدارة عروض الأسعار للعملاء</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition"
          style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, border: "none", cursor: "pointer" }}>
          <Plus size={16} /> عرض جديد
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي العروض", val: kpis.total, icon: FileText, color: "#C6914C" },
          { label: "بانتظار الرد", val: kpis.pending, icon: Send, color: "#60A5FA" },
          { label: "مقبولة", val: kpis.accepted, icon: CheckCircle, color: "#4ADE80" },
          { label: "قيمة المقبولة", val: fmtNum(kpis.totalAmount) + " ﷼", icon: SARIcon, color: "#C6914C", isSar: true },
        ].map((k, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 11, color: "#5A5A62" }}>{k.label}</p>
              {!k.isSar && <k.icon size={15} style={{ color: k.color }} />}
            </div>
            <p className="font-cairo font-bold" style={{ fontSize: 22, color: k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl p-6" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.18)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#C6914C", letterSpacing: 1 }}>عرض سعر جديد</h3>
            <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#5A5A62", cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>عنوان العرض *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="مثال: عرض فيلا النخيل" />
              </div>
              <div>
                <label className={lbl}>المبلغ (ر.س)</label>
                <input type="number" dir="ltr" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inp} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={lbl}>اسم العميل</label>
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className={lbl}>هاتف العميل</label>
                <input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>صالح حتى</label>
                <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={inp} dir="ltr" />
              </div>
            </div>
            <div>
              <label className={lbl}>ملاحظات</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={inp} />
            </div>
            <div className="flex gap-3">
              <button onClick={addQuotation} disabled={saving}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#C6914C,#A6743A)", color: "#0A0A0C", fontSize: 14, cursor: "pointer", border: "none" }}>
                <Check size={16} /> {saving ? "جاري الحفظ..." : "إنشاء العرض"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "12px 20px", borderRadius: 12, background: "#1C1C22", color: "#9A9AA0", fontSize: 13, border: "1px solid rgba(198,145,76,0.1)", cursor: "pointer" }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotations List */}
      {quotations.length === 0 ? (
        <div className="rounded-2xl py-20 text-center" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
          <FileText size={40} style={{ color: "rgba(198,145,76,0.2)", margin: "0 auto 14px", display: "block" }} />
          <p style={{ color: "#5A5A62", fontSize: 14, marginBottom: 16 }}>لا توجد عروض أسعار — أنشئ أول عرض</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotations.map(q => {
            const cfg = STATUS_CFG[q.status] || STATUS_CFG["مسودة"];
            const StatusIcon = cfg.icon;
            const isExpired = q.valid_until && new Date(q.valid_until) < new Date() && q.status !== "مقبول";
            return (
              <div key={q.id} className="rounded-2xl p-5 transition"
                style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.09)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: "#E5E5E5" }}>{q.title}</h4>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                        <StatusIcon size={11} />
                        {q.status}
                      </span>
                      {isExpired && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: "rgba(248,113,113,0.08)", color: "#F87171" }}>منتهي الصلاحية</span>
                      )}
                    </div>
                    <div className="flex gap-4 flex-wrap" style={{ fontSize: 12, color: "#5A5A62" }}>
                      {q.client_name && <span>👤 {q.client_name}</span>}
                      {q.client_phone && <span>📱 {q.client_phone}</span>}
                      {q.valid_until && <span>📅 {new Date(q.valid_until).toLocaleDateString("ar-SA")}</span>}
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-cairo font-bold" style={{ fontSize: 18, color: "#C6914C" }}>
                      {fmtNum(q.amount || 0)} <span style={{ fontSize: 12 }}>﷼</span>
                    </p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4 pt-3 flex-wrap" style={{ borderTop: "1px solid rgba(198,145,76,0.06)" }}>
                  {q.status === "مسودة" && (
                    <button onClick={() => updateStatus(q.id, "مُرسل")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      style={{ background: "rgba(96,165,250,0.08)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.2)", cursor: "pointer" }}>
                      <Send size={11} /> إرسال
                    </button>
                  )}
                  {q.status === "مُرسل" && (
                    <>
                      <button onClick={() => updateStatus(q.id, "مقبول")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: "rgba(74,222,128,0.08)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.2)", cursor: "pointer" }}>
                        <CheckCircle size={11} /> قبول
                      </button>
                      <button onClick={() => updateStatus(q.id, "مرفوض")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)", cursor: "pointer" }}>
                        <XCircle size={11} /> رفض
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.open(`/api/pdf?type=quotation&id=${q.id}`, "_blank")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                    style={{ background: "rgba(96,165,250,0.06)", color: "#60A5FA", border: "1px solid rgba(96,165,250,0.15)", cursor: "pointer" }}>
                    <Printer size={11} /> PDF
                  </button>
                  <button onClick={() => deleteQuotation(q.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
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
