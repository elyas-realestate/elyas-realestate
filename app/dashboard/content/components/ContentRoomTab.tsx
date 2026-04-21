"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-browser";
import { providers, roomRoles } from "../constants";
import type { BrokerIdentity } from "@/types/database";
import { Play, Loader2, RefreshCw, Sparkles, Copy, Check, Save, MessageCircle, Users } from "lucide-react";

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

const SPEAKER_COLORS = ["#C6914C", "#7BB3E6", "#89D185"];
const SPEAKER_BG     = ["rgba(198,145,76,0.08)", "rgba(123,179,230,0.08)", "rgba(137,209,133,0.08)"];

export default function ContentRoomTab({ onDraftSaved }: { onDraftSaved: () => void }) {
  const [topic, setTopic]       = useState("");
  const [models, setModels]     = useState<RoomModel[]>([
    { provider: "openai",    model: "gpt-4o" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "google",    model: "gemini-2.0-flash" },
  ]);
  const [turns, setTurns]       = useState<Turn[]>([]);
  const [finalContent, setFinal]= useState("");
  const [activeTurn, setActiveTurn] = useState<number>(-1); // -1=idle, 0..5=turns, 6=synthesis
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [savedDraft, setSaved]  = useState(false);
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
    const others = roomRoles.filter((_, i) => i !== roleIdx).map((r) => r.fullName).join(" و");
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
    if (!topic.trim()) { setError("اكتب الموضوع أولاً"); return; }
    setError(""); setRunning(true); setDone(false);
    setTurns([]); setFinal(""); setSaved(false);

    const accumulated: Turn[] = [];
    try {
      // ── 6 discussion turns, sequential ──
      for (let i = 0; i < TURN_PLAN.length; i++) {
        setActiveTurn(i);
        const plan = TURN_PLAN[i];
        const sys  = buildSystemPrompt(plan.roleIdx);
        const usr  = buildUserPrompt(plan.roleIdx, plan.action, accumulated);
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
    setTurns([]); setFinal(""); setSaved(false); setError(""); setActiveTurn(-1); setDone(false);
  }

  function copyFinal() {
    navigator.clipboard.writeText(finalContent);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  async function saveDraft() {
    if (!finalContent) return;
    await supabase.from("content").insert([{
      title: topic.substring(0, 60) + (topic.length > 60 ? "..." : ""),
      main_text: finalContent,
      content_goal: "خلاصة نقاش غرفة المحتوى",
      status: "مسودة",
    }]);
    setSaved(true);
    onDraftSaved();
  }

  // ─────── Render ───────

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Users size={20} className="text-[#C6914C]" /> غرفة المحتوى — الطاولة المستديرة
        </h3>
        <p className="text-[#9A9AA0] text-sm">
          ٣ خبراء يجلسون على طاولة واحدة ويتناقشون حول موضوعك — ثم يخرجون لك بمحتوى واحد موحّد
        </p>
      </div>

      {/* Topic Input */}
      <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 mb-5">
        <label className="block text-sm text-[#9A9AA0] mb-2">الموضوع المطروح للنقاش</label>
        <div className="flex gap-3">
          <input
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setError(""); }}
            placeholder='مثال: أهمية الموقع في اختيار العقار'
            className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C] text-sm"
            disabled={running}
            onKeyDown={(e) => { if (e.key === "Enter" && !running && !done) runDiscussion(); }}
          />
          {!running && turns.length > 0 && (
            <button onClick={resetRoom} className="px-4 py-3 rounded-lg bg-[#2A2A32] text-[#9A9AA0] hover:text-white text-sm transition flex items-center gap-1">
              <RefreshCw size={14} /> نقاش جديد
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {roomRoles.map((role, idx) => (
          <div key={role.id} className="bg-[#16161A] border rounded-xl p-3"
            style={{ borderColor: running && activeTurn >= 0 && TURN_PLAN[activeTurn]?.roleIdx === idx ? SPEAKER_COLORS[idx] : "rgba(198,145,76,0.12)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: SPEAKER_COLORS[idx], color: "#0A0A0C" }}>{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: SPEAKER_COLORS[idx] }}>{role.name}</div>
                <div className="text-xs text-[#5A5A62] truncate">{role.desc}</div>
              </div>
              {running && activeTurn >= 0 && TURN_PLAN[activeTurn]?.roleIdx === idx && (
                <Loader2 size={15} className="animate-spin" style={{ color: SPEAKER_COLORS[idx] }} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={models[idx].provider} onChange={(e) => updateModel(idx, "provider", e.target.value)} disabled={running} className="bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#C6914C] disabled:opacity-50">
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={models[idx].model} onChange={(e) => updateModel(idx, "model", e.target.value)} disabled={running} className="bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded px-2 py-1.5 text-xs focus:outline-none focus:border-[#C6914C] disabled:opacity-50">
                {providers.find((p) => p.id === models[idx].provider)?.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Start Button (initial) */}
      {turns.length === 0 && !running && (
        <div className="text-center mb-6">
          <button onClick={runDiscussion} className="px-8 py-3 rounded-xl font-bold bg-[#C6914C] hover:bg-[#A6743A] text-white transition flex items-center gap-2 text-sm mx-auto">
            <Play size={16} /> ابدأ النقاش
          </button>
          <p className="text-xs text-[#5A5A62] mt-3">سيتناقش الثلاثة في ٦ مداخلات، ثم يخرج المحتوى الموحّد</p>
        </div>
      )}

      {/* Discussion Transcript (chat-style) */}
      {(turns.length > 0 || running) && (
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-[rgba(198,145,76,0.12)] flex items-center gap-2">
            <MessageCircle size={15} className="text-[#C6914C]" />
            <span className="font-bold text-sm text-[#C6914C]">النقاش الجاري</span>
            {running && activeTurn >= 0 && activeTurn < 6 && (
              <span className="text-xs text-[#9A9AA0] mr-auto">المداخلة {activeTurn + 1} من 6</span>
            )}
            {running && activeTurn === 6 && (
              <span className="text-xs text-[#C6914C] mr-auto flex items-center gap-1"><Loader2 size={11} className="animate-spin"/> يصيغون الخلاصة...</span>
            )}
          </div>
          <div ref={scrollRef} className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
            {turns.map((turn, i) => (
              <div key={i} className="flex gap-3 animate-[fadeIn_0.3s_ease]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: SPEAKER_COLORS[turn.roleIdx], color: "#0A0A0C" }}>
                  {turn.roleIdx + 1}
                </div>
                <div className="flex-1 min-w-0 rounded-xl p-3" style={{ background: SPEAKER_BG[turn.roleIdx], border: `1px solid ${SPEAKER_COLORS[turn.roleIdx]}33` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm" style={{ color: SPEAKER_COLORS[turn.roleIdx] }}>{roomRoles[turn.roleIdx].name}</span>
                    <span className="text-xs text-[#5A5A62]">— {turn.action}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{turn.text}</p>
                </div>
              </div>
            ))}
            {running && activeTurn >= 0 && activeTurn < 6 && (
              <div className="flex gap-3 opacity-60">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx] }}>
                  <Loader2 size={15} className="animate-spin" style={{ color: "#0A0A0C" }} />
                </div>
                <div className="flex-1 rounded-xl p-3" style={{ background: SPEAKER_BG[TURN_PLAN[activeTurn].roleIdx], border: `1px solid ${SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx]}33` }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-sm" style={{ color: SPEAKER_COLORS[TURN_PLAN[activeTurn].roleIdx] }}>{roomRoles[TURN_PLAN[activeTurn].roleIdx].name}</span>
                    <span className="text-xs text-[#5A5A62]">يكتب...</span>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    <div className="skeleton h-3 rounded w-full"/>
                    <div className="skeleton h-3 rounded w-5/6"/>
                    <div className="skeleton h-3 rounded w-3/4"/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Final Content */}
      {done && finalContent && (
        <div className="bg-[#16161A] border-2 border-[#C6914C] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgba(198,145,76,0.3)] flex items-center justify-between flex-wrap gap-2" style={{ background: "rgba(198,145,76,0.08)" }}>
            <span className="font-bold text-[#C6914C] flex items-center gap-2 text-sm">
              <Sparkles size={16} /> خلاصة النقاش — المحتوى النهائي الموحّد
            </span>
            <div className="flex gap-2">
              <button onClick={copyFinal} className={"text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 " + (copied ? "bg-green-900/30 text-green-400" : "bg-[#1C1C22] hover:bg-[#2A2A32] text-[#9A9AA0]")}>
                {copied ? <><Check size={12}/> نُسخ</> : <><Copy size={12}/> نسخ</>}
              </button>
              <button onClick={saveDraft} disabled={savedDraft} className={"text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 " + (savedDraft ? "bg-green-900/30 text-green-400" : "bg-[#C6914C] hover:bg-[#A6743A] text-white")}>
                {savedDraft ? <><Check size={12}/> حُفظ ✓</> : <><Save size={12}/> حفظ كمسودة</>}
              </button>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-100 leading-loose whitespace-pre-wrap text-[15px]">{finalContent}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
