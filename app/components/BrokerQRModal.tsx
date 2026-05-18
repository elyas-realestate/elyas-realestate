"use client";

import { useState } from "react";
import { X, Download, QrCode, IdCard, MessageCircle, Map } from "lucide-react";

// ══════════════════════════════════════════════════════════════
// BrokerQRModal — مولّد QR لبطاقة الوسيط
// ٤ أنواع: رابط البطاقة / vCard / WhatsApp / Map
// ══════════════════════════════════════════════════════════════

interface Props {
  slug: string;
  whatsapp?: string; // رقم واتساب (e.g., "966501234567")
  brokerName?: string;
  mapsUrl?: string; // رابط Google Maps
  accentColor?: string;
  bgColor?: string;
  textColor?: string;
  onClose: () => void;
}

const TYPES = [
  { id: "card", label: "بطاقتي", icon: IdCard, hint: "رابط بطاقتي التعريفية" },
  { id: "vcard", label: "vCard", icon: IdCard, hint: "تحميل بياناتي مباشرة في contacts" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, hint: "محادثة واتساب جاهزة" },
  { id: "maps", label: "موقعي", icon: Map, hint: "موقع المكتب على الخريطة" },
] as const;

type QRType = (typeof TYPES)[number]["id"];

export default function BrokerQRModal({
  slug,
  whatsapp,
  brokerName = "الوسيط",
  mapsUrl,
  accentColor = "#C6914C",
  bgColor = "#FAF7F2",
  textColor = "#1A1206",
  onClose,
}: Props) {
  const [activeType, setActiveType] = useState<QRType>("card");

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function getQRText(): string {
    switch (activeType) {
      case "card":
        return `${origin}/c/${slug}`;
      case "vcard":
        return `${origin}/api/vcard/${slug}`;
      case "whatsapp":
        if (!whatsapp) return "";
        return `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحباً ${brokerName}، أتواصل معك بخصوص العقارات`)}`;
      case "maps":
        return mapsUrl || "";
      default:
        return "";
    }
  }

  const qrText = getQRText();
  const qrUrl = qrText
    ? `/api/qr?text=${encodeURIComponent(qrText)}&color=${encodeURIComponent(textColor)}&bg=${encodeURIComponent(bgColor)}&size=512`
    : "";

  function downloadQR(format: "png" | "svg") {
    if (!qrText) return;
    const url = `/api/qr?text=${encodeURIComponent(qrText)}&color=${encodeURIComponent(textColor)}&bg=${encodeURIComponent(bgColor)}&size=1024&format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-qr-${activeType}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          width: "100%",
          maxWidth: 460,
          background: bgColor,
          color: textColor,
          borderRadius: 24,
          padding: 24,
          maxHeight: "90vh",
          overflow: "auto",
          border: `1px solid ${accentColor}33`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <QrCode size={20} style={{ color: accentColor }} />
            <h3 style={{ fontSize: 17, fontWeight: 800 }}>رمز QR</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: textColor,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = activeType === t.id;
            const disabled = (t.id === "whatsapp" && !whatsapp) || (t.id === "maps" && !mapsUrl);
            return (
              <button
                key={t.id}
                onClick={() => !disabled && setActiveType(t.id)}
                disabled={disabled}
                style={{
                  flex: "1 1 100px",
                  padding: "10px 8px",
                  borderRadius: 10,
                  border: `1px solid ${active ? accentColor : `${accentColor}33`}`,
                  background: active ? `${accentColor}1a` : "transparent",
                  color: disabled ? `${textColor}66` : active ? accentColor : textColor,
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Hint */}
        <p style={{ fontSize: 12, opacity: 0.7, textAlign: "center", marginBottom: 14 }}>
          {TYPES.find((t) => t.id === activeType)?.hint}
        </p>

        {/* QR Image */}
        <div
          style={{
            width: 280,
            height: 280,
            margin: "0 auto",
            background: bgColor,
            borderRadius: 16,
            padding: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${accentColor}22`,
          }}
        >
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <p style={{ fontSize: 12, opacity: 0.5 }}>غير متاح</p>
          )}
        </div>

        {/* Download buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button
            onClick={() => downloadQR("png")}
            disabled={!qrText}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 10,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              color: "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: qrText ? "pointer" : "not-allowed",
              opacity: qrText ? 1 : 0.5,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Download size={14} /> تحميل PNG
          </button>
          <button
            onClick={() => downloadQR("svg")}
            disabled={!qrText}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 10,
              background: "transparent",
              color: textColor,
              border: `1px solid ${accentColor}66`,
              fontSize: 13,
              fontWeight: 700,
              cursor: qrText ? "pointer" : "not-allowed",
              opacity: qrText ? 1 : 0.5,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Download size={14} /> تحميل SVG
          </button>
        </div>

        <p style={{ fontSize: 11, opacity: 0.55, textAlign: "center", marginTop: 12 }}>
          PNG للطباعة العادية • SVG للجودة العالية والمقاسات الكبيرة
        </p>
      </div>
    </div>
  );
}
