"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import { providers, roomRoles } from "../constants";
import type { BrokerIdentity } from "@/types/database";
import {
  Play,
  Loader2,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Save,
  MessageCircle,
  Users,
} from "lucide-react";

type RoomModel = { provider: string; model: string };

/**
 * Each turn = one speaker contributing to an ongoing discussion.
 * Each speaker SEES all previous turns → real back-and-forth.
 *
 * Turn order (7 calls total, sequential):
 *   1. Marketer opens
 *   2. Advisor responds to #1
 *   3. Analyst responds to #1+#2
 *   4. Marketer reacts to #2+#3
 *   5. Advisor builds on #4
 *   6. Analyst closes
 *   7. Final content — synthesised from the entire discussion
 */
type Turn = { roleIdx: number; action: string; text: string };

const TURN_PLAN: { roleIdx: number; action: string }[] = [
  { roleIdx: 0, action: "فتح النقاش" },
  { roleIdx: 1, action: "رد" },
  { roleIdx: 2, action: "أضاف" },
  { roleIdx: 0, action: "بنى على النقاش" },
  { roleIdx: 1, action: "طوّر الفكرة" },
  { roleIdx: 2, action: "أنهى النقاش" },
];

const SPEAKER_COLORS = ["var(--gold-2)", "#7BB3E6", "#89D185"];
const SPEAKER_BG = ["var(--gold-bg-soft)", "rgba(123,179,230,0.08)", "rgba(137,209,133,0.08)"];

