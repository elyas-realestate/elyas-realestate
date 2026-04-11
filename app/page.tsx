import Link from "next/link";

export const revalidate = 3600;

const features = [
  {
    icon: "🤖",
    title: "وكيل المحتوى الذكي",
    desc: "مصنع محتوى، خبير محتوى، وغرفة المحتوى — ٣ نماذج AI تتحاور لإنتاج محتوى عقاري استثنائي جاهز للنشر",
  },
  {
    icon: "🏘️",
    title: "إدارة العقارات",
    desc: "أضف عقاراتك وتابع الطلبات وانشرها على صفحتك الخاصة بنقرة واحدة مع دعم الصور والتفاصيل الكاملة",
  },
  {
    icon: "👥",
    title: "CRM متكامل",
    desc: "تتبع عملاءك وصفقاتك من أول تواصل حتى إغلاق الصفقة مع سجل كامل لكل تفاعل",
  },
  {
    icon: "💰",
    title: "التحليل المالي",
    desc: "تتبع عمولاتك وقيمة صفقاتك ومؤشرات أدائك المالي مع حاسبة عمولات تفاعلية",
  },
  {
    icon: "📄",
    title: "الوثائق القانونية",
    desc: "نظّم عقودك ووثائقك مع تنبيه تلقائي قبل انتهاء الصلاحية حتى لا يفوتك شيء",
  },
  {
    icon: "🎨",
    title: "صفحة هبوط خاصة",
    desc: "كل وسيط يحصل على صفحة عامة قابلة للتخصيص الكامل — الألوان والخطوط والمحتوى كله بيدك",
  },
];

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "",
    badge: "",
    desc: "ابدأ بدون بطاقة ائتمان",
    features: [
      "٥ عقارات",
      "١٠ عملاء",
      "صفحة هبوط خاصة",
      "إدارة المهام والطلبات",
    ],
    excluded: ["وكيل المحتوى الذكي", "الوثائق القانونية", "التحليل المالي"],
    cta: "ابدأ مجاناً",
    ctaStyle: "outline",
    highlighted: false,
  },
  {
    name: "أساسي",
    price: "99",
    period: "ريال / شهر",
    badge: "الأكثر طلباً",
    desc: "للوسيط النشط الذي يريد النمو",
    features: [
      "٥٠ عقار",
      "عملاء غير محدودين",
      "AI محدود (٥٠ طلب/شهر)",
      "وثائق قانونية",
      "تحليل مالي",
      "صفحة هبوط خاصة",
    ],
    excluded: ["غرفة المحتوى (٣ نماذج)"],
    cta: "ابدأ تجربة مجانية",
    ctaStyle: "gold",
    highlighted: true,
  },
  {
    name: "احترافي",
    price: "249",
    period: "ريال / شهر",
    badge: "",
    desc: "للوسيط المحترف بدون قيود",
    features: [
      "عقارات غير محدودة",
      "عملاء غير محدودين",
      "AI غير محدود",
      "غرفة المحتوى (٣ نماذج)",
      "وثائق قانونية",
      "تحليل مالي متقدم",
      "أولوية الدعم الفني",
    ],
    excluded: [],
    cta: "ابدأ تجربة مجانية",
    ctaStyle: "outline",
    highlighted: false,
  },
];

const stats = [
  { number: "٣", label: "نماذج AI في غرفة المحتوى" },
  { number: "٦+", label: "أدوات متكاملة في منصة واحدة" },
  { number: "١٠٠٪", label: "مخصص للسوق السعودي" },
  { number: "٠", label: "بطاقة ائتمان للبدء" },
];

