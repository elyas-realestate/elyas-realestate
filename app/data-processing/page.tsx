import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "اتفاقية معالجة البيانات — وسيط برو",
  description: "كيف نعالج بياناتك ومستخدميك ضمن منصّة وسيط برو.",
};

export default function DataProcessingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0C",
      color: "#E5E5E5",
      direction: "rtl",
      fontFamily: "'Tajawal', sans-serif",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <a href="/" style={{
          color: "#E8B86D", textDecoration: "none", fontSize: 14, marginBottom: 32,
          display: "inline-block",
        }}>
          ← العودة للصفحة الرئيسية
        </a>

        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#F4F4F5", marginBottom: 8 }}>
          اتفاقية معالجة البيانات
        </h1>
        <p style={{ color: "#A1A1AA", fontSize: 14, marginBottom: 40 }}>
          آخر تحديث: ٣٠ أبريل ٢٠٢٦
        </p>

        <Section title="نطاق الاتفاقية">
          <p>
            تسري هذه الاتفاقية على معالجة منصّة <strong style={{ color: "#E8B86D" }}>وسيط برو</strong>
            للبيانات الشخصية لعملائك (المشترين، المستأجرين، الملاك) عبر خدماتنا، وفقاً
            لنظام حماية البيانات الشخصية في المملكة (PDPL) ولوائح REGA.
          </p>
        </Section>

        <Section title="الأدوار">
          <ul>
            <li><strong>المتحكّم (Data Controller):</strong> الوسيط المشترك في المنصّة (أنت)، تحدّد أغراض ووسائل المعالجة لعملائك.</li>
            <li><strong>المعالج (Data Processor):</strong> منصّة وسيط برو، تعالج بياناتك بالنيابة عنك ضمن تعليماتك الموثَّقة.</li>
            <li><strong>المعالجون الفرعيون:</strong> Meta (WhatsApp Business)، Vercel (الاستضافة)، Supabase (قاعدة البيانات)، مزوّدو AI (OpenAI, Anthropic, Google, etc).</li>
          </ul>
        </Section>

        <Section title="أنواع البيانات المُعالَجة">
          <ul>
            <li>بيانات الاتصال (الاسم، الجوال، البريد).</li>
            <li>محادثات WhatsApp وتاريخ التواصل.</li>
            <li>تفاصيل البحث العقاري (المنطقة، الميزانية، النوع).</li>
            <li>بيانات الصفقات (الأسعار، التواريخ، الأطراف).</li>
            <li>السجلات المالية (الفواتير، التحصيلات) — يُحتفظ بها ٧ سنوات لمتطلبات ZATCA.</li>
          </ul>
        </Section>

        <Section title="أغراض المعالجة">
          <ul>
            <li>تقديم خدمات الوساطة العقارية المباشرة.</li>
            <li>توليد محتوى تسويقي عبر AI ضمن توجيهاتك المحدّدة.</li>
            <li>الرد على استفسارات العملاء عبر WhatsApp.</li>
            <li>إدارة العقود والفواتير وفق الأنظمة السعودية.</li>
            <li>إنتاج تقارير وتحليلات لأداء أعمالك.</li>
          </ul>
        </Section>

        <Section title="الإجراءات الأمنية">
          <ul>
            <li>تشفير البيانات الحساسة على مستوى الحقل (مفاتيح API، Tokens).</li>
            <li>عزل صفّي (Row-Level Security) — كل وسيط معزول بياناته عن الآخرين.</li>
            <li>مصادقة قوية + خيار 2FA.</li>
            <li>سجلات تدقيق (audit logs) للوصول للبيانات الحساسة.</li>
            <li>اتصال HTTPS مشفّر لكل العمليات.</li>
            <li>توقيع رقمي SHA-256 للعقود الإلكترونية.</li>
          </ul>
        </Section>

        <Section title="نقل البيانات">
          <p>
            بعض المعالجات تتم خارج المملكة (مثلاً: استدعاءات AI لمزوّدين دوليين،
            استضافة Vercel/Supabase). نضمن:
          </p>
          <ul>
            <li>اختيار مزوّدين ملتزمين بمعايير حماية بيانات صارمة (GDPR، SOC 2).</li>
            <li>عدم إرسال بيانات حساسة (مثل أرقام هويات، حسابات بنكية) لخدمات AI.</li>
            <li>مراجعة دورية للالتزام بمتطلبات نقل البيانات السعودية.</li>
          </ul>
        </Section>

        <Section title="الخروقات الأمنية">
          <p>
            في حال أي خرق أمني يؤثر على بياناتك أو بيانات عملائك، نلتزم بـ:
          </p>
          <ul>
            <li>إخطارك خلال ٧٢ ساعة من اكتشاف الخرق.</li>
            <li>تقديم تفاصيل كاملة عن طبيعة الخرق وحجمه.</li>
            <li>التعاون مع SDAIA إن طلبت ذلك.</li>
            <li>اتخاذ خطوات فورية لاحتواء الخرق.</li>
          </ul>
        </Section>

        <Section title="مدة الاتفاقية">
          <p>
            تسري هذه الاتفاقية طوال مدة اشتراكك في المنصّة. بعد إنهاء الاشتراك:
          </p>
          <ul>
            <li>يحق لك تصدير كامل بياناتك (CSV / JSON) خلال ٣٠ يوم.</li>
            <li>بعد ٣٠ يوم، تُحذف البيانات الشخصية للعملاء بشكل آمن.</li>
            <li>السجلات المالية المطلوبة قانونياً (ZATCA) تُحفظ للمدة المحدّدة بالنظام.</li>
          </ul>
        </Section>

        <Section title="حقوق أصحاب البيانات">
          <p>
            للعملاء (المشترين، المستأجرين، الملاك) حقوق وفق PDPL تشمل: الوصول، التصحيح،
            الحذف، الاعتراض. عند تلقّي طلب من أحد عملائك، يجب أن تُحيله إلينا خلال ٤٨
            ساعة، وسنتعاون لتنفيذه ضمن الأطر النظامية.
          </p>
        </Section>

        <Section title="التواصل">
          <p style={{ lineHeight: 2 }}>
            <strong>منسّق حماية البيانات</strong><br />
            إلياس الدخيل<br />
            <a href="mailto:vip.elyas@gmail.com" style={{ color: "#E8B86D" }}>
              vip.elyas@gmail.com
            </a>
          </p>
        </Section>

        <div style={{
          marginTop: 60, paddingTop: 24, borderTop: "1px solid #1F2937",
          color: "#71717A", fontSize: 12, textAlign: "center",
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
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#F4F4F5", marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ color: "#D4D4D8", fontSize: 15, lineHeight: 1.9 }}>
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
