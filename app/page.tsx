import Link from "next/link";
import WaitlistForm from "@/app/components/WaitlistForm";
import SARIcon from "@/app/components/SARIcon";

// تقليل وقت الـ ISR cache من ٣٦٠٠ إلى ٦٠ ثانية حتى تتبع تغييرات الثيم بسرعة
// لاحقاً، يمكن رفعه لـ ٣٦٠٠ بعد ثبات الـ landing
export const revalidate = 60;

const features = [
  {
    icon: "🤖",
    title: "٤ موظفين بالذكاء الاصطناعي",
    desc: "موظف استقبال يرد على واتساب، موظف تسويق يولّد المنشورات يومياً، موظف متابعة، ومحلل بيانات أسبوعي — يشتغلون عنك ٢٤/٧",
  },
  {
    icon: "✍️",
    title: "العقود الإلكترونية",
    desc: "٤ قوالب جاهزة (إيجار سكني/تجاري، بيع، حصر) + توقيع إلكتروني بختم رقمي SHA-256 + رابط مشاركة عبر واتساب",
  },
  {
    icon: "💬",
    title: "WhatsApp Business",
    desc: "بوت ذكي يرد على رسائل العملاء فوراً، يفهم استفساراتهم، ويقترح ٣ عقارات مطابقة من قاعدتك تلقائياً",
  },
  {
    icon: "🏘️",
    title: "إدارة عقارات احترافية",
    desc: "أضف، عدّل، انشر، وزّع على ٨ بوّابات (عقار، بيوت، إنستجرام، تويتر، واتساب…) — كل عقار في مكانه",
  },
  {
    icon: "👥",
    title: "CRM ذكي + تصنيف عاطفي",
    desc: "تتبع كل عميل من أول رسالة حتى الإغلاق، مع تصنيف تلقائي (ساخن/دافئ/بارد) وتنبيهات للعملاء المهمَلين",
  },
  {
    icon: "🇸🇦",
    title: "ZATCA + امتثال سعودي كامل",
    desc: "فواتير معتمدة (مرحلة ١ و٢ ZATCA)، QR code، XML، توافق فال للوسطاء — جاهز للهيئة العامة للزكاة",
  },
  {
    icon: "📱",
    title: "تطبيق جوّال (PWA)",
    desc: "ثبّت المنصّة كتطبيق على شاشة جوّالك بنقرة، يعمل بدون متصفح، ومجهّز للإشعارات الفورية",
  },
  {
    icon: "💰",
    title: "محاسبة + عمولات + تقارير",
    desc: "تتبع كل عمولة وكل فاتورة، تحليل مالي شهري، تقارير PDF تلقائية، ومحلل أسبوعي يقترح خطوات التحسين",
  },
  {
    icon: "🔐",
    title: "أمان متعدد المستأجرين",
    desc: "RLS صارم على كل جدول، 2FA + رموز استرداد، عزل كامل لبيانات كل وسيط — لا أحد يرى بيانات أحد",
  },
];

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "",
    badge: "",
    desc: "للتجربة قبل الالتزام",
    features: [
      "٥ عقارات",
      "١٠ عملاء",
      "صفحة عقاري عامة",
      "إدارة المهام والطلبات",
      "PWA — تطبيق على الجوّال",
    ],
    excluded: ["المساعدون الأذكياء", "العقود الإلكترونية", "واتساب التجاري", "التحليل المالي"],
    cta: "ابدأ مجاناً",
    ctaStyle: "outline",
    highlighted: false,
  },
  {
    name: "أساسي",
    price: "99",
    period: "/ شهر",
    badge: "الأكثر طلباً",
    desc: "للوسيط النشط الذي يريد النمو",
    features: [
      "٥٠ عقار",
      "عملاء غير محدودين",
      "وكيل المحتوى الذكي (٥٠ طلب/شهر)",
      "العقود الإلكترونية",
      "ZATCA كامل + الفواتير",
      "تحليل مالي + تقارير PDF",
      "WhatsApp (wa.me)",
    ],
    excluded: ["AI غير محدود", "غرفة المحتوى (٣ نماذج)"],
    cta: "ابدأ تجربة مجانية",
    ctaStyle: "gold",
    highlighted: true,
  },
  {
    name: "احترافي",
    price: "249",
    period: "/ شهر",
    badge: "بدون قيود",
    desc: "للوسيط المحترف وفريقه",
    features: [
      "عقارات + عملاء بدون حد",
      "٤ موظفين AI كاملين (مع موظف الاستقبال)",
      "WhatsApp Business API رسمي",
      "غرفة المحتوى (٣ نماذج AI)",
      "فريق حتى ١٠ أعضاء",
      "أوامر العمل + إدارة الأملاك",
      "أولوية الدعم الفني",
    ],
    excluded: [],
    cta: "ابدأ تجربة مجانية",
    ctaStyle: "outline",
    highlighted: false,
  },
];

