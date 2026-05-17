import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام — وسيط برو",
  description: "الشروط والأحكام لاستخدام منصّة وسيط برو.",
};

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page)",
        color: "var(--text-on-dark)",
        direction: "rtl",
        fontFamily: "'Tajawal', sans-serif",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "var(--gold-1)",
            textDecoration: "none",
            fontSize: 14,
            marginBottom: 32,
            display: "inline-block",
          }}
        >
          ← العودة للصفحة الرئيسية
        </Link>

        <h1
          style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}
        >
          شروط الاستخدام
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 40 }}>
          آخر تحديث: ٣٠ أبريل ٢٠٢٦
        </p>

        <Section title="القبول بالشروط">
          <p>
            باستخدامك منصّة <strong style={{ color: "var(--gold-1)" }}>وسيط برو</strong>، توافق على
            الالتزام بهذه الشروط. إن لم توافق، يُرجى عدم استخدام المنصّة.
          </p>
        </Section>

        <Section title="وصف الخدمة">
          <p>
            وسيط برو منصّة SaaS تقدّم خدمات الوساطة والتسويق العقاري عبر منظومة ذكاء اصطناعي متعدّدة
            الوكلاء (Multi-Agent System) لمساعدة الوسطاء العقاريين المرخّصين في المملكة العربية
            السعودية على إدارة أعمالهم.
          </p>
        </Section>

        <Section title="شروط الاستخدام">
          <ul>
            <li>
              يجب أن تكون وسيطاً عقارياً مرخّصاً من الهيئة العامة للعقار (REGA) لاستخدام الميزات
              الكاملة.
            </li>
            <li>تتحمّل المسؤولية الكاملة عن دقة المحتوى الذي تنشره عبر المنصّة.</li>
            <li>
              تلتزم بأنظمة المملكة العربية السعودية، خصوصاً أنظمة العقار، الإعلان، حماية المستهلك،
              وحماية البيانات.
            </li>
            <li>يُمنع استخدام المنصّة لأي غرض غير قانوني أو احتيالي.</li>
            <li>يُمنع محاولة الوصول غير المصرَّح به للمنصّة أو لبيانات الوسطاء الآخرين.</li>
          </ul>
        </Section>

        <Section title="المسؤولية عن قرارات الذكاء الاصطناعي">
          <p>
            المنصّة تستخدم نماذج ذكاء اصطناعي لإنتاج محتوى، الرد على عملاء، واقتراح توصيات.{" "}
            <strong>القرار النهائي يبقى دائماً للوسيط المرخّص.</strong> تُوفّر المنصّة{" "}
            <strong>بوّابات موافقة (Approval Gates)</strong> توقف القرارات الحرجة (تخفيض السعر،
            إلغاء عقد، التزامات قانونية) قبل التنفيذ، وتطلب موافقتك الصريحة.
          </p>
          <p>
            باستخدامك للمنصّة، تُقرّ بأن مسؤولية المخرجات النهائية تقع عليك بصفتك الوسيط المرخّص،
            ولا تتحمّل المنصّة المسؤولية عن أي قرار اعتمدته أنت.
          </p>
        </Section>

        <Section title="الاشتراكات والدفع">
          <ul>
            <li>الاشتراكات شهرية، تُجدَّد تلقائياً ما لم تلغِها قبل انتهاء الفترة.</li>
            <li>الفواتير تُصدر إلكترونياً بصيغة متوافقة مع متطلبات ZATCA.</li>
            <li>
              يمكنك إلغاء الاشتراك في أي وقت من إعدادات حسابك. يبقى وصولك متاحاً حتى نهاية الفترة
              المدفوعة.
            </li>
            <li>لا توجد استردادات للأشهر السابقة، لكن لن نخصم منك بعد الإلغاء.</li>
          </ul>
        </Section>

        <Section title="الملكية الفكرية">
          <p>
            المحتوى الذي تُنشئه (توجيهاتك الاستراتيجية، قاعدة معرفتك، عقاراتك، عملاؤك) ملكك الكامل.
            منصّة وسيط برو وكودها وتصميمها ملكية فكرية للمالك (إلياس الدخيل).
          </p>
        </Section>

        <Section title="حدود المسؤولية">
          <p>
            تُقدَّم المنصّة "كما هي". نسعى لأقصى جودة وثبات، لكن لا نضمن خلوّها من انقطاعات أو
            أخطاء. مسؤوليتنا الإجمالية لا تتجاوز قيمة اشتراكك للشهر الذي وقع فيه الضرر.
          </p>
        </Section>

        <Section title="الإلغاء">
          <p>يحق لنا إنهاء حسابك دون إشعار في حال:</p>
          <ul>
            <li>انتهاك هذه الشروط أو الأنظمة السعودية.</li>
            <li>محاولة الإضرار بالمنصّة أو بمستخدميها.</li>
            <li>إساءة استخدام ميزات الذكاء الاصطناعي بطريقة تخالف توجيهاتنا.</li>
          </ul>
        </Section>

        <Section title="القانون الحاكم">
          <p>
            تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع يُحَل عبر المحاكم المختصّة في
            مدينة الرياض.
          </p>
        </Section>

        <Section title="التواصل">
          <p style={{ lineHeight: 2 }}>
            للاستفسارات عن هذه الشروط:
            <br />
            <a href="mailto:vip.elyas@gmail.com" style={{ color: "var(--gold-1)" }}>
              vip.elyas@gmail.com
            </a>
          </p>
        </Section>

        <div
          style={{
            marginTop: 60,
            paddingTop: 24,
            borderTop: "1px solid #1F2937",
            color: "var(--text-ghost)",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          © ٢٠٢٦ وسيط برو. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9 }}>
        {children}
      </div>
      <style>{`
        section ul { padding-right: 20px; margin: 8px 0; }
        section li { margin-bottom: 8px; }
        section p { margin-bottom: 8px; }
      `}</style>
    </section>
  );
}
