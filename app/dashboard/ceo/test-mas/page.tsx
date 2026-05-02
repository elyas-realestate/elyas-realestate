"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Play, Loader2, CheckCircle2, AlertCircle, Bot, Clock, Zap } from "lucide-react";

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
  system_prompt_preview?: string;
  system_prompt_length?: number;
};

const PRESET_PROMPTS: Record<string, string> = {
  content_creator: "اكتب منشور تويتر بأسلوب محترف عن شقة فاخرة في النرجس - 4 غرف بسعر 720,000 ر.س.",
  whatsapp_qualifier: "عميل أرسل: 'مرحبا، ممكن سعر فيلا في حطين؟' — كيف ترد؟",
  lead_scorer: "عميل تواصل أول مرة قبل ساعة، طلب معاينة فيلا في حطين بـ 2.8 مليون، قال إن الميزانية حاضرة. صنّفه (hot/warm/cold) واشرح لماذا.",
  trend_scout: "ما أبرز ٣ ترندات عقارية في الرياض هذا الأسبوع؟ (لو xAI غير مشحون، اعتذر بأدب)",
  social_publisher: "لدينا منشور جاهز عن شقة. ما أفضل وقت نشر له على X و Instagram؟",
  community_manager: "تعليق سلبي على منشور: 'الأسعار غالية مرة'. كيف ترد بهدوء واحترافية؟",
  visual_director: "عقار: شقة 4 غرف في النرجس، 180م². اقترح ٣ زوايا تصوير ومحتوى Reel ٣٠ ثانية.",
  leasing_agent: "مستأجر تأخر دفع إيجار شهرين. اكتب رسالة تذكير لطيفة لكنها واضحة.",
  maintenance_coordinator: "بلاغ صيانة: مكيف لا يبرد في غرفة المستأجر. حدد الأولوية والخطوات التالية.",
  vacancy_filler: "وحدة شاغرة منذ شهرين في الياسمين. اقترح ٣ تكتيكات لتسويقها بسرعة.",
  bookkeeper: "صفقة بيع 700,000 ر.س، عمولتي 2.5%. كيف تقيدها محاسبياً؟",
  financial_analyst: "هذا الشهر: 3 صفقات (700k, 620k, 2.8M). كم إجمالي العمولات وما النصائح؟",
  collections_specialist: "فاتورة عمولة لم تُدفع منذ 30 يوماً. ضع خطة تحصيل من 3 خطوات.",
  bizdev_scout: "ما ٣ فرص أعمال جديدة لوسيط فردي في الرياض؟ (لو xAI غير مشحون، اعتذر)",
  dev_lead: "اقترح تحسيناً تقنياً واحداً يرفع تجربة وسيط برو خلال أسبوع.",
  ceo_assistant: "كم صفقة جارية وكم عميل ساخن؟ ملخّص قصير.",
};

export default function TestMASPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/test-mas");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingList(false);
  }

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
    } finally {
      setRunning(false);
    }
  }

  return (
    <div dir="rtl" className="space-y-6 max-w-5xl">
      <Link href="/dashboard/ceo" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة للوحة CEO
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
          <Zap size={22} style={{ color: "var(--gold-2)" }} /> اختبار المساعدين الأذكياء
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          شغّل أي موظف ذكي يدوياً وشاهد ردّه فوراً. اختر موظفاً، عدّل المدخل لو شئت، ثم اضغط «تشغيل».
        </p>
      </div>

      {/* Employee picker */}
      <div className="rounded-xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--gold-2)" }}>
          ١) اختر موظفاً ({employees.filter(e => e.is_active).length}/{employees.length} نشط)
        </h3>
        {loadingList ? (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin" style={{ color: "var(--gold-2)" }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {employees.map(emp => {
              const isActive = selected === emp.code;
              const xaiBlocked = emp.ai_provider === "xai";
              return (
                <button
                  key={emp.code}
                  onClick={() => handleSelect(emp.code)}
                  disabled={!emp.is_active}
                  className="text-start rounded-lg p-3 transition"
                  style={{
                    background: isActive ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                    border: `1px solid ${isActive ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
                    opacity: emp.is_active ? 1 : 0.5,
                    cursor: emp.is_active ? "pointer" : "not-allowed",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bot size={14} style={{ color: isActive ? "var(--gold-2)" : "var(--text-soft)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{emp.name}</span>
                    {xaiBlocked && (
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "var(--warning-bg)", color: "var(--warning)" }}>
                        xAI
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {emp.manager_name || "بدون مدير"} • {emp.ai_provider}/{emp.ai_model}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Input */}
      {selected && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--gold-2)" }}>
            ٢) المدخل (يمكنك تعديله)
          </h3>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition resize-none"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg-hover)",
              color: "var(--text-strong)",
            }}
            placeholder="اكتب أمراً أو سؤالاً للموظف..."
          />
          <button
            onClick={runTest}
            disabled={running || !input.trim()}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm"
            style={{
              background: running ? "var(--bg-surface-3)" : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: running ? "var(--text-faint)" : "var(--bg-page)",
              border: "none",
              cursor: running ? "wait" : "pointer",
            }}
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "جارٍ التشغيل..." : "تشغيل الموظف"}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-xl p-5 space-y-4" style={{
          background: result.ok ? "var(--success-bg)" : "var(--danger-bg)",
          border: `1px solid ${result.ok ? "var(--success)" : "var(--danger)"}`,
        }}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: result.ok ? "var(--success)" : "var(--danger)" }}>
              {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {result.ok ? "✓ نجح الاختبار" : "✗ فشل الاختبار"}
            </h3>
            {result.duration_ms && (
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-soft)" }}>
                <Clock size={11} /> {result.duration_ms} ms
              </span>
            )}
          </div>

          {result.employee && (
            <div className="text-xs" style={{ color: "var(--text-soft)" }}>
              الموظف: <strong>{result.employee.name}</strong> • النموذج: <strong>{result.employee.provider}/{result.employee.model}</strong>
              <br/>
              التوجيهات المُحمَّلة: <strong>{result.employee.directives_count}</strong> • KB: <strong>{result.employee.kb_count}</strong>
            </div>
          )}

          {result.error && (
            <div className="rounded-lg p-3 text-sm" style={{ background: "var(--bg-surface-1)", color: "var(--danger)" }}>
              <strong>الخطأ:</strong> {result.error}
            </div>
          )}

          {result.output && (
            <div>
              <div className="text-xs font-bold mb-2" style={{ color: "var(--text-soft)" }}>📤 رد الموظف:</div>
              <div className="rounded-lg p-4 text-sm whitespace-pre-wrap" style={{
                background: "var(--bg-surface-1)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-strong)",
                lineHeight: 1.8,
              }}>
                {result.output}
              </div>
            </div>
          )}

          {result.system_prompt_preview && (
            <details className="text-xs">
              <summary className="cursor-pointer font-bold" style={{ color: "var(--text-soft)" }}>
                📋 معاينة system prompt ({result.system_prompt_length} حرف)
              </summary>
              <pre className="mt-2 rounded-lg p-3 overflow-x-auto" style={{
                background: "var(--bg-surface-1)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-soft)",
                fontSize: 10,
                whiteSpace: "pre-wrap",
              }}>
                {result.system_prompt_preview}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
