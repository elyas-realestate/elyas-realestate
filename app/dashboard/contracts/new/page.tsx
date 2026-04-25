"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, FileText, Building, Home, Briefcase, Tag,
  Loader2, AlertCircle, Save,
} from "lucide-react";

type Template = {
  id: string;
  code: string;
  title: string;
  category: string;
  body_html: string;
  variables: Array<{ name: string; label: string; type: string; required: boolean }>;
  is_system: boolean;
};

const CATEGORY_ICON: Record<string, typeof Home> = {
  rent: Home, sale: Tag, listing: Building,
};

export default function NewContractPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const { data, error: e } = await supabase
        .from("e_contract_templates")
        .select("id, code, title, category, body_html, variables, is_system")
        .eq("is_active", true)
        .order("category");
      if (e) throw new Error(e.message);
      setTemplates((data || []) as Template[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  function pickTemplate(t: Template) {
    setSelected(t);
    // initialize values with empty strings + today for date fields
    const initial: Record<string, string> = {};
    const today = new Date().toISOString().slice(0, 10);
    t.variables.forEach(v => {
      initial[v.name] = v.type === "date" && v.name === "contract_date" ? today : "";
    });
    setValues(initial);
  }

  function fillTemplate(html: string, vars: Record<string, string>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  }

  async function handleCreate() {
    if (!selected) return;
    // التحقق من المتغيرات المطلوبة
    const missing = selected.variables
      .filter(v => v.required && !values[v.name]?.trim())
      .map(v => v.label);
    if (missing.length > 0) {
      toast.error(`حقول ناقصة: ${missing.slice(0, 3).join("، ")}${missing.length > 3 ? "..." : ""}`);
      return;
    }

    setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("غير مصرح");

      // tenant_id
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();

      let tenantId = tenant?.id;
      if (!tenantId) {
        // try membership
        const { data: m } = await supabase
          .from("tenant_members")
          .select("tenant_id")
          .eq("user_id", userData.user.id)
          .eq("status", "active")
          .maybeSingle();
        tenantId = m?.tenant_id;
      }
      if (!tenantId) throw new Error("لم يُعثر على المستأجر");

      // contract_number
      const { data: nextNum } = await supabase.rpc("next_e_contract_number", { tid: tenantId });

      const filled = fillTemplate(selected.body_html, values);
      const amountKeys = ["rent_amount", "sale_amount", "listing_price"];
      const amountKey = amountKeys.find(k => values[k]);
      const amount = amountKey ? Number(values[amountKey]) || null : null;

      const { data: created, error: insErr } = await supabase
        .from("e_contracts")
        .insert({
          tenant_id: tenantId,
          template_id: selected.id,
          contract_number: nextNum,
          title: selected.title,
          category: selected.category,
          party_first: {
            name: values.first_party_name || "",
            id_number: values.first_party_id || "",
            phone: values.first_party_phone || "",
          },
          party_second: {
            name: values.second_party_name || "",
            id_number: values.second_party_id || "",
            phone: values.second_party_phone || "",
          },
          body_html: filled,
          variables_used: values,
          amount,
          start_date: values.start_date || null,
          end_date: values.end_date || null,
          status: "draft",
          created_by: userData.user.id,
        })
        .select("id")
        .single();

      if (insErr) throw new Error(insErr.message);

      // log audit
      await supabase.from("e_contract_audit").insert({
        contract_id: created.id,
        action: "created",
        actor_user_id: userData.user.id,
        actor_label: `broker:${userData.user.email}`,
        details: { template: selected.code },
      });

      toast.success("تم إنشاء العقد");
      router.push(`/dashboard/contracts/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإنشاء");
    }
    setCreating(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#C6914C", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <Link href="/dashboard/contracts"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 14 }}>
        <ArrowRight size={12} /> العقود
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 16 }}>
        {selected ? `إنشاء ${selected.title}` : "اختر قالب العقد"}
      </h1>

      {error && (
        <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertCircle size={14} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
          <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
        </div>
      )}

      {!selected ? (
        // ─────── خطوة 1: اختيار قالب ───────
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {templates.map(t => {
            const Icon = CATEGORY_ICON[t.category] || FileText;
            return (
              <button key={t.id} onClick={() => pickTemplate(t)}
                style={{
                  background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 13, padding: 18, textAlign: "right", cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif", transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(198,145,76,0.4)"; e.currentTarget.style.background = "#141418"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "#0F0F12"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(198,145,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={18} style={{ color: "#C6914C" }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E4E4E7", marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "#71717A" }}>
                  {t.variables.length} حقل قابل للتخصيص
                  {t.is_system && <span style={{ marginInlineStart: 8, fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(74,222,128,0.1)", color: "#4ADE80" }}>قالب نظام</span>}
                </div>
              </button>
            );
          })}
          {templates.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#52525B" }}>
              لا قوالب متاحة
            </div>
          )}
        </div>
      ) : (
        // ─────── خطوة 2: ملء الحقول ───────
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
          {/* العمود الأيمن: النموذج */}
          <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A1A1AA" }}>الحقول</h2>
              <button onClick={() => { setSelected(null); setValues({}); }}
                style={{ fontSize: 12, color: "#71717A", background: "none", border: "none", cursor: "pointer" }}>
                تغيير القالب
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selected.variables.map(v => (
                <label key={v.name} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 12, color: "#A1A1AA" }}>
                    {v.label} {v.required && <span style={{ color: "#F87171" }}>*</span>}
                  </span>
                  {v.type === "textarea" ? (
                    <textarea
                      value={values[v.name] || ""}
                      onChange={e => setValues(s => ({ ...s, [v.name]: e.target.value }))}
                      rows={3}
                      style={inputStyle}
                    />
                  ) : (
                    <input
                      type={v.type === "number" ? "number" : v.type === "date" ? "date" : "text"}
                      value={values[v.name] || ""}
                      onChange={e => setValues(s => ({ ...s, [v.name]: e.target.value }))}
                      style={inputStyle}
                    />
                  )}
                </label>
              ))}
            </div>

            <button onClick={handleCreate} disabled={creating}
              style={{
                marginTop: 18, width: "100%", padding: "12px",
                background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
                color: "#0A0A0C", border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
                fontFamily: "'Tajawal', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: creating ? 0.6 : 1,
              }}>
              {creating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
              إنشاء العقد كمسودة
            </button>
          </div>

          {/* العمود الأيسر: المعاينة */}
          <div style={{ background: "#FAFAFA", color: "#000", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, maxHeight: "85vh", overflowY: "auto", direction: "rtl" }}>
            <div className="contract-preview"
              dangerouslySetInnerHTML={{ __html: fillTemplate(selected.body_html, values) }}
              style={{ fontFamily: "'Tajawal', serif", fontSize: 14, lineHeight: 1.8 }} />
          </div>
        </div>
      )}

      <style>{`
        .contract-preview h1 { font-size: 20px; font-weight: 800; margin: 16px 0 12px; }
        .contract-preview h2 { font-size: 16px; font-weight: 700; margin: 14px 0 8px; color: #444; }
        .contract-preview h3 { font-size: 14px; font-weight: 700; margin: 10px 0 6px; color: #555; }
        .contract-preview p { margin: 8px 0; }
        .contract-preview ul { margin: 8px 0; padding-inline-start: 24px; }
        .contract-preview li { margin: 4px 0; }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", background: "#18181B", border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8, color: "#E4E4E7", fontSize: 13, fontFamily: "'Tajawal', sans-serif",
  outline: "none", width: "100%",
};
