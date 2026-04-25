// ══════════════════════════════════════════════════════════════
// lib/org-constants.ts — ثوابت مشتركة لصفحات الهيكل التنظيمي
// ══════════════════════════════════════════════════════════════

import { Phone, Megaphone, Building, DollarSign, Rocket, Bot } from "lucide-react";

export const DEPARTMENT_META: Record<string, { label: string; color: string; bg: string; icon: typeof Bot }> = {
  cs:           { label: "خدمة العملاء",         color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  icon: Phone     },
  marketing:    { label: "التسويق",                color: "#C6914C", bg: "rgba(198,145,76,0.10)",  icon: Megaphone },
  asset:        { label: "إدارة الأملاك",         color: "#34D399", bg: "rgba(52,211,153,0.10)",  icon: Building  },
  financial:    { label: "المالية",                color: "#E8B86D", bg: "rgba(232,184,109,0.10)", icon: DollarSign },
  dev_bizdev:   { label: "التطوير وتطوير الأعمال", color: "#A78BFA", bg: "rgba(167,139,250,0.10)", icon: Rocket    },
};

export const PROVIDER_LABELS: Record<string, string> = {
  openai:    "OpenAI",
  anthropic: "Claude",
  google:    "Gemini",
  groq:      "Groq",
  deepseek:  "DeepSeek",
  xai:       "Grok",
  manus:     "Manus",
};

export const KB_CATEGORIES: Record<string, string> = {
  general:        "عام",
  faq:            "أسئلة متكرّرة",
  brand:          "هوية العلامة",
  policy:         "سياسات",
  property_data:  "بيانات العقارات",
  client_history: "تاريخ العملاء",
  market_intel:   "ذكاء سوقي",
};

export const DIRECTIVE_SOURCE_META: Record<string, { label: string; color: string; bg: string }> = {
  custom:    { label: "مخصّص (أنت)",          color: "#C6914C", bg: "rgba(198,145,76,0.10)" },
  inherited: { label: "موروث من المدير",       color: "#A78BFA", bg: "rgba(167,139,250,0.10)" },
  suggested: { label: "مقترَح من AI",           color: "#60A5FA", bg: "rgba(96,165,250,0.10)" },
};

export const TRIGGER_LABELS: Record<string, string> = {
  cron_daily:   "يومياً",
  cron_hourly:  "كل ساعة",
  cron_weekly:  "أسبوعياً",
  webhook:      "عند حدث",
  on_event:     "عند حدث",
};
