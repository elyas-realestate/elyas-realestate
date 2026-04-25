"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import {
  ArrowRight, BarChart3, Calendar, TrendingUp, Building, Users,
  Briefcase, FileText, Loader2, AlertCircle, Printer, Sparkles,
} from "lucide-react";

type Insight = {
  id: string;
  period_start: string;
  period_end: string;
  raw_metrics: {
    new_properties?: number;
    new_clients?: number;
    new_deals?: number;
    new_invoices?: number;
    published_properties?: number;
    paid_invoice_total?: number;
    hot_clients?: number;
    cold_clients?: number;
    expected_commission_total?: number;
    top_cities?: Array<{ key: string; count: number }>;
    top_districts?: Array<{ key: string; count: number }>;
    top_property_types?: Array<{ key: string; count: number }>;
    top_offer_types?: Array<{ key: string; count: number }>;
    top_client_categories?: Array<{ key: string; count: number }>;
  };
  summary_text: string | null;
  recommendations: string | null;
  generated_by_model: string | null;
  email_to: string | null;
  email_sent_at: string | null;
  created_at: string;
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selected, setSelected] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const { data, error: e } = await supabase
        .from("weekly_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (e) throw new Error(e.message);
      const list = (data || []) as Insight[];
      setInsights(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    }
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
        <Loader2 size={28} style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .insights-print, .insights-print * { visibility: visible; }
          .insights-print { position: absolute; inset: 0; padding: 24px; background: white !important; color: black !important; }
          .no-print { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="no-print">
        <Link href="/dashboard/ai-employees"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 12 }}>
          <ArrowRight size={12} /> موظفو AI
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={20} style={{ color: "#A78BFA" }} /> تقارير محلّل البيانات
            </h1>
            <p style={{ fontSize: 13, color: "#71717A" }}>
              تقارير أسبوعية تلقائية — ملخص أدائك + توصيات للأسبوع القادم
            </p>
          </div>
          {selected && (
            <button onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#A78BFA", fontSize: 13, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
              <Printer size={13} /> طباعة / PDF
            </button>
          )}
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <AlertCircle size={14} style={{ color: "#F87171", display: "inline", marginInlineEnd: 8 }} />
            <span style={{ fontSize: 13, color: "#F87171" }}>{error}</span>
          </div>
        )}

        {insights.length === 0 ? (
          <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <BarChart3 size={32} style={{ color: "#3F3F46", marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: "#A1A1AA", marginBottom: 4 }}>لا تقارير بعد</div>
            <div style={{ fontSize: 12, color: "#71717A" }}>
              محلّل البيانات يُنشئ تقريراً أسبوعياً كل يوم أحد الساعة 9 صباحاً.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 14 }}>
            {/* قائمة التقارير */}
            <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, overflow: "hidden", maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 11, fontWeight: 700, color: "#71717A" }}>
                التقارير ({insights.length})
              </div>
              {insights.map(i => (
                <button key={i.id} onClick={() => setSelected(i)}
                  style={{
                    width: "100%", textAlign: "right", padding: "10px 12px",
                    background: selected?.id === i.id ? "rgba(124,58,237,0.06)" : "transparent",
                    border: "none", borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#E4E4E7", marginBottom: 3 }}>
                    {new Date(i.period_start).toLocaleDateString("ar-SA")} - {new Date(i.period_end).toLocaleDateString("ar-SA")}
                  </div>
                  <div style={{ fontSize: 10, color: "#52525B" }}>
                    {i.raw_metrics?.new_properties || 0} عقار، {i.raw_metrics?.new_clients || 0} عميل
                  </div>
                </button>
              ))}
            </div>

            {/* محتوى التقرير */}
            {selected && <ReportView insight={selected} />}
          </div>
        )}
      </div>

      {/* Print version */}
      {selected && (
        <div className="insights-print" style={{ display: "none" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>تقرير محلّل البيانات الأسبوعي</h1>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            الفترة: {new Date(selected.period_start).toLocaleDateString("ar-SA")} - {new Date(selected.period_end).toLocaleDateString("ar-SA")}
          </p>
          <h2 style={{ fontSize: 16, marginTop: 14, marginBottom: 8 }}>الملخص التنفيذي</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{selected.summary_text}</div>
          <h2 style={{ fontSize: 16, marginTop: 14, marginBottom: 8 }}>التوصيات</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{selected.recommendations}</div>
        </div>
      )}
    </div>
  );
}

