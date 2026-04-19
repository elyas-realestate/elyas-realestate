"use client";
import { useI18n } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 8,
        background: "rgba(198,145,76,0.06)",
        border: "1px solid rgba(198,145,76,0.12)",
        color: "#9A9AA0",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        letterSpacing: 0.3,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#C6914C"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9A9AA0"; }}
    >
      {lang === "ar" ? "EN" : "عر"}
    </button>
  );
}
