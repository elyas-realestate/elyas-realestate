import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سياسة الخصوصية — وسيط برو",
  description: "سياسة الخصوصية لمنصة وسيط برو، نوضح كيف نجمع بياناتك ونستخدمها ونحميها.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-on-dark)",
      direction: "rtl",
      fontFamily: "'Tajawal', sans-serif",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{
          color: "var(--gold-1)", textDecoration: "none", fontSize: 14, marginBottom: 32,
          display: "inline-block",
        }}>
          ← العودة للصفحة الرئيسية
        </a>

        <h1 style={{
          fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8,
        }}>
          سياسة الخصوصية
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 40 }}>
          آخر تحديث: ٣٠ أبريل ٢٠٢٦
        </p>

        <Section title="من نحن">
          <p>
            منصّة <strong style={{ color: "var(--gold-1)" }}>وسيط برو</strong> (Wasit Pro) منصّة سعودية
            للوساطة والتسويق العقاري، يديرها <strong>إلياس الدخيل</strong> — وسيط ومسوّق
            عقاري مرخّص في المملكة العربية السعودية. تحترم منصّتنا خصوصيتك، وتلتزم بأنظمة حماية البيانات
            الشخصية في المملكة (PDPL) ومتطلبات الهيئة العامة للعقار (REGA).
          </p>
        </Section>

        <Section title="البيانات التي نجمعها">
          <ul>
            <li><strong>معلومات الاتصال:</strong> الاسم، رقم الجوال، البريد الإلكتروني — تقدّمها أنت طوعاً عند الاستفسار أو التسجيل.</li>
            <li><strong>تفاصيل الاهتمام العقاري:</strong> نطاق البحث الجغرافي، نوع العقار، الميزانية، الإطار الزمني.</li>
            <li><strong>محادثات WhatsApp:</strong> عند تواصلك مع رقم الأعمال الخاص بنا عبر WhatsApp Business API، نحفظ نص الرسائل والوقت لأغراض الخدمة فقط.</li>
            <li><strong>بيانات الاستخدام:</strong> الصفحات التي تزورها، نوع المتصفح، تاريخ الزيارة — لتحسين تجربتك على المنصّة.</li>
          </ul>
        </Section>

        <Section title="كيف نستخدم بياناتك">
          <ul>
            <li>الرد على استفساراتك العقارية وتقديم خيارات تناسبك.</li>
            <li>مطابقتك مع عقارات في نطاقك الجغرافي وضمن ميزانيتك.</li>
            <li>التواصل معك بشأن الصفقات، المعاينات، والمتابعات.</li>
            <li>إصدار الفواتير والعقود الإلكترونية المتوافقة مع متطلبات ZATCA و REGA.</li>
            <li>تحسين خدمات المنصّة وقياس الأداء.</li>
          </ul>
        </Section>

        <Section title="مشاركة البيانات">
          <p>
            <strong>نحن لا نبيع بياناتك أبداً.</strong> قد نشارك بياناتك فقط مع:
          </p>
          <ul>
            <li><strong>مزوّدي الخدمات التقنية:</strong> Meta (WhatsApp Business API)، Vercel (الاستضافة)، Supabase (قاعدة البيانات) — لتشغيل المنصّة، وضمن سياسات الخصوصية الخاصة بهم.</li>
            <li><strong>الجهات الحكومية:</strong> عند طلب رسمي من السلطات السعودية المختصة، أو لتلبية متطلبات REGA و ZATCA.</li>
            <li><strong>أطراف العقد:</strong> عند توقيعك لعقد إلكتروني، نشارك المعلومات الضرورية مع الطرف الآخر فقط.</li>
          </ul>
        </Section>

        <Section title="حماية البيانات">
          <ul>
            <li>تشفير البيانات الحساسة (مفاتيح API، Tokens) على مستوى الحقل في قاعدة البيانات.</li>
            <li>عزل صفّي (Row-Level Security) — كل وسيط يرى بياناته فقط.</li>
            <li>اتصال آمن HTTPS لكل الصفحات والـ APIs.</li>
            <li>توقيع رقمي SHA-256 للعقود الإلكترونية.</li>
            <li>مصادقة ثنائية (2FA) متاحة لحسابات الوسطاء.</li>
          </ul>
        </Section>

        <Section title="حقوقك">
          <p>وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL)، يحق لك:</p>
          <ul>
            <li>طلب الوصول لبياناتك المخزّنة.</li>
            <li>طلب تصحيح أي بيانات غير دقيقة.</li>
            <li>طلب حذف بياناتك (مع مراعاة المتطلبات النظامية للاحتفاظ ببعض السجلات).</li>
            <li>سحب موافقتك على المعالجة في أي وقت.</li>
            <li>تقديم شكوى للهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA).</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            للاستفادة من هذه الحقوق، تواصل معنا على:{" "}
            <a href="mailto:vip.elyas@gmail.com" style={{ color: "var(--gold-1)" }}>vip.elyas@gmail.com</a>
          </p>
        </Section>

        <Section title="الاحتفاظ بالبيانات">
          <p>
            نحتفظ ببياناتك للمدة اللازمة لتقديم الخدمة، أو حسبما يقتضيه النظام السعودي
            (مثلاً: ٧ سنوات للسجلات المالية وفقاً لنظام ZATCA). عند انتهاء الحاجة،
            تُحذف البيانات بشكل آمن.
          </p>
        </Section>

        <Section title="ملفات تعريف الارتباط (Cookies)">
          <p>
            نستخدم cookies أساسية لتشغيل المنصّة (الجلسات، التفضيلات). لا نستخدم
            cookies إعلانية لتتبّع المستخدمين عبر مواقع أخرى.
          </p>
        </Section>

        <Section title="الأطفال">
          <p>
            خدماتنا موجَّهة للبالغين (١٨+). لا نجمع بيانات قاصرين عمداً. إن علمت أن
            قاصراً قدّم لنا بيانات، تواصل معنا فوراً للحذف.
          </p>
        </Section>

        <Section title="تعديلات السياسة">
          <p>
            قد نحدّث هذه السياسة من وقت لآخر. عند التعديلات الجوهرية، سنخطرك عبر
            البريد الإلكتروني أو إشعار بارز على المنصّة قبل سريانها.
          </p>
        </Section>

        <Section title="التواصل">
          <p style={{ lineHeight: 2 }}>
            <strong>إلياس الدخيل</strong><br />
            وسيط ومسوّق عقاري مرخّص<br />
            الرياض، المملكة العربية السعودية<br />
            البريد:{" "}
            <a href="mailto:vip.elyas@gmail.com" style={{ color: "var(--gold-1)" }}>
              vip.elyas@gmail.com
            </a>
          </p>
        </Section>

        <div style={{
          marginTop: 60, paddingTop: 24, borderTop: "1px solid #1F2937",
          color: "var(--text-ghost)", fontSize: 12, textAlign: "center",
        }}>
          © ٢٠٢٦ وسيط برو. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12,
      }}>
        {title}
      </h2>
      <div style={{
        color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.9,
      }}>
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
