"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { toast, Toaster } from "sonner";
import {
  CheckCircle2, ArrowLeft, ArrowRight, Loader2, Sparkles,
  Building, MapPin, Bot, Zap, Crown, Gift,
} from "lucide-react";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Step 1: identity
  const [brokerName, setBrokerName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [coverageAreas, setCoverageAreas] = useState("");
  const [bioShort, setBioShort] = useState("");
  const [writingTone, setWritingTone] = useState("احترافي ودود");

  // Step 2: plan
  const [selectedPlan, setSelectedPlan] = useState<"free" | "basic" | "pro">("free");

  // Step 3: enable AI employees
  const [enableMarketer, setEnableMarketer] = useState(true);
  const [enableFollowup, setEnableFollowup] = useState(true);
  const [enableAnalyst, setEnableAnalyst] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirectTo=/onboarding");
        return;
      }

      // اعثر على tenant
      const { data: t } = await supabase
        .from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
      if (t?.id) {
        setTenantId(t.id);

        // إذا كان قد أكمل الإعداد سابقاً (specialization ظاهر فقط بعد ملء الـ wizard)
        const { data: existing } = await supabase
          .from("broker_identity")
          .select("broker_name, specialization, coverage_areas")
          .eq("tenant_id", t.id)
          .maybeSingle();
        if (existing?.specialization) {
          // أكمل الإعداد سابقاً
          router.replace("/dashboard");
          return;
        }
        // مهَّأ الحقول إن وُجدت بيانات أولية من التسجيل
        if (existing?.broker_name) setBrokerName(existing.broker_name);
      }
      setAuthChecked(true);
    })();
  }, [router]);

  function next() {
    if (step === 1 && !brokerName.trim()) {
      toast.error("اسم الوسيط مطلوب");
      return;
    }
    setStep((step + 1) as Step);
  }

  function prev() {
    if (step > 1) setStep((step - 1) as Step);
  }

  async function complete() {
    if (!tenantId) {
      toast.error("لم يُعثر على حسابك");
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: حفظ هوية الوسيط
      const areas = coverageAreas.split(",").map(s => s.trim()).filter(Boolean);
      const { error: idErr } = await supabase.from("broker_identity").upsert({
        tenant_id: tenantId,
        broker_name: brokerName.trim(),
        specialization: specialization.trim() || null,
        coverage_areas: areas.length > 0 ? areas : null,
        bio_short: bioShort.trim() || null,
        writing_tone: writingTone || null,
      } as never, { onConflict: "tenant_id" });
      if (idErr) throw new Error(idErr.message);

      // Step 2: حفظ الخطة
      const { error: planErr } = await supabase
        .from("tenants")
        .update({ plan: selectedPlan, updated_at: new Date().toISOString() } as never)
        .eq("id", tenantId);
      if (planErr) throw new Error(planErr.message);

      // Step 3: إعدادات موظفي AI
      const { error: aiErr } = await supabase.from("ai_employee_settings").upsert({
        tenant_id: tenantId,
        marketer_enabled: enableMarketer,
        followup_enabled: enableFollowup,
        analyst_enabled: enableAnalyst,
        receiver_enabled: false, // يحتاج Meta setup
      } as never, { onConflict: "tenant_id" });
      if (aiErr) throw new Error(aiErr.message);

      toast.success("اكتمل الإعداد! أهلاً بك في وسيط برو 🎉");
      setTimeout(() => router.replace("/dashboard"), 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإعداد");
      setSubmitting(false);
    }
  }

  if (!authChecked) {
    return (
      <div style={wrapperStyle}>
        <Loader2 size={32} style={{ color: "#C6914C", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div dir="rtl" style={wrapperStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;600;700;800&family=Noto+Kufi+Arabic:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <Toaster position="top-center" dir="rtl" toastOptions={{
        style: { background: "#18181B", border: "1px solid rgba(198,145,76,0.25)", color: "#F4F4F5", fontFamily: "'Tajawal', sans-serif" },
      }} />

      <div style={{ maxWidth: 720, width: "100%" }}>
        {/* Logo + welcome */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #C6914C, #8A5F2E)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontFamily: "'Noto Kufi Arabic', serif", fontSize: 26, fontWeight: 800, color: "#0A0A0C" }}>
            و
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F4F4F5", marginBottom: 6, fontFamily: "'Noto Kufi Arabic', serif" }}>
            أهلاً بك في وسيط برو
          </h1>
          <p style={{ fontSize: 14, color: "#A1A1AA" }}>
            ٣ خطوات سريعة (دقيقتين) لتجهيز منصّتك
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step >= (n as Step) ? "linear-gradient(135deg, #C6914C, #8A5F2E)" : "#1C1C1E",
                color: step >= (n as Step) ? "#0A0A0C" : "#52525B",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, fontFamily: "'Noto Kufi Arabic', serif",
                transition: "all 0.3s",
              }}>
                {step > n ? <CheckCircle2 size={16} /> : n}
              </div>
              {n < 3 && (
                <div style={{ width: 60, height: 2, background: step > n ? "#C6914C" : "#1C1C1E", transition: "background 0.3s" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 28, animation: "fadeIn 0.4s ease-out" }}>

          {step === 1 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(198,145,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building size={17} style={{ color: "#C6914C" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F4F4F5" }}>هويتك المهنية</h2>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>كيف تظهر للعملاء وللذكاء الاصطناعي</p>
                </div>
              </div>

              <Field label="اسم الوسيط (للعرض) *" hint="مثلاً: إلياس الدخيل أو مكتب فيستا رايز">
                <input value={brokerName} onChange={e => setBrokerName(e.target.value)} style={inputStyle} placeholder="إلياس الدخيل" />
              </Field>

              <Field label="التخصص" hint="نوع العقارات اللي تركّز عليها">
                <input value={specialization} onChange={e => setSpecialization(e.target.value)} style={inputStyle} placeholder="فلل وأراضي شمال الرياض" />
              </Field>

              <Field label="نطاق التغطية" hint="افصل بين الأحياء أو المدن بفاصلة (,)">
                <input value={coverageAreas} onChange={e => setCoverageAreas(e.target.value)} style={inputStyle} placeholder="الياسمين، الملقا، النرجس" />
              </Field>

              <Field label="نبذة قصيرة" hint="جملة أو جملتين عن خبرتك — سيُستخدمها AI في الردود">
                <textarea value={bioShort} onChange={e => setBioShort(e.target.value)} rows={3} style={inputStyle} placeholder="١٠ سنوات في وساطة العقارات السكنية، متخصص في..." />
              </Field>

              <Field label="نبرة الكتابة" hint="نبرة الردود التلقائية على عملائك">
                <select value={writingTone} onChange={e => setWritingTone(e.target.value)} style={inputStyle}>
                  <option value="احترافي ودود">احترافي ودود</option>
                  <option value="رسمي">رسمي</option>
                  <option value="ودي قريب">ودّي قريب</option>
                </select>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(232,184,109,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={17} style={{ color: "#E8B86D" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F4F4F5" }}>اختر خطتك</h2>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>تقدر تغيرها أي وقت من الإعدادات</p>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                <PlanCard
                  selected={selectedPlan === "free"}
                  onClick={() => setSelectedPlan("free")}
                  icon={Gift}
                  name="مجاني"
                  price="0 ر.س"
                  features={["٥ عقارات", "١٠ عملاء", "صفحة عقاري عامة"]}
                  recommended={false}
                  color="#71717A"
                />
                <PlanCard
                  selected={selectedPlan === "basic"}
                  onClick={() => setSelectedPlan("basic")}
                  icon={Zap}
                  name="أساسي"
                  price="199 ر.س / شهر"
                  features={["٥٠ عقار + عملاء غير محدودين", "٣ موظفين AI (تسويق + متابعة + محلل)", "العقود الإلكترونية + ZATCA"]}
                  recommended
                  color="#C6914C"
                />
                <PlanCard
                  selected={selectedPlan === "pro"}
                  onClick={() => setSelectedPlan("pro")}
                  icon={Crown}
                  name="احترافي"
                  price="499 ر.س / شهر"
                  features={["كل شي بدون حدود", "٤ موظفين AI (مع موظف الاستقبال)", "WhatsApp Business API + فريق ١٠"]}
                  recommended={false}
                  color="#E8B86D"
                />
              </div>

              <div style={{ marginTop: 14, padding: 12, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 8, fontSize: 12, color: "#A1A1AA" }}>
                💡 ابدأ بالمجاني وجرّب المنصة. تقدر ترقّي خطتك من <strong>الإعدادات → الاشتراك</strong> في أي وقت.
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={17} style={{ color: "#A78BFA" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F4F4F5" }}>تفعيل الموظفين الذكيين</h2>
                  <p style={{ fontSize: 12, color: "#71717A", marginTop: 2 }}>يبدأون العمل تلقائياً عنك</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <ToggleCard
                  enabled={enableMarketer} onChange={setEnableMarketer}
                  title="موظف التسويق"
                  desc="يولّد ٣ منشورات يومياً لأحدث عقاراتك (تويتر/إنستجرام/واتساب) — تراجعها وتنشرها"
                  schedule="يومياً 10ص"
                  color="#C6914C"
                />
                <ToggleCard
                  enabled={enableFollowup} onChange={setEnableFollowup}
                  title="موظف المتابعة"
                  desc="يكتب رسائل واتساب مخصّصة للعملاء الباردين الذين لم تتواصل معهم منذ 14+ يوم"
                  schedule="يومياً 6م"
                  color="#34D399"
                />
                <ToggleCard
                  enabled={enableAnalyst} onChange={setEnableAnalyst}
                  title="محلل البيانات"
                  desc="تقرير أسبوعي بالأرقام والتوصيات لتحسين أدائك في الأسبوع القادم"
                  schedule="أسبوعياً — الأحد 9ص"
                  color="#A78BFA"
                />
                <div style={{ padding: 12, background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: 9, fontSize: 12, color: "#A1A1AA" }}>
                  📱 <strong>موظف الاستقبال</strong> (يرد على واتساب تلقائياً) متاح بعد ربط Meta Business — تقدر تفعّله لاحقاً.
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 26, justifyContent: "space-between" }}>
            {step > 1 ? (
              <button onClick={prev} style={btnSecondary}>
                <ArrowRight size={14} /> السابق
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={next} style={btnPrimary}>
                التالي <ArrowLeft size={14} />
              </button>
            ) : (
              <button onClick={complete} disabled={submitting} style={{ ...btnPrimary, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
                إكمال + الدخول للداشبورد
              </button>
            )}
          </div>
        </div>

        {/* Skip link */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button onClick={() => router.replace("/dashboard")} style={{ background: "none", border: "none", color: "#52525B", fontSize: 12, cursor: "pointer", fontFamily: "'Tajawal', sans-serif" }}>
            تخطٍّ الإعداد والذهاب للداشبورد
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ selected, onClick, icon: Icon, name, price, features, recommended, color }: {
  selected: boolean; onClick: () => void; icon: typeof Gift; name: string; price: string;
  features: string[]; recommended: boolean; color: string;
}) {
  return (
    <button onClick={onClick}
      style={{
        textAlign: "right", padding: 16, borderRadius: 11,
        background: selected ? `${color}10` : "#18181B",
        border: `2px solid ${selected ? color : "rgba(255,255,255,0.06)"}`,
        cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
        position: "relative", transition: "all 0.2s",
      }}>
      {recommended && (
        <span style={{ position: "absolute", top: -10, insetInlineStart: 14, fontSize: 10, padding: "2px 9px", borderRadius: 100, background: color, color: "#0A0A0C", fontWeight: 700 }}>
          الأكثر طلباً
        </span>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#E4E4E7" }}>{name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{price}</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
            {features.map((f, i) => (
              <li key={i} style={{ fontSize: 11.5, color: "#A1A1AA", display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={11} style={{ color: "#4ADE80", flexShrink: 0 }} /> {f}
              </li>
            ))}
          </ul>
        </div>
        {selected && <CheckCircle2 size={18} style={{ color, flexShrink: 0 }} />}
      </div>
    </button>
  );
}

function ToggleCard({ enabled, onChange, title, desc, schedule, color }: {
  enabled: boolean; onChange: (v: boolean) => void; title: string; desc: string; schedule: string; color: string;
}) {
  return (
    <button onClick={() => onChange(!enabled)}
      style={{
        textAlign: "right", padding: 14, borderRadius: 10,
        background: enabled ? `${color}08` : "#18181B",
        border: `1px solid ${enabled ? `${color}33` : "rgba(255,255,255,0.05)"}`,
        cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7" }}>{title}</span>
          <span style={{ fontSize: 10, color: color, background: `${color}15`, padding: "2px 7px", borderRadius: 4 }}>{schedule}</span>
        </div>
        <p style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.7 }}>{desc}</p>
      </div>
      <div style={{
        width: 38, height: 22, borderRadius: 11, position: "relative",
        background: enabled ? color : "#27272A", flexShrink: 0, transition: "all 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 2, insetInlineStart: enabled ? 18 : 2,
          width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s",
        }} />
      </div>
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: "#A1A1AA", marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: "#52525B", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(ellipse at top, rgba(198,145,76,0.06) 0%, #09090B 65%)",
  color: "#E4E4E7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  fontFamily: "'Tajawal', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: "#18181B",
  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9,
  color: "#E4E4E7", fontSize: 14, fontFamily: "'Tajawal', sans-serif",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 10,
  background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
  color: "#0A0A0C", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "'Tajawal', sans-serif",
};

const btnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7, padding: "11px 18px", borderRadius: 10,
  background: "rgba(255,255,255,0.04)", color: "#A1A1AA",
  border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, cursor: "pointer",
  fontFamily: "'Tajawal', sans-serif",
};
