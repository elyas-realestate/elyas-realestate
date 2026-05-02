"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Loader2, CheckCircle2, AlertCircle, Bot, Clock, FlaskConical } from "lucide-react";

type Employee = {
  code: string;
  name: string;
  ai_provider: string;
  ai_model: string;
  is_active: boolean;
  manager_name: string | null;
};

type TestResult = {
  ok: boolean;
  employee?: any;
  input: string;
  output?: string;
  duration_ms?: number;
  error?: string | null;
};

const PRESET_PROMPTS: Record<string, string> = {
  content_creator: "اكتب منشور تويتر بأسلوب محترف عن شقة فاخرة في النرجس - 4 غرف بسعر 720,000 ر.س.",
  whatsapp_qualifier: "عميل أرسل: 'مرحبا، ممكن سعر فيلا في حطين؟' — كيف ترد؟",
  lead_scorer: "عميل تواصل أول مرة قبل ساعة، طلب معاينة فيلا في حطين بـ 2.8 مليون. صنّفه واشرح.",
  community_manager: "تعليق سلبي: 'الأسعار غالية مرة'. كيف ترد بهدوء؟",
  ceo_assistant: "كم صفقة جارية وكم عميل ساخن؟ ملخّص قصير.",
};

export default function TestTab() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("employee") || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<string>(initialCode);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetch("/api/admin/test-mas").then(r => r.json()).then(data => {
      setEmployees(data.employees || []);
      if (initialCode) setInput(PRESET_PROMPTS[initialCode] || "");
    }).finally(() => setLoadingList(false));
  }, [initialCode]);

  function handleSelect(code: string) {
    setSelected(code);
    setInput(PRESET_PROMPTS[code] || "");
    setResult(null);
  }

  async function runTest() {
    if (!selected) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-mas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_code: selected, test_input: input }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ ok: false, input, error: e?.message || "خطأ" });
    } finally { setRunning(false); }
  }

  return (
    <div className="space-y-5">
      <div className="text-sm" style={{ color: "var(--text-faint)" }}>
        جرّب أي مساعد يدوياً وشاهد الرد. لا يحفظ في DB، لا يخصم من الحد اليومي.
      </div>

      {/* Picker */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--gold-2)" }}>
          ١) اختر المساعد ({employees.filter(e => e.is_active).length}/{employees.length} نشط)
        </h3>
        {loadingList ? (
          <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {employees.map(emp => {
              const isActive = selected === emp.code;
              return (
                <button key={emp.code} onClick={() => handleSelect(emp.code)} disabled={!emp.is_active}
                  className="text-start rounded-lg p-3"
                  style={{
                    background: isActive ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                    border: `1px solid ${isActive ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
                    opacity: emp.is_active ? 1 : 0.5,
                    cursor: emp.is_active ? "pointer" : "not-allowed",
                  }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={13} style={{ color: isActive ? "var(--gold-2)" : "var(--text-soft)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{emp.name}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {emp.manager_name || "—"} • {emp.ai_provider}/{emp.ai_model}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      {selected && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--gold-2)" }}>٢) المدخل</h3>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
            style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg-hover)", color: "var(--text-strong)" }}
            placeholder="اكتب أمراً أو سؤالاً..." />
          <button onClick={runTest} disabled={running || !input.trim()}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
            style={{
              background: running ? "var(--bg-surface-3)" : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: running ? "var(--text-faint)" : "var(--bg-page)",
              border: "none",
              cursor: running ? "wait" : "pointer",
            }}>
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? "جارٍ التشغيل..." : "تشغيل"}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl p-4 space-y-3" style={{
          background: result.ok ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${result.ok ? "var(--success)" : "var(--danger)"}`,
        }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: result.ok ? "var(--success)" : "var(--danger)" }}>
              {result.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {result.ok ? "نجح الاختبار" : "فشل"}
            </h3>
            {result.duration_ms && (
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-soft)" }}>
                <Clock size={11} /> {result.duration_ms} ms
              </span>
            )}
          </div>
          {result.error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "var(--bg-surface-1)", color: "var(--danger)" }}>
              {result.error}
            </div>
          )}
          {result.output && (
            <div>
              <div className="text-xs font-bold mb-2" style={{ color: "var(--text-soft)" }}>📤 رد المساعد:</div>
              <div className="rounded-lg p-3 text-sm whitespace-pre-wrap" style={{
                background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)",
                color: "var(--text-strong)", lineHeight: 1.7,
              }}>
                {result.output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
