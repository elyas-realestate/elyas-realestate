// ══════════════════════════════════════════════════════════════
// lib/project-status.ts — قاعدة بيانات مدير المشروع
// كل ما يخص حالة المنصة، الخطط، التنافسية، الجاهزية.
// عدّل هذا الملف لما يتغيّر شي — والداشبورد يعكس فوراً.
// ══════════════════════════════════════════════════════════════

export type PhaseStatus = "done" | "in_progress" | "pending" | "blocked";
export type Priority = "p0" | "p1" | "p2";

export interface Milestone {
  code: string;
  name: string;
  status: PhaseStatus;
  description?: string;
  blockedBy?: string;
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  status: PhaseStatus;
  milestones: Milestone[];
  completedAt?: string;
}

export interface Competitor {
  name: string;
  url?: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  ourEdge: string;
}

export interface ReadinessItem {
  id: string;
  category: "أمان" | "مالي" | "ذكاء" | "تجربة" | "تشغيل" | "قانون";
  label: string;
  done: boolean;
  blocking: boolean;
  note?: string;
}

export interface SWOTItem {
  text: string;
  weight: 1 | 2 | 3; // 3 = أهم
}

export const PROJECT_META = {
  name: "وسيط برو",
  slug: "wasit-pro",
  tagline: "منصة الوسيط العقاري الذكي في السعودية",
  startedAt: "2026-03-23",
  targetBetaLaunch: "2026-06-15",
  ownerName: "إلياس الدخيل",
  marketScope: "السعودية — تركيز على الرياض",
};

