"use client";
import { useRef, useState, useEffect } from "react";
import { Eraser, Check, X, Loader2 } from "lucide-react";

interface SignaturePadProps {
  onConfirm: (dataUrl: string) => void;
  onCancel?: () => void;
  busy?: boolean;
  hint?: string;
}

export default function SignaturePad({ onConfirm, onCancel, busy = false, hint }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // High-DPI handling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0A0A0C";
      ctx.lineWidth = 2.2;
      // white background to make exported PNG visible
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, []);

  function getPoint(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPoint(e);
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = getPoint(e);
    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastPoint.current = p;
    setHasDrawing(true);
  }

  function end() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawing(false);
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return;
    const dataUrl = canvas.toDataURL("image/png");
    onConfirm(dataUrl);
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 8 }}>
        {hint || "وقّع داخل الإطار باستخدام الماوس أو الإصبع"}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        style={{
          width: "100%", height: 200,
          background: "#FFFFFF",
          borderRadius: 9,
          border: "1px dashed #C6914C",
          touchAction: "none",
          cursor: "crosshair",
          display: "block",
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button onClick={clear} disabled={busy || !hasDrawing}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#A1A1AA", fontSize: 12, cursor: hasDrawing ? "pointer" : "not-allowed",
            fontFamily: "'Tajawal', sans-serif", opacity: hasDrawing ? 1 : 0.5,
          }}>
          <Eraser size={13} /> مسح
        </button>
        {onCancel && (
          <button onClick={onCancel} disabled={busy}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 8,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
              color: "#F87171", fontSize: 12, cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif",
            }}>
            <X size={13} /> إلغاء
          </button>
        )}
        <button onClick={confirm} disabled={busy || !hasDrawing}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8,
            background: hasDrawing ? "linear-gradient(135deg, #C6914C, #8A5F2E)" : "#3F3F46",
            border: "none", color: hasDrawing ? "#0A0A0C" : "#71717A",
            fontSize: 12, fontWeight: 700, cursor: hasDrawing && !busy ? "pointer" : "not-allowed",
            fontFamily: "'Tajawal', sans-serif", opacity: busy ? 0.6 : 1,
          }}>
          {busy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
          تأكيد التوقيع
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </button>
      </div>
    </div>
  );
}
