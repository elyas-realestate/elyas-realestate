"use client";
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import {
  FileText, CreditCard, Wrench, Plus, X, CheckCircle,
  Clock, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import type { Contract, TenantPayment, MaintenanceRequest, Client, Property } from "@/types/database";

const sb = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Tab = "contracts" | "payments" | "maintenance";

// ── status configs ──────────────────────────────────────────────────────────

const CONTRACT_STATUS: Record<string, { label: string; color: string }> = {
  active:    { label: "نشط",     color: "#4ADE80" },
  expired:   { label: "منتهي",   color: "#94A3B8" },
  cancelled: { label: "ملغي",    color: "#F87171" },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending:   { label: "معلق",     color: "#FACC15" },
  paid:      { label: "مدفوع",   color: "#4ADE80" },
  late:      { label: "متأخر",   color: "#F87171" },
  cancelled: { label: "ملغي",    color: "#94A3B8" },
};

const MAINTENANCE_PRIORITY: Record<string, { label: string; color: string }> = {
  low:    { label: "منخفض",  color: "#4ADE80" },
  medium: { label: "متوسط",  color: "#FACC15" },
  high:   { label: "عالي",   color: "#F97316" },
  urgent: { label: "عاجل",   color: "#F87171" },
};

const MAINTENANCE_STATUS: Record<string, { label: string; color: string }> = {
  open:        { label: "مفتوح",       color: "#FACC15" },
  in_progress: { label: "قيد التنفيذ", color: "#60A5FA" },
  resolved:    { label: "محلول",       color: "#4ADE80" },
  cancelled:   { label: "ملغي",        color: "#94A3B8" },
};

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  if (!n) return "—";
  return n.toLocaleString("ar-SA") + " ر.س";
}

function fmtDate(d: string | undefined | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ar-SA");
}

