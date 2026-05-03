"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle, ChevronDown, ChevronLeft, Search, MessageCircle,
  Bot, IdCard, Building2, Users, FileSignature, Banknote,
  CheckSquare, ShieldCheck, Sparkles, BookOpen, Play, Mail
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  link?: string;
  items: FAQItem[];
}

const SECTIONS: HelpSection[] = [
  {
    id: "start",
    title: "البداية السريعة",
    icon: Play,
    description: "أهم ٧ خطوات لتجهز بطاقتك ومنصتك خلال ١٠ دقائق",
    items: [
      {
        q: "ما هي أول خطوة بعد تسجيل دخولي؟",
        a: "اذهب لـ الإعدادات → الموقع → معلومات عامة وعبّئ: اسمك، تخصصك، الجوال، الإيميل. ثم انتقل لقسم 'الرخص والاعتمادات' وأدخل رخصة فال + السجل التجاري. كل هذه البيانات تظهر تلقائياً في بطاقتك.",
      },
      {
        q: "كيف أحصل على بطاقة احترافية مثل لينك تري؟",
        a: "افتح /dashboard/profile-card. لديك بطاقة جاهزة بالفعل في /c/(اسمك). عدّل الاسم والوصف، اختر ثيماً، أضف عناصر مخصصة (روابط عقار/بيوت، نموذج اتصل بنا) من المكتبة. شارك رابط البطاقة عبر QR.",
      },
      {
        q: "كيف أُشغّل أول مساعد ذكي؟",
        a: "افتح /dashboard/ai → التحكم. اضغط على المفتاح الرئيسي ليصبح أخضر. ثم في قائمة المساعدين، شغّل واحداً (مثل 'مدير خدمة العملاء'). الآن يبدأ العمل تلقائياً.",
      },
      {
        q: "كم تكلفة استخدام المساعدين؟",
        a: "النظام يحدّد سقف يومي (افتراضياً ٥٠ استدعاء/يوم) ويتوقف تلقائياً عند الوصول. يمكنك تعديل السقف من /dashboard/ai → التحكم.",
      },
    ],
  },
  {
    id: "ai",
    title: "موظفو الذكاء الصناعي",
    icon: Bot,
    link: "/dashboard/ai",
    description: "١٦ مساعد + ٥ مدراء يعملون لك ٢٤/٧",
    items: [
      {
        q: "ما الفرق بين المساعدين الـ ١٦؟",
        a: "كل مساعد متخصص: السكرتير الشخصي يجاوب على واتساب، مساعد التسويق يكتب منشورات يومية، المحلل المالي يصدر تقارير، مساعد المتابعة يرسل رسائل للعملاء الباردين. اطلع على /dashboard/ai → المساعدون لتفاصيل كل واحد.",
      },
      {
        q: "هل المساعدون يأخذون قرارات بدون إذني؟",
        a: "لا. عند أي إجراء حسّاس (مثل سعر، التزام، رسالة لعميل ساخن)، النظام يرفع 'بوابة موافقة' في /dashboard/ai → الموافقات. لا يُرسل شيء قبل موافقتك.",
      },
      {
        q: "كيف أوقف المساعدين فوراً؟",
        a: "/dashboard/ai → التحكم → اضغط 'إيقاف النظام' الزر الكبير الأحمر. في ثانية كل المساعدين يتوقفون.",
      },
      {
        q: "كيف أعرف ماذا فعل المساعد؟",
        a: "في /dashboard/ai → التحكم تحت 'النشاط الأخير' تجد سجل كامل لكل مهمة. ولكل مدير مراجعة يومية في /dashboard/ai → المساعدون.",
      },
    ],
  },
  {
    id: "card",
    title: "بطاقتي التعريفية",
    icon: IdCard,
    link: "/dashboard/profile-card",
    description: "بطاقة لينك تري للوسيط — رابط واحد لكل ما يمثلك",
    items: [
      {
        q: "أين رابط بطاقتي؟",
        a: "بطاقتك على /c/(اسم المستخدم). مثلاً لو اسمك elyas، الرابط https://منصتنا/c/elyas. شاركه عبر زر 'مشاركة' أعلى البطاقة، أو امسح QR.",
      },
      {
        q: "لماذا روابطي الاجتماعية تظهر بدون إضافة؟",
        a: "البطاقة ذكية: تسحب وسائل التواصل والرخص تلقائياً من /dashboard/settings. هذا يعني تدخل بياناتك مرّة واحدة فقط، وتظهر تلقائياً.",
      },
      {
        q: "كيف أرتّب البطاقات؟",
        a: "اذهب /dashboard/profile-card. الأسهم ▲▼ بجانب كل عنصر تنقله للأعلى/الأسفل. الـ toggle يُخفي/يُظهر بدون حذف.",
      },
      {
        q: "هل يمكن إضافة نموذج اتصل بنا؟",
        a: "نعم. اضغط '+ أضف عنصراً مخصصاً' → 'نماذج تفاعلية' → 'نموذج اتصل بنا'. الزوار يرسلون رسائلهم وتصل لصندوق وارد خاص بك.",
      },
    ],
  },
  {
    id: "clients",
    title: "إدارة العملاء",
    icon: Users,
    link: "/dashboard/clients",
    description: "CRM ذكي مع تصنيف عاطفي تلقائي",
    items: [
      {
        q: "ما معنى ساخن/دافئ/بارد؟",
        a: "ساخن 🔥: تواصل قريب + اهتمام عالي. دافئ: متابعة دورية. بارد ❄️: لم يتواصل منذ شهر+. النظام يصنّفهم تلقائياً بناءً على آخر محادثة.",
      },
      {
        q: "أين رسائل واتساب من عملائي؟",
        a: "/dashboard/whatsapp/inbox. تظهر هنا كل المحادثات الواردة، مع ربط تلقائي للعميل في CRM.",
      },
      {
        q: "كيف أستورد عملائي من ملف؟",
        a: "/dashboard/import — يقبل CSV. ضع الأعمدة: name, phone, city, district. النظام يستورد ويُنشئ سجلات تلقائياً.",
      },
    ],
  },
  {
    id: "properties",
    title: "إدارة العقارات",
    icon: Building2,
    link: "/dashboard/properties",
    description: "أضف، انشر، ووزّع على ٨ منصات",
    items: [
      {
        q: "كيف أضيف عقاراً جديداً؟",
        a: "/dashboard/properties → 'إضافة عقار'. أكمل البيانات الأساسية، أرفع الصور، حدّد السعر. زر 'حفظ ونشر' لجعله ظاهراً للعموم.",
      },
      {
        q: "كيف أوزّع عقاراً على بيوت/عقار؟",
        a: "بعد إنشاء العقار، اذهب لصفحته واضغط 'توزيع'. تختار المنصات (عقار، بيوت، إنستجرام، X، إلخ). النظام يولّد المنشور المناسب لكل منصة.",
      },
      {
        q: "ما هي 'طلبات العقار'؟",
        a: "طلب عقار = عميل يبحث عن عقار بمواصفات محددة (مثل: شقة في النرجس بـ ٨٠٠ ألف). النظام يطابقه تلقائياً مع عقاراتك ويُنبّهك عند وجود مطابقة.",
      },
    ],
  },
  {
    id: "finance",
    title: "المالية والعقود",
    icon: Banknote,
    link: "/dashboard/financial",
    description: "صفقات، عقود، عمولات، تقارير",
    items: [
      {
        q: "كيف أنشئ عقد إلكتروني؟",
        a: "/dashboard/contracts → 'عقد جديد'. اختر القالب (إيجار سكني/تجاري، بيع، حصر). املأ البيانات. النظام يولّد PDF بختم رقمي + رابط مشاركة عبر واتساب للتوقيع.",
      },
      {
        q: "كيف أحسب عمولتي؟",
        a: "/dashboard/commissions → 'حاسبة العمولة'. أدخل قيمة الصفقة ونسبتك، النظام يحسب VAT تلقائياً ويُصدر فاتورة ZATCA متوافقة.",
      },
      {
        q: "أين تقاريري الشهرية؟",
        a: "/dashboard/insights — تقرير AI أسبوعي وشهري بشكل تلقائي. أو /dashboard/reports لتحميل PDF.",
      },
    ],
  },
  {
    id: "settings",
    title: "الإعدادات والأمان",
    icon: ShieldCheck,
    link: "/dashboard/settings",
    description: "حسابك، فريقك، اشتراكك، الأمان",
    items: [
      {
        q: "أين تفعيل التحقق بخطوتين 2FA؟",
        a: "/dashboard/security. خطوتان: امسح QR ببرنامج Authenticator، ثم أدخل الكود لتفعيل.",
      },
      {
        q: "كيف أضيف موظفاً لفريقي؟",
        a: "/dashboard/team → 'دعوة'. أدخل بريده + الصلاحية. تُرسَل دعوة ولما يقبلها يصل لمنصتك بصلاحياته.",
      },
      {
        q: "كيف أرى مَن دخل حسابي؟",
        a: "/dashboard/audit. سجل كامل بكل تسجيلات الدخول والإجراءات الحساسة (مع IP والوقت).",
      },
    ],
  },
];

