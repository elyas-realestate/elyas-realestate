"use client";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase-browser";
import { toast, Toaster } from "sonner";
import {
  FileSignature,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Building,
  Calendar,
  User,
} from "lucide-react";
import SignaturePad from "@/components/SignaturePad";

type PublicContract = {
  id: string;
  contract_number: string | null;
  title: string;
  category: string;
  body_html: string;
  status: string;
  amount: number | null;
  party_first: { name?: string };
  party_second: { name?: string; phone?: string; id_number?: string };
  signing_expires_at: string;
};

export default function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerId, setSignerId] = useState("");
  const [signerPhone, setSignerPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showSig, setShowSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    load();
  }, [token]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error: e } = await supabase
        .from("e_contracts")
        .select(
          "id, contract_number, title, category, body_html, status, amount, party_first, party_second, signing_expires_at"
        )
        .eq("signing_token", token)
        .maybeSingle();

      if (e) throw new Error(e.message);
      if (!data) {
        setError("الرابط غير صالح أو منتهي الصلاحية");
      } else {
        setContract(data as PublicContract);
        // pre-fill suggested name
        if (data.party_second?.name) setSignerName(data.party_second.name);
        if (data.party_second?.phone) setSignerPhone(data.party_second.phone);
        if (data.party_second?.id_number) setSignerId(data.party_second.id_number);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في التحميل");
    }
    setLoading(false);
  }

  async function handleSubmit(signatureData: string) {
    if (!contract) return;
    if (!signerName.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (!agreed) {
      toast.error("يجب الموافقة على المحتوى أولاً");
      return;
    }

    setSubmitting(true);
    try {
      const { error: e } = await supabase.from("e_contract_signatures").insert({
        contract_id: contract.id,
        party: "second",
        signer_name: signerName.trim(),
        signer_id_number: signerId.trim() || null,
        signer_phone: signerPhone.trim() || null,
        signature_data: signatureData,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
      });
      if (e) throw new Error(e.message);

      // log audit (also needs public access — but audit policy is read-only for tenant. Insert needs different policy.)
      // Skip audit log here since it's a tenant-only table; trigger updates contract status anyway.

      setSubmitted(true);
      toast.success("تم التوقيع بنجاح");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التوقيع");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <Wrapper>
        <Loader2
          size={32}
          style={{ color: "var(--gold-2)", animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Wrapper>
    );
  }

  if (error || !contract) {
    return (
      <Wrapper>
        <div style={{ maxWidth: 460, textAlign: "center" }}>
          <AlertCircle size={42} style={{ color: "var(--danger)", marginBottom: 14 }} />
          <h1
            style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}
          >
            الرابط غير متاح
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {error || "تأكد من صحة الرابط أو راجع الوسيط الذي أرسله لك."}
          </p>
        </div>
      </Wrapper>
    );
  }

  if (submitted) {
    return (
      <Wrapper>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <CheckCircle2 size={48} style={{ color: "var(--success)", marginBottom: 14 }} />
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: 10,
            }}
          >
            تم التوقيع بنجاح
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
            شكراً لك. تم تسجيل توقيعك على {contract.title}.
            <br />
            ستحصل على نسخة موقّعة من الطرف الأول قريباً.
          </p>
        </div>
      </Wrapper>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#09090B",
        color: "var(--text-on-dark)",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <Toaster
        position="top-center"
        dir="rtl"
        toastOptions={{
          style: {
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg-hover)",
            color: "var(--text-primary)",
            fontFamily: "'Tajawal', sans-serif",
          },
        }}
      />

      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--overlay-soft)",
          background: "var(--bg-deep)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <FileSignature size={22} style={{ color: "var(--gold-2)" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{contract.title}</div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-ghost)",
                direction: "ltr",
                textAlign: "right",
              }}
            >
              {contract.contract_number}
            </div>
          </div>
          <div
            style={{
              marginInlineStart: "auto",
              fontSize: 11,
              color: "var(--text-disabled)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Shield size={12} /> توقيع إلكتروني آمن
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {/* ملخص العقد */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <InfoChip icon={User} label="الطرف الأول" value={contract.party_first.name || "—"} />
          <InfoChip icon={User} label="الطرف الثاني" value={contract.party_second.name || "—"} />
          {contract.amount && (
            <InfoChip
              icon={Building}
              label="القيمة"
              value={`${Number(contract.amount).toLocaleString("en-US")} ر.س`}
            />
          )}
          <InfoChip
            icon={Calendar}
            label="ينتهي الرابط"
            value={new Date(contract.signing_expires_at).toLocaleDateString("ar-SA")}
          />
        </div>

        {/* محتوى العقد */}
        <div
          style={{
            background: "#FAFAFA",
            color: "var(--pure-black)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 18,
          }}
        >
          <div
            className="contract-body"
            dangerouslySetInnerHTML={{ __html: contract.body_html }}
            style={{ fontFamily: "'Tajawal', serif", fontSize: 14, lineHeight: 1.9 }}
          />
        </div>

        <style>{`
          .contract-body h1 { font-size: 22px; font-weight: 800; margin: 16px 0 14px; }
          .contract-body h2 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; color: #333; }
          .contract-body h3 { font-size: 15px; font-weight: 700; margin: 12px 0 6px; color: #555; }
          .contract-body p { margin: 8px 0; }
          .contract-body ul { margin: 8px 0; padding-inline-start: 24px; }
          .contract-body li { margin: 5px 0; }
        `}</style>

        {/* الموافقة + بيانات الموقّع */}
        <div
          style={{
            background: "var(--bg-deep)",
            border: "1px solid var(--overlay-mid)",
            borderRadius: 12,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--gold-2)" }}>
            بياناتك للتوقيع
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <Field label="الاسم الكامل *">
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="رقم الهوية">
              <input
                value={signerId}
                onChange={(e) => setSignerId(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="الجوال">
              <input
                value={signerPhone}
                onChange={(e) => setSignerPhone(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 9,
              padding: "10px 12px",
              background: "rgba(198,145,76,0.05)",
              border: "1px solid var(--gold-bg-hover)",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 3, accentColor: "var(--gold-2)" }}
            />
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              قرأت محتوى العقد بالكامل، وأوافق على جميع شروطه وبنوده، وأقرّ بأن توقيعي الإلكتروني
              التالي مُلزِم قانونياً ويعادل توقيعي اليدوي.
            </span>
          </label>
        </div>

        {/* زر التوقيع */}
        {!showSig ? (
          <button
            onClick={() => {
              if (!signerName.trim()) {
                toast.error("الاسم مطلوب");
                return;
              }
              if (!agreed) {
                toast.error("الموافقة مطلوبة");
                return;
              }
              setShowSig(true);
            }}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, var(--gold-2), var(--gold-4))",
              color: "var(--bg-page)",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <FileSignature size={16} /> ابدأ التوقيع
          </button>
        ) : (
          <div
            style={{
              background: "var(--bg-deep)",
              border: "1px solid var(--gold-bg-strong)",
              borderRadius: 12,
              padding: 18,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--gold-2)", marginBottom: 12 }}>
              وقّع هنا
            </h3>
            <SignaturePad
              onConfirm={handleSubmit}
              onCancel={() => setShowSig(false)}
              busy={submitting}
              hint="استخدم إصبعك (على الجوال) أو الماوس (على الكمبيوتر) للتوقيع"
            />
          </div>
        )}
      </main>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#09090B",
        color: "var(--text-on-dark)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Tajawal', sans-serif",
        padding: 20,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-deep)",
        border: "1px solid var(--overlay-soft)",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: "var(--text-ghost)",
          marginBottom: 4,
        }}
      >
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-on-dark)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "var(--bg-surface-2)",
  border: "1px solid var(--overlay-mid)",
  borderRadius: 8,
  color: "var(--text-on-dark)",
  fontSize: 13,
  fontFamily: "'Tajawal', sans-serif",
  outline: "none",
  width: "100%",
};
