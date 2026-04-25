"use client";
import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import { DEPARTMENT_META, PROVIDER_LABELS, KB_CATEGORIES, TRIGGER_LABELS, DIRECTIVE_SOURCE_META } from "@/lib/org-constants";
import {
  ArrowRight, Sparkles, BookOpen, Activity, Plus, Edit3, Trash2,
  Save, X, Loader2, AlertCircle, Bot, Cpu, Clock, Check, ChevronUp, ChevronDown,
} from "lucide-react";

type Employee = {
  id: string; code: string; name: string; description: string;
  department: string; manager_id: string;
  default_ai_provider: string; default_ai_model: string;
  trigger_type?: string;
};

type Manager = {
  id: string; code: string; name: string;
};

type Directive = {
  id: string; title: string; content: string; status: string; source: string;
  display_order: number; created_at: string; parent_directive_id?: string;
};

type KBItem = {
  id: string; title: string; content: string; category: string; created_at: string;
};

type Tab = "directives" | "knowledge" | "activity";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [manager, setManager] = useState<Manager | null>(null);
  const [managerDirectives, setManagerDirectives] = useState<Directive[]>([]);
  const [empDirectives, setEmpDirectives] = useState<Directive[]>([]);
  const [kb, setKB] = useState<KBItem[]>([]);
  const [tab, setTab] = useState<Tab>("directives");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenantId, setTenantId] = useState<string | null>(null);
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
        const { data: mb } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).eq("status", "active").maybeSingle();
        tid = mb?.tenant_id;
      }
      if (!tid) throw new Error("لم يُعثر على المستأجر");
      setTenantId(tid);

      const empRes = await supabase.from("ai_employees").select("*").eq("id", id).single();
      if (empRes.error) throw new Error(empRes.error.message);
      const emp = empRes.data as Employee;
      setEmployee(emp);

      const [mgrRes, mgrDirRes, empDirRes, kbRes] = await Promise.all([
        supabase.from("ai_managers").select("id, code, name").eq("id", emp.manager_id).single(),
        // directives الموروثة من المدير
        supabase.from("directives").select("*").eq("target_kind", "manager").eq("target_id", emp.manager_id).eq("status", "active").order("display_order"),
        // directives الموظف نفسه (custom + suggested)
        supabase.from("directives").select("*").eq("target_kind", "employee").eq("target_id", id).order("display_order"),
        supabase.from("knowledge_base").select("*").eq("target_kind", "employee").eq("target_id", id).order("created_at", { ascending: false }),
      ]);
      if (mgrRes.data) setManager(mgrRes.data as Manager);
      setManagerDirectives((mgrDirRes.data || []) as Directive[]);
      setEmpDirectives((empDirRes.data || []) as Directive[]);
      setKB((kbRes.data || []) as KBItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading && !employee) {
    return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><Loader2 size={28} style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>;
  }

  if (error || !employee) {
    return <div style={{ padding: 16, background: "rgba(239,68,68,0.07)", borderRadius: 10, color: "#F87171" }}><AlertCircle size={14} style={{ display: "inline", marginInlineEnd: 8 }} />{error || "الموظف غير موجود"}</div>;
  }

  const dept = DEPARTMENT_META[employee.department];
  const customDirectives = empDirectives.filter(d => d.source === "custom" && d.status === "active");
  const suggestedDirectives = empDirectives.filter(d => d.source === "suggested" && d.status === "pending");
  const acceptedSuggestions = empDirectives.filter(d => d.source === "suggested" && d.status === "active");

  return (
    <div>
      <Link href={manager ? `/dashboard/organization/manager/${manager.id}` : "/dashboard/organization"}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
        <ArrowRight size={12} /> {manager?.name || "الهيكل التنظيمي"}
      </Link>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${dept?.color}15, transparent)`, border: `1px solid ${dept?.color}33`, borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: dept?.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={20} style={{ color: dept?.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#F4F4F5" }}>{employee.name}</h1>
          <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{employee.description}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <div style={{ fontSize: 11, color: "#71717A", display: "flex", alignItems: "center", gap: 4 }}>
            <Cpu size={11} /> {PROVIDER_LABELS[employee.default_ai_provider] || employee.default_ai_provider}
          </div>
          {employee.trigger_type && (
            <div style={{ fontSize: 10, color: "#52525B", display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={9} /> {TRIGGER_LABELS[employee.trigger_type] || employee.trigger_type}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        <Tab2 active={tab === "directives"} onClick={() => setTab("directives")} icon={Sparkles} label="التوجيهات"
          badge={managerDirectives.length + acceptedSuggestions.length + customDirectives.length}
          highlight={suggestedDirectives.length > 0 ? suggestedDirectives.length : undefined} />
        <Tab2 active={tab === "knowledge"} onClick={() => setTab("knowledge")} icon={BookOpen} label="قاعدة المعرفة" badge={kb.length} />
        <Tab2 active={tab === "activity"} onClick={() => setTab("activity")} icon={Activity} label="النشاط" />
      </div>

      {/* Directives Tab — 3 sections */}
      {tab === "directives" && tenantId && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Pending Suggestions — أعلى أولوية */}
          {suggestedDirectives.length > 0 && (
            <Section title={`${suggestedDirectives.length} اقتراح بانتظار مراجعتك`} sub="AI ولّد هذه التوجيهات تلقائياً بناءً على توجيهات المدير" color="#E8B86D" highlight>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestedDirectives.map(d => (
                  <SuggestedDirectiveCard key={d.id} directive={d} onChange={load} />
                ))}
              </div>
            </Section>
          )}

          {/* Inherited (Manager) */}
          <Section
            title="موروث من المدير"
            sub={`توجيهات ${manager?.name || "المدير"} الاستراتيجية تنطبق على هذا الموظف تلقائياً`}
            color={DIRECTIVE_SOURCE_META.inherited.color}
          >
            {managerDirectives.length === 0 ? (
              <EmptyState2 text="المدير لم يضع توجيهات بعد" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {managerDirectives.map(d => (
                  <ReadOnlyDirectiveCard key={d.id} directive={d} sourceLabel="من المدير" />
                ))}
              </div>
            )}
          </Section>

          {/* Custom + Accepted Suggestions */}
          <Section
            title="توجيهات الموظف"
            sub="مخصّصة لهذا الموظف تحديداً"
            color={DIRECTIVE_SOURCE_META.custom.color}
            action={
              <button onClick={() => { setEditingDirective(null); setShowDirectiveModal(true); }}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7, background: "linear-gradient(135deg, #C6914C, #8A5F2E)", color: "#0A0A0C", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
                <Plus size={12} /> توجيه مخصّص
              </button>
            }>
            {customDirectives.length === 0 && acceptedSuggestions.length === 0 ? (
              <EmptyState2 text="لا توجيهات مخصّصة بعد" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...customDirectives, ...acceptedSuggestions].map(d => (
                  <EditableDirectiveCard key={d.id} directive={d}
                    onEdit={() => { setEditingDirective(d); setShowDirectiveModal(true); }}
                    onDelete={async () => {
                      if (!confirm("حذف هذا التوجيه؟")) return;
                      const { error: e } = await supabase.from("directives").delete().eq("id", d.id);
                      if (e) toast.error(e.message); else { toast.success("حُذف"); load(); }
                    }} />
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {tab === "knowledge" && tenantId && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: "#71717A" }}>قاعدة معرفة خاصة بهذا الموظف (تُضاف لما يقرأه من قاعدة المدير).</p>
            <button onClick={() => { setEditingKB(null); setShowKBModal(true); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, background: "linear-gradient(135deg, #60A5FA, #2563EB)", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
              <Plus size={12} /> عنصر معرفة
            </button>
          </div>
          {kb.length === 0 ? (
            <EmptyState2 text="لا عناصر معرفة بعد" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
              {kb.map(k => (
                <div key={k.id} style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: "#60A5FA", background: "rgba(96,165,250,0.1)", padding: "2px 7px", borderRadius: 4 }}>
                      {KB_CATEGORIES[k.category] || k.category}
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditingKB(k); setShowKBModal(true); }} style={iconBtn("#A78BFA")}><Edit3 size={11} /></button>
                      <button onClick={async () => {
                        if (!confirm("حذف؟")) return;
                        await supabase.from("knowledge_base").delete().eq("id", k.id);
                        toast.success("حُذف"); load();
                      }} style={iconBtn("#F87171")}><Trash2 size={11} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#E4E4E7", marginBottom: 6 }}>{k.title}</div>
                  <div style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6, maxHeight: 80, overflow: "hidden" }}>{k.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <EmptyState2 text="سجل نشاط الموظف يظهر هنا بعد تشغيل المهام (في K-5)" />
      )}

      {/* Modals */}
      {showDirectiveModal && tenantId && (
        <DirectiveModal
          directive={editingDirective}
          tenantId={tenantId}
          targetKind="employee"
          targetId={id}
          onClose={() => setShowDirectiveModal(false)}
          onSave={() => { setShowDirectiveModal(false); load(); }}
        />
      )}
      {showKBModal && tenantId && (
        <KBModal
          kbItem={editingKB}
          tenantId={tenantId}
          targetKind="employee"
          targetId={id}
          onClose={() => setShowKBModal(false)}
          onSave={() => { setShowKBModal(false); load(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggested Directive Card (with accept/reject)
// ─────────────────────────────────────────────────────────────
function SuggestedDirectiveCard({ directive, onChange }: { directive: Directive; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function accept() {
    setBusy(true);
    const { error } = await supabase.from("directives").update({ status: "active" }).eq("id", directive.id);
    if (error) toast.error(error.message); else { toast.success("اعتُمد"); onChange(); }
    setBusy(false);
  }
  async function reject() {
    setBusy(true);
    const { error } = await supabase.from("directives").update({ status: "rejected" }).eq("id", directive.id);
    if (error) toast.error(error.message); else { toast.success("رُفض"); onChange(); }
    setBusy(false);
  }

  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(232,184,109,0.3)", borderRadius: 11, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", marginBottom: 4 }}>{directive.title}</div>
          <div style={{ fontSize: 11, color: "#E8B86D", display: "flex", alignItems: "center", gap: 4 }}>
            <Sparkles size={10} /> اقتراح من AI
          </div>
        </div>
        <button onClick={() => setExpanded(s => !s)} style={iconBtn("#A1A1AA")}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: expanded ? "none" : 60, overflow: "hidden" }}>
        {directive.content}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button onClick={accept} disabled={busy}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 12px", borderRadius: 7, background: "rgba(74,222,128,0.1)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <Check size={12} /> اعتمد
        </button>
        <button onClick={reject} disabled={busy}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 12px", borderRadius: 7, background: "rgba(239,68,68,0.06)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
          <X size={12} /> ارفض
        </button>
      </div>
    </div>
  );
}

function ReadOnlyDirectiveCard({ directive, sourceLabel }: { directive: Directive; sourceLabel: string }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#E4E4E7" }}>{directive.title}</div>
        <span style={{ fontSize: 9, color: "#A78BFA", background: "rgba(167,139,250,0.1)", padding: "2px 6px", borderRadius: 4 }}>{sourceLabel}</span>
      </div>
      <div style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.6 }}>{directive.content}</div>
    </div>
  );
}

function EditableDirectiveCard({ directive, onEdit, onDelete }: { directive: Directive; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>{directive.title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {directive.source === "suggested" && (
            <span style={{ fontSize: 9, color: "#60A5FA", background: "rgba(96,165,250,0.1)", padding: "2px 6px", borderRadius: 4 }}>معتمَد من اقتراح</span>
          )}
          <button onClick={onEdit} style={iconBtn("#A78BFA")}><Edit3 size={12} /></button>
          <button onClick={onDelete} style={iconBtn("#F87171")}><Trash2 size={12} /></button>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#D4D4D8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{directive.content}</div>
    </div>
  );
}

function Tab2({ active, onClick, icon: Icon, label, badge, highlight }: {
  active: boolean; onClick: () => void; icon: typeof Sparkles; label: string; badge?: number; highlight?: number;
}) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
        background: active ? "rgba(167,139,250,0.08)" : "transparent",
        border: "none", borderBottom: `2px solid ${active ? "#A78BFA" : "transparent"}`,
        color: active ? "#A78BFA" : "#A1A1AA", fontSize: 13, fontWeight: active ? 700 : 500,
        cursor: "pointer", fontFamily: "'Tajawal', sans-serif", marginBottom: -1,
      }}>
      <Icon size={13} /> {label}
      {typeof badge === "number" && (
        <span style={{ fontSize: 10, background: active ? "#A78BFA" : "#27272A", color: active ? "#0A0A0C" : "#A1A1AA", padding: "1px 6px", borderRadius: 8 }}>
          {badge}
        </span>
      )}
      {typeof highlight === "number" && highlight > 0 && (
        <span style={{ fontSize: 10, background: "#E8B86D", color: "#0A0A0C", padding: "1px 6px", borderRadius: 8 }}>
          {highlight} جديد
        </span>
      )}
    </button>
  );
}

function Section({ title, sub, color, action, highlight, children }: {
  title: string; sub?: string; color: string; action?: React.ReactNode; highlight?: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ background: highlight ? `${color}06` : "transparent", border: highlight ? `1px solid ${color}33` : "none", borderRadius: 12, padding: highlight ? 14 : 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{title}</h3>
          {sub && <div style={{ fontSize: 11, color: "#71717A" }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState2({ text }: { text: string }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: 20, textAlign: "center", color: "#52525B", fontSize: 12 }}>
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modals (reused from manager page logic)
// ─────────────────────────────────────────────────────────────
function DirectiveModal({ directive, tenantId, targetKind, targetId, onClose, onSave }: {
  directive: Directive | null; tenantId: string; targetKind: string; targetId: string;
  onClose: () => void; onSave: () => void;
}) {
  const [title, setTitle] = useState(directive?.title || "");
  const [content, setContent] = useState(directive?.content || "");
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!title.trim() || !content.trim()) { toast.error("العنوان والمحتوى مطلوبان"); return; }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (directive) {
        const { error } = await supabase.from("directives").update({ title, content }).eq("id", directive.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("directives").insert({
          tenant_id: tenantId, target_kind: targetKind, target_id: targetId,
          title, content, source: "custom", status: "active", created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ"); onSave();
    } catch (e) { toast.error(e instanceof Error ? e.message : "خطأ"); }
    setBusy(false);
  }
  return (
    <Modal title={directive ? "تعديل توجيه" : "توجيه مخصّص جديد"} onClose={onClose}>
      <Field label="العنوان"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} /></Field>
      <Field label="المحتوى"><textarea value={content} onChange={e => setContent(e.target.value)} rows={8} style={inputStyle} /></Field>
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
          title, content, category, is_active: true, created_by: userData.user?.id,
        });
        if (error) throw new Error(error.message);
      }
      toast.success("حُفظ"); onSave();
    } catch (e) { toast.error(e instanceof Error ? e.message : "خطأ"); }
    setBusy(false);
  }
  return (
    <Modal title={kbItem ? "تعديل عنصر معرفة" : "عنصر معرفة"} onClose={onClose}>
      <Field label="العنوان"><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} /></Field>
      <Field label="الفئة"><select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle}>{Object.entries(KB_CATEGORIES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="المحتوى"><textarea value={content} onChange={e => setContent(e.target.value)} rows={10} style={inputStyle} /></Field>
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
      <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>إلغاء</button>
      <button onClick={onSave} disabled={busy} style={{ padding: "10px 22px", borderRadius: 8, background: "linear-gradient(135deg, #A78BFA, #7C3AED)", color: "#0A0A0C", border: "none", fontSize: 13, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", fontFamily: "'Tajawal', sans-serif", display: "flex", alignItems: "center", gap: 6, opacity: busy ? 0.6 : 1 }}>
        {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={13} />}حفظ
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<div style={{ marginBottom: 14 }}><label style={{ display: "block", fontSize: 12, color: "#A1A1AA", marginBottom: 5 }}>{label}</label>{children}</div>);
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "#18181B",
  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8,
  color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif", outline: "none",
};

function iconBtn(color: string): React.CSSProperties {
  return { background: `${color}10`, border: `1px solid ${color}30`, color, padding: 6, borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
}