export default function HelpPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("start");
  const [search, setSearch] = useState("");

  const filtered = search
    ? SECTIONS.map(s => ({
        ...s,
        items: s.items.filter(i =>
          i.q.toLowerCase().includes(search.toLowerCase()) ||
          i.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(s => s.items.length > 0)
    : SECTIONS;

  return (
    <div dir="rtl" className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
          <HelpCircle size={22} style={{ color: "var(--gold-2)" }} /> مركز المساعدة
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          ابحث في كل ميزات المنصة، أو تصفّح الأقسام أدناه.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث في المساعدة..."
          className="w-full rounded-xl px-10 py-3 text-sm"
          style={{
            background: "var(--bg-surface-1)",
            border: "1px solid var(--gold-bg)",
            color: "var(--text-strong)",
          }}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <QuickLink href="/dashboard/ai" icon={<Bot size={16} />} label="مساعدوك" color="var(--gold-2)" />
        <QuickLink href="/dashboard/profile-card" icon={<IdCard size={16} />} label="بطاقتك" color="rgb(167,139,250)" />
        <QuickLink href="/dashboard/today" icon={<CheckSquare size={16} />} label="يومي" color="var(--success)" />
        <QuickLink href="/dashboard/settings" icon={<ShieldCheck size={16} />} label="الإعدادات" color="var(--info, #3B82F6)" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.map(section => {
          const Icon = section.icon;
          const isOpen = search ? true : expandedSection === section.id;
          return (
            <div key={section.id} className="rounded-xl overflow-hidden" style={{
              background: "var(--bg-surface-1)",
              border: "1px solid var(--gold-bg)",
            }}>
              <button onClick={() => setExpandedSection(isOpen ? null : section.id)}
                className="w-full p-4 flex items-center justify-between text-start"
                style={{ cursor: "pointer", background: "transparent", border: "none" }}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                    background: "var(--gold-bg-soft)", color: "var(--gold-2)",
                  }}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm" style={{ color: "var(--text-strong)" }}>{section.title}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>{section.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.link && (
                    <Link href={section.link}
                      onClick={e => e.stopPropagation()}
                      className="text-xs px-2 py-1 rounded no-underline"
                      style={{ background: "var(--gold-bg-soft)", color: "var(--gold-2)" }}>
                      افتح
                    </Link>
                  )}
                  {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {section.items.map((item, i) => (
                    <details key={i} className="rounded-lg" style={{ background: "var(--bg-surface-2)" }}>
                      <summary className="cursor-pointer p-3 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                        {item.q}
                      </summary>
                      <div className="px-3 pb-3 text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact support */}
      <div className="rounded-xl p-5 text-center" style={{
        background: "linear-gradient(135deg, var(--gold-bg-soft), var(--bg-surface-1))",
        border: "1px solid var(--gold-bg)",
      }}>
        <MessageCircle size={28} className="mx-auto mb-2" style={{ color: "var(--gold-2)" }} />
        <div className="text-sm font-bold mb-1" style={{ color: "var(--text-strong)" }}>لم تجد إجابة؟</div>
        <div className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>تواصل مع الدعم مباشرة</div>
        <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm no-underline"
          style={{ background: "#25D366", color: "#FFFFFF" }}>
          <MessageCircle size={14} /> راسلنا على واتساب
        </a>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, color }: any) {
  return (
    <Link href={href} className="rounded-lg p-3 text-center no-underline transition" style={{
      background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)",
    }}>
      <div className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-1.5" style={{
        background: `${color}15`, color,
      }}>{icon}</div>
      <div className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{label}</div>
    </Link>
  );
}
