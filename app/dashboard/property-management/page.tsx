"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Home,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  Phone,
  Trash2,
  Edit2,
  Send,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import SARIcon from "../../components/SARIcon";
import HelpHint from "../../components/HelpHint";

// ══════════════════════════════════════════════════════════════════
// /dashboard/property-management — D2 إدارة الأملاك
// عقود الإيجار + المدفوعات + المتأخرات + التذكيرات
// ══════════════════════════════════════════════════════════════════

interface Contract {
  id: string;
  property_id: string | null;
  tenant_name: string;
  tenant_phone: string | null;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  payment_day: number;
  status: string;
}

interface Payment {
  id: string;
  contract_id: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: "pending" | "partial" | "paid" | "overdue";
  contract?: {
    tenant_name: string;
    tenant_phone: string | null;
  };
}

interface Stats {
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  partial_count: number;
  overdue_amount: number;
  unpaid_total: number;
  month_collected: number;
}

export default function PropertyManagementPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "contracts" | "payments">("overview");
  const [showNewContract, setShowNewContract] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [cRes, pRes, sRes] = await Promise.all([
        supabase.from("rent_contracts").select("*").order("created_at", { ascending: false }),
        supabase
          .from("rent_payments")
          .select("*, contract:rent_contracts(tenant_name, tenant_phone)")
          .order("due_date", { ascending: true })
          .limit(50),
        supabase.from("rent_dashboard_stats").select("*").maybeSingle(),
      ]);
      setContracts(cRes.data || []);
      setPayments(pRes.data || []);
      setStats(sRes.data || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div dir="rtl" className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="flex items-center gap-2 text-2xl font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <Home size={22} style={{ color: "var(--gold-2)" }} /> إدارة الأملاك
            <HelpHint
              title="إدارة الأملاك"
              body="نظام كامل لإدارة عقود الإيجار: تتبّع المدفوعات الشهرية، المتأخرات، تذكيرات WhatsApp تلقائية للمستأجرين، وإحصائيات سريعة."
              size="sm"
            />
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
            {contracts.length} {contracts.length === 1 ? "عقد" : "عقود"} ·{" "}
            {stats?.overdue_count || 0} متأخّر
          </p>
        </div>
        <button
          onClick={() => setShowNewContract(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
          style={{
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
          }}
        >
          <Plus size={12} /> عقد جديد
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="مدفوع هذا الشهر"
            value={Number(stats.month_collected).toLocaleString("ar-SA")}
            withSAR
            color="#4ade80"
          />
          <StatCard
            icon={<Clock size={18} />}
            label="قيد الانتظار"
            value={String(stats.pending_count)}
            color="#C6914C"
          />
          <StatCard
            icon={<AlertTriangle size={18} />}
            label="متأخّر"
            value={String(stats.overdue_count)}
            sub={`${Number(stats.overdue_amount).toLocaleString("ar-SA")} ر.س`}
            color="#ef4444"
          />
          <StatCard
            icon={<Calendar size={18} />}
            label="إجمالي غير مُحصّل"
            value={Number(stats.unpaid_total).toLocaleString("ar-SA")}
            withSAR
            color="#6b7280"
          />
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{
          background: "var(--bg-surface-1)",
          border: "1px solid var(--gold-bg)",
          maxWidth: "fit-content",
        }}
      >
        {[
          { id: "overview", label: "نظرة عامة" },
          { id: "contracts", label: `العقود (${contracts.length})` },
          { id: "payments", label: `المدفوعات (${payments.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className="rounded-lg px-4 py-2 text-sm font-bold"
            style={{
              background: tab === t.id ? "var(--gold-bg)" : "transparent",
              color: tab === t.id ? "var(--gold-2)" : "var(--text-faint)",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <OverviewTab payments={payments} />}
      {tab === "contracts" && <ContractsTab contracts={contracts} onChanged={load} />}
      {tab === "payments" && <PaymentsTab payments={payments} onChanged={load} />}

      {/* New Contract Modal */}
      {showNewContract && (
        <NewContractModal
          onClose={() => setShowNewContract(false)}
          onSaved={() => {
            setShowNewContract(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  withSAR,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  withSAR?: boolean;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div style={{ color }}>{icon}</div>
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold" style={{ color: "var(--text-strong)" }}>
          {value}
        </span>
        {withSAR && <SARIcon size={11} color="current" />}
      </div>
      {sub && (
        <div className="mt-1 text-xs" style={{ color }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function OverviewTab({ payments }: { payments: Payment[] }) {
  const overdue = payments.filter((p) => p.status === "overdue");
  const upcoming = payments.filter((p) => p.status === "pending").slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Overdue alerts */}
      {overdue.length > 0 && (
        <div>
          <h3
            className="mb-2 flex items-center gap-2 text-sm font-bold"
            style={{ color: "#ef4444" }}
          >
            <AlertTriangle size={15} />
            مدفوعات متأخّرة ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.slice(0, 5).map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3
            className="mb-2 flex items-center gap-2 text-sm font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <Calendar size={15} style={{ color: "var(--gold-2)" }} />
            القادمة قريباً
          </h3>
          <div className="space-y-2">
            {upcoming.map((p) => (
              <PaymentRow key={p.id} payment={p} />
            ))}
          </div>
        </div>
      )}

      {payments.length === 0 && (
        <div
          className="rounded-xl py-12 text-center"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <Home size={36} style={{ color: "var(--gold-2)", margin: "0 auto 12px" }} />
          <p className="mb-1 font-bold" style={{ color: "var(--text-strong)" }}>
            لا توجد عقود بعد
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            ابدأ بإضافة عقد إيجار لإدارة المدفوعات والمتأخرات
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ContractsTab({ contracts, onChanged }: { contracts: Contract[]; onChanged: () => void }) {
  async function deleteContract(id: string) {
    if (!confirm("احذف هذا العقد وكل مدفوعاته؟")) return;
    const { error } = await supabase.from("rent_contracts").delete().eq("id", id);
    if (error) toast.error("فشل");
    else {
      toast.success("تم الحذف");
      onChanged();
    }
  }

  if (contracts.length === 0) {
    return (
      <div
        className="rounded-xl py-12 text-center"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <p style={{ color: "var(--text-faint)" }}>لا توجد عقود</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {contracts.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-xl p-3"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
              {c.tenant_name}
            </div>
            <div className="text-xs" style={{ color: "var(--text-faint)" }}>
              {Number(c.monthly_rent).toLocaleString("ar-SA")} ر.س/شهر · {c.start_date} →{" "}
              {c.end_date}
            </div>
          </div>
          <span
            className="rounded-full px-2 py-1 text-xs font-bold"
            style={{
              background: c.status === "active" ? "rgba(74,222,128,0.1)" : "rgba(150,150,150,0.1)",
              color: c.status === "active" ? "var(--success, #4ade80)" : "var(--text-faint)",
            }}
          >
            {c.status === "active" ? "نشط" : c.status}
          </span>
          {c.tenant_phone && (
            <a
              href={`https://wa.me/${c.tenant_phone.replace(/^\+/, "").replace(/^0/, "966")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5"
              style={{ color: "#25D366", background: "transparent" }}
              title="واتساب"
            >
              <Send size={14} />
            </a>
          )}
          <button
            onClick={() => deleteContract(c.id)}
            className="rounded-lg p-1.5"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-faint)",
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function PaymentsTab({ payments, onChanged }: { payments: Payment[]; onChanged: () => void }) {
  if (payments.length === 0) {
    return (
      <div
        className="rounded-xl py-12 text-center"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <p style={{ color: "var(--text-faint)" }}>لا توجد مدفوعات</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((p) => (
        <PaymentRow key={p.id} payment={p} onChanged={onChanged} editable />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function PaymentRow({
  payment,
  onChanged,
  editable,
}: {
  payment: Payment;
  onChanged?: () => void;
  editable?: boolean;
}) {
  const colors = {
    paid: { bg: "rgba(74,222,128,0.08)", text: "var(--success, #4ade80)", label: "مدفوع" },
    pending: { bg: "rgba(198,145,76,0.08)", text: "var(--gold-2)", label: "قيد الانتظار" },
    overdue: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", label: "متأخّر" },
    partial: { bg: "rgba(150,150,150,0.08)", text: "var(--text-faint)", label: "جزئي" },
  };
  const c = colors[payment.status];

  async function markPaid() {
    if (!editable) return;
    if (!confirm("هل تأكّد دفع كامل المبلغ؟")) return;
    const { error } = await supabase
      .from("rent_payments")
      .update({ paid_amount: payment.amount })
      .eq("id", payment.id);
    if (error) toast.error("فشل");
    else {
      toast.success("✅ تم تسجيل الدفع");
      onChanged?.();
    }
  }

  function sendReminder() {
    if (!payment.contract?.tenant_phone) {
      toast.error("لا يوجد رقم جوّال للمستأجر");
      return;
    }
    const phone = payment.contract.tenant_phone.replace(/^\+/, "").replace(/^0/, "966");
    const remaining = Number(payment.amount) - Number(payment.paid_amount);
    const msg = encodeURIComponent(
      `السلام عليكم،\nنذكّركم بأن قيمة إيجار شهر ${payment.due_date} (${remaining.toLocaleString("ar-SA")} ر.س) ${
        payment.status === "overdue" ? "متأخّرة عن موعد الاستحقاق" : "تستحق قريباً"
      }. يُرجى التواصل لتأكيد الدفع. شكراً لكم.`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl p-3"
      style={{ background: "var(--bg-surface-1)", border: `1px solid ${c.bg}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          {payment.contract?.tenant_name || "—"}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-faint)" }}>
          <Calendar size={11} />
          استحقاق: {payment.due_date}
          <span>·</span>
          <span style={{ color: "var(--text-strong)", fontWeight: 600 }}>
            {Number(payment.amount).toLocaleString("ar-SA")} ر.س
          </span>
        </div>
      </div>

      <span
        className="rounded-full px-2 py-1 text-xs font-bold"
        style={{ background: c.bg, color: c.text }}
      >
        {c.label}
      </span>

      {editable && payment.status !== "paid" && (
        <>
          {payment.contract?.tenant_phone && (
            <button
              onClick={sendReminder}
              className="rounded-lg p-1.5"
              style={{
                color: "#25D366",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
              title="إرسال تذكير عبر واتساب"
            >
              <Send size={14} />
            </button>
          )}
          <button
            onClick={markPaid}
            className="rounded-lg px-2 py-1 text-xs font-bold"
            style={{
              background: "rgba(74,222,128,0.15)",
              color: "var(--success, #4ade80)",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            title="تأكيد الدفع"
          >
            تسجيل دفع
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function NewContractModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    tenant_name: "",
    tenant_phone: "",
    tenant_email: "",
    monthly_rent: "",
    start_date: "",
    end_date: "",
    payment_day: "1",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.tenant_name || !form.monthly_rent || !form.start_date || !form.end_date) {
      toast.error("املأ الحقول الأساسية");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("غير مسجّل دخول");
        return;
      }
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();
      if (!tenant) {
        toast.error("لم يُعثر على وسيط");
        return;
      }

      const { data: contract, error } = await supabase
        .from("rent_contracts")
        .insert([
          {
            tenant_id: tenant.id,
            tenant_name: form.tenant_name,
            tenant_phone: form.tenant_phone || null,
            tenant_email: form.tenant_email || null,
            monthly_rent: Number(form.monthly_rent),
            start_date: form.start_date,
            end_date: form.end_date,
            payment_day: Number(form.payment_day),
            notes: form.notes || null,
            status: "active",
          },
        ])
        .select()
        .single();

      if (error || !contract) {
        toast.error("فشل: " + (error?.message || "غير معروف"));
        return;
      }

      // توليد المدفوعات تلقائياً
      const { data: count } = await supabase.rpc("generate_rent_payments", {
        p_contract_id: contract.id,
      });

      toast.success(`✅ أُضيف العقد + ${count || 0} دفعة شهرية`);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    borderRadius: 8,
    color: "var(--text-strong)",
    fontSize: 13,
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-page)",
          borderRadius: 16,
          maxWidth: 540,
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          padding: 20,
          border: "1px solid var(--gold-bg)",
        }}
        dir="rtl"
      >
        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--text-strong)" }}>
          عقد إيجار جديد
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                اسم المستأجر *
              </label>
              <input
                type="text"
                value={form.tenant_name}
                onChange={(e) => setForm({ ...form, tenant_name: e.target.value })}
                style={inputStyle}
                placeholder="فلان الفلاني"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                جوّال المستأجر
              </label>
              <input
                type="tel"
                value={form.tenant_phone}
                onChange={(e) => setForm({ ...form, tenant_phone: e.target.value })}
                style={inputStyle}
                placeholder="05XXXXXXXX"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                الإيجار الشهري (ر.س) *
              </label>
              <input
                type="number"
                value={form.monthly_rent}
                onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
                style={inputStyle}
                placeholder="3000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                يوم الاستحقاق (1-28)
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={form.payment_day}
                onChange={(e) => setForm({ ...form, payment_day: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                تاريخ البدء *
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                تاريخ الانتهاء *
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
              ملاحظات
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg py-2.5 text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                color: "var(--bg-page)",
                border: "none",
                cursor: saving ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {saving ? "جاري الحفظ..." : "حفظ + توليد المدفوعات"}
            </button>
            <button
              onClick={onClose}
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
      </div>
    </div>
  );
}