function ReportView({ insight }: { insight: Insight }) {
  const m = insight.raw_metrics || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Period banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(167,139,250,0.04))", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <Calendar size={20} style={{ color: "#A78BFA" }} />
        <div>
          <div style={{ fontSize: 13, color: "#A78BFA", fontWeight: 700 }}>
            تقرير الأسبوع
          </div>
          <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>
            {new Date(insight.period_start).toLocaleDateString("ar-SA", { dateStyle: "full" })}
            <span style={{ margin: "0 6px" }}>—</span>
            {new Date(insight.period_end).toLocaleDateString("ar-SA", { dateStyle: "full" })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        <Stat icon={Building}    color="#C6914C" label="عقارات جديدة"  value={m.new_properties || 0} />
        <Stat icon={Users}       color="#34D399" label="عملاء جدد"     value={m.new_clients || 0} />
        <Stat icon={Briefcase}   color="#60A5FA" label="صفقات جديدة"   value={m.new_deals || 0} />
        <Stat icon={FileText}    color="#E8B86D" label="فواتير"         value={m.new_invoices || 0} />
        <Stat icon={TrendingUp}  color="#4ADE80" label="فواتير مدفوعة" value={`${Number(m.paid_invoice_total || 0).toLocaleString("en-US")} ر.س`} />
        <Stat icon={Sparkles}    color="#F87171" label="عملاء ساخنون"  value={m.hot_clients || 0} />
      </div>

      {/* Summary */}
      {insight.summary_text && (
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart3 size={14} /> الملخص التنفيذي
          </h2>
          <div style={{ fontSize: 14, color: "#D4D4D8", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
            {insight.summary_text}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insight.recommendations && (
        <div style={{ background: "#0F0F12", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 12, padding: 18 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#4ADE80", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={14} /> التوصيات للأسبوع القادم
          </h2>
          <div style={{ fontSize: 14, color: "#D4D4D8", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
            {insight.recommendations}
          </div>
        </div>
      )}

      {/* Top lists */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        <TopList title="أكثر المدن طلباً" items={m.top_cities || []} />
        <TopList title="أكثر الأحياء طلباً" items={m.top_districts || []} />
        <TopList title="أنواع العقارات الأعلى" items={m.top_property_types || []} />
        <TopList title="نوع العرض" items={m.top_offer_types || []} />
        <TopList title="فئات العملاء" items={m.top_client_categories || []} />
      </div>

      {insight.generated_by_model && (
        <div style={{ fontSize: 10, color: "#52525B", textAlign: "left", direction: "ltr" }}>
          Generated by: {insight.generated_by_model} • {new Date(insight.created_at).toLocaleString("ar-SA")}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }: { icon: typeof Building; color: string; label: string; value: number | string }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: "12px 14px" }}>
      <Icon size={14} style={{ color, marginBottom: 6 }} />
      <div style={{ fontSize: 18, fontWeight: 800, color: "#F4F4F5", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#52525B", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  if (!items || items.length === 0) return null;
  const max = Math.max(...items.map(i => i.count));
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 11, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#A1A1AA", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((i, idx) => (
          <div key={idx}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
              <span style={{ color: "#D4D4D8" }}>{i.key || "—"}</span>
              <span style={{ color: "#71717A" }}>{i.count}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "#18181B", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(i.count / max) * 100}%`, background: "linear-gradient(90deg, #A78BFA, #7C3AED)", borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