const stats = [
  { number: "٤", label: "موظفون AI يشتغلون ٢٤/٧" },
  { number: "٩+", label: "أدوات متكاملة في منصة واحدة" },
  { number: "ZATCA", label: "متوافق مع الهيئة كاملاً" },
  { number: "٠", label: "بطاقة ائتمان للبدء" },
];

export default function Home() {
  return (
    <div
      dir="rtl"
      style={{
        background: "var(--bg-page)",
        color: "var(--text-strong)",
        minHeight: "100vh",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent-text { color: var(--gold-2); }
        .accent-bg { background: linear-gradient(135deg, var(--gold-2), var(--gold-3)); }
        .card-base { background: var(--bg-surface-1); border: 1px solid var(--gold-bg); border-radius: 16px; transition: all 0.3s ease; }
        .card-base:hover { border-color: rgba(198,145,76,0.28); transform: translateY(-3px); box-shadow: 0 12px 40px var(--shadow-overlay-2); }
        .dot-bg { background-image: radial-gradient(rgba(198,145,76,0.04) 1px, transparent 1px); background-size: 40px 40px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.7s ease-out both; }
        .d1 { animation-delay: 0.1s; } .d2 { animation-delay: 0.2s; } .d3 { animation-delay: 0.3s; } .d4 { animation-delay: 0.4s; }
        @media (max-width: 767px) {
          .nav-links { display: none !important; }
          .hero-btns { flex-direction: column; align-items: stretch !important; }
          .hero-btns a { text-align: center; justify-content: center; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .plans-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
          .section-pad { padding: 64px 20px !important; }
          .hero-pad { padding: 120px 20px 80px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 0,
          zIndex: 50,
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "var(--header-bg-2)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--gold-bg)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          <div
            className="accent-bg font-kufi"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "var(--bg-page)",
              flexShrink: 0,
            }}
          >
            و
          </div>
          <span
            className="font-kufi"
            style={{ fontSize: 17, fontWeight: 800, color: "var(--text-strong)" }}
          >
            وسيط <span style={{ color: "var(--gold-2)" }}>برو</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a
            href="#features"
            style={{
              color: "var(--text-soft)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            المميزات
          </a>
          <a
            href="#pricing"
            style={{
              color: "var(--text-soft)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            الأسعار
          </a>
          <Link
            href="/login"
            style={{
              color: "var(--text-soft)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/register"
            className="accent-bg"
            style={{
              color: "var(--bg-page)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              padding: "9px 22px",
              borderRadius: 9,
            }}
          >
            ابدأ مجاناً
          </Link>
        </div>

        {/* Mobile CTA */}
        <Link
          href="/register"
          className="accent-bg"
          style={{
            display: "none",
            color: "var(--bg-page)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 8,
          }}
        >
          ابدأ
        </Link>
      </nav>

      {/* ═══ HERO ═══ */}
      <section
        className="dot-bg hero-pad"
        style={{
          padding: "140px 48px 100px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%, var(--gold-bg-soft) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <div
            className="fade-up accent-text"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "var(--gold-bg-soft)",
              border: "1px solid var(--gold-bg-hover)",
              borderRadius: 100,
              padding: "7px 18px",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                background: "var(--gold-2)",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            منصة SaaS مخصصة للوسطاء العقاريين السعوديين
          </div>
          <h1
            className="font-kufi fade-up d1"
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: 22,
              color: "var(--text-strong)",
            }}
          >
            المنصة العقارية الذكية{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              للوسطاء السعوديين
            </span>
          </h1>
          <p
            className="fade-up d2"
            style={{
              fontSize: "clamp(15px, 2vw, 17px)",
              color: "var(--text-soft)",
              lineHeight: 1.85,
              maxWidth: 620,
              margin: "0 auto 40px",
            }}
          >
            ٤ موظفين بالذكاء الاصطناعي يشتغلون عنك ٢٤/٧ — ردّ تلقائي على واتساب، تسويق يومي، متابعة
            العملاء، تحليل أسبوعي. مع عقود إلكترونية موقَّعة وفواتير ZATCA كاملة.
          </p>
          <div
            className="fade-up d3 hero-btns"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}
          >
            <Link
              href="/register"
              className="accent-bg"
              style={{
                color: "var(--bg-page)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              ابدأ مجاناً — بدون بطاقة ائتمان
            </Link>
            <Link
              href="/login"
              style={{
                color: "var(--text-soft)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                padding: "14px 24px",
                borderRadius: 11,
                border: "1px solid var(--gold-bg-hover)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ padding: "0 48px 80px", background: "var(--bg-page)" }}>
        <div
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            maxWidth: 860,
            margin: "0 auto",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="card-base"
              style={{ padding: "28px 20px", textAlign: "center" }}
            >
              <div
                className="font-kufi accent-text"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, marginBottom: 6 }}
              >
                {stat.number}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section
        id="features"
        className="section-pad"
        style={{ padding: "90px 48px", background: "var(--bg-deep)" }}
      >
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div
              className="accent-text"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              — المميزات —
            </div>
            <h2
              className="font-kufi"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)",
                fontWeight: 800,
                color: "var(--text-strong)",
                lineHeight: 1.3,
                marginBottom: 14,
              }}
            >
              كل ما يحتاجه الوسيط المحترف
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--text-soft)",
                maxWidth: 480,
                margin: "0 auto",
                lineHeight: 1.8,
              }}
            >
              أدوات متكاملة مصممة خصيصاً للسوق العقاري السعودي
            </p>
          </div>
          <div
            className="features-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
          >
            {features.map((feat, i) => (
              <div key={i} className="card-base" style={{ padding: "32px 28px" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(198,145,76,0.07)",
                    border: "1px solid rgba(198,145,76,0.13)",
                    borderRadius: 13,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    marginBottom: 20,
                  }}
                >
                  {feat.icon}
                </div>
                <h3
                  className="font-kufi"
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-strong)",
                    marginBottom: 10,
                  }}
                >
                  {feat.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "var(--text-soft)", lineHeight: 1.75 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section
        id="pricing"
        className="section-pad"
        style={{ padding: "90px 48px", background: "var(--bg-page)" }}
      >
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div
              className="accent-text"
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
            >
              — الأسعار —
            </div>
            <h2
              className="font-kufi"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)",
                fontWeight: 800,
                color: "var(--text-strong)",
                lineHeight: 1.3,
                marginBottom: 14,
              }}
            >
              اختر الخطة المناسبة لك
            </h2>
            <p
              style={{
                fontSize: 15,
                color: "var(--text-soft)",
                maxWidth: 440,
                margin: "0 auto",
                lineHeight: 1.8,
              }}
            >
              ابدأ مجاناً وطوّر اشتراكك عند الحاجة
            </p>
          </div>
          <div
            className="plans-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              alignItems: "start",
            }}
          >
            {plans.map((plan, i) => (
              <div
                key={i}
                style={{
                  background: plan.highlighted ? "var(--bg-surface-1)" : "var(--bg-surface-1)",
                  border: plan.highlighted
                    ? "1px solid rgba(198,145,76,0.4)"
                    : "1px solid var(--gold-bg)",
                  borderRadius: 18,
                  padding: "32px 28px",
                  position: "relative",
                  boxShadow: plan.highlighted ? "0 0 40px var(--gold-bg-soft)" : "none",
                }}
              >
                {plan.badge && (
                  <div
                    className="accent-bg"
                    style={{
                      position: "absolute",
                      top: -12,
                      right: 24,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--bg-page)",
                      padding: "4px 14px",
                      borderRadius: 100,
                    }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <h3
                    className="font-kufi"
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text-strong)",
                      marginBottom: 6,
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--text-faint)" }}>{plan.desc}</p>
                </div>
                <div
                  style={{
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: "1px solid var(--gold-bg)",
                  }}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span
                      className="font-kufi"
                      style={{
                        fontSize: plan.price === "0" ? 28 : "clamp(1.8rem, 2.5vw, 2.2rem)",
                        fontWeight: 900,
                        color: plan.highlighted ? "var(--gold-2)" : "var(--text-strong)",
                      }}
                    >
                      {plan.price === "0" ? "مجاناً" : plan.price}
                    </span>
                    {plan.price !== "0" && (
                      <SARIcon size={18} color={plan.highlighted ? "accent" : "current"} />
                    )}
                    {plan.period && (
                      <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  {plan.price !== "0" && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-faint)",
                        marginTop: 6,
                        opacity: 0.85,
                      }}
                    >
                      + ضريبة القيمة المضافة 15%
                    </div>
                  )}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--gold-2)",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ color: "var(--success)", flexShrink: 0, fontSize: 14 }}>
                        ✓
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f, j) => (
                    <li
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        color: "var(--border-1)",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ flexShrink: 0, fontSize: 14 }}>✕</span>
                      <span style={{ textDecoration: "line-through" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  style={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "12px 20px",
                    borderRadius: 10,
                    background:
                      plan.ctaStyle === "gold"
                        ? "linear-gradient(135deg, var(--gold-2), var(--gold-3))"
                        : "transparent",
                    color: plan.ctaStyle === "gold" ? "var(--bg-page)" : "var(--text-soft)",
                    border: plan.ctaStyle === "gold" ? "none" : "1px solid var(--gold-bg-hover)",
                    transition: "all 0.2s",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS PLACEHOLDER ═══ */}
      <section style={{ padding: "70px 48px", background: "var(--bg-deep)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div
            className="accent-text"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}
          >
            — آراء الوسطاء —
          </div>
          <h2
            className="font-kufi"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              color: "var(--text-strong)",
              marginBottom: 40,
            }}
          >
            ماذا يقول الوسطاء؟
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-surface-1)",
                  border: "1px solid var(--gold-bg)",
                  borderRadius: 14,
                  padding: "28px 24px",
                }}
              >
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ color: "var(--gold-2)", fontSize: 14 }}>
                      ★
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    height: 60,
                    background: "rgba(198,145,76,0.04)",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--gold-bg)",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        width: 80,
                        height: 10,
                        background: "var(--gold-bg)",
                        borderRadius: 4,
                        marginBottom: 5,
                      }}
                    />
                    <div
                      style={{
                        width: 60,
                        height: 8,
                        background: "rgba(90,90,98,0.3)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--border-1)", fontSize: 12, marginTop: 24 }}>
            قريباً — آراء الوسطاء الأوائل
          </p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section
        style={{
          padding: "90px 48px",
          background: "var(--bg-page)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, var(--gold-bg-soft) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h2
            className="font-kufi"
            style={{
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 900,
              color: "var(--text-strong)",
              lineHeight: 1.3,
              marginBottom: 18,
            }}
          >
            ابدأ رحلتك مع{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              وسيط برو
            </span>{" "}
            اليوم
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-soft)", lineHeight: 1.8, marginBottom: 36 }}>
            انضم لوسطاء يستخدمون الذكاء الاصطناعي لتوليد المحتوى، وإدارة بياناتهم، وتنمية أعمالهم
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 40,
            }}
          >
            <Link
              href="/register"
              className="accent-bg"
              style={{
                color: "var(--bg-page)",
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 700,
                padding: "15px 36px",
                borderRadius: 11,
              }}
            >
              ابدأ مجاناً — بدون بطاقة ائتمان
            </Link>
          </div>

          {/* Beta Waitlist */}
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <WaitlistForm source="landing" />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer
        style={{
          padding: "48px",
          background: "var(--bg-page)",
          borderTop: "1px solid var(--gold-bg-soft)",
        }}
      >
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              gap: 32,
              marginBottom: 40,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div
                  className="accent-bg font-kufi"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "var(--bg-page)",
                  }}
                >
                  و
                </div>
                <span
                  className="font-kufi"
                  style={{ fontSize: 16, fontWeight: 800, color: "var(--text-strong)" }}
                >
                  وسيط <span style={{ color: "var(--gold-2)" }}>برو</span>
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-faint)",
                  lineHeight: 1.75,
                  maxWidth: 260,
                }}
              >
                المنصة العقارية الذكية للوسطاء السعوديين — من إدارة الأعمال إلى الذكاء الاصطناعي في
                مكان واحد
              </p>
            </div>
            <div>
              <h4
                className="font-kufi"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-soft)",
                  marginBottom: 16,
                  letterSpacing: 1,
                }}
              >
                المنصة
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href="#features"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  المميزات
                </a>
                <a
                  href="#pricing"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  الأسعار
                </a>
                <Link
                  href="/login"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  تسجيل الدخول
                </Link>
              </div>
            </div>
            <div>
              <h4
                className="font-kufi"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-soft)",
                  marginBottom: 16,
                  letterSpacing: 1,
                }}
              >
                الأدوات
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["وكيل المحتوى", "إدارة العقارات", "التحليل المالي", "الوثائق"].map((item, i) => (
                  <span key={i} style={{ color: "var(--text-faint)", fontSize: 13 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4
                className="font-kufi"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-soft)",
                  marginBottom: 16,
                  letterSpacing: 1,
                }}
              >
                قانوني
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link
                  href="/privacy"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  سياسة الخصوصية
                </Link>
                <Link
                  href="/terms"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  الشروط والأحكام
                </Link>
                <Link
                  href="/data-processing"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  اتفاقية معالجة البيانات
                </Link>
                <Link
                  href="/license"
                  style={{ color: "var(--text-faint)", textDecoration: "none", fontSize: 13 }}
                >
                  الترخيص
                </Link>
              </div>
            </div>
            <div>
              <h4
                className="font-kufi"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--text-soft)",
                  marginBottom: 16,
                  letterSpacing: 1,
                }}
              >
                ابدأ الآن
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link
                  href="/register"
                  className="accent-bg"
                  style={{
                    color: "var(--bg-page)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "10px 16px",
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  إنشاء حساب
                </Link>
                <Link
                  href="/login"
                  style={{
                    color: "var(--text-soft)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "10px 16px",
                    borderRadius: 8,
                    textAlign: "center",
                    border: "1px solid var(--gold-bg)",
                  }}
                >
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          </div>
          <div
            style={{
              paddingTop: 24,
              borderTop: "1px solid var(--gold-bg-soft)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--border-1)" }}>
              © {new Date().getFullYear()} وسيط برو — جميع الحقوق محفوظة
            </span>
            <span style={{ fontSize: 12, color: "var(--border-1)" }}>
              مصنوع بـ ❤️ للوسطاء السعوديين
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
