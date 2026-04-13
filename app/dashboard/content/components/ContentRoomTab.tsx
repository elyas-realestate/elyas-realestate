"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

type RoomModel = { provider: string; model: string };
type RoomPhase =
  | "idle"
  | "r1-loading"
  | "r1-done"
  | "r2-loading"
  | "r2-done"
  | "merging"
  | "merged";

export default function ContentRoomTab({
  onDraftSaved,
}: {
  onDraftSaved: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [models, setModels] = useState<RoomModel[]>([
    { provider: "openai", model: "gpt-4o" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "google", model: "gemini-2.5-flash" },
  ]);
  const [phase, setPhase] = useState<RoomPhase>("idle");
  const [round1, setRound1] = useState<string[]>(["", "", ""]);
  const [round2, setRound2] = useState<string[]>(["", "", ""]);
  const [mergerIdx, setMergerIdx] = useState<number | null>(null);
  const [finalContent, setFinalContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedDraft, setSavedDraft] = useState(false);
  const [identity, setIdentity] = useState<BrokerIdentity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("broker_identity").select("*").limit(1).single();
      if (data) setIdentity(data as BrokerIdentity);
    })();
  }, []);

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
    ? `هوية الوسيط: ${identity.broker_name}، التخصص: ${identity.specialization}، المناطق: ${(identity.coverage_areas || []).join("، ")}`
    : "";

  async function callRoomModel(idx: number, systemPrompt: string, userPrompt: string) {
    const { provider, model } = models[idx];
    const res = await fetch("/api/ai-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt, provider, model, mode: "single" }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result as string;
  }

  async function startRound1() {
    if (!topic.trim()) { setError("يرجى كتابة فكرة أو موضوع أولاً"); return; }
    setError(""); setPhase("r1-loading");
    setRound1(["", "", ""]); setRound2(["", "", ""]);
    setFinalContent(""); setSavedDraft(false); setMergerIdx(null);
    try {
      const results = await Promise.all(
        roomRoles.map((role, idx) => {
          const sys = role.systemPrompt + (identityContext ? "\n\n" + identityContext : "");
          const usr = `اكتب محتوى عقاري احترافي حول الموضوع التالي:\n"${topic}"\n\nاكتب من منظورك كـ${role.fullName}. اجعله ملائماً للنشر على السوشال ميديا.`;
          return callRoomModel(idx, sys, usr);
        })
      );
      setRound1(results); setPhase("r1-done");
    } catch (err: unknown) {
      setError("حدث خطأ: " + (err instanceof Error ? err.message : "")); setPhase("idle");
    }
  }

  async function startRound2() {
    setPhase("r2-loading"); setRound2(["", "", ""]);
    try {
      const results = await Promise.all(
        roomRoles.map((role, idx) => {
          const otherIndices = [0, 1, 2].filter((i) => i !== idx);
          const othersText = otherIndices.map((i) => `**${roomRoles[i].fullName}:**\n${round1[i]}`).join("\n\n---\n\n");
          const sys = role.systemPrompt + (identityContext ? "\n\n" + identityContext : "");
          const usr = `الموضوع: "${topic}"\n\nنسختك من الجولة الأولى:\n${round1[idx]}\n\nما كتبه زملاؤك:\n\n${othersText}\n\nبناءً على ما قرأت، حسّن نسختك مع استيعاب أفضل ما طرحه الآخرون. أعد كتابة المحتوى المطوّر فقط.`;
          return callRoomModel(idx, sys, usr);
        })
      );
      setRound2(results); setPhase("r2-done");
    } catch (err: unknown) {
      setError("حدث خطأ: " + (err instanceof Error ? err.message : "")); setPhase("r1-done");
    }
  }

  async function mergeContent() {
    if (mergerIdx === null) { setError("اختر نموذجاً للدمج"); return; }
    setPhase("merging"); setError("");
    try {
      const allContents = roomRoles.map((r, i) => `**${r.fullName}:**\n${round2[i] || round1[i]}`).join("\n\n---\n\n");
      const sys = roomRoles[mergerIdx].systemPrompt + (identityContext ? "\n\n" + identityContext : "");
      const usr = `الموضوع: "${topic}"\n\nأنت محرر محتوى عقاري متمكن. إليك ٣ نسخ كتبها فريقك:\n\n${allContents}\n\nمهمتك: ادمج أفضل ما في هذه النسخ في محتوى نهائي واحد متكامل وقوي — خذ الجاذبية التسويقية من الأول، المصداقية والعمق من الثاني، والأرقام والتحليل من الثالث. اكتب المحتوى النهائي فقط بدون شرح.`;
      const result = await callRoomModel(mergerIdx, sys, usr);
      setFinalContent(result); setPhase("merged");
    } catch (err: unknown) {
      setError("حدث خطأ في الدمج: " + (err instanceof Error ? err.message : "")); setPhase("r2-done");
    }
  }

  async function saveDraft() {
    if (!finalContent) return;
    await supabase.from("content").insert([{
      title: topic.substring(0, 60) + (topic.length > 60 ? "..." : ""),
      main_text: finalContent,
      content_goal: "محتوى غرفة الذكاء الاصطناعي",
      status: "مسودة",
    }]);
    setSavedDraft(true); onDraftSaved();
  }

  function copyFinal() {
    navigator.clipboard.writeText(finalContent);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function resetRoom() {
    setPhase("idle"); setRound1(["", "", ""]); setRound2(["", "", ""]);
    setFinalContent(""); setSavedDraft(false); setMergerIdx(null); setError("");
  }

  const isLoading = phase === "r1-loading" || phase === "r2-loading" || phase === "merging";
  const round1Done = ["r1-done", "r2-loading", "r2-done", "merging", "merged"].includes(phase);
  const round2Done = ["r2-done", "merging", "merged"].includes(phase);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">غرفة المحتوى</h3>
        <p className="text-[#9A9AA0] text-sm">
          ٣ نماذج ذكاء اصطناعي تتحاور لإنتاج محتوى عقاري استثنائي — كل نموذج بدور مختلف
        </p>
      </div>

      {/* Topic Input */}
      <div className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl p-5 mb-6">
        <label className="block text-sm text-[#9A9AA0] mb-2">الفكرة أو الموضوع</label>
        <div className="flex gap-3">
          <input
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setError(""); }}
            placeholder='مثلاً: أهمية الموقع في اختيار العقار'
            className="flex-1 bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C6914C] text-sm"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === "Enter" && phase === "idle") startRound1(); }}
          />
          {phase !== "idle" && (
            <button onClick={resetRoom} disabled={isLoading} className="px-4 py-3 rounded-lg bg-[#2A2A32] text-[#9A9AA0] hover:text-white text-sm transition flex items-center gap-1 disabled:opacity-40">
              <RefreshCw size={14} /> بداية جديدة
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* 3 Model Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {roomRoles.map((role, idx) => (
          <div key={role.id} className="bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[rgba(198,145,76,0.12)]" style={{ background: `rgba(198,145,76,${0.04 + idx * 0.025})` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full bg-[#C6914C] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                <span className="font-bold text-sm text-[#C6914C]">{role.fullName}</span>
              </div>
              <p className="text-xs text-[#5A5A62] pr-8">{role.desc}</p>
            </div>
            <div className="p-3 border-b border-[rgba(198,145,76,0.08)] space-y-2">
              <select value={models[idx].provider} onChange={(e) => updateModel(idx, "provider", e.target.value)} disabled={isLoading || phase !== "idle"} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C6914C] disabled:opacity-50">
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={models[idx].model} onChange={(e) => updateModel(idx, "model", e.target.value)} disabled={isLoading || phase !== "idle"} className="w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C6914C] disabled:opacity-50">
                {providers.find((p) => p.id === models[idx].provider)?.models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="p-4 flex-1 min-h-[200px]">
              {phase === "idle" && <div className="flex items-center justify-center h-full"><p className="text-[#3A3A42] text-xs text-center">في انتظار الجولة الأولى</p></div>}
              {phase === "r1-loading" && <div className="space-y-2 animate-pulse"><div className="skeleton h-3 rounded w-full" /><div className="skeleton h-3 rounded w-5/6" /><div className="skeleton h-3 rounded w-4/5" /><div className="skeleton h-3 rounded w-full" /><div className="skeleton h-3 rounded w-3/4" /></div>}
              {round1Done && (
                <div className="space-y-3">
                  {round2Done && round2[idx] ? (
                    <>
                      <div><p className="text-xs text-[#C6914C] font-bold mb-1.5">الجولة الثانية:</p><p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{round2[idx]}</p></div>
                      <details className="group"><summary className="text-xs text-[#5A5A62] cursor-pointer hover:text-[#9A9AA0] transition list-none flex items-center gap-1"><span className="group-open:hidden">▶</span><span className="hidden group-open:inline">▼</span> الجولة الأولى</summary><p className="text-[#5A5A62] text-xs leading-relaxed whitespace-pre-wrap mt-2 border-t border-[rgba(198,145,76,0.08)] pt-2">{round1[idx]}</p></details>
                    </>
                  ) : phase === "r2-loading" ? (
                    <>
                      <p className="text-xs text-[#5A5A62] font-bold mb-1.5">الجولة الأولى:</p>
                      <p className="text-[#5A5A62] text-xs leading-relaxed whitespace-pre-wrap">{round1[idx]}</p>
                      <div className="space-y-2 mt-3 pt-3 border-t border-[rgba(198,145,76,0.08)]"><p className="text-xs text-[#C6914C] mb-1">الجولة الثانية جارية...</p><div className="skeleton h-3 rounded w-full" /><div className="skeleton h-3 rounded w-4/5" /></div>
                    </>
                  ) : (
                    <p className="text-gray-200 text-xs leading-relaxed whitespace-pre-wrap">{round1[idx]}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Phase Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {phase === "idle" && <button onClick={startRound1} className="px-8 py-3 rounded-xl font-bold bg-[#C6914C] hover:bg-[#A6743A] text-white transition flex items-center gap-2 text-sm"><Play size={16} /> ابدأ الجولة الأولى</button>}
        {phase === "r1-loading" && <button disabled className="px-8 py-3 rounded-xl font-bold bg-[#2A2A32] text-[#9A9AA0] flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" /> الجولة الأولى جارية...</button>}
        {phase === "r1-done" && <button onClick={startRound2} className="px-8 py-3 rounded-xl font-bold bg-[#C6914C] hover:bg-[#A6743A] text-white transition flex items-center gap-2 text-sm"><RefreshCw size={16} /> ابدأ الجولة الثانية</button>}
        {phase === "r2-loading" && <button disabled className="px-8 py-3 rounded-xl font-bold bg-[#2A2A32] text-[#9A9AA0] flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin" /> الجولة الثانية جارية...</button>}
      </div>

      {/* Merge Section */}
      {phase === "r2-done" && (
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.2)] rounded-xl p-5 mb-6">
          <h4 className="font-bold text-[#C6914C] mb-2">الجولة الثالثة — ادمج المحتوى النهائي</h4>
          <p className="text-[#9A9AA0] text-sm mb-4">اختر النموذج الذي سيدمج أفضل ما كتبه الجميع في محتوى واحد متكامل</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {roomRoles.map((role, idx) => (
              <button key={role.id} onClick={() => setMergerIdx(idx)} className={"p-3 rounded-xl border text-right transition " + (mergerIdx === idx ? "border-[#C6914C] bg-[rgba(198,145,76,0.1)]" : "border-[rgba(198,145,76,0.15)] bg-[#1C1C22] hover:border-[rgba(198,145,76,0.3)]")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={"w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 " + (mergerIdx === idx ? "bg-[#C6914C] text-white" : "bg-[#2A2A32] text-[#9A9AA0]")}>{idx + 1}</span>
                  <span className={"font-bold text-sm " + (mergerIdx === idx ? "text-[#C6914C]" : "text-[#9A9AA0]")}>{role.name}</span>
                </div>
                <p className="text-xs text-[#5A5A62] pr-7">{providers.find((p) => p.id === models[idx].provider)?.name} — {providers.find((p) => p.id === models[idx].provider)?.models.find((m) => m.id === models[idx].model)?.name}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button onClick={mergeContent} disabled={mergerIdx === null} className={"w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm " + (mergerIdx !== null ? "bg-[#C6914C] hover:bg-[#A6743A] text-white" : "bg-[#2A2A32] text-[#5A5A62]")}>
            <Sparkles size={16} /> ادمج المحتوى
          </button>
        </div>
      )}

      {phase === "merging" && (
        <div className="text-center py-10 bg-[#16161A] border border-[rgba(198,145,76,0.12)] rounded-xl mb-6">
          <Loader2 size={40} className="text-[#C6914C] animate-spin mx-auto mb-4" />
          <p className="text-[#9A9AA0] text-sm">يجري دمج أفضل ما كتبه الثلاثة...</p>
        </div>
      )}

      {/* Final Content */}
      {phase === "merged" && finalContent && (
        <div className="bg-[#16161A] border border-[rgba(198,145,76,0.3)] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[rgba(198,145,76,0.15)] flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-[#C6914C] flex items-center gap-2 text-sm"><Sparkles size={15} /> المحتوى النهائي المدمج</span>
            <div className="flex gap-2">
              <button onClick={copyFinal} className={"text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 " + (copied ? "bg-green-900/30 text-green-400" : "bg-[#1C1C22] hover:bg-[#2A2A32] text-[#9A9AA0]")}>
                {copied ? <><Check size={12} /> نُسخ</> : <><Copy size={12} /> نسخ</>}
              </button>
              <button onClick={saveDraft} disabled={savedDraft} className={"text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 " + (savedDraft ? "bg-green-900/30 text-green-400" : "bg-[#C6914C] hover:bg-[#A6743A] text-white")}>
                {savedDraft ? <><Check size={12} /> حُفظ كمسودة ✓</> : <><Save size={12} /> حفظ مسودة</>}
              </button>
            </div>
          </div>
          <div className="p-5">
            <p className="text-gray-100 leading-relaxed whitespace-pre-wrap text-sm">{finalContent}</p>
          </div>
        </div>
      )}
    </div>
  );
}