export default function ContentRoomTab({ onDraftSaved }: { onDraftSaved: () => void }) {
  const [topic, setTopic] = useState("");
  const [models, setModels] = useState<RoomModel[]>([
    { provider: "openai", model: "gpt-4o" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "google", model: "gemini-2.5-flash" },
  ]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [finalContent, setFinal] = useState("");
  const [activeTurn, setActiveTurn] = useState<number>(-1); // -1=idle, 0..5=turns, 6=synthesis
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedDraft, setSaved] = useState(false);
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("broker_identity").select("*").limit(1).single();
      if (data) setIdentity(data as BrokerIdentity);
    })();
  }, []);

  // auto-scroll discussion
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, activeTurn]);

  function updateModel(idx: number, field: "provider" | "model", value: string) {
    setModels((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "provider") {
        const prov = providers.find((p) => p.id === value);
        if (prov) next[idx].model = prov.models[0].id;
      }
      return next;
    });
  }

  const identityContext = identity
    ? `سياق: الوسيط "${identity.broker_name}"، تخصص: ${identity.specialization || "عام"}، مناطق: ${(identity.coverage_areas || []).join("، ")}.`
    : "";

  async function callAI(roleIdx: number, systemPrompt: string, userPrompt: string) {
    const { provider, model } = models[roleIdx];
    const res = await fetch("/api/ai-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt, provider, model, mode: "single" }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return (data.result as string).trim();
  }

  function buildSystemPrompt(roleIdx: number) {
    const role = roomRoles[roleIdx];
    const others = roomRoles
      .filter((_, i) => i !== roleIdx)
      .map((r) => r.fullName)
      .join(" و");
    return `${role.systemPrompt}

أنت الآن في نقاش مفتوح مع ${others} حول موضوع عقاري. تكلّم بأسلوب محادثة طبيعية كأنك في اجتماع حقيقي — اذكر اسم الزميل الذي تردّ عليه، اتفق أو اختلف، وأضِف من زاويتك.
${identityContext}

مهم جداً:
- لا تكتب محتوى تسويقي جاهز للنشر هنا — أنت تتحاور فقط.
- اجعل مشاركتك قصيرة ومركّزة (60-100 كلمة).
- لا تبدأ بـ"مرحباً" أو مقدمات — ادخل في الموضوع مباشرة.
- لا تضع عنواناً أو رموز تنسيق.`;
  }

  function buildUserPrompt(roleIdx: number, action: string, priorTurns: Turn[]) {
    if (priorTurns.length === 0) {
      return `الموضوع المطروح للنقاش: "${topic}"

افتح النقاش. اطرح فكرتك الرئيسية من زاويتك كخبير تسويق عقاري، وارمِ نقطة للنقاش يتفاعل معها الزملاء.`;
    }

    const transcript = priorTurns
      .map((t) => `${roomRoles[t.roleIdx].fullName}:\n${t.text}`)
      .join("\n\n---\n\n");

    return `الموضوع: "${topic}"

ما قيل في النقاش حتى الآن:

${transcript}

---

الآن دورك لـ"${action}". رُدّ بشكل طبيعي على ما قيل — اتفق واضِف، أو اختلف وبرّر، أو اطرح زاوية جديدة من تخصصك. لا تكرّر ما قيل.`;
  }

  async function runDiscussion() {
    if (!topic.trim()) {
      setError("اكتب الموضوع أولاً");
      return;
    }
    setError("");
    setRunning(true);
    setDone(false);
    setTurns([]);
    setFinal("");
    setSaved(false);

    const accumulated: Turn[] = [];
    try {
      // ── 6 discussion turns, sequential ──
      for (let i = 0; i < TURN_PLAN.length; i++) {
        setActiveTurn(i);
        const plan = TURN_PLAN[i];
        const sys = buildSystemPrompt(plan.roleIdx);
        const usr = buildUserPrompt(plan.roleIdx, plan.action, accumulated);
        const text = await callAI(plan.roleIdx, sys, usr);
        const turn: Turn = { roleIdx: plan.roleIdx, action: plan.action, text };
        accumulated.push(turn);
        setTurns([...accumulated]);
      }

      // ── Turn 7: synthesis — compile the discussion into final content ──
      setActiveTurn(6);
      const fullDiscussion = accumulated
        .map((t, i) => `[${i + 1}] ${roomRoles[t.roleIdx].fullName}:\n${t.text}`)
        .join("\n\n");

      // Pick the strongest model for synthesis — use slot #1 (advisor) by default
      const synthRoleIdx = 1;
      const synthSys = `أنت محرر محتوى عقاري محترف. مهمتك تحويل نقاش جماعي بين ثلاثة خبراء إلى محتوى واحد متكامل جاهز للنشر على السوشال ميديا.
${identityContext}

المحتوى النهائي يجب أن:
- يدمج أفضل ما طرحه الخبراء الثلاثة (الجاذبية التسويقية + العمق الاستشاري + الأرقام التحليلية).
- يكون متماسكاً وقابلاً للنشر مباشرة.
- لا يذكر أسماء الخبراء أو أنه نقاش — اكتبه كمحتوى واحد صادر من وسيط واحد.
- يتراوح بين 150-250 كلمة.
- لا يتضمّن عناوين فرعية أو قوائم نقطية إلا إذا كان ذلك مناسباً للنشر.`;
      const synthUsr = `الموضوع: "${topic}"

نص النقاش الكامل:

${fullDiscussion}

---

اكتب الآن المحتوى النهائي الموحّد (منشور عقاري جاهز). فقط المحتوى، بدون مقدمات أو شروحات.`;

      const finalText = await callAI(synthRoleIdx, synthSys, synthUsr);
      setFinal(finalText);
      setActiveTurn(-1);
      setDone(true);
    } catch (err: unknown) {
      setError("حدث خطأ: " + (err instanceof Error ? err.message : ""));
      setActiveTurn(-1);
    } finally {
      setRunning(false);
    }
  }

  function resetRoom() {
    setTurns([]);
    setFinal("");
    setSaved(false);
    setError("");
    setActiveTurn(-1);
    setDone(false);
  }

  function copyFinal() {
    navigator.clipboard.writeText(finalContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveDraft() {
    if (!finalContent) return;
    await supabase.from("content").insert([
      {
        title: topic.substring(0, 60) + (topic.length > 60 ? "..." : ""),
        main_text: finalContent,
        content_goal: "خلاصة نقاش غرفة المحتوى",
        status: "مسودة",
      },
    ]);
    setSaved(true);
    onDraftSaved();
  }

  // ─────── Render ───────

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-bold">
          <Users size={20} className="text-[var(--gold-2)]" /> غرفة المحتوى — الطاولة المستديرة
        </h3>
        <p className="text-sm text-[var(--text-soft)]">
          ٣ خبراء يجلسون على طاولة واحدة ويتناقشون حول موضوعك — ثم يخرجون لك بمحتوى واحد موحّد
        </p>
      </div>

      {/* Topic Input */}
      <div className="mb-5 rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)] p-5">
        <label className="mb-2 block text-sm text-[var(--text-soft)]">الموضوع المطروح للنقاش</label>
        <div className="flex gap-3">
          <input
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setError("");
            }}
            placeholder="مثال: أهمية الموقع في اختيار العقار"
            className="flex-1 rounded-lg border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-4 py-3 text-sm focus:border-[var(--gold-2)] focus:outline-none"
            disabled={running}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !running && !done) runDiscussion();
            }}
          />
          {!running && turns.length > 0 && (
            <button
              onClick={resetRoom}
              className="flex items-center gap-1 rounded-lg bg-[var(--bg-surface-3)] px-4 py-3 text-sm text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
            >
              <RefreshCw size={14} /> نقاش جديد
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* Participants */}
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {roomRoles.map((role, idx) => (
          <div
            key={role.id}
            className="rounded-xl border bg-[var(--bg-surface-1)] p-3"
            style={{
              borderColor:
                running && activeTurn >= 0 && TURN_PLAN[activeTurn]?.roleIdx === idx
                  ? SPEAKER_COLORS[idx]
                  : "var(--gold-bg)",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                style={{ background: SPEAKER_COLORS[idx], color: "var(--bg-page)" }}
              >
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold" style={{ color: SPEAKER_COLORS[idx] }}>
                  {role.name}
                </div>
                <div className="truncate text-xs text-[var(--text-faint)]">{role.desc}</div>
              </div>
              {running && activeTurn >= 0 && TURN_PLAN[activeTurn]?.roleIdx === idx && (
                <Loader2
                  size={15}
                  className="animate-spin"
                  style={{ color: SPEAKER_COLORS[idx] }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={models[idx].provider}
                onChange={(e) => updateModel(idx, "provider", e.target.value)}
                disabled={running}
                className="rounded border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-2 py-1.5 text-xs focus:border-[var(--gold-2)] focus:outline-none disabled:opacity-50"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                value={models[idx].model}
                onChange={(e) => updateModel(idx, "model", e.target.value)}
                disabled={running}
                className="rounded border border-[var(--gold-bg-hover)] bg-[var(--bg-surface-2)] px-2 py-1.5 text-xs focus:border-[var(--gold-2)] focus:outline-none disabled:opacity-50"
              >
                {providers
                  .find((p) => p.id === models[idx].provider)
                  ?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Start Button (initial) */}
      {turns.length === 0 && !running && (
        <div className="mb-6 text-center">
          <button
            onClick={runDiscussion}
            className="mx-auto flex items-center gap-2 rounded-xl bg-[var(--gold-2)] px-8 py-3 text-sm font-bold text-white transition hover:bg-[var(--gold-3)]"
          >
            <Play size={16} /> ابدأ النقاش
          </button>
          <p className="mt-3 text-xs text-[var(--text-faint)]">
            سيتناقش الثلاثة في ٦ مداخلات، ثم يخرج المحتوى الموحّد
          </p>
        </div>
      )}

      {/* Discussion Transcript (chat-style) */}
      {(turns.length > 0 || running) && (
        <div className="mb-5 overflow-hidden rounded-xl border border-[var(--gold-bg)] bg-[var(--bg-surface-1)]">
          <div className="flex items-center gap-2 border-b border-[var(--gold-bg)] px-5 py-3">
            <MessageCircle size={15} className="text-[var(--gold-2)]" />
            <span className="text-sm font-bold text-[var(--gold-2)]">النقاش الجاري</span>
            {running && activeTurn >= 0 && activeTurn < 6 && (
              <span className="mr-auto text-xs text-[var(--text-soft)]">
                المداخلة {activeTurn + 1} من 6
              </span>
            )}
            {running && activeTurn === 6 && (
              <span className="mr-auto flex items-center gap-1 text-xs text-[var(--gold-2)]">
                <Loader2 size={11} className="animate-spin" /> يصيغون الخلاصة...
              </span>
            )}
          </div>
          <div ref={scrollRef} className="max-h-[520px] space-y-4 overflow-y-auto p-5">
            {turns.map((turn, i) => (
              <div key={i} className="flex animate-[fadeIn_0.3s_ease] gap-3">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: SPEAKER_COLORS[turn.roleIdx], color: "var(--bg-page)" }}
                >
                  {turn.roleIdx + 1}
                </div>
                <div
                  className="min-w-0 flex-1 rounded-xl p-3"
                  style={{
                    background: SPEAKER_BG[turn.roleIdx],
                    border: `1px solid ${SPEAKER_COLORS[turn.roleIdx]}33`,
                  }}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: SPEAKER_COLORS[turn.roleIdx] }}
                    >
                      {roomRoles[turn.roleIdx].name}
                    </span>
                    <span className="text-xs text-[var(--text-faint)]">— {turn.action}</span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-200">
                    {turn.text}
                  </p>
                </div>
              </div>
            ))}
            {running && activeTurn >= 0 && activeTurn < 6 && (
              <div className="flex gap-3 opacity-60">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx] }}
                >
                  <Loader2 size={15} className="animate-spin" style={{ color: "var(--bg-page)" }} />
                </div>
                <div
                  className="flex-1 rounded-xl p-3"
                  style={{
                    background: SPEAKER_BG[TURN_PLAN[activeTurn].roleIdx],
                    border: `1px solid ${SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx]}33`,
                  }}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx] }}
                    >
                      {roomRoles[TURN_PLAN[activeTurn].roleIdx].name}
                    </span>
                    <span className="text-xs text-[var(--text-faint)]">يكتب...</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-5/6 rounded" />
                    <div className="skeleton h-3 w-3/4 rounded" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Content */}
      {done && finalContent && (
        <div className="overflow-hidden rounded-xl border-2 border-[var(--gold-2)] bg-[var(--bg-surface-1)]">
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gold-bg-strong)] px-5 py-3"
            style={{ background: "var(--gold-bg-soft)" }}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-[var(--gold-2)]">
              <Sparkles size={16} /> خلاصة النقاش — المحتوى النهائي الموحّد
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyFinal}
                className={
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition " +
                  (copied
                    ? "bg-green-900/30 text-green-400"
                    : "bg-[var(--bg-surface-2)] text-[var(--text-soft)] hover:bg-[var(--bg-surface-3)]")
                }
              >
                {copied ? (
                  <>
                    <Check size={12} /> نُسخ
                  </>
                ) : (
                  <>
                    <Copy size={12} /> نسخ
                  </>
                )}
              </button>
              <button
                onClick={saveDraft}
                disabled={savedDraft}
                className={
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition " +
                  (savedDraft
                    ? "bg-green-900/30 text-green-400"
                    : "bg-[var(--gold-2)] text-white hover:bg-[var(--gold-3)]")
                }
              >
                {savedDraft ? (
                  <>
                    <Check size={12} /> حُفظ ✓
                  </>
                ) : (
                  <>
                    <Save size={12} /> حفظ كمسودة
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-6">
            <p className="text-[15px] leading-loose whitespace-pre-wrap text-gray-100">
              {finalContent}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
