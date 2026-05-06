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
  blockedBy?: string;
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
    id: "ux-restructure-ss",
    name: "إعادة هيكلة شاملة بناءً على CIB audit (SS)",
    description: "تنظيف copy-paste + إصلاح الثيم + sidebar 7 + Office Mode + /today + Hero promotion + Help Center",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "SS-A1", name: "حذف فئات متاجر/توصيل من مكتبة البطاقة", status: "done" },
      { code: "SS-A2", name: "إصلاح ٤ صفحات (work-orders, assets, team, contracts)", status: "done" },
      { code: "SS-B1", name: "Sidebar 32→7 primary + Office Mode toggle", status: "done" },
      { code: "SS-C1", name: "/dashboard/today صفحة موحَّدة", status: "done" },
      { code: "SS-D",  name: "Hero promotion للـ AI + Card في /dashboard (CIB #5)", status: "done" },
      { code: "SS-E",  name: "/dashboard/help مركز مساعدة بـ ٧ أقسام + بحث + FAQ", status: "done" },
    ],
  },
  {
    id: "ux-consolidation",
    name: "توحيد تجربة الـ AI (KK + LL)",
    description: "دمج الصفحات المتفرقة في /dashboard/ai واحد بستة تابات + إصلاح ٥ bugs من CIB",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "UX-1", name: "تحليل CIB لنقاط الإرباك (39 رابط → 6)", status: "done" },
      { code: "UX-2", name: "/dashboard/ai layout + hero stats + 6 tabs", status: "done" },
      { code: "UX-3", name: "تابات: التحكم، المساعدون، الاختبار، المخرجات، الموافقات، المزوّدون", status: "done" },
      { code: "UX-4", name: "Redirects من المسارات القديمة", status: "done" },
      { code: "UX-5", name: "اختصار sidebar من 39 إلى 5 عناصر primary", status: "done" },
      { code: "UX-6", name: "Toaster + richColors (أخضر/أحمر)", status: "done" },
      { code: "UX-7", name: "Hero refresh فوري بـ custom event", status: "done" },
      { code: "UX-8", name: "Skeleton أثناء التحميل", status: "done" },
      { code: "UX-9", name: "outputs_count موحَّد في status API", status: "done" },
    ],
  },
  {
    id: "profile-card",
    name: "بطاقة الوسيط (Linktree-style) — MM + MM-V2",
    description: "نظام Element Library كامل (Linktree/Bilenda-grade): 30+ عنصر، 8 فئات، فورمات ديناميكية، نماذج تفاعلية",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "MM-1", name: "Migration 035: profile_cards + profile_links + RLS + seed", status: "done" },
      { code: "MM-2", name: "/c/[slug] الصفحة العامة (V1)", status: "done" },
      { code: "MM-3", name: "/dashboard/profile-card لوحة التحكم (V1)", status: "done" },
      { code: "MM-4", name: "API routes — GET/PUT card + CRUD links", status: "done" },
      { code: "MM-5", name: "ربط في sidebar", status: "done" },
      { code: "MM-FIX1", name: "دمج site_settings + broker_identity", status: "done" },
      { code: "MM-FIX2", name: "QR محلي بـ qrcode npm + initials avatar", status: "done" },
      { code: "MM-FIX3", name: "إزالة rewrite landing dark", status: "done" },
      { code: "MM-V2.1", name: "lib/profile-elements.ts — 30+ عنصر، 8 فئات + Migration 036 metadata column", status: "done" },
      { code: "MM-V2.2", name: "/c/[slug] يرسم العناصر ديناميكياً من الكتالوج", status: "done" },
      { code: "MM-V2.3", name: "Element Library modal + فورمات ديناميكية + drag-drop يدوي", status: "done" },
      { code: "MM-V2.4", name: "نموذج اتصل بنا تفاعلي + جدول submissions + endpoint", status: "done" },
      { code: "MM-V3", name: "Auto-pull من site_settings — مصدر واحد للحقيقة، لا تكرار في الإدخال", status: "done" },
      { code: "MM-V3-FIX", name: "قسم رخص مخصص + 7 حقول سعودية + telegram/gmaps auto-pull + CR validation", status: "done" },
    ],
  },
  {
    id: "social-smart",
    name: "إدخال وسائل التواصل الذكي — NN",
    description: "قبول username بدون https://platform.com/ ويحوّل تلقائياً",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "NN-1", name: "lib/social-normalize.ts (9 منصات)", status: "done" },
      { code: "NN-2", name: "تطبيقه في /dashboard/settings + onBlur + onSave", status: "done" },
      { code: "NN-3", name: "Smart placeholders + توضيح للمستخدم", status: "done" },
    ],
  },
  {
    id: "subdomain",
    name: "Subdomain للوسيط — OO (مؤجَّل)",
    description: "elyas.wpro.sa بدل /elyas — يحتاج شراء دومين",
    status: "blocked",
    blockedBy: "domain-purchase",
    milestones: [
      { code: "OO-1", name: "Middleware يقرأ host → يكشف subdomain", status: "pending" },
      { code: "OO-2", name: "Wildcard DNS + Vercel custom domain", status: "pending", blockedBy: "domain-purchase" },
      { code: "OO-3", name: "301 redirect من /[slug] للـ subdomain", status: "pending", blockedBy: "domain-purchase" },
    ],
  },
  {
    id: "cream-default",
    name: "الكريمي = الثيم الافتراضي — PP",
    description: "تطبيق الكريمي على landing + اعتباره الافتراضي للمستخدم الجديد",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "PP-1", name: ":root + cream في CSS — أصبح الافتراضي", status: "done" },
      { code: "PP-2", name: "init script في layout.tsx يضع cream عند عدم وجود تفضيل", status: "done" },
      { code: "PP-3", name: "ألوان /[slug] الافتراضية — كريمي بدل أسود", status: "done" },
      { code: "PP-4", name: "ThemeSwitcher يبدأ بـ cream + تمييز الافتراضي", status: "done" },
    ],
  },
  {
    id: "tracker-link",
    name: "رابط تتبّع المشروع في الـ header — QQ",
    description: "زر بارز بجانب /slug للوصول السريع",
    status: "done",
    completedAt: "2026-05-03",
    milestones: [
      { code: "QQ-1", name: "إضافة الرابط بتدرج ذهبي بارز", status: "done" },
    ],
  },
  {
    id: "ux-simplification-2",
    name: "تبسيط UX المرحلة الثانية + كتيّب — RR",
    description: "Onboarding tour + tooltips + /help + simplified mode",
    status: "pending",
    milestones: [
      { code: "RR-1", name: "Onboarding tour (Joyride) لأول مرة", status: "pending" },
      { code: "RR-2", name: "زر '?' بجانب كل قسم رئيسي", status: "pending" },
      { code: "RR-3", name: "/dashboard/help — مركز المساعدة", status: "pending" },
      { code: "RR-4", name: "Simplified mode: يخفي ميزات المتقدمين عن المبتدئين", status: "pending" },
      { code: "RR-5", name: "كتيّب PDF عربي للوسيط الجديد", status: "pending" },
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
    description: "D3 — Moyasar API + webhook + payment events + ZATCA invoices",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "D3-1", name: "lib/moyasar.ts + /api/payment route", status: "done" },
      { code: "D3-2", name: "Moyasar webhook + payment_events audit table", status: "done" },
      { code: "D3-3", name: "lib/vat.ts + getPlanBreakdown — احتساب VAT 15% آلي", status: "done" },
      { code: "D3-4", name: "Webhook ينشئ فاتورة subscription_invoices تلقائياً عند نجاح الدفع", status: "done" },
      { code: "D3-5", name: "Migration 043 — جدول subscription_invoices متوافق مع ZATCA", status: "done" },
    ],
  },
  {
    id: "wa-real",
    name: "WhatsApp Business — رقم سعودي حقيقي (WA-REAL)",
    description: "ربط رقم سعودي معتمد من Meta + بنية تحتية كاملة. أُنجزت في جلستين (4-5 مايو 2026) مع كلود في المتصفح.",
    status: "done",
    completedAt: "2026-05-05",
    milestones: [
      { code: "WA-1", name: "Meta Business Manager — Verified ✓ (Elyas Aldakhil Real Estate)", status: "done" },
      { code: "WA-2", name: "WABA #3 (وسيط برو) + رقم سعودي +966575828854", status: "done" },
      { code: "WA-3", name: "Meta Developer App (Wasit Pro API) + System User + Permanent Token", status: "done" },
      { code: "WA-4a", name: "META_WEBHOOK_VERIFY_TOKEN في Vercel", status: "done" },
      { code: "WA-4b", name: "Webhook URL + Subscribe Fields (messages + template_status_update)", status: "done" },
      { code: "WA-4c", name: "حفظ بيانات WABA في /dashboard/whatsapp/settings", status: "done" },
      { code: "WA-4d", name: "Phone Registration with Two-step PIN", status: "done" },
      { code: "WA-4e", name: "Subscribed Apps (WABA-level)", status: "done" },
      { code: "WA-4f", name: "Privacy + Terms URLs في App Settings", status: "done" },
      { code: "WA-5", name: "إضافة بطاقة دفع SAR (Visa) — Step 2 مكتمل", status: "done" },
      { code: "WA-FIX", name: "إصلاح Vercel async kill في webhook handler (await processWebhook)", status: "done" },
      { code: "WA-TEST", name: "اختبار End-to-End ناجح: Inbound + Outbound + AI auto-reply", status: "done" },
      { code: "WA-ROTATE", name: "Rotation كامل للتوكن + App Secret (إغلاق التسرب الأمني)", status: "done" },
      { code: "WA-7", name: "Display Name 'Elyas Real Estate' — Pending Review (قُدّم 6 مايو بعد رفض 3 محاولات سابقة)", status: "in_progress" },
    ],
  },
  {
    id: "ceo-identity",
    name: "هوية الرئيس التنفيذي (CEO Identity)",
    description: "نظام تعريف موحَّد للمالك يربط كل قنوات التماس (واتساب، إيميل، داشبورد) بهوية واحدة + ربط تلقائي بالسكرتير الذكي",
    status: "done",
    completedAt: "2026-05-05",
    milestones: [
      { code: "CEO-ID-1", name: "Migration 042 — جدول ceo_identity + RLS + دالة is_ceo_phone + ترحيل تلقائي من ceo_phones القديم", status: "done" },
      { code: "CEO-ID-2", name: "API endpoint /api/ceo-identity (GET/PUT) + validation + phone normalization", status: "done" },
      { code: "CEO-ID-3", name: "صفحة /dashboard/ceo/identity كاملة — اسم/مسمى/إيميل/أرقام متعددة/لقب/نبرة", status: "done" },
      { code: "CEO-ID-4", name: "تحديث webhook ليقرأ من ceo_identity أولاً + fallback للقديم", status: "done" },
      { code: "CEO-ID-5", name: "ربط في /dashboard/ceo (زر هوية الرئيس التنفيذي)", status: "done" },
    ],
  },
  {
    id: "onboarding-support",
    name: "Onboarding + Support Flow",
    description: "تجربة الوسيط الجديد + قناة دعم متكاملة",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "ONB-1", name: "Migration 044 — جدولين: support_requests + tenant_onboarding", status: "done" },
      { code: "ONB-2", name: "API /api/support-request (POST/GET) + validation", status: "done" },
      { code: "ONB-3", name: "API /api/onboarding (auto-detect 4 خطوات)", status: "done" },
      { code: "ONB-4", name: "OnboardingChecklist component في /dashboard (يختفي عند الإنجاز)", status: "done" },
      { code: "ONB-5", name: "SupportContact في /dashboard/help (واتساب + إيميل + form)", status: "done" },
      { code: "ONB-6", name: "RLS + auto-detect للخطوات (profile/property/whatsapp/assistant)", status: "done" },
    ],
  },
  {
    id: "monitoring-sentry",
    name: "Monitoring (Sentry)",
    description: "تتبّع أخطاء الإنتاج في الـ frontend والـ backend",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "SEN-1", name: "Sentry config files (client/server/edge) + instrumentation.ts", status: "done" },
      { code: "SEN-2", name: "withSentryConfig wrapper في next.config.ts", status: "done" },
      { code: "SEN-3", name: "Global error boundary (app/global-error.tsx) — UI لطيف للمستخدم", status: "done" },
      { code: "SEN-4", name: "Endpoint اختبار /api/sentry-test (محمي بـ CRON_SECRET)", status: "done" },
      { code: "SEN-5", name: "CSP محدَّث للسماح بـ Sentry ingest endpoints", status: "done" },
      { code: "SEN-6", name: "ربط بحساب Sentry فعلي + إضافة DSN في Vercel", status: "done" },
      { code: "SEN-7", name: "اختبار End-to-End ناجح: خطأ ملتقَط في Sentry dashboard", status: "done" },
      { code: "SEN-8", name: "تحسين endpoint الاختبار: مصادقة المالك بديل للـ secret", status: "done" },
    ],
  },
  {
    id: "card-rebuild-phase1",
    name: "إعادة بناء البطاقة — Phase 1 (Foundation)",
    description: "إصلاح SAR icon + Brand Icons + vCard + Lead Capture Gate + QR + Schema.org",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "P1-SAR", name: "SARIcon — استخدام PNG الرسمي مع CSS Mask للتلوين", status: "done" },
      { code: "P1-1", name: "Migration 047 — lead_captures + visit_bookings + views_log + cols", status: "done" },
      { code: "P1-2", name: "API /api/lead-capture (POST مع validation + cookie)", status: "done" },
      { code: "P1-3", name: "API /api/vcard/[slug] (تحميل vCard .vcf مع PDPL)", status: "done" },
      { code: "P1-4", name: "LeadCaptureGate component (الميزة القاتلة)", status: "done" },
      { code: "P1-5", name: "BrandIcons component — 13 أيقونة SVG رسمية (Simple Icons)", status: "done" },
      { code: "P1-6", name: "API /api/qr (PNG + SVG، colors + size مخصصة)", status: "done" },
      { code: "P1-7", name: "BrokerQRModal component (4 types: card/vcard/whatsapp/maps)", status: "done" },
      { code: "P1-8", name: "lib/schema-org.ts — JSON-LD generators (RealEstateAgent + Listing + Breadcrumb)", status: "done" },
    ],
  },
  {
    id: "card-rebuild-phase2",
    name: "إعادة بناء البطاقة — Phase 2 (Visual + Trust)",
    description: "20 ثيم + Testimonials + Property Comparison + رخص متعددة",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "P2-1", name: "Migration 048 — testimonials + property_comparisons + 8 رخص/تخصصات", status: "done" },
      { code: "P2-2", name: "lib/card-themes.ts — 20 ثيم احترافي (luxury/modern/classic/minimal/bold/specialty)", status: "done" },
      { code: "P2-3", name: "broker_identity أعمدة جديدة: maroof_id + muthawiq_id + هيئة العقار + سنوات الخبرة + التخصصات + المناطق", status: "done" },
    ],
  },
  {
    id: "card-rebuild-phase4",
    name: "الميزات المبتكرة — Phase 4 (AI Innovations)",
    description: "5 ميزات AI تستفيد من البنية الموجودة",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "P4-1", name: "Migration 049 — voice_intakes + virtual_staging + alerts + catalog_sync + neighborhood_intel", status: "done" },
      { code: "P4-2", name: "API /api/ai/voice-to-property — transcript → GPT extraction → JSON", status: "done" },
      { code: "P4-3", name: "API /api/ai/smart-matching — alerts vs properties scoring (60%+ matches)", status: "done" },
      { code: "P4-4", name: "API /api/ai/neighborhood-intel — AI generation + 30-day cache", status: "done" },
      { code: "P4-5", name: "Virtual Staging table — جاهز لـ Stable Diffusion integration", status: "in_progress" },
      { code: "P4-6", name: "WhatsApp Catalog Sync table — جاهز لـ Meta Catalog API", status: "in_progress" },
    ],
  },
  {
    id: "card-rebuild-phase3",
    name: "إعادة بناء البطاقة — Phase 3 (UI Integration)",
    description: "ربط البنية التحتية بـ UI: Save Contact، LeadCapture، Themes Picker، Testimonials، Neighborhood، QR",
    status: "in_progress",
    completedAt: "2026-05-06",
    milestones: [
      { code: "P3-1", name: "SaveContactButton — زر Hero مميّز 'اضغط لحفظ في جهات اتصالك' لـ iPhone/Android/Huawei", status: "done" },
      { code: "P3-2", name: "ربط SaveContactButton في /c/[slug] (هيرو) و /[slug] (نافبار + قسم تواصل)", status: "done" },
      { code: "P3-3", name: "LeadCaptureGate في /properties/[id] — يلفّ أزرار الاتصال إذا require_lead_capture=true", status: "done" },
      { code: "P3-4", name: "NeighborhoodIntel widget في /properties/[id] — استدعاء AI + عرض إحصائيات الحي", status: "done" },
      { code: "P3-5", name: "TestimonialsSection في /c/[slug] — عرض آراء العملاء بنجوم + featured badge", status: "done" },
      { code: "P3-6", name: "CardThemePicker — مودال 20 ثيم بفلاتر فئات (luxury/modern/...)، مربوط بـ profile_cards", status: "done" },
      { code: "P3-7", name: "BrokerQRModal trigger — زر 'رمز QR' في profile-card editor", status: "done" },
      { code: "P3-8", name: "Compare page /compare?ids=... — صفحة مقارنة العقارات", status: "pending" },
      { code: "P3-9", name: "Voice-to-Property UI — زر تسجيل صوتي في /properties/add", status: "pending" },
      { code: "P3-10", name: "Smart Matching UI — /dashboard/clients/[id]/alerts", status: "pending" },
      { code: "P3-11", name: "Themes Picker — preview على السمات والخطوط داخل الـ picker", status: "pending" },
    ],
  },
  {
    id: "ux-fixes-batch",
    name: "إصلاحات UX من ملاحظات المالك (٦ مايو)",
    description: "زر دخول في صفحة الوسيط + تسمية أوضح + روابط سوشال في البطاقة + تشخيص login",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "UX-FIX-1", name: "زر تسجيل دخول في navbar صفحة /[slug]", status: "done" },
      { code: "UX-FIX-2", name: "زر /elyas → 'زيارة موقعي' (أوضح وأجمل)", status: "done" },
      { code: "UX-FIX-3", name: "تشخيص login: حسابك سليم، session شغّالة، كلمة المرور فقط هي المشكلة", status: "done" },
      { code: "UX-FIX-4", name: "قسم 'روابط تلقائية في بطاقتك' في /profile-card مع preview cards", status: "done" },
    ],
  },
  {
    id: "seo-analytics",
    name: "SEO + Analytics — Phase 5",
    description: "sitemap + robots + Open Graph + Twitter cards + analytics",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "SEO-1", name: "sitemap.xml ديناميكي (ثابت + الوسطاء + العقارات)", status: "done" },
      { code: "SEO-2", name: "robots.txt مع AI crawlers (GPTBot, ChatGPT, Claude, Perplexity)", status: "done" },
      { code: "SEO-3", name: "Open Graph + Twitter cards في root layout", status: "done" },
      { code: "SEO-4", name: "metadataBase + keywords + canonical structure", status: "done" },
      { code: "SEO-5", name: "Custom analytics tracker موجود في app/components/AnalyticsTracker.tsx", status: "done" },
    ],
  },
  {
    id: "beta-invite",
    name: "Beta Invite Mechanism — Phase 6",
    description: "نظام دعوات + قائمة انتظار + APIs",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "BETA-1", name: "Migration 046 — invite_codes + beta_waitlist + RLS + RPCs", status: "done" },
      { code: "BETA-2", name: "RPC validate_invite_code + consume_invite_code (atomic)", status: "done" },
      { code: "BETA-3", name: "API /api/invite-code/validate + /api/waitlist", status: "done" },
      { code: "BETA-4", name: "WaitlistForm component (للـ landing أو /beta)", status: "done" },
      { code: "BETA-5", name: "بذور: 3 أكواد Beta أولية (WASIT-BETA-1/2/3)", status: "done" },
      { code: "BETA-6", name: "ربط في register page (validate قبل + consume بعد signup) + حقل invite code", status: "done" },
      { code: "BETA-7", name: "WaitlistForm مرتبط في landing page (قسم Beta قبل footer)", status: "done" },
      { code: "BETA-8", name: "20 كود Wave-1 جاهزة في DB (WP-W1-XXXXXX)", status: "done" },
      { code: "BETA-9", name: "خطة إطلاق مكتوبة في docs/beta-launch-plan.md (timeline + KPIs + رسائل قوالب)", status: "done" },
      { code: "BUG-1", name: "إصلاح hover dark cards — كان hardcoded #141418 في organization page", status: "done" },
    ],
  },
  {
    id: "duplication-deep-cleanup",
    name: "تنظيف التكرارات الوظيفية — المرحلة العميقة (CIB Audit)",
    description: "اكتشاف وتصحيح ٣ تكرارات إضافية كشفها CIB: هوية في 3 جداول، زر ثيم في profile-card، بريد إشعارات مكرّر",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "DEEP-1", name: "حذف زر 'الثيم' من /profile-card → link لـ /settings?tab=design", status: "done" },
      { code: "DEEP-2", name: "تبويب 'هوية الوسيط' في /content → banner يحوّل لـ /settings", status: "done" },
      { code: "DEEP-3", name: "إزالة حقل 'بريد الإشعارات' المكرّر من /settings/profile → لينك لـ /notifications", status: "done" },
      { code: "DEEP-4", name: "لينك لـ /whatsapp/settings من /settings/contact (للتكامل المتقدّم)", status: "done" },
      { code: "DEEP-5", name: "GrowthNav component مشترك بين /content + /marketing + /distribute", status: "done" },
      { code: "DEEP-6", name: "AIAssistant component مشترك (موجود سلفاً في app/dashboard/layout.tsx)", status: "done" },
      { code: "DEEP-7", name: "docs/ux-canonical-pages.md — توثيق Source of Truth pattern + خريطة الـ redirects", status: "done" },
      { code: "DEEP-8", name: "تنبيهات Inheritance في profile-card + ceo/identity — leave empty to use defaults", status: "done" },
      { code: "DEEP-9", name: "useBrokerProfile() hook موحَّد — مؤجَّل (يحتاج refactor متعدد الملفات)", status: "pending" },
      { code: "DEEP-10", name: "Search filter داخل /settings — مؤجَّل (٦ تبويبات قابلة للتذكر، أولوية منخفضة)", status: "pending" },
    ],
  },
  {
    id: "duplication-cleanup",
    name: "تنظيف التكرارات الوظيفية (Functional Dedup)",
    description: "حذف الصفحات المكرّرة + توحيد إدارة الثيم/الهوية + Hubs بتبويبات",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "DUP-1", name: "حذف /dashboard/theme (يكتب لحقول ميتة) → redirect لـ /settings", status: "done" },
      { code: "DUP-2", name: "حذف /dashboard/visual-editor (مكرر مع settings tab=design) → redirect", status: "done" },
      { code: "DUP-3", name: "توحيد الهوية: UI hints في profile-card و ceo/identity توضح التوريث من broker_identity", status: "done" },
      { code: "DUP-4", name: "FAL license — مؤجَّل (موجود في 14 ملف، ترحيله مخاطرة عالية)", status: "pending" },
      { code: "DUP-5", name: "/dashboard/whatsapp Hub — layout بتبويبات (محادثات/قوالب/إعدادات)", status: "done" },
      { code: "DUP-6", name: "/dashboard/ceo Hub — layout بتبويبات (نظرة عامة/الهوية/الموافقات)", status: "done" },
      { code: "DUP-7", name: "settings menu نُظّفت من 10 → 7 (حذف theme/notifications/CEO identity المكرّرة)", status: "done" },
      { code: "DUP-8", name: "Property add/smart-add — toggle UI في رأس كل صفحة للتنقل بينهما", status: "done" },
      { code: "DUP-9", name: "/dashboard/content مرتبط من sidebar Tools group", status: "done" },
      { code: "DUP-10", name: "حذف الـ 9 redirects القديمة — مؤجَّل لـ شهرين (لتفادي bookmarks مكسورة)", status: "pending" },
    ],
  },
  {
    id: "navigation-audit",
    name: "تنظيف معمارية الـ Routing (Pipe Audit)",
    description: "فحص شامل لـ 96 صفحة + إصلاح يتامى وروابط مكسورة وتكرارات",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "NAV-1", name: "إصلاح رابط مكسور /clients/add في /today", status: "done" },
      { code: "NAV-2", name: "حلّ تكرار property-requests ↔ requests (٣ صفحات → redirects)", status: "done" },
      { code: "NAV-3", name: "إضافة /deals + /tasks + /requests إلى مجموعة 'العمل اليومي' الجديدة", status: "done" },
      { code: "NAV-4", name: "إضافة /documents لـ Tools group", status: "done" },
      { code: "NAV-5", name: "إضافة /theme لـ Settings menu", status: "done" },
      { code: "NAV-6", name: "تحويل /site-settings إلى redirect لـ /settings (إزالة تكرار)", status: "done" },
      { code: "NAV-7", name: "ربط /invoices + /quotations + /commissions + /goals + /reports من /financial", status: "done" },
      { code: "NAV-8", name: "ربط /content من /dashboard/ai (محتوى AI)", status: "done" },
      { code: "NAV-9", name: "تأكيد ai-foundation + ai-employees redirects (موجودة سلفاً)", status: "done" },
    ],
  },
  {
    id: "ui-bugs",
    name: "UI Bugs (تشكيل/Hover)",
    description: "أخطاء بصرية متفرقة على الواجهة — تجمع وتُصلح كـ batch",
    status: "pending",
    milestones: [
      { code: "BUG-1", name: "بطاقات المدراء تتحوّل لخلفية سوداء عند hover (ربما /dashboard/ai/control أو organization)", status: "pending" },
    ],
  },
  {
    id: "settings-photo-fix",
    name: "إصلاح رفع الصورة الشخصية + Storage Buckets",
    description: "Migration 045 + cleanup كود رفع الصورة",
    status: "done",
    completedAt: "2026-05-06",
    milestones: [
      { code: "SET-1", name: "Migration 045 — buckets (avatars + assets) مع RLS صحيح", status: "done" },
      { code: "SET-2", name: "إصلاح handlePhotoChange: tenant-scoped update + رسائل خطأ واضحة + path آمن", status: "done" },
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
  { id: "ux-consolidation", category: "تجربة", label: "تجربة AI موحَّدة في /dashboard/ai", done: true, blocking: false },

  // تشغيل
  { id: "whatsapp-test", category: "تشغيل", label: "اختبار رسالة على رقم Meta التجريبي", done: true, blocking: false, note: "تم استبداله بالرقم الحقيقي" },
  { id: "whatsapp-real", category: "تشغيل", label: "رقم سعودي حقيقي معتمد من Meta", done: true, blocking: true, note: "+966575828854 — End-to-End يعمل" },
  { id: "deploy", category: "تشغيل", label: "Deploy على Vercel + crons شغّالة", done: true, blocking: true },
  { id: "monitoring", category: "تشغيل", label: "تتبّع الأخطاء (Sentry)", done: true, blocking: false, note: "Sentry SDK + 4 config files + global-error boundary + test endpoint" },
  { id: "rate-limit", category: "تشغيل", label: "Rate limiting على APIs", done: false, blocking: false },
  { id: "backups", category: "تشغيل", label: "تأكيد Supabase auto-backups", done: false, blocking: false },
  { id: "error-boundaries", category: "تشغيل", label: "Error boundaries في React + صفحات 500/404", done: false, blocking: false },

  // مالي
  { id: "subscription-plans", category: "مالي", label: "خطط اشتراك في DB", done: true, blocking: true },
  { id: "pricing-decision", category: "مالي", label: "تثبيت الأسعار النهائية (99/149/249)", done: false, blocking: true },
  { id: "moyasar", category: "مالي", label: "تكامل Moyasar للدفع الفعلي", done: false, blocking: true },
  { id: "vat", category: "مالي", label: "احتساب VAT 15%", done: true, blocking: true, note: "lib/vat.ts + integration كاملة" },
  { id: "zatca", category: "مالي", label: "فاتورة ZATCA متوافقة", done: true, blocking: false },

  // قانون
  { id: "tos", category: "قانون", label: "شروط الاستخدام", done: true, blocking: true, note: "/terms موجودة" },
  { id: "privacy", category: "قانون", label: "سياسة الخصوصية + PDPL", done: true, blocking: true, note: "/privacy موجودة" },
  { id: "broker-license", category: "قانون", label: "حقل ترخيص فال للوسيط", done: true, blocking: false },
  { id: "pdpl-rights", category: "قانون", label: "حقوق المستخدم (تصدير/حذف بيانات)", done: false, blocking: false },
  { id: "subscription-contract", category: "قانون", label: "عقد اشتراك واضح + قبول صريح", done: false, blocking: false },

  // تجربة (إضافات)
  { id: "onboarding-flow", category: "تجربة", label: "Onboarding flow للوسيط الجديد (أول 5 دقائق)", done: true, blocking: false, note: "OnboardingChecklist في /dashboard مع 4 خطوات auto-detect" },
  { id: "transactional-emails", category: "تجربة", label: "إيميلات معاملاتية (welcome, reset, receipt)", done: false, blocking: false },
  { id: "mobile-audit", category: "تجربة", label: "فحص responsiveness على الجوّال لكل الصفحات", done: false, blocking: false },
  { id: "loading-states", category: "تجربة", label: "Loading + Error states موحَّدة", done: false, blocking: false },

  // تسويق & SEO
  { id: "sitemap", category: "تشغيل", label: "Sitemap.xml + robots.txt", done: false, blocking: false },
  { id: "meta-tags", category: "تشغيل", label: "Open Graph + Twitter cards على landing", done: false, blocking: false },
  { id: "analytics", category: "تشغيل", label: "Analytics (PostHog/Plausible/GA4)", done: false, blocking: false },

  // تشغيل Beta
  { id: "beta-invite", category: "تشغيل", label: "آلية دعوة Beta (invite codes / waitlist)", done: false, blocking: false },
  { id: "feedback-loop", category: "تشغيل", label: "نظام جمع feedback للوسطاء التجريبيين", done: false, blocking: false },
  { id: "support-channel", category: "تشغيل", label: "قناة دعم العملاء (واتساب / form)", done: true, blocking: false, note: "SupportContact widget + form في /dashboard/help + جدول support_requests" },
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
  { text: "Moyasar webhook لم يُكمل (D3-3 + D3-4: VAT + معالجة دفع ناجح)", weight: 3 },
  { text: "لا يوجد monitoring/error tracking في إنتاج (Sentry)", weight: 2 },
  { text: "Onboarding flow للوسيط الجديد غير مصمم", weight: 2 },
  { text: "إيميلات معاملاتية غير مضبوطة (welcome, reset, receipt)", weight: 2 },
  { text: "إدارة الأملاك (D2) لم تُبنَ بعد", weight: 2 },
  { text: "لا analytics — لا نعرف كيف يستخدمها الوسطاء", weight: 1 },
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
    title: "تجربة UX (تم حلّها)",
    severity: "low",
    impact: "كانت تربك المستخدمين الجدد",
    mitigation: "✅ KK — تم توحيد /dashboard/ai بستة تابات + اختصار sidebar من 39→5",
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

// أولويات معاد ترتيبها: المالك أجّل الإطلاق ويركّز على اكتمال الرؤية والتبسيط
export const TOP_PRIORITIES: Priority_Item[] = [
  {
    id: "p-cream",
    rank: 1,
    title: "الكريمي = الافتراضي + landing (PP)",
    why: "أول انطباع للمستخدم؛ هوية بصرية موحَّدة قبل أي شي",
    effort: "ساعتان",
    impact: "تحسين أول انطباع",
  },
  {
    id: "p-social-smart",
    rank: 2,
    title: "إدخال وسائل التواصل الذكي (NN)",
    why: "تخفيف احتكاك للوسطاء؛ تحسين سهلة التنفيذ",
    effort: "ساعة",
    impact: "تحسين UX onboarding",
  },
  {
    id: "p-profile-card",
    rank: 3,
    title: "بطاقة الوسيط Linktree-style (MM)",
    why: "ميزة تنافسية كبيرة (نزل/تعاريف عندهم) + هوية مميَّزة لكل وسيط",
    effort: "يومان",
    impact: "تمييز عن المنافسين",
  },
  {
    id: "p-subdomain-design",
    rank: 4,
    title: "تصميم Subdomain routing (OO-1 فقط)",
    why: "نبني الكود الآن، نُفعّله لما تُشترى الدومين",
    effort: "نصف يوم",
    impact: "جاهزية تقنية مستقبلية",
  },
  {
    id: "p-ux-2",
    rank: 5,
    title: "تبسيط UX المرحلة الثانية (RR)",
    why: "المالك يشعر بالإرباك؛ Onboarding tour + Help center + Simplified mode",
    effort: "3-4 أيام",
    impact: "حلّ بلوكر استخدام رئيسي",
  },
  {
    id: "p-payments",
    rank: 6,
    title: "دمج Moyasar (D3) — مؤجَّل بناءً على قرار المالك",
    why: "حاسم للإطلاق، لكن ليس الآن — تركيز على اكتمال الرؤية",
    effort: "يومان",
    impact: "بلوكر إطلاق Beta",
  },
  {
    id: "p-property-mgmt",
    rank: 7,
    title: "إدارة الأملاك (D2)",
    why: "ميزة تنافسية ضد نزل",
    effort: "أسبوع",
    impact: "توسيع السوق",
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
