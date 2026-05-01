"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useMemo } from "react";
import { Plus, X, Trash2, BellRing, Smartphone } from "lucide-react";
import { toast } from "sonner";
import SARIcon from "../../components/SARIcon";

export default function ExternalSubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    app_name: "", plan_name: "", cost: "0", billing_cycle: "monthly",
    start_date: new Date().toISOString().split("T")[0], end_date: "",
    remind_before_days: "7", status: "active"
  });

  useEffect(() => { loadSubs(); }, []);

  async function loadSubs() {
    const { data, error } = await supabase
      .from("external_subscriptions")
      .select("*")
      .order("end_date", { ascending: true });
    
    if (error) {
      if (error.message.includes("does not exist")) {
        toast.error("قم بتشغيل ملف السكربت 014 في Supabase أولاً");
      }
      setLoading(false);
      return;
    }
    setSubs(data || []);
    setLoading(false);
  }

  async function addSub() {
    if (!form.app_name) { toast.error("أدخل اسم التطبيق"); return; }
    if (!form.end_date) { toast.error("أدخل تاريخ انتهاء الاشتراك القادم"); return; }

    setSaving(true);
    const { error } = await supabase.from("external_subscriptions").insert([{
      app_name: form.app_name,
      plan_name: form.plan_name || 'أساسي',
      cost: Number(form.cost),
      billing_cycle: form.billing_cycle,
      start_date: form.start_date,
      end_date: form.end_date,
      remind_before_days: Number(form.remind_before_days),
      status: form.status,
    }]);
    setSaving(false);
    
    if (error) { toast.error("فشل الحفظ: " + error.message); return; }
    
    toast.success("تم التتبع بنجاح");
    setForm({
      app_name: "", plan_name: "", cost: "0", billing_cycle: "monthly",
      start_date: new Date().toISOString().split("T")[0], end_date: "",
      remind_before_days: "7", status: "active"
    });
    setShowForm(false);
    loadSubs();
  }

  async function deleteSub(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الاشتراك؟")) return;
    await supabase.from("external_subscriptions").delete().eq("id", id);
    toast.success("تم الحذف");
    loadSubs();
  }

  // calculations
  const totalCostMonthly = useMemo(() => {
    return subs.filter(s => s.status === 'active').reduce((acc, curr) => {
      if (curr.billing_cycle === 'yearly') return acc + (Number(curr.cost) / 12);
      return acc + Number(curr.cost);
    }, 0);
  }, [subs]);

  const activeCount = subs.filter(s => s.status === 'active').length;

  const getDaysLeft = (endDate: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const inpMenu = "w-full bg-[var(--bg-surface-2)] border border-[var(--success-3)25] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-ghost)] focus:outline-none focus:border-[var(--success-3)] transition";
  const lblMenu = "block text-xs font-semibold text-[var(--text-muted)] mb-2 tracking-wide";

  if (loading) return <div dir="rtl" className="p-10 text-center text-[var(--text-muted)] font-cairo">جاري التحميل...</div>;

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-cairo mb-1">متابعة اشتراكات التطبيقات المساعدة</h2>
          <p className="text-[var(--text-ghost)] text-sm">تتبع مصروفات وتجديدات منصات كـ (عقار، ديل، تويتر إكس) وغيرها</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition"
          style={{ background: "var(--success-3)", color: "var(--bg-page)", fontSize: 14, border: "none", cursor: "pointer" }}>
          <Plus size={16} /> إضافة اشتراك
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-[var(--bg-surface-1)] border border-[var(--success-3)20]">
          <p className="text-xs text-[var(--text-muted)] mb-2">إجمالي التكلفة التقديرية (شهرياً)</p>
          <div className="flex items-center gap-2">
            <SARIcon size={16} color="accent" />
            <p className="font-cairo font-bold text-2xl text-[var(--success-3)]">{totalCostMonthly.toFixed(0)}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 bg-[var(--bg-surface-1)] border border-[var(--success-3)20]">
          <p className="text-xs text-[var(--text-muted)] mb-2">الاشتراكات النشطة</p>
          <p className="font-cairo font-bold text-2xl text-[var(--text-strong)]">{activeCount}</p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 bg-[var(--bg-surface-1)] border border-[var(--success-3)30] animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-[var(--success-3)]">تفاصيل الاشتراك الجديد</h3>
            <button onClick={() => setShowForm(false)} className="text-[var(--text-ghost)] hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lblMenu}>اسم التطبيق / المنصة *</label>
              <input value={form.app_name} onChange={e => setForm(f => ({ ...f, app_name: e.target.value }))} className={inpMenu} placeholder="تطبيق عقار، تطبيق ديل..." />
            </div>
            <div>
              <label className={lblMenu}>خطة الاشتراك</label>
              <input value={form.plan_name} onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))} className={inpMenu} placeholder="مثال: باقة أعمال" />
            </div>
            <div>
              <label className={lblMenu}>التكلفة</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={inpMenu} dir="ltr" />
            </div>
            <div>
              <label className={lblMenu}>دورة الدفع</label>
              <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))} className={inpMenu}>
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
            </div>
            <div>
              <label className={lblMenu}>تاريخ البدء</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inpMenu} dir="ltr" />
            </div>
            <div>
              <label className={lblMenu}>التجديد القادم في *</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inpMenu} dir="ltr" />
            </div>
            <div>
              <label className={lblMenu}>تنبيه قبل (أيام)</label>
              <input type="number" value={form.remind_before_days} onChange={e => setForm(f => ({ ...f, remind_before_days: e.target.value }))} className={inpMenu} dir="ltr" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={addSub} disabled={saving} className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold bg-[var(--success-3)] text-[var(--bg-page)] disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "إضافة للتتبع"} 
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 rounded-xl text-[var(--text-muted)] border border-[var(--success-3)20]">إلغاء</button>
          </div>
        </div>
      )}

      {subs.length === 0 && !loading && (
        <div className="rounded-2xl py-20 text-center bg-[var(--bg-surface-1)] border border-[var(--success-3)20]">
          <Smartphone size={40} className="text-[var(--success-3)50] mx-auto mb-4" />
          <p className="text-sm text-[var(--text-muted)] mb-4">لاتوجد اشتراكات حالياً، أضف المنصات التي تدفع لها دورياً</p>
        </div>
      )}

      {subs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subs.map(sub => {
            const daysLeft = getDaysLeft(sub.end_date);
            const isUrgent = daysLeft !== null && daysLeft <= sub.remind_before_days && daysLeft >= 0;
            const isExpired = daysLeft !== null && daysLeft < 0;

            return (
              <div key={sub.id} className={`rounded-xl p-5 border relative overflow-hidden ${isUrgent ? 'border-[var(--warning-2)80] bg-[var(--bg-surface-2)]' : isExpired ? 'border-[var(--danger)80] bg-[var(--bg-surface-2)]' : 'border-[var(--success-3)20] bg-[var(--bg-surface-1)]'}`}>
                {isUrgent && (
                  <div className="absolute top-0 right-0 left-0 bg-[var(--warning-2)20] text-[var(--warning-2)] text-[10px] text-center font-bold py-1">يحين التجديد قريباً!</div>
                )}
                {isExpired && (
                  <div className="absolute top-0 right-0 left-0 bg-[var(--danger)20] text-[var(--danger)] text-[10px] text-center font-bold py-1">انتهى الاشتراك!</div>
                )}
                
                <div className="flex justify-between items-start mt-2">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--success-3)20] flex items-center justify-center">
                      <Smartphone size={18} className="text-[var(--success-3)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-strong)]">{sub.app_name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)]">{sub.plan_name}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteSub(sub.id)} className="text-[var(--text-ghost)] hover:text-[var(--danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-end pb-3 mb-3 border-b border-[var(--success-3)15]">
                  <div>
                    <p className="text-[10px] text-[var(--text-ghost)] mb-1">التكلفة</p>
                    <p className="font-bold text-[var(--success-3)] font-cairo">
                      {sub.cost} <SARIcon size={10} color="accent" />
                      <span className="text-[10px] text-[var(--text-ghost)] font-normal mr-1">/ {sub.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[var(--text-ghost)] mb-1">تاريخ الانتهاء</p>
                    <p className="text-sm font-semibold text-[var(--text-strong)] font-sans" dir="ltr">{sub.end_date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BellRing size={12} className={isUrgent ? 'text-[var(--warning-2)]' : isExpired ? 'text-[var(--danger)]' : 'text-[var(--text-ghost)]'} />
                  <span className={`text-[11px] font-bold ${isUrgent ? 'text-[var(--warning-2)]' : isExpired ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                    {isExpired ? 'متأخر الدفع' : daysLeft !== null ? `باقي ${daysLeft} يوماً` : 'غير محدد'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
