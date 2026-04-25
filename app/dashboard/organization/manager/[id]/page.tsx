"use client";
import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { DEPARTMENT_META, PROVIDER_LABELS, KB_CATEGORIES, TRIGGER_LABELS } from "@/lib/org-constants";
import {
  ArrowRight, Sparkles, BookOpen, Users, Activity, Plus, Edit3, Trash2,
  Save, X, ChevronLeft, Loader2, AlertCircle, Bot, Cpu, Clock, Wand2,
} from "lucide-react";

type Manager = {
  id: string; code: string; name: string; department: string; description: string;
  default_ai_provider: string; default_ai_model: string;
};

type Employee = {
  id: string; code: string; name: string; description: string;
  default_ai_provider: string; default_ai_model: string;
  trigger_type?: string;
};

type Directive = {
  id: string; title: string; content: string; status: string; source: string;
  display_order: number; created_at: string;
};

type KBItem = {
  id: string; title: string; content: string; category: string; tags?: string[]; created_at: string;
};

type Activity = {
  id: string; action: string; details: Record<string, unknown>; created_at: string;
};

type Tab = "directives" | "knowledge" | "team" | "activity";

export default function ManagerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [manager, setManager] = useState<Manager | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [kb, setKB] = useState<KBItem[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>("directives");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Modals
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [editingDirective, setEditingDirective] = useState<Directive | null>(null);
  const [showKBModal, setShowKBModal] = useState(false);
  const [editingKB, setEditingKB] = useState<KBItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: t } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
      let tid = t?.id;
      if (!tid) {
        const { data: m } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
        tid = m?.tenant_id;
      }
      if (!tid) throw new Error("لم يُعثر على المستأجر");
      setTenantId(tid);

      const [mgrRes, empRes, dirRes, kbRes, actRes] = await Promise.all([
        supabase.from("ai_managers").select("*").eq("id", id).single(),
        supabase.from("ai_employees").select("*").eq("manager_id", id).order("display_order"),
        supabase.from("directives").select("*").eq("target_kind", "manager").eq("target_id", id).order("display_order"),
        supabase.from("knowledge_base").select("*").eq("target_kind", "manager").eq("target_id", id).order("created_at", { ascending: false }),
        supabase.from("org_activity_log").select("*").eq("actor_kind", "manager").eq("actor_id", id).order("created_at", { ascending: false }).limit(50),
      ]);
      if (mgrRes.error) throw new Error(mgrRes.error.message);
      setManager(mgrRes.data as Manager);
      setEmployees((empRes.data || []) as Employee[]);
      setDirectives((dirRes.data || []) as Directive[]);
      setKB((kbRes.data || []) as KBItem[]);
      setActivity((actRes.data || []) as Activity[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading && !manager) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !manager) {
    return (
      <div style={{ padding: 16, background: "rgba(239,68,68,0.07)", borderRadius: 10, color: "#F87171" }}>
        <AlertCircle size={14} style={{ display: "inline", marginInlineEnd: 8 }} />
        {error || "المدير غير موجود"}
      </div>
    );
  }

  const dept = DEPARTMENT_META[manager.department];
  const Icon = dept?.icon || Bot;

  return (
    <div>
      <Link href="/dashboard/organization"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
        <ArrowRight size={12} /> الهيكل التنظيمي
      </Link>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${dept?.color}15, transparent)`,
        border: `1px solid ${dept?.color}33`,
        borderRadius: 14, padding: 18, marginBottom: 18,
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: dept?.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={22} style={{ color: dept?.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F4F4F5" }}>{manager.name}</h1>
          <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{manager.description}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <div style={{ fontSize: 11, color: "#71717A", display: "flex", alignItems: "center", gap: 4 }}>
            <Cpu size={11} /> {PROVIDER_LABELS[manager.default_ai_provider] || manager.default_ai_provider}
          </div>
          <div style={{ fontSize: 10, color: "#52525B", direction: "ltr" }}>{manager.default_ai_model}</div>
        </div>
      </div>

      {/* Generate Suggestions for Team — banner */}
      {directives.length > 0 && employees.length > 0 && (
        <SuggestionsBanner managerId={id} managerName={manager.name} employeeCount={employees.length} />
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        <TabButton active={tab === "directives"} onClick={() => setTab("directives")} icon={Sparkles} label="التوجيهات" badge={directives.length} />
        <TabButton active={tab === "knowledge"}  onClick={() => setTab("knowledge")}  icon={BookOpen}  label="قاعدة المعرفة" badge={kb.length} />
        <TabButton active={tab === "team"}       onClick={() => setTab("team")}       icon={Users}     label="الفريق" badge={employees.length} />
        <TabButton active={tab === "activity"}   onClick={() => setTab("activity")}   icon={Activity}  label="النشاط" />
      </div>

      {/* Directives Tab */}
      {tab === "directives" && tenantId && (
        <DirectivesTab
          directives={directives}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onAdd={() => { setEditingDirective(null); setShowDirectiveModal(true); }}
          onEdit={(d) => { setEditingDirective(d); setShowDirectiveModal(true); }}
          onChange={load}
        />
      )}

      {/* Knowledge Tab */}
      {tab === "knowledge" && tenantId && (
        <KnowledgeTab
          kb={kb}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onAdd={() => { setEditingKB(null); setShowKBModal(true); }}
          onEdit={(k) => { setEditingKB(k); setShowKBModal(true); }}
          onChange={load}
        />
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {employees.map(emp => (
            <Link key={emp.id} href={`/dashboard/organization/employee/${emp.id}`}
              style={{
                background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 11, padding: 14, textDecoration: "none",
              }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={14} style={{ color: "#A78BFA" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E4E4E7" }}>{emp.name}</div>
                  <div style={{ fontSize: 10, color: "#52525B", direction: "ltr" }}>{emp.code}</div>
                </div>
                <ChevronLeft size={12} style={{ color: "#52525B" }} />
              </div>
              <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6, marginBottom: 10 }}>{emp.description.slice(0, 100)}...</p>
              <div style={{ display: "flex", gap: 6, fontSize: 10, color: "#71717A" }}>
                <span style={{ background: "#18181B", padding: "2px 8px", borderRadius: 4 }}>
                  {PROVIDER_LABELS[emp.default_ai_provider]}
                </span>
                {emp.trigger_type && (
                  <span style={{ background: "#18181B", padding: "2px 8px", borderRadius: 4 }}>
                    <Clock size={9} style={{ display: "inline", marginInlineEnd: 3 }} />
                    {TRIGGER_LABELS[emp.trigger_type] || emp.trigger_type}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activity.length === 0 ? (
            <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 32, textAlign: "center", color: "#52525B", fontSize: 13 }}>
              لا يوجد نشاط بعد — يبدأ الموظفون بتسجيل الإجراءات لما يشغّلون مهامهم
            </div>
          ) : (
            activity.map(a => (
              <div key={a.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <Activity size={12} style={{ color: "#A78BFA", flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13, color: "#D4D4D8" }}>{a.action}</div>
                <div style={{ fontSize: 11, color: "#52525B" }}>{new Date(a.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Directive Modal */}
      {showDirectiveModal && tenantId && (
        <DirectiveModal
          directive={editingDirective}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onClose={() => setShowDirectiveModal(false)}
          onSave={() => { setShowDirectiveModal(false); load(); }}
        />
      )}

      {/* KB Modal */}
      {showKBModal && tenantId && (
        <KBModal
          kbItem={editingKB}
          tenantId={tenantId}
          targetKind="manager"
          targetId={id}
          onClose={() => setShowKBModal(false)}
          onSave={() => { setShowKBModal(false); load(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggestions Banner — يوفّر زر توليد اقتراحات لكل الفريق
// ─────────────────────────────────────────────────────────────
function SuggestionsBanner({ managerId, managerName, employeeCount }: { managerId: string; managerName: string; employeeCount: number }) {
  const [busy, setBusy] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

  async function generate() {
    if (!confirm(`توليد اقتراحات توجيهات لـ ${employeeCount} موظفين تحت ${managerName}؟ يستغرق ${employeeCount * 5}-${employeeCount * 10} ثانية.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/org/suggest-directives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_id: managerId, replace_existing: replaceExisting }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل التوليد");
      toast.success(`تم توليد ${json.total_suggestions} اقتراح لـ ${json.employees_processed} موظفين. اضغط على أي موظف لمراجعة الاقتراحات.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(232,184,109,0.08), rgba(198,145,76,0.04))",
      border: "1px solid rgba(232,184,109,0.25)",
      borderRadius: 12, padding: 14, marginBottom: 18,
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <Wand2 size={20} style={{ color: "#E8B86D", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#E8B86D" }}>
          توليد اقتراحات للفريق ({employeeCount} موظفين)
        </div>
        <div style={{ fontSize: 11, color: "#A1A1AA", marginTop: 3 }}>
          AI يحوّل توجيهات هذا المدير إلى ٣-٥ توجيهات تشغيلية لكل موظف، تظهر في صفحاتهم بحالة "بانتظار مراجعتك".
        </div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#A1A1AA", cursor: "pointer" }}>
        <input type="checkbox" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)}
          style={{ accentColor: "#E8B86D" }} />
        استبدال الاقتراحات السابقة
      </label>
      <button onClick={generate} disabled={busy}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8,
          background: "linear-gradient(135deg, #E8B86D, #C6914C)",
          color: "#0A0A0C", border: "none", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
          fontFamily: "'Tajawal', sans-serif", opacity: busy ? 0.6 : 1,
        }}>
        {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Wand2 size={13} />}
        {busy ? "جاري التوليد..." : "ولّد الاقتراحات"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab Button
// ─────────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon: Icon, label, badge }: {
  active: boolean; onClick: () => void; icon: typeof Sparkles; label: string; badge?: number;
}) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        background: active ? "rgba(167,139,250,0.08)" : "transparent",
        border: "none", borderBottom: `2px solid ${active ? "#A78BFA" : "transparent"}`,
        color: active ? "#A78BFA" : "#A1A1AA", fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
        marginBottom: -1,
      }}>
      <Icon size={13} /> {label}
      {typeof badge === "number" && (
        <span style={{ fontSize: 10, background: active ? "#A78BFA" : "#27272A", color: active ? "#0A0A0C" : "#A1A1AA", padding: "1px 6px", borderRadius: 8 }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Directives Tab Content
// ─────────────────────────────────────────────────────────────
function DirectivesTab({ directives, onAdd, onEdit, onChange }: {
  directives: Directive[]; tenantId: string; targetKind: string; targetId: string;
  onAdd: () => void; onEdit: (d: Directive) => void; onChange: () => void;
}) {
  async function remove(id: string) {
    if (!confirm("حذف هذا التوجيه؟")) return;
    const { error } = await supabase.from("directives").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("حُذف"); onChange(); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: "#71717A" }}>توجيهات هذا المدير الاستراتيجية. تُورَث تلقائياً للموظفين كاقتراحات.</p>
        <button onClick={onAdd}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #7C3AED)", color: "#0A0A0C", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <Plus size={13} /> توجيه جديد
        </button>
      </div>
      {directives.length === 0 ? (
        <EmptyState icon={Sparkles} title="لا توجيهات بعد" hint="أضف توجيه استراتيجي يُوجِّه عمل المدير وفريقه" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {directives.map(d => (
            <div key={d.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>{d.title}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(d)} style={iconBtn("#A78BFA")}><Edit3 size={12} /></button>
                  <button onClick={() => remove(d.id)} style={iconBtn("#F87171")}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{d.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Knowledge Tab
// ─────────────────────────────────────────────────────────────
function KnowledgeTab({ kb, onAdd, onEdit, onChange }: {
  kb: KBItem[]; tenantId: string; targetKind: string; targetId: string;
  onAdd: () => void; onEdit: (k: KBItem) => void; onChange: () => void;
}) {
  async function remove(id: string) {
    if (!confirm("حذف هذا العنصر من قاعدة المعرفة؟")) return;
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("حُذف"); onChange(); }
  }
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 12, color: "#71717A" }}>معلومات يستخدمها المدير وموظفوه عند الحاجة (FAQs, سياسات، بيانات سوق...).</p>
        <button onClick={onAdd}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "linear-gradient(135deg, #60A5FA, #2563EB)", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <Plus size={13} /> عنصر معرفة
        </button>
      </div>
      {kb.length === 0 ? (
        <EmptyState icon={BookOpen} title="قاعدة المعرفة فارغة" hint="أضف معلومات تساعد AI في فهم سياقك العقاري الخاص" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
          {kb.map(k => (
            <div key={k.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: "#60A5FA", background: "rgba(96,165,250,0.1)", padding: "2px 7px", borderRadius: 4 }}>
                  {KB_CATEGORIES[k.category] || k.category}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onEdit(k)} style={iconBtn("#A78BFA")}><Edit3 size={11} /></button>
                  <button onClick={() => remove(k.id)} style={iconBtn("#F87171")}><Trash2 size={11} /></button>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E4E4E7", marginBottom: 6 }}>{k.title}</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6, maxHeight: 80, overflow: "hidden" }}>{k.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals + helpers
// ─────────────────────────────────────────────────────────────
function DirectiveModal({ directive, tenantId, targetKind, targetId, onClose, onSave }: {
  directive: Directive | null; tenantId: string; targetKind: string; targetId: string;
  onClose: () => void; onSave: () => void;
}) {
  const [title, setTitle] = useState(directive?.title || "");
  const [content, setContent] = useState(directive?.content || "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (directive) {
        const { error } = await supabase.from("directives").update({ title, content }).eq("id", directive.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("directives").insert({
          tenant_id: tenantId, target_kind: targetKind, target_id: targetId,
          title, content, source: "custom", status: "active",
          created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ");
      onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  }

  return (
    <Modal title={directive ? "تعديل توجيه" : "توجيه جديد"} onClose={onClose}>
      <Field label="العنوان">
        <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="مثلاً: نبرة الردود" />
      </Field>
      <Field label="المحتوى" hint="اكتب التوجيه بصياغة واضحة قابلة للتنفيذ">
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} style={inputStyle} placeholder="مثلاً: استخدم العربية الفصحى دائماً، تجنّب الـ emojis، اختصر الردود لأقل من 80 كلمة..." />
      </Field>
      <ModalActions onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function KBModal({ kbItem, tenantId, targetKind, targetId, onClose, onSave }: {
  kbItem: KBItem | null; tenantId: string; targetKind: string; targetId: string;
  onClose: () => void; onSave: () => void;
}) {
  const [title, setTitle] = useState(kbItem?.title || "");
  const [content, setContent] = useState(kbItem?.content || "");
  const [category, setCategory] = useState(kbItem?.category || "general");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim() || !content.trim()) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (kbItem) {
        const { error } = await supabase.from("knowledge_base").update({ title, content, category }).eq("id", kbItem.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("knowledge_base").insert({
          tenant_id: tenantId, target_kind: targetKind, target_id: targetId,
          title, content, category, is_active: true,
          created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ");
      onSave();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "خطأ");
    }
    setBusy(false);
  }

  return (
    <Modal title={kbItem ? "تعديل عنصر معرفة" : "عنصر معرفة جديد"} onClose={onClose}>
      <Field label="العنوان">
        <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="الفئة">
        <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>
          {Object.entries(KB_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </Field>
      <Field label="المحتوى">
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} style={inputStyle} />
      </Field>
      <ModalActions onClose={onClose} onSave={save} busy={busy} />
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
      <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 22, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#E4E4E7" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717A", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, busy }: { onClose: () => void; onSave: () => void; busy: boolean }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
      <button onClick={onClose}
        style={{ padding: "10px 18px", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
        إلغاء
      </button>
      <button onClick={onSave} disabled={busy}
        style={{ padding: "10px 22px", borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #7C3AED)", color: "#0A0A0C", border: "none", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "'Tajawal', sans-serif", display: "flex", alignItems: "center", gap: 6, opacity: busy ? 0.6 : 1 }}>
        {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}
        حفظ
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "#A1A1AA", marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#52525B", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Sparkles; title: string; hint: string }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 40, textAlign: "center" }}>
      <Icon size={32} style={{ color: "#3F3F46", marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: "#A1A1AA", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#71717A" }}>{hint}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "#18181B",
  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
  color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none",
};

function iconBtn(color: string): React.CSSProperties {
  return {
    background: `${color}10`, border: `1px solid ${color}30`, color,
    padding: 6, borderRadius: 6, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}
