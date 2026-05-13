import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "الترخيص الإعلاني — وسيط برو",
  description: "بيانات الترخيص الإعلاني الصادر من الهيئة العامة للعقار (REGA).",
};

export const dynamic = "force-dynamic";

interface BrokerIdentity {
  broker_name?: string;
  rega_license?: string;
  fal_number?: string;
  brokerage_name?: string;
  city?: string;
}

async function getOwnerIdentity(): Promise<BrokerIdentity | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  // أول tenant في النظام (المالك)
  const { data: t } = await admin
    .from("tenants")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!t?.id) return null;

  const { data } = await admin
    .from("broker_identity")
    .select("broker_name, rega_license, fal_number, brokerage_name, city")
    .eq("tenant_id", t.id)
    .maybeSingle();
  return (data as BrokerIdentity | null) || null;
}

export default async function LicensePage() {
  const identity = await getOwnerIdentity();

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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <a
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
        </a>

        <h1
          style={{ fontSize: 32, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}
        >
          الترخيص الإعلاني
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 40 }}>
          بيانات الترخيص العقاري والإعلاني المعتمد من الهيئة العامة للعقار (REGA)
        </p>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(232,184,109,0.08), rgba(198,145,76,0.04))",
            border: "1px solid rgba(232,184,109,0.25)",
            borderRadius: 14,
            padding: 28,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 18, color: "var(--gold-1)", marginBottom: 20, fontWeight: 700 }}>
            بيانات الجهة المرخّصة
          </h2>

          <Field label="اسم المنصّة" value="وسيط برو (Wasit Pro)" />
          <Field label="الوسيط المرخّص" value={identity?.broker_name || "إلياس الدخيل"} />
          <Field label="الصفة المهنية" value="وسيط ومسوّق عقاري مرخّص" />
          {identity?.brokerage_name && (
            <Field label="الكيان التجاري" value={identity.brokerage_name} />
          )}
          <Field label="المدينة" value={identity?.city || "الرياض"} />
          <Field label="المملكة" value="المملكة العربية السعودية" />
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid #1F2937",
            borderRadius: 14,
            padding: 28,
            marginBottom: 32,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              color: "var(--text-primary)",
              marginBottom: 20,
              fontWeight: 700,
            }}
          >
            أرقام التراخيص
          </h2>

          <Field
            label="رقم الترخيص العقاري (REGA)"
            value={identity?.rega_license || "قيد التحديث"}
            highlight={!!identity?.rega_license}
          />
          <Field
            label="رقم الترخيص الإعلاني (فال)"
            value={identity?.fal_number || "قيد التحديث"}
            highlight={!!identity?.fal_number}
          />
        </div>

        <div
          style={{
            background: "rgba(96,165,250,0.05)",
            border: "1px solid rgba(96,165,250,0.20)",
            borderRadius: 14,
            padding: 24,
            marginBottom: 32,
            fontSize: 14,
            lineHeight: 1.9,
            color: "var(--text-secondary)",
          }}
        >
          <h2 style={{ fontSize: 16, color: "var(--info)", marginBottom: 12, fontWeight: 700 }}>
            الالتزام النظامي
          </h2>
          <p>تلتزم منصّة وسيط برو بكامل اللوائح والأنظمة الصادرة عن:</p>
          <ul style={{ paddingRight: 20, marginTop: 8 }}>
            <li>الهيئة العامة للعقار (REGA)</li>
            <li>هيئة الزكاة والضريبة والجمارك (ZATCA) — الفوترة الإلكترونية</li>
            <li>الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA) — حماية البيانات</li>
            <li>نظام الوساطة العقارية</li>
            <li>نظام التعاملات الإلكترونية</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            كل الإعلانات العقارية المنشورة عبر المنصّة تحمل رقم الترخيص الإعلاني (فال) وفقاً
            لاشتراطات اللائحة التنفيذية لنظام الوساطة العقارية.
          </p>
        </div>

        <div
          style={{
            background: "rgba(74,222,128,0.05)",
            border: "1px solid rgba(74,222,128,0.20)",
            borderRadius: 14,
            padding: 24,
            fontSize: 14,
            color: "var(--text-secondary)",
          }}
        >
          <h2 style={{ fontSize: 16, color: "var(--success)", marginBottom: 12, fontWeight: 700 }}>
            للتحقق
          </h2>
          <p>
            يمكنك التحقق من سريان الترخيص عبر بوابة الهيئة العامة للعقار:{" "}
            <a
              href="https://srem.rega.gov.sa"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--success)", textDecoration: "underline" }}
            >
              srem.rega.gov.sa
            </a>
          </p>
        </div>

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

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--overlay-soft)",
        fontSize: 14,
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span
        style={{
          color: highlight
            ? "#86EFAC"
            : value === "قيد التحديث"
              ? "var(--warning-2)"
              : "var(--text-primary)",
          fontWeight: 600,
          fontFamily: "monospace",
          direction: "ltr",
        }}
      >
        {value}
      </span>
    </div>
  );
}
