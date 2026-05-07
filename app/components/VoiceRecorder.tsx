"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, Sparkles, AlertCircle, Check } from "lucide-react";

// ══════════════════════════════════════════════════════════════════
// VoiceRecorder — تسجيل صوتي + إرسال لـ /api/ai/voice-to-property
// يستخدم Web Speech API للتفريغ المحلي (browser native)
// ══════════════════════════════════════════════════════════════════

interface Props {
  onExtracted: (fields: Record<string, any>) => void;
  accentColor?: string;
}

// تصريحات Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceRecorder({ onExtracted, accentColor = "#C6914C" }: Props) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  function startRecording() {
    setError(null);
    setTranscript("");
    setInterim("");

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("متصفحك لا يدعم التسجيل الصوتي. استخدم Chrome أو Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript + " ";
        else interimText += result[0].transcript;
      }
      if (finalText) setTranscript((prev) => prev + finalText);
      setInterim(interimText);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") return; // متجاهَل
      if (event.error === "not-allowed") {
        setError("لم يُسمح للمتصفح بالميكروفون. فعّله من الإعدادات.");
      } else {
        setError(`خطأ في التسجيل: ${event.error}`);
      }
      stopRecording();
    };

    recognition.onend = () => {
      // قد يتوقّف تلقائياً، نعيد التشغيل لو لا يزال recording=true
      if (recording && recognitionRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch (e: any) {
      setError(e?.message || "فشل بدء التسجيل");
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setRecording(false);
    setInterim("");
  }

  async function extract() {
    const text = transcript.trim();
    if (!text) {
      setError("لم يُسجَّل أي نص");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/voice-to-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const j = await res.json();
      if (j.ok && j.fields) {
        onExtracted(j.fields);
      } else {
        setError(j.error || "فشل الاستخراج");
      }
    } catch (e: any) {
      setError(e?.message || "خطأ");
    } finally {
      setExtracting(false);
    }
  }

  function clear() {
    setTranscript("");
    setInterim("");
    setError(null);
  }

  if (supported === null) {
    return null; // لم يُحدَّد بعد
  }

  if (supported === false) {
    return (
      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          fontSize: 12,
          color: "var(--text-soft)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <AlertCircle size={14} style={{ color: "#ef4444" }} />
        التسجيل الصوتي غير مدعوم في متصفحك. استخدم Chrome أو Edge.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: "var(--bg-surface-1)",
        border: `1px solid ${recording ? accentColor : "var(--gold-bg)"}`,
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Sparkles size={14} style={{ color: accentColor }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>
          إدخال صوتي بالذكاء الاصطناعي
        </span>
        <span
          style={{
            fontSize: 9,
            padding: "2px 6px",
            background: `${accentColor}15`,
            color: accentColor,
            borderRadius: 999,
            fontWeight: 600,
          }}
        >
          BETA
        </span>
      </div>

      <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 12, lineHeight: 1.7 }}>
        اضغط الميكروفون واحكِ تفاصيل العقار باللهجة العربية. النظام يستخرج الحقول تلقائياً.
        مثال: "فيلا للبيع في حي العليا بالرياض، مساحة الأرض ٦٠٠ متر، خمس غرف، السعر ٢ مليون".
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={extracting}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              color: "var(--bg-page, #fff)",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: extracting ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            <Mic size={15} />
            {transcript ? "متابعة التسجيل" : "ابدأ التسجيل"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              animation: "voicePulse 1.4s ease-in-out infinite",
            }}
          >
            <Square size={13} fill="currentColor" />
            إيقاف التسجيل
            <style>{`
              @keyframes voicePulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
                50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
              }
            `}</style>
          </button>
        )}
        {transcript && !recording && (
          <button
            type="button"
            onClick={clear}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "transparent",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-faint)",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            مسح
          </button>
        )}
      </div>

      {/* Transcript */}
      {(transcript || interim) && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 9,
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg-soft)",
            fontSize: 13,
            lineHeight: 1.8,
            color: "var(--text-strong)",
            marginBottom: 10,
            minHeight: 50,
          }}
        >
          {transcript}
          {interim && (
            <span style={{ color: "var(--text-faint)", opacity: 0.6 }}>{interim}</span>
          )}
        </div>
      )}

      {/* Extract button */}
      {transcript && !recording && (
        <button
          type="button"
          onClick={extract}
          disabled={extracting}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 10,
            background: extracting
              ? "var(--bg-surface-2)"
              : "var(--text-strong)",
            color: extracting ? "var(--text-faint)" : "var(--bg-page)",
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            cursor: extracting ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {extracting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              جاري الاستخراج...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              استخراج البيانات بالذكاء الاصطناعي
            </>
          )}
        </button>
      )}

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            fontSize: 12,
            color: "var(--text-soft)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <AlertCircle size={13} style={{ color: "#ef4444" }} />
          {error}
        </div>
      )}
    </div>
  );
}