// ─────────────────────────────────────────────────────────────
// المراحل — منظَّمة حسب prefix في قائمة المهام
// ─────────────────────────────────────────────────────────────
export const PHASES: Phase[] = [
  {
    id: "foundation",
    name: "الأساس التقني",
    description: "Super Admin + multi-tenant + RLS + auth",
    status: "done",
    completedAt: "2026-03-25",
    milestones: [
      { code: "FND-1", name: "Super Admin migration + UI", status: "done" },
      { code: "FND-2", name: "Multi-tenant schema + RLS", status: "done" },
      { code: "FND-3", name: "Storage bucket + security policies", status: "done" },
      { code: "FND-4", name: "Subscription system + plans", status: "done" },
    ],
  },
  {
    id: "ai-employees",
    name: "موظفو الذكاء الصناعي",
    description: "5 مدراء + 16 موظف ذكي مع توجيهات ومعرفة",
    status: "done",
    completedAt: "2026-04-10",
    milestones: [
      { code: "AI-1", name: "Migration 026 — جداول الموظفين", status: "done" },
      { code: "AI-2", name: "5 مدراء + 16 موظف seed", status: "done" },
      { code: "AI-3", name: "/dashboard/organization — هرم المنظومة", status: "done" },
      { code: "AI-4", name: "محرّك التوجيهات (ai-org-context)", status: "done" },
      { code: "AI-5", name: "/api/cron — 5 كرونات دورية", status: "done" },
      { code: "AI-6", name: "اقتراح توجيهات تلقائية بـ AI", status: "done" },
    ],
  },
  {
    id: "approval-gates",
    name: "بوابات الموافقة",
    description: "K-7 — إجراءات حرجة تحتاج موافقتك قبل التنفيذ",
    status: "done",
    completedAt: "2026-04-12",
    milestones: [
      { code: "AG-1", name: "Migration 032 — escalations", status: "done" },
      { code: "AG-2", name: "lib/approval-gates.ts", status: "done" },
      { code: "AG-3", name: "/dashboard/ceo/approvals UI", status: "done" },
      { code: "AG-4", name: "ربط في webhook + crons", status: "done" },
    ],
  },
  {
    id: "manager-loop",
    name: "حلقة المدراء اليومية",
    description: "K-8 — كل مدير يراجع موظفيه يومياً ويقترح تحسينات",
    status: "done",
    completedAt: "2026-04-15",
    milestones: [
      { code: "ML-1", name: "Migration 033 — manager_reviews", status: "done" },
      { code: "ML-2", name: "/api/cron/manager-loop", status: "done" },
      { code: "ML-3", name: "عرض في /dashboard/ceo", status: "done" },
      { code: "ML-4", name: "Summaries مخصّصة لكل مدير", status: "done" },
    ],
  },
  {
    id: "ceo-assistant",
    name: "السكرتير الذكي",
    description: "K-9 — عبر واتساب، يجيبك بأدوات حقيقية لا مجرد دردشة",
    status: "done",
    completedAt: "2026-04-28",
    milestones: [
      { code: "CEO-1", name: "ceo_assistant employee + توجيه صارم", status: "done" },
      { code: "CEO-2", name: "K-9 Phase 2 — 7 أدوات (deals/clients/...)", status: "done" },
      { code: "CEO-3", name: "تبديل النموذج إلى DeepSeek", status: "done" },
      { code: "CEO-4", name: "منع \"أحتاج توضيح\" نهائياً", status: "done" },
    ],
  },
  {
    id: "ux-theme",
    name: "نظام الألوان والتجربة",
    description: "T — Dark/Cream + متغيّرات CSS + brand accent",
    status: "done",
    completedAt: "2026-04-20",
    milestones: [
      { code: "T-1", name: "CSS variables + theme switcher", status: "done" },
      { code: "T-2", name: "Quick themes presets", status: "done" },
      { code: "T-3", name: "Brand color provider", status: "done" },
      { code: "T-4", name: "Sidebar restructure", status: "done" },
    ],
  },
  {
    id: "property-features",
    name: "ميزات العقارات والعملاء",
    description: "P — طلبات العقار + AI Matching + Maps coords",
    status: "in_progress",
    milestones: [
      { code: "P-1", name: "كيان طلبات العقار", status: "done" },
      { code: "P-2", name: "AI Property Matching + رسالة WhatsApp", status: "done" },
      { code: "P-3", name: "Bulk CSV Import للعقارات والعملاء", status: "done" },
      { code: "P-4", name: "استخراج إحداثيات Google Maps", status: "done" },
    ],
  },
  {
    id: "operations",
    name: "مركز التحكم التشغيلي",
    description: "II — مفتاح رئيسي + حد يومي + toggles لكل موظف ومدير",
    status: "done",
    completedAt: "2026-05-02",
    milestones: [
      { code: "II-1", name: "Migration 034 — master + counter", status: "done" },
      { code: "II-2", name: "lib/system-gate.ts", status: "done" },
      { code: "II-3", name: "ربط البوّاب في 5 crons + webhook", status: "done" },
      { code: "II-4", name: "API endpoints (master/employee/limit)", status: "done" },
      { code: "II-5", name: "/dashboard/ceo/operations UI", status: "done" },
    ],
  },
  {
    id: "ux-consolidation",
    name: "توحيد تجربة الـ AI",
    description: "II8 — دمج الصفحات المتفرقة في /dashboard/ai واحد",
    status: "in_progress",
    milestones: [
      { code: "UX-1", name: "تحليل CIB لنقاط الإرباك", status: "in_progress" },
      { code: "UX-2", name: "إنشاء /dashboard/ai بـ 6 تابات", status: "pending" },
      { code: "UX-3", name: "إعادة توجيه القديم → الجديد", status: "pending" },
      { code: "UX-4", name: "توحيد Toggle component", status: "pending" },
      { code: "UX-5", name: "اختصار sidebar إلى 5-7 عناصر", status: "pending" },
    ],
  },
  {
    id: "property-mgmt",
    name: "إدارة الأملاك",
    description: "D2 — مدفوعات + متأخرات + تذكير واتساب للمستأجرين",
    status: "pending",
    milestones: [
      { code: "D2-1", name: "جدول مدفوعات الإيجار", status: "pending" },
      { code: "D2-2", name: "تذكير تلقائي قبل الاستحقاق", status: "pending" },
      { code: "D2-3", name: "تتبع المتأخرات", status: "pending" },
      { code: "D2-4", name: "/dashboard/property-management", status: "pending" },
    ],
  },
  {
    id: "payments",
    name: "نظام الدفع",
    description: "D3 — Moyasar روابط دفع + VAT آلي",
    status: "pending",
    milestones: [
      { code: "D3-1", name: "تكامل Moyasar API", status: "pending" },
      { code: "D3-2", name: "إنشاء روابط دفع للعميل", status: "pending" },
      { code: "D3-3", name: "احتساب VAT 15% آلي", status: "pending" },
      { code: "D3-4", name: "Webhook استقبال دفع ناجح", status: "pending" },
    ],
  },
  {
    id: "beta-launch",
    name: "إطلاق Beta",
    description: "اختبار المنصة مع 10-30 وسيط فعليين",
    status: "pending",
    milestones: [
      { code: "B-1", name: "تثبيت التسعير (99/149/249)", status: "pending" },
      { code: "B-2", name: "صفحة هبوط للتسجيل في Beta", status: "pending" },
      { code: "B-3", name: "دعوة 10-30 وسيط من شبكتك", status: "pending" },
      { code: "B-4", name: "نظام تتبّع feedback", status: "pending" },
      { code: "B-5", name: "Onboarding يدوي للأوائل", status: "pending" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// المنافسون — من تحليلنا الاستراتيجي السابق
// ─────────────────────────────────────────────────────────────
export const COMPETITORS: Competitor[] = [
  {
    name: "تداولكم",
    positioning: "تطبيق إعلانات وتسويق عقاري مبسّط للوسطاء",
    strengths: [
      "حضور سوقي مبكر",
      "تطبيق جوّال متطور",
      "قاعدة وسطاء كبيرة",
    ],
    weaknesses: [
      "لا يقدّم إدارة شاملة للوسيط (CRM, متابعات، أتمتة)",
      "بدون موظفين أذكياء",
      "تركيز على الإعلان فقط",
    ],
    ourEdge: "نحن منظومة كاملة (CRM + AI + متابعات + تشغيل)، ليس فقط إعلانات.",
  },
  {
    name: "نزل",
    positioning: "إدارة العقارات للملّاك والمستأجرين",
    strengths: [
      "تخصص واضح في إدارة الأملاك",
      "دعم مدفوعات",
      "حضور قوي",
    ],
    weaknesses: [
      "لا يخدم الوسيط الفردي بشكل مباشر",
      "بدون AI",
      "تجربة مالك/مستأجر فقط",
    ],
    ourEdge: "وسيط برو موجَّه للوسيط أولاً + يضمّ إدارة الأملاك كميزة فرعية.",
  },
  {
    name: "تعاريف",
    positioning: "أداة مساعدة للوسطاء (عقود، نماذج)",
    strengths: [
      "نماذج وعقود جاهزة",
      "تركيز على عمل الوسيط اليومي",
    ],
    weaknesses: [
      "محدود الوظائف",
      "لا أتمتة ولا AI",
      "لا قاعدة عملاء مدمجة",
    ],
    ourEdge: "نقدّم عقود + AI + تسويق + متابعات في نظام واحد.",
  },
];

// ─────────────────────────────────────────────────────────────
// قائمة جاهزية الإطلاق
// ─────────────────────────────────────────────────────────────
export const LAUNCH_READINESS: ReadinessItem[] = [
  // أمان
  { id: "auth", category: "أمان", label: "تسجيل دخول + sessions", done: true, blocking: true },
  { id: "rls", category: "أمان", label: "RLS على كل الجداول", done: true, blocking: true },
  { id: "secrets", category: "أمان", label: "إخفاء secrets من frontend", done: true, blocking: true },
  { id: "2fa", category: "أمان", label: "2FA للحساب", done: false, blocking: false, note: "اختياري للـ Beta" },

  // ذكاء
  { id: "mas", category: "ذكاء", label: "16 موظف ذكي + 5 مدراء", done: true, blocking: true },
  { id: "operations", category: "ذكاء", label: "مركز تحكم تشغيلي", done: true, blocking: true },
  { id: "approvals", category: "ذكاء", label: "بوابات الموافقة على الإجراءات الحرجة", done: true, blocking: true },
  { id: "ceo-assistant", category: "ذكاء", label: "السكرتير الذكي عبر واتساب", done: true, blocking: false },

  // تجربة
  { id: "theme", category: "تجربة", label: "Dark + Cream themes", done: true, blocking: true },
  { id: "rtl", category: "تجربة", label: "RTL + عربي fully supported", done: true, blocking: true },
  { id: "pwa", category: "تجربة", label: "PWA — يثبت على الجوّال", done: true, blocking: false },
  { id: "ux-consolidation", category: "تجربة", label: "تجربة AI موحَّدة", done: false, blocking: false, note: "قيد العمل (II8)" },

  // تشغيل
  { id: "whatsapp-test", category: "تشغيل", label: "اختبار رسالة على رقم Meta التجريبي", done: false, blocking: false, note: "مرسَلة الآن، تحتاج تأكيد CIB" },
  { id: "whatsapp-real", category: "تشغيل", label: "رقم سعودي حقيقي معتمد من Meta", done: false, blocking: true, note: "يحتاج 1-3 أيام مراجعة" },
  { id: "deploy", category: "تشغيل", label: "Deploy على Vercel + crons شغّالة", done: true, blocking: true },
  { id: "monitoring", category: "تشغيل", label: "تتبّع الأخطاء (Sentry/equivalent)", done: false, blocking: false },

  // مالي
  { id: "subscription-plans", category: "مالي", label: "خطط اشتراك في DB", done: true, blocking: true },
  { id: "pricing-decision", category: "مالي", label: "تثبيت الأسعار النهائية (99/149/249)", done: false, blocking: true },
  { id: "moyasar", category: "مالي", label: "تكامل Moyasar للدفع الفعلي", done: false, blocking: true },
  { id: "vat", category: "مالي", label: "احتساب VAT 15%", done: false, blocking: true },
  { id: "zatca", category: "مالي", label: "فاتورة ZATCA متوافقة", done: true, blocking: false },

  // قانون
  { id: "tos", category: "قانون", label: "شروط الاستخدام", done: false, blocking: true },
  { id: "privacy", category: "قانون", label: "سياسة الخصوصية + PDPL", done: false, blocking: true },
  { id: "broker-license", category: "قانون", label: "حقل ترخيص فال للوسيط", done: true, blocking: false },
];

// ─────────────────────────────────────────────────────────────
// SWOT
// ─────────────────────────────────────────────────────────────
export const STRENGTHS: SWOTItem[] = [
  { text: "MAS كامل: 16 موظف + 5 مدراء بمحرّك توجيهات ديناميكي", weight: 3 },
  { text: "مركز تحكم تشغيلي — السوق ما عنده شي مماثل", weight: 3 },
  { text: "بوابات موافقة على الإجراءات الحرجة (لا يهرّب صفقات)", weight: 3 },
  { text: "Multi-tenant جاهز للتوسع", weight: 2 },
  { text: "PWA + Push Notifications", weight: 2 },
  { text: "مساعد CEO عبر واتساب بأدوات حقيقية", weight: 2 },
  { text: "Theme system احترافي (Dark + Cream)", weight: 1 },
];

export const WEAKNESSES: SWOTItem[] = [
  { text: "لا يوجد مستخدمون فعليون بعد — كل الاختبارات معك", weight: 3 },
  { text: "Moyasar غير مدمج — لا يوجد دفع فعلي", weight: 3 },
  { text: "WhatsApp على رقم Meta التجريبي فقط", weight: 3 },
  { text: "تجربة UX متفرقة — صفحات AI كثيرة", weight: 2 },
  { text: "لا يوجد monitoring/error tracking في إنتاج", weight: 2 },
  { text: "إدارة الأملاك (D2) لم تُبنَ بعد", weight: 2 },
  { text: "صفحات شروط/خصوصية مفقودة", weight: 2 },
];

export const OPPORTUNITIES: SWOTItem[] = [
  { text: "السوق العقاري السعودي ينمو + رؤية 2030", weight: 3 },
  { text: "الوسطاء الفرديون يفتقرون لأدوات احترافية", weight: 3 },
  { text: "AI لم يدخل القطاع العقاري السعودي بقوة بعد", weight: 3 },
  { text: "إمكانية شراكات مع منصات إعلانات عقارية", weight: 2 },
  { text: "بناء brand قوي قبل دخول لاعبين كبار", weight: 2 },
  { text: "تصدير المنظومة لخليج لاحقاً", weight: 1 },
];

export const THREATS: SWOTItem[] = [
  { text: "تداولكم ولاعبون قائمون قد يضيفون ميزات مماثلة", weight: 3 },
  { text: "تكلفة AI قد ترتفع مع التوسّع", weight: 2 },
  { text: "تغيّر سياسات Meta WhatsApp Business", weight: 2 },
  { text: "وسطاء جدد قد يفضّلون الأدوات المجانية", weight: 2 },
  { text: "متطلبات تنظيمية جديدة (PDPL، ZATCA، فال)", weight: 1 },
];

// ─────────────────────────────────────────────────────────────
// المخاطر النشطة + المعوّقات
// ─────────────────────────────────────────────────────────────
export interface Risk {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  impact: string;
  mitigation: string;
}

export const ACTIVE_RISKS: Risk[] = [
  {
    id: "r1",
    title: "WhatsApp على رقم تجريبي فقط",
    severity: "high",
    impact: "لا يمكن إطلاق Beta حقيقي بدون رقم سعودي معتمد",
    mitigation: "ابدأ مراجعة Meta Business Verification الأسبوع القادم (1-3 أيام)",
  },
  {
    id: "r2",
    title: "الدفع الفعلي غير مدمج",
    severity: "high",
    impact: "لا يستطيع وسيط دفع الاشتراك ولا الحصول على فاتورة",
    mitigation: "D3 — تكامل Moyasar (ساعتين عمل تقني + يوم اختبار)",
  },
  {
    id: "r3",
    title: "لا يوجد TOS + Privacy Policy",
    severity: "high",
    impact: "إطلاق Beta بدونهما = خطر قانوني",
    mitigation: "كتابة قالبين عربيين خلال يوم واحد + مراجعة محامي",
  },
  {
    id: "r4",
    title: "تجربة UX متفرقة",
    severity: "medium",
    impact: "يربك المستخدمين الجدد + يطيل onboarding",
    mitigation: "II8 — توحيد /dashboard/ai قيد العمل (CIB يحلل، أنا أنفّذ)",
  },
  {
    id: "r5",
    title: "لا يوجد error tracking",
    severity: "medium",
    impact: "أخطاء الإنتاج لن تُكتشف إلا عبر شكوى مستخدم",
    mitigation: "إضافة Sentry قبل Beta (نصف يوم عمل)",
  },
];

// ─────────────────────────────────────────────────────────────
// الأولويات الاستراتيجية الحالية
// ─────────────────────────────────────────────────────────────
export interface Priority_Item {
  id: string;
  rank: number;
  title: string;
  why: string;
  effort: string;
  impact: string;
}

export const TOP_PRIORITIES: Priority_Item[] = [
  {
    id: "p-payments",
    rank: 1,
    title: "دمج Moyasar (D3)",
    why: "بدون دفع فعلي ما في إيراد",
    effort: "يومان",
    impact: "بلوكر إطلاق Beta",
  },
  {
    id: "p-whatsapp",
    rank: 2,
    title: "ترقية WhatsApp لرقم سعودي",
    why: "بدونه، الـ MAS كله نظري",
    effort: "1-3 أيام (انتظار Meta)",
    impact: "بلوكر إطلاق Beta",
  },
  {
    id: "p-legal",
    rank: 3,
    title: "صفحات Legal (TOS + Privacy)",
    why: "إلزام قانوني",
    effort: "يوم واحد + مراجعة",
    impact: "بلوكر إطلاق",
  },
  {
    id: "p-pricing",
    rank: 4,
    title: "تثبيت التسعير النهائي",
    why: "ما تقدر تطلق Beta بدون أسعار محسومة",
    effort: "نصف يوم تفكير",
    impact: "تحدّد ROI",
  },
  {
    id: "p-ux",
    rank: 5,
    title: "توحيد UX (II8)",
    why: "تجربة واضحة = onboarding أسرع",
    effort: "3-4 أيام",
    impact: "تحسين conversion",
  },
  {
    id: "p-property-mgmt",
    rank: 6,
    title: "إدارة الأملاك (D2)",
    why: "ميزة تنافسية ضد نزل",
    effort: "أسبوع",
    impact: "توسيع السوق المستهدف",
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers لحساب التقدم
// ─────────────────────────────────────────────────────────────

export function phaseCompletionPct(phase: Phase): number {
  if (phase.milestones.length === 0) return 0;
  const done = phase.milestones.filter(m => m.status === "done").length;
  return Math.round((done / phase.milestones.length) * 100);
}

export function overallCompletionPct(): number {
  const all = PHASES.flatMap(p => p.milestones);
  if (all.length === 0) return 0;
  const done = all.filter(m => m.status === "done").length;
  return Math.round((done / all.length) * 100);
}

export function readinessPct(blockingOnly = true): number {
  const items = blockingOnly ? LAUNCH_READINESS.filter(r => r.blocking) : LAUNCH_READINESS;
  if (items.length === 0) return 0;
  const done = items.filter(r => r.done).length;
  return Math.round((done / items.length) * 100);
}

export function blockingGaps(): ReadinessItem[] {
  return LAUNCH_READINESS.filter(r => r.blocking && !r.done);
}

export function daysSinceStart(): number {
  const start = new Date(PROJECT_META.startedAt);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysToBeta(): number {
  const target = new Date(PROJECT_META.targetBetaLaunch);
  const now = new Date();
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * "أين أنا الآن؟" — جملة واحدة تلخّص الحالة للمالك.
 */
export function currentPositionSummary(): string {
  const overall = overallCompletionPct();
  const ready = readinessPct(true);
  const gaps = blockingGaps().length;
  const dToBeta = daysToBeta();

  if (gaps === 0) return `جاهز للإطلاق ✓ — اضغط الزناد متى ما حبّيت`;
  if (ready >= 80) return `قريب من الجاهزية (${ready}٪). ينقصك ${gaps} عناصر بلوكر قبل Beta. تبقى ${dToBeta} يوم على الموعد.`;
  if (ready >= 50) return `في منتصف الطريق (${ready}٪ جاهزية). ركّز على الأولويات الـ 3 الأولى.`;
  return `مرحلة بناء فعّالة (${overall}٪ تنفيذ تقني). الجاهزية للإطلاق ${ready}٪.`;
}