function Badge({ cfg }: { cfg: { label: string; color: string } }) {
  return (
    <span style={{
      background: cfg.color + "22", color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
}

// ── modal form components ──────────────────────────────────────────────────

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#16161A", border: "1px solid #2A2A35",
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function TenantPortalPage() {
  const [tab, setTab] = useState<Tab>("contracts");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments]   = useState<TenantPayment[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading]   = useState(true);

  // modals
  const [contractModal, setContractModal] = useState(false);
  const [paymentModal, setPaymentModal]   = useState(false);
  const [maintModal, setMaintModal]       = useState(false);
  const [saving, setSaving] = useState(false);

  // contract form
  const [cForm, setCForm] = useState({
    title: "", type: "rent", client_id: "", property_id: "",
    start_date: "", end_date: "", monthly_rent: "", total_value: "", notes: "",
  });

  // payment form
  const [pForm, setPForm] = useState({
    contract_id: "", client_id: "", amount: "", due_date: "", notes: "",
  });

  // maintenance form
  const [mForm, setMForm] = useState({
    title: "", description: "", priority: "medium",
    contract_id: "", client_id: "", property_id: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p, m, cl, pr] = await Promise.all([
      sb.from("contracts").select("*").order("created_at", { ascending: false }),
      sb.from("tenant_payments").select("*").order("due_date", { ascending: true }),
      sb.from("maintenance_requests").select("*").order("created_at", { ascending: false }),
      sb.from("clients").select("id,full_name,phone").order("full_name"),
      sb.from("properties").select("id,title,location").order("title"),
    ]);
    setContracts((c.data || []) as Contract[]);
    setPayments((p.data || []) as TenantPayment[]);
    setMaintenance((m.data || []) as MaintenanceRequest[]);
    setClients((cl.data || []) as unknown as Client[]);
    setProperties((pr.data || []) as unknown as Property[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── stats ──
  const activeContracts  = contracts.filter(c => c.status === "active").length;
  const pendingPayments  = payments.filter(p => p.status === "pending" || p.status === "late").length;
  const openMaintenance  = maintenance.filter(m => m.status === "open" || m.status === "in_progress").length;
  const overduePayments  = payments.filter(p => p.status === "late").length;

  // ── save contract ──
  async function saveContract() {
    if (!cForm.title) return;
    setSaving(true);
    await sb.from("contracts").insert({
      ...cForm,
      monthly_rent: cForm.monthly_rent ? parseFloat(cForm.monthly_rent) : null,
      total_value:  cForm.total_value  ? parseFloat(cForm.total_value)  : null,
      client_id:    cForm.client_id    || null,
      property_id:  cForm.property_id  || null,
    });
    setSaving(false);
    setContractModal(false);
    setCForm({ title: "", type: "rent", client_id: "", property_id: "", start_date: "", end_date: "", monthly_rent: "", total_value: "", notes: "" });
    load();
  }

  // ── save payment ──
  async function savePayment() {
    if (!pForm.amount || !pForm.due_date) return;
    setSaving(true);
    await sb.from("tenant_payments").insert({
      ...pForm,
      amount:      parseFloat(pForm.amount),
      contract_id: pForm.contract_id || null,
      client_id:   pForm.client_id   || null,
    });
    setSaving(false);
    setPaymentModal(false);
    setPForm({ contract_id: "", client_id: "", amount: "", due_date: "", notes: "" });
    load();
  }

  // ── mark payment paid ──
  async function markPaid(id: string) {
    await sb.from("tenant_payments").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "paid", paid_date: new Date().toISOString().split("T")[0] } : p));
  }

  // ── save maintenance ──
  async function saveMaint() {
    if (!mForm.title) return;
    setSaving(true);
    await sb.from("maintenance_requests").insert({
      ...mForm,
      contract_id: mForm.contract_id || null,
      client_id:   mForm.client_id   || null,
      property_id: mForm.property_id || null,
    });
    setSaving(false);
    setMaintModal(false);
    setMForm({ title: "", description: "", priority: "medium", contract_id: "", client_id: "", property_id: "" });
    load();
  }

  // ── update maintenance status ──
  async function updateMaintStatus(id: string, status: string) {
    const upd: Record<string, unknown> = { status };
    if (status === "resolved") upd.resolved_at = new Date().toISOString();
    await sb.from("maintenance_requests").update(upd).eq("id", id);
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, status: status as MaintenanceRequest["status"] } : m));
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: "100%", background: "#0F0F14", border: "1px solid #2A2A35",
    borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 14,
    outline: "none", boxSizing: "border-box", ...extra,
  });

  const label = (text: string) => (
    <label style={{ fontSize: 13, color: "#94A3B8", display: "block", marginBottom: 4 }}>{text}</label>
  );

  // ── render ──
  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit", direction: "rtl" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#E2E8F0", margin: 0 }}>بوابة المستأجر</h1>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 4 }}>إدارة العقود والدفعات وطلبات الصيانة</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {tab === "contracts"   && <button onClick={() => setContractModal(true)} style={btnStyle()}><Plus size={15} /> عقد جديد</button>}
          {tab === "payments"    && <button onClick={() => setPaymentModal(true)}  style={btnStyle()}><Plus size={15} /> دفعة جديدة</button>}
          {tab === "maintenance" && <button onClick={() => setMaintModal(true)}    style={btnStyle()}><Plus size={15} /> طلب صيانة</button>}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { icon: <FileText size={18} />, label: "عقود نشطة",     value: activeContracts, color: "#4ADE80" },
          { icon: <CreditCard size={18} />, label: "دفعات معلقة", value: pendingPayments, color: "#FACC15" },
          { icon: <AlertTriangle size={18} />, label: "متأخرة",    value: overduePayments, color: "#F87171" },
          { icon: <Wrench size={18} />, label: "صيانة مفتوحة",    value: openMaintenance, color: "#60A5FA" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#16161A", border: "1px solid #2A2A35", borderRadius: 12,
            padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ color: s.color, background: s.color + "18", borderRadius: 10, padding: 10 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#E2E8F0" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0F0F14", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {([
          ["contracts",   "العقود",      <FileText  size={15} />],
          ["payments",    "الدفعات",     <CreditCard size={15} />],
          ["maintenance", "الصيانة",    <Wrench    size={15} />],
        ] as [Tab, string, React.ReactNode][]).map(([id, lbl, icon]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            border: "none", cursor: "pointer",
            background: tab === id ? "#C6914C" : "transparent",
            color: tab === id ? "#0A0A0C" : "#94A3B8",
          }}>
            {icon}{lbl}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#64748B", padding: 40, textAlign: "center" }}>جاري التحميل…</div>
      ) : (
        <>
          {/* ── Contracts Tab ── */}
          {tab === "contracts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {contracts.length === 0 && <Empty label="لا توجد عقود بعد" />}
              {contracts.map(c => {
                const client = clients.find(cl => cl.id === c.client_id);
                const prop   = properties.find(p => p.id === c.property_id);
                return (
                  <div key={c.id} style={{
                    background: "#16161A", border: "1px solid #2A2A35",
                    borderRadius: 12, padding: "16px 20px",
                    display: "grid", gridTemplateColumns: "1fr auto", gap: 12,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ color: "#E2E8F0", fontWeight: 700 }}>{c.title}</span>
                        <Badge cfg={CONTRACT_STATUS[c.status]} />
                        <span style={{ fontSize: 12, color: "#64748B" }}>
                          {c.type === "rent" ? "إيجار" : c.type === "sale" ? "بيع" : "إدارة"}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 24px", color: "#94A3B8", fontSize: 13 }}>
                        {client && <span>العميل: <b style={{ color: "#CBD5E1" }}>{client.full_name}</b></span>}
                        {prop   && <span>العقار: <b style={{ color: "#CBD5E1" }}>{prop.title}</b></span>}
                        {c.monthly_rent && <span>الإيجار الشهري: <b style={{ color: "#C6914C" }}>{fmt(c.monthly_rent)}</b></span>}
                        {c.start_date && <span>من: {fmtDate(c.start_date)}</span>}
                        {c.end_date   && <span>إلى: {fmtDate(c.end_date)}</span>}
                      </div>
                      {c.notes && <p style={{ color: "#64748B", fontSize: 13, marginTop: 6 }}>{c.notes}</p>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "#475569" }}>{fmtDate(c.created_at)}</span>
                      {c.total_value && <span style={{ color: "#C6914C", fontWeight: 700 }}>{fmt(c.total_value)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Payments Tab ── */}
          {tab === "payments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {payments.length === 0 && <Empty label="لا توجد دفعات بعد" />}
              {payments.map(p => {
                const client   = clients.find(cl => cl.id === p.client_id);
                const contract = contracts.find(c => c.id === p.contract_id);
                const isLate   = p.status === "late" || (p.status === "pending" && new Date(p.due_date) < new Date());
                return (
                  <div key={p.id} style={{
                    background: "#16161A",
                    border: `1px solid ${isLate ? "#F8717144" : "#2A2A35"}`,
                    borderRadius: 12, padding: "14px 20px",
                    display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ color: "#C6914C", fontWeight: 700, fontSize: 16 }}>{fmt(p.amount)}</span>
                        <Badge cfg={PAYMENT_STATUS[isLate && p.status === "pending" ? "late" : p.status]} />
                      </div>
                      <div style={{ display: "flex", gap: 20, color: "#94A3B8", fontSize: 13 }}>
                        {client   && <span>العميل: <b style={{ color: "#CBD5E1" }}>{client.full_name}</b></span>}
                        {contract && <span>العقد: <b style={{ color: "#CBD5E1" }}>{contract.title}</b></span>}
                        <span><Clock size={12} style={{ display: "inline", marginLeft: 4 }} />استحقاق: {fmtDate(p.due_date)}</span>
                        {p.paid_date && <span><CheckCircle size={12} style={{ display: "inline", marginLeft: 4 }} />تاريخ الدفع: {fmtDate(p.paid_date)}</span>}
                      </div>
                    </div>
                    {p.status !== "paid" && p.status !== "cancelled" && (
                      <button onClick={() => markPaid(p.id)} style={{
                        background: "#4ADE8022", color: "#4ADE80",
                        border: "1px solid #4ADE8044", borderRadius: 8,
                        padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600,
                      }}>
                        تأكيد الدفع
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Maintenance Tab ── */}
          {tab === "maintenance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {maintenance.length === 0 && <Empty label="لا توجد طلبات صيانة" />}
              {maintenance.map(m => {
                const client = clients.find(cl => cl.id === m.client_id);
                const prop   = properties.find(p => p.id === m.property_id);
                return (
                  <div key={m.id} style={{
                    background: "#16161A", border: "1px solid #2A2A35",
                    borderRadius: 12, padding: "16px 20px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ color: "#E2E8F0", fontWeight: 700 }}>{m.title}</span>
                          <Badge cfg={MAINTENANCE_PRIORITY[m.priority]} />
                          <Badge cfg={MAINTENANCE_STATUS[m.status]} />
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", color: "#94A3B8", fontSize: 13 }}>
                          {client && <span>العميل: <b style={{ color: "#CBD5E1" }}>{client.full_name}</b></span>}
                          {prop   && <span>العقار: <b style={{ color: "#CBD5E1" }}>{prop.title}</b></span>}
                          {m.cost && <span>التكلفة: <b style={{ color: "#C6914C" }}>{fmt(m.cost)}</b></span>}
                          <span>{fmtDate(m.created_at)}</span>
                        </div>
                        {m.description && <p style={{ color: "#64748B", fontSize: 13, marginTop: 6 }}>{m.description}</p>}
                      </div>
                      {/* Status changer */}
                      {m.status !== "resolved" && m.status !== "cancelled" && (
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {m.status === "open" && (
                            <button onClick={() => updateMaintStatus(m.id, "in_progress")} style={actionBtn("#60A5FA")}>بدء التنفيذ</button>
                          )}
                          {m.status === "in_progress" && (
                            <button onClick={() => updateMaintStatus(m.id, "resolved")} style={actionBtn("#4ADE80")}>تم الحل</button>
                          )}
                          <button onClick={() => updateMaintStatus(m.id, "cancelled")} style={actionBtn("#F87171")}>إلغاء</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Contract Modal ── */}
      {contractModal && (
        <ModalOverlay onClose={() => setContractModal(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#E2E8F0", margin: 0, fontSize: 18 }}>عقد جديد</h2>
            <button onClick={() => setContractModal(false)} style={closeBtn()}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>{label("عنوان العقد *")}<input value={cForm.title} onChange={e => setCForm(f => ({ ...f, title: e.target.value }))} style={inp()} placeholder="مثال: عقد إيجار شقة الملقا" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("نوع العقد")}
                <select value={cForm.type} onChange={e => setCForm(f => ({ ...f, type: e.target.value }))} style={inp()}>
                  <option value="rent">إيجار</option><option value="sale">بيع</option><option value="management">إدارة</option>
                </select>
              </div>
              <div>{label("العميل")}
                <select value={cForm.client_id} onChange={e => setCForm(f => ({ ...f, client_id: e.target.value }))} style={inp()}>
                  <option value="">— اختر —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>{label("العقار")}
              <select value={cForm.property_id} onChange={e => setCForm(f => ({ ...f, property_id: e.target.value }))} style={inp()}>
                <option value="">— اختر —</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("تاريخ البداية")}<input type="date" value={cForm.start_date} onChange={e => setCForm(f => ({ ...f, start_date: e.target.value }))} style={inp()} /></div>
              <div>{label("تاريخ النهاية")}<input type="date" value={cForm.end_date}   onChange={e => setCForm(f => ({ ...f, end_date: e.target.value }))}   style={inp()} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("الإيجار الشهري (ر.س)")}<input type="number" value={cForm.monthly_rent} onChange={e => setCForm(f => ({ ...f, monthly_rent: e.target.value }))} style={inp()} /></div>
              <div>{label("القيمة الإجمالية (ر.س)")}<input type="number" value={cForm.total_value}  onChange={e => setCForm(f => ({ ...f, total_value:  e.target.value }))} style={inp()} /></div>
            </div>
            <div>{label("ملاحظات")}<textarea value={cForm.notes} onChange={e => setCForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={inp({ resize: "none" })} /></div>
            <button onClick={saveContract} disabled={saving || !cForm.title} style={btnStyle("100%", saving || !cForm.title)}>
              {saving ? "جاري الحفظ…" : "حفظ العقد"}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <ModalOverlay onClose={() => setPaymentModal(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#E2E8F0", margin: 0, fontSize: 18 }}>دفعة جديدة</h2>
            <button onClick={() => setPaymentModal(false)} style={closeBtn()}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("العميل")}
                <select value={pForm.client_id} onChange={e => setPForm(f => ({ ...f, client_id: e.target.value }))} style={inp()}>
                  <option value="">— اختر —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>{label("العقد")}
                <select value={pForm.contract_id} onChange={e => setPForm(f => ({ ...f, contract_id: e.target.value }))} style={inp()}>
                  <option value="">— اختر —</option>
                  {contracts.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("المبلغ (ر.س) *")}<input type="number" value={pForm.amount}   onChange={e => setPForm(f => ({ ...f, amount: e.target.value }))}   style={inp()} /></div>
              <div>{label("تاريخ الاستحقاق *")}<input type="date" value={pForm.due_date} onChange={e => setPForm(f => ({ ...f, due_date: e.target.value }))} style={inp()} /></div>
            </div>
            <div>{label("ملاحظات")}<input value={pForm.notes} onChange={e => setPForm(f => ({ ...f, notes: e.target.value }))} style={inp()} /></div>
            <button onClick={savePayment} disabled={saving || !pForm.amount || !pForm.due_date} style={btnStyle("100%", saving || !pForm.amount || !pForm.due_date)}>
              {saving ? "جاري الحفظ…" : "إضافة الدفعة"}
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Maintenance Modal ── */}
      {maintModal && (
        <ModalOverlay onClose={() => setMaintModal(false)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ color: "#E2E8F0", margin: 0, fontSize: 18 }}>طلب صيانة جديد</h2>
            <button onClick={() => setMaintModal(false)} style={closeBtn()}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>{label("عنوان الطلب *")}<input value={mForm.title} onChange={e => setMForm(f => ({ ...f, title: e.target.value }))} style={inp()} placeholder="مثال: تسرب مياه في الحمام" /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>{label("الأولوية")}
                <select value={mForm.priority} onChange={e => setMForm(f => ({ ...f, priority: e.target.value }))} style={inp()}>
                  <option value="low">منخفض</option><option value="medium">متوسط</option>
                  <option value="high">عالي</option><option value="urgent">عاجل</option>
                </select>
              </div>
              <div>{label("العميل")}
                <select value={mForm.client_id} onChange={e => setMForm(f => ({ ...f, client_id: e.target.value }))} style={inp()}>
                  <option value="">— اختر —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>{label("العقار")}
              <select value={mForm.property_id} onChange={e => setMForm(f => ({ ...f, property_id: e.target.value }))} style={inp()}>
                <option value="">— اختر —</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>{label("وصف المشكلة")}<textarea value={mForm.description} onChange={e => setMForm(f => ({ ...f, description: e.target.value }))} rows={3} style={inp({ resize: "none" })} /></div>
            <button onClick={saveMaint} disabled={saving || !mForm.title} style={btnStyle("100%", saving || !mForm.title)}>
              {saving ? "جاري الحفظ…" : "إرسال الطلب"}
            </button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{
      background: "#16161A", border: "1px dashed #2A2A35",
      borderRadius: 12, padding: 40, textAlign: "center", color: "#475569",
    }}>
      {label}
    </div>
  );
}

function btnStyle(width?: string, disabled?: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
    background: disabled ? "#2A2A35" : "#C6914C",
    color: disabled ? "#475569" : "#0A0A0C",
    border: "none", borderRadius: 10, padding: "9px 20px",
    fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    width: width || "auto",
  };
}

function actionBtn(color: string): React.CSSProperties {
  return {
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
  };
}

function closeBtn(): React.CSSProperties {
  return {
    background: "transparent", border: "none", color: "#64748B",
    cursor: "pointer", padding: 4, display: "flex",
  };
}
