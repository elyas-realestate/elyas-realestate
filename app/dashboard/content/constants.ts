import { Sparkles, Factory, MessageSquare, Calendar, TrendingUp, Settings, FileText, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Tabs ──

export interface TabDef {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const tabs: TabDef[] = [
  { id: "identity", label: "هوية الوسيط", icon: Settings, desc: "إعدادات الهوية والأسلوب" },
  { id: "factory", label: "مصنع المحتوى", icon: Factory, desc: "إنتاج دفعات محتوى مرتبطة بعقاراتك" },
  { id: "expert", label: "خبير المحتوى", icon: MessageSquare, desc: "من الفكرة إلى المحتوى الجاهز" },
  { id: "room", label: "غرفة المحتوى", icon: Users2, desc: "٣ نماذج ذكاء اصطناعي تتحاور لإنتاج محتوى استثنائي" },
  { id: "drafts", label: "المسودات", icon: FileText, desc: "المحتوى المحفوظ والجاهز للنشر" },
  { id: "calendar", label: "الخطة الشهرية", icon: Calendar, desc: "تقويم بصري لجدولة المحتوى" },
  { id: "trends", label: "ترندات ومناسبات", icon: TrendingUp, desc: "أفكار مرتبطة بأحداث السوق" },
];

// ── AI Providers & Models ──

export interface AIModel {
  id: string;
  name: string;
  desc: string;
}

export interface AIProvider {
  id: string;
  name: string;
  desc: string;
  models: AIModel[];
}

export const providers: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    desc: "صانعة ChatGPT — أشهر نماذج الذكاء الاصطناعي",
    models: [
      { id: "gpt-4o", name: "GPT-4o", desc: "الأقوى والأشمل" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", desc: "سريع واقتصادي، جودة جيدة" },
      { id: "gpt-4.1", name: "GPT-4.1", desc: "أحدث إصدار من OpenAI" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", desc: "نسخة خفيفة وأرخص من 4.1" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    desc: "صانعة Claude — ممتاز في الفهم والكتابة العربية",
    models: [
      { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", desc: "ممتاز في الكتابة والفهم العربي" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", desc: "مستقر وموثوق" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", desc: "سريع جداً وأرخص" },
    ],
  },
  {
    id: "google",
    name: "Google",
    desc: "صانعة Gemini — قوي في المحتوى متعدد اللغات",
    models: [
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "مستقر وسريع — مجاني" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "قوي ومستقر" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", desc: "سريع واقتصادي" },
    ],
  },
  {
    id: "manus",
    name: "Manus",
    desc: "نموذج Manus — متخصص في التنفيذ والتحليل",
    models: [
      { id: "manus-1", name: "Manus 1", desc: "النموذج الرئيسي" },
    ],
  },
  {
    id: "groq",
    name: "Groq ⚡",
    desc: "سريع جداً ومجاني — مثالي للاستخدام اليومي",
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", desc: "الأقوى من Groq — جودة عالية" },
      { id: "llama-3.1-8b-instant",    name: "Llama 3.1 8B Instant", desc: "الأسرع — للردود الفورية" },
      { id: "mixtral-8x7b-32768",      name: "Mixtral 8x7B", desc: "قوي في المحتوى العربي" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    desc: "نموذج صيني قوي — أداء ممتاز بسعر منخفض",
    models: [
      { id: "deepseek-chat",     name: "DeepSeek Chat",     desc: "النموذج الرئيسي" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner", desc: "ممتاز للتحليل والتفكير" },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    desc: "نموذج Elon Musk — إبداعي وجريء",
    models: [
      { id: "grok-3",      name: "Grok 3",      desc: "الأقوى من xAI" },
      { id: "grok-3-mini", name: "Grok 3 Mini", desc: "أسرع وأرخص" },
    ],
  },
];

export const modes = [
  { id: "single", name: "نموذج واحد", desc: "نموذج واحد يكتب المحتوى — الأسرع والأوفر" },
  { id: "chain", name: "دمج (تتابع)", desc: "نموذج يكتب + نموذج ثاني يراجع ويحسّن — جودة أعلى" },
  { id: "compare", name: "مقارنة", desc: "نفس الطلب لنموذجين — تشوف النتيجتين وتختار الأفضل" },
];

// ── Calendar ──

export const platformColors: Record<string, string> = {
  "X (تويتر)": "bg-[#1C2333] text-[#C18D4A]",
  Instagram: "bg-pink-500",
  TikTok: "bg-gray-100 text-black",
  Snapchat: "bg-yellow-400 text-black",
  LinkedIn: "bg-[#A6743A]",
  Threads: "bg-gray-400",
  "متعدد": "bg-purple-500",
};

export const platformDots: Record<string, string> = {
  "X (تويتر)": "bg-[#C18D4A]",
  Instagram: "bg-pink-500",
  TikTok: "bg-white",
  Snapchat: "bg-yellow-400",
  LinkedIn: "bg-[#A6743A]",
  Threads: "bg-gray-400",
  "متعدد": "bg-purple-500",
};

export const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const arabicDaysShort = ["أحد", "إثن", "ثلث", "أرب", "خمس", "جمع", "سبت"];
export const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ── Trends Data ──

export const saudiEvents: Record<number, { date: string; title: string; type: string; contentIdea: string }[]> = {
  1: [
    { date: "1 يناير", title: "رأس السنة الميلادية", type: "مناسبة", contentIdea: "أهداف عقارية للسنة الجديدة — خطط لاستثمارك العقاري" },
    { date: "يناير", title: "موسم الإيجارات الشتوي", type: "سوق", contentIdea: "نصائح للمستأجرين في موسم الشتاء — كيف تختار الشقة المناسبة" },
  ],
  2: [
    { date: "22 فبراير", title: "يوم التأسيس السعودي", type: "مناسبة", contentIdea: "من بيوت الطين إلى الأبراج — تطور العقار السعودي منذ التأسيس" },
    { date: "فبراير", title: "اجتماعات البنك المركزي", type: "سوق", contentIdea: "تأثير قرارات الفائدة على السوق العقاري السعودي" },
  ],
  3: [
    { date: "مارس", title: "بداية موسم البيع الربيعي", type: "سوق", contentIdea: "الربيع = موسم شراء العقارات — لماذا هذا الوقت مثالي للمشتري؟" },
    { date: "مارس", title: "معرض ريستاتكس العقاري", type: "سوق", contentIdea: "أبرز ما جاء في معرض ريستاتكس — فرص وعروض عقارية" },
  ],
  4: [
    { date: "أبريل", title: "موسم الصيف يقترب", type: "سوق", contentIdea: "استعد لموسم الإيجارات الصيفي — نصائح للملاك والمستأجرين" },
    { date: "أبريل", title: "تحديثات أنظمة إيجار", type: "سوق", contentIdea: "كل ما تحتاج معرفته عن تحديثات منصة إيجار" },
  ],
  5: [
    { date: "مايو", title: "نهاية العام الدراسي", type: "مناسبة", contentIdea: "موسم الانتقالات العائلية — كيف تختار حيك الجديد في الرياض" },
    { date: "مايو", title: "ارتفاع الطلب على الفلل", type: "سوق", contentIdea: "لماذا يرتفع الطلب على الفلل في الصيف؟ تحليل سوقي" },
  ],
  6: [
    { date: "يونيو", title: "بداية الإجازة الصيفية", type: "مناسبة", contentIdea: "الإجازة الصيفية فرصة للبحث عن عقار — دليل المشتري" },
    { date: "يونيو", title: "موسم الاستراحات", type: "سوق", contentIdea: "الاستثمار في الاستراحات — هل هو مجدي في الرياض؟" },
  ],
  7: [
    { date: "يوليو", title: "ذروة الصيف", type: "سوق", contentIdea: "أحياء الرياض الأكثر طلباً في الصيف — تحليل بيانات" },
    { date: "يوليو", title: "موسم السياحة الداخلية", type: "مناسبة", contentIdea: "العقارات السياحية في السعودية — فرصة استثمارية" },
  ],
  8: [
    { date: "أغسطس", title: "قرب العام الدراسي الجديد", type: "مناسبة", contentIdea: "أفضل الأحياء للعائلات قرب المدارس المميزة في الرياض" },
    { date: "أغسطس", title: "حركة نقل الموظفين", type: "سوق", contentIdea: "نصائح للموظف المنتقل — كيف تجد سكن مناسب بسرعة" },
  ],
  9: [
    { date: "23 سبتمبر", title: "اليوم الوطني السعودي", type: "مناسبة", contentIdea: "إنجازات القطاع العقاري السعودي — أرقام تفخر بها" },
    { date: "سبتمبر", title: "بداية العام الدراسي", type: "مناسبة", contentIdea: "ارتفاع الطلب على الشقق قرب الجامعات — فرصة للملاك" },
  ],
  10: [
    { date: "أكتوبر", title: "موسم الرياض", type: "مناسبة", contentIdea: "تأثير موسم الرياض على أسعار العقارات والإيجارات" },
    { date: "أكتوبر", title: "معارض عقارية", type: "سوق", contentIdea: "أبرز المعارض العقارية في الربع الأخير — لا تفوتها" },
  ],
  11: [
    { date: "نوفمبر", title: "يوم العقار السعودي", type: "سوق", contentIdea: "مستقبل العقار السعودي — رؤية 2030 والفرص القادمة" },
    { date: "نوفمبر", title: "تقارير السوق الربعية", type: "سوق", contentIdea: "قراءة في تقرير السوق العقاري للربع الثالث" },
  ],
  12: [
    { date: "ديسمبر", title: "نهاية السنة", type: "مناسبة", contentIdea: "ملخص السوق العقاري هذا العام — أرقام وتحليلات" },
    { date: "ديسمبر", title: "موسم التخطيط", type: "سوق", contentIdea: "خطط استثمارك العقاري للسنة القادمة — دليل شامل" },
  ],
};

export const riyadhTrendingAreas = [
  { name: "حي النرجس", trend: "صاعد", reason: "قرب من طريق الملك سلمان، مشاريع سكنية جديدة" },
  { name: "حي الملقا", trend: "مستقر مرتفع", reason: "موقع استراتيجي، طلب عالي على الفلل" },
  { name: "حي العارض", trend: "صاعد بقوة", reason: "أسعار معقولة مع تطور البنية التحتية" },
  { name: "حي الياسمين", trend: "مستقر", reason: "حي عائلي مكتمل الخدمات" },
  { name: "حي القيروان", trend: "صاعد", reason: "توسع عمراني سريع وأسعار تنافسية" },
  { name: "حي الصحافة", trend: "صاعد", reason: "قرب من مركز الملك عبدالله المالي" },
  { name: "حي المهدية", trend: "صاعد", reason: "مشاريع سكنية جديدة وأسعار مناسبة" },
  { name: "حي الرمال", trend: "صاعد بقوة", reason: "شرق الرياض، مشاريع ضخمة قادمة" },
  { name: "حي طويق", trend: "مستقر", reason: "غرب الرياض، أسعار معقولة للعائلات" },
  { name: "حي الشفا", trend: "مستقر مرتفع", reason: "جنوب الرياض، طلب متزايد" },
];

export const marketTopics = [
  { title: "أسعار الفائدة وتأثيرها على التمويل العقاري", icon: "📊" },
  { title: "تحديثات نظام الوساطة العقارية", icon: "📋" },
  { title: "رسوم الأراضي البيضاء", icon: "🏗️" },
  { title: "برنامج سكني وخيارات الدعم", icon: "🏠" },
  { title: "تحديثات منصة إيجار", icon: "📝" },
  { title: "رؤية 2030 والقطاع العقاري", icon: "🎯" },
  { title: "الاستثمار الأجنبي في العقار السعودي", icon: "🌍" },
  { title: "مشاريع البنية التحتية الجديدة في الرياض", icon: "🚇" },
  { title: "أسعار مواد البناء وتأثيرها", icon: "🧱" },
  { title: "التقنية العقارية PropTech", icon: "💡" },
];

// ── Content Room Roles ──

export const roomRoles = [
  {
    id: "marketer",
    name: "خبير التسويق",
    fullName: "خبير التسويق العقاري",
    desc: "يكتب من زاوية تسويقية جذابة",
    systemPrompt:
      "أنت خبير تسويق عقاري سعودي محترف. مهمتك كتابة محتوى تسويقي جذاب ومقنع يدفع القارئ للتفاعل. ركّز على الإثارة والجاذبية العاطفية والحوافز. استخدم لغة حيوية ومحفزة.",
  },
  {
    id: "advisor",
    name: "المستشار العقاري",
    fullName: "المستشار العقاري",
    desc: "يكتب من زاوية خبرة ومصداقية",
    systemPrompt:
      "أنت مستشار عقاري سعودي متمرس. مهمتك كتابة محتوى موثوق ومعمّق يعكس الخبرة والمصداقية. ركّز على النصيحة القيمة والمعلومات المفيدة. استخدم لغة احترافية تُظهر الكفاءة.",
  },
  {
    id: "analyst",
    name: "محلل البيانات",
    fullName: "محلل البيانات العقاري",
    desc: "يكتب من زاوية أرقام وتحليلات",
    systemPrompt:
      "أنت محلل بيانات عقاري سعودي. مهمتك كتابة محتوى مبني على أرقام وحقائق وتحليلات السوق. ركّز على الإحصائيات والأدلة والمقارنات. استخدم لغة تحليلية دقيقة تقنع بالأرقام.",
  },
];