export default function Home() {
  return (
    <div dir="rtl" style={{ background: "#0A0A0C", color: "#F5F5F5", minHeight: "100vh", fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent-text { color: #C6914C; }
        .accent-bg { background: linear-gradient(135deg, #C6914C, #A6743A); }
        .card-base { background: #16161A; border: 1px solid rgba(198,145,76,0.12); border-radius: 16px; transition: all 0.3s ease; }
        .card-base:hover { border-color: rgba(198,145,76,0.28); transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
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
      <nav style={{ position: "fixed", top: 0, right: 0, left: 0, zIndex: 50, height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(10,10,12,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div className="accent-bg font-kufi" style={{ width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#0A0A0C", flexShrink: 0 }}>و</div>
          <span className="font-kufi" style={{ fontSize: 17, fontWeight: 800, color: "#F5F5F5" }}>وسيط <span style={{ color: "#C6914C" }}>برو</span></span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#features" style={{ color: "#9A9AA0", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>المميزات</a>
          <a href="#pricing" style={{ color: "#9A9AA0", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>الأسعار</a>
          <Link href="/login" style={{ color: "#9A9AA0", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }}>تسجيل الدخول</Link>
          <Link href="/register" className="accent-bg" style={{ color: "#0A0A0C", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "9px 22px", borderRadius: 9 }}>ابدأ مجاناً</Link>
        </div>

        {/* Mobile CTA */}
        <Link href="/register" className="accent-bg" style={{ display: "none", color: "#0A0A0C", textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8 }}>
          ابدأ
        </Link>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="dot-bg hero-pad" style={{ padding: "140px 48px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(198,145,76,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <div className="fade-up accent-text" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, background: "rgba(198,145,76,0.08)", border: "1px solid rgba(198,145,76,0.2)", borderRadius: 100, padding: "7px 18px", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, background: "#C6914C", borderRadius: "50%", display: "inline-block" }} />
            منصة SaaS مخصصة للوسطاء العقاريين السعوديين
          </div>
          <h1 className="font-kufi fade-up d1" style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 900, lineHeight: 1.2, marginBottom: 22, color: "#F5F5F5" }}>
            المنصة العقارية الذكية{" "}
            <span style={{ background: "linear-gradient(135deg, #C6914C, #E8B86D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              للوسطاء السعوديين
            </span>
          </h1>
          <p className="fade-up d2" style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "#9A9AA0", lineHeight: 1.85, maxWidth: 580, margin: "0 auto 40px" }}>
            من إدارة العقارات والعملاء، إلى إنتاج المحتوى بالذكاء الاصطناعي والتحليل المالي — كل أدوات الوسيط المحترف في مكان واحد
          </p>
          <div className="fade-up d3 hero-btns" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <Link href="/register" className="accent-bg" style={{ color: "#0A0A0C", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 11, display: "flex", alignItems: "center", gap: 8 }}>
              ابدأ مجاناً — بدون بطاقة ائتمان
            </Link>
            <Link href="/login" style={{ color: "#9A9AA0", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "14px 24px", borderRadius: 11, border: "1px solid rgba(198,145,76,0.15)", display: "flex", alignItems: "center", gap: 6 }}>
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section style={{ padding: "0 48px 80px", background: "#0A0A0C" }}>
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 860, margin: "0 auto" }}>
          {stats.map((stat, i) => (
            <div key={i} className="card-base" style={{ padding: "28px 20px", textAlign: "center" }}>
              <div className="font-kufi accent-text" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 900, marginBottom: 6 }}>{stat.number}</div>
              <div style={{ fontSize: 12, color: "#5A5A62", lineHeight: 1.5 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="section-pad" style={{ padding: "90px 48px", background: "#111114" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div className="accent-text" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>— المميزات —</div>
            <h2 className="font-kufi" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "#F5F5F5", lineHeight: 1.3, marginBottom: 14 }}>كل ما يحتاجه الوسيط المحترف</h2>
            <p style={{ fontSize: 15, color: "#9A9AA0", maxWidth: 480, margin: "0 auto", lineHeight: 1.8 }}>أدوات متكاملة مصممة خصيصاً للسوق العقاري السعودي</p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map((feat, i) => (
              <div key={i} className="card-base" style={{ padding: "32px 28px" }}>
                <div style={{ width: 52, height: 52, background: "rgba(198,145,76,0.07)", border: "1px solid rgba(198,145,76,0.13)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>{feat.icon}</div>
                <h3 className="font-kufi" style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F5", marginBottom: 10 }}>{feat.title}</h3>
                <p style={{ fontSize: 13.5, color: "#9A9AA0", lineHeight: 1.75 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="section-pad" style={{ padding: "90px 48px", background: "#0A0A0C" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="accent-text" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>— الأسعار —</div>
            <h2 className="font-kufi" style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 800, color: "#F5F5F5", lineHeight: 1.3, marginBottom: 14 }}>اختر الخطة المناسبة لك</h2>
            <p style={{ fontSize: 15, color: "#9A9AA0", maxWidth: 440, margin: "0 auto", lineHeight: 1.8 }}>ابدأ مجاناً وطوّر اشتراكك عند الحاجة</p>
          </div>
          <div className="plans-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
            {plans.map((plan, i) => (
              <div key={i} style={{ background: plan.highlighted ? "#16161A" : "#16161A", border: plan.highlighted ? "1px solid rgba(198,145,76,0.4)" : "1px solid rgba(198,145,76,0.12)", borderRadius: 18, padding: "32px 28px", position: "relative", boxShadow: plan.highlighted ? "0 0 40px rgba(198,145,76,0.08)" : "none" }}>
                {plan.badge && (
                  <div className="accent-bg" style={{ position: "absolute", top: -12, right: 24, fontSize: 11, fontWeight: 700, color: "#0A0A0C", padding: "4px 14px", borderRadius: 100 }}>{plan.badge}</div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <h3 className="font-kufi" style={{ fontSize: 18, fontWeight: 800, color: "#F5F5F5", marginBottom: 6 }}>{plan.name}</h3>
                  <p style={{ fontSize: 12, color: "#5A5A62" }}>{plan.desc}</p>
                </div>
                <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(198,145,76,0.1)" }}>
                  <span className="font-kufi" style={{ fontSize: plan.price === "0" ? 28 : "clamp(1.8rem, 2.5vw, 2.2rem)", fontWeight: 900, color: plan.highlighted ? "#C6914C" : "#F5F5F5" }}>
                    {plan.price === "0" ? "مجاناً" : plan.price}
                  </span>
                  {plan.period && <span style={{ fontSize: 12, color: "#5A5A62", marginRight: 4 }}>{plan.period}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#C6914C", marginBottom: 10 }}>
                      <span style={{ color: "#4ADE80", flexShrink: 0, fontSize: 14 }}>✓</span>
                      <span style={{ color: "#D4D4D8" }}>{f}</span>
                    </li>
                  ))}
                  {plan.excluded.map((f, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3A3A42", marginBottom: 10 }}>
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
                    background: plan.ctaStyle === "gold" ? "linear-gradient(135deg, #C6914C, #A6743A)" : "transparent",
                    color: plan.ctaStyle === "gold" ? "#0A0A0C" : "#9A9AA0",
                    border: plan.ctaStyle === "gold" ? "none" : "1px solid rgba(198,145,76,0.2)",
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
      <section style={{ padding: "70px 48px", background: "#111114" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="accent-text" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 14 }}>— آراء الوسطاء —</div>
          <h2 className="font-kufi" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, color: "#F5F5F5", marginBottom: 40 }}>ماذا يقول الوسطاء؟</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)", borderRadius: 14, padding: "28px 24px" }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#C6914C", fontSize: 14 }}>★</span>)}
                </div>
                <div style={{ height: 60, background: "rgba(198,145,76,0.04)", borderRadius: 8, marginBottom: 16 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(198,145,76,0.1)" }} />
                  <div>
                    <div style={{ width: 80, height: 10, background: "rgba(198,145,76,0.1)", borderRadius: 4, marginBottom: 5 }} />
                    <div style={{ width: 60, height: 8, background: "rgba(90,90,98,0.3)", borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ color: "#3A3A42", fontSize: 12, marginTop: 24 }}>قريباً — آراء الوسطاء الأوائل</p>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding: "90px 48px", background: "#0A0A0C", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(198,145,76,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 640, margin: "0 auto" }}>
          <h2 className="font-kufi" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 900, color: "#F5F5F5", lineHeight: 1.3, marginBottom: 18 }}>
            ابدأ رحلتك مع{" "}
            <span style={{ background: "linear-gradient(135deg, #C6914C, #E8B86D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>وسيط برو</span>
            {" "}اليوم
          </h2>
          <p style={{ fontSize: 15, color: "#9A9AA0", lineHeight: 1.8, marginBottom: 36 }}>انضم لوسطاء يستخدمون الذكاء الاصطناعي لتوليد المحتوى، وإدارة بياناتهم، وتنمية أعمالهم</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/register" className="accent-bg" style={{ color: "#0A0A0C", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "15px 36px", borderRadius: 11 }}>
              ابدأ مجاناً — بدون بطاقة ائتمان
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "48px", background: "#0A0A0C", borderTop: "1px solid rgba(198,145,76,0.08)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div className="accent-bg font-kufi" style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0A0A0C" }}>و</div>
                <span className="font-kufi" style={{ fontSize: 16, fontWeight: 800, color: "#F5F5F5" }}>وسيط <span style={{ color: "#C6914C" }}>برو</span></span>
              </div>
              <p style={{ fontSize: 13, color: "#5A5A62", lineHeight: 1.75, maxWidth: 260 }}>المنصة العقارية الذكية للوسطاء السعوديين — من إدارة الأعمال إلى الذكاء الاصطناعي في مكان واحد</p>
            </div>
            <div>
              <h4 className="font-kufi" style={{ fontSize: 13, fontWeight: 700, color: "#9A9AA0", marginBottom: 16, letterSpacing: 1 }}>المنصة</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["المميزات", "الأسعار", "تسجيل الدخول"].map((link, i) => (
                  <a key={i} href={i < 2 ? `#${["features","pricing"][i]}` : "/login"} style={{ color: "#5A5A62", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}>{link}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-kufi" style={{ fontSize: 13, fontWeight: 700, color: "#9A9AA0", marginBottom: 16, letterSpacing: 1 }}>الأدوات</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["وكيل المحتوى", "إدارة العقارات", "التحليل المالي", "الوثائق"].map((item, i) => (
                  <span key={i} style={{ color: "#5A5A62", fontSize: 13 }}>{item}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-kufi" style={{ fontSize: 13, fontWeight: 700, color: "#9A9AA0", marginBottom: 16, letterSpacing: 1 }}>ابدأ الآن</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/register" className="accent-bg" style={{ color: "#0A0A0C", textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "10px 16px", borderRadius: 8, textAlign: "center" }}>إنشاء حساب</Link>
                <Link href="/login" style={{ color: "#9A9AA0", textDecoration: "none", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 8, textAlign: "center", border: "1px solid rgba(198,145,76,0.12)" }}>تسجيل الدخول</Link>
              </div>
            </div>
          </div>
          <div style={{ paddingTop: 24, borderTop: "1px solid rgba(198,145,76,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#3A3A42" }}>© {new Date().getFullYear()} وسيط برو — جميع الحقوق محفوظة</span>
            <span style={{ fontSize: 12, color: "#3A3A42" }}>مصنوع بـ ❤️ للوسطاء السعوديين</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
