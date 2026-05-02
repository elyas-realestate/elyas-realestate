"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight, Save, Eye, EyeOff, Upload, X, Lock,
  Sparkles, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import SARIcon from "../../../components/SARIcon";
import { checkLimit } from "@/lib/plan-limits";
import { toast } from "sonner";
import MapsLinkInput from "@/app/components/MapsLinkInput";


const categoriesMap: Record<string, string[]> = {
  "سكني":    ["شقة","فيلا","دور","استوديو","دوبلكس","تاون هاوس","عمارة سكنية","مجمع سكني","قصر","استراحة"],
  "تجاري":   ["معرض","مكتب","محل تجاري","عمارة تجارية","مستودع","فندق","شقق فندقية","مجمع تجاري","برج تجاري"],
  "زراعي":   ["أرض زراعية","مزرعة"],
  "صناعي":   ["أرض صناعية","مستودع صناعي","مصنع","ورشة"],
  "أرض":     ["أرض سكنية","أرض تجارية","أرض زراعية","أرض صناعية","أرض خام"],
};

const offerTypes = ["بيع", "إيجار", "استثمار", "تطوير بالشراكة"];

const inp = "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--border-1)] focus:outline-none focus:border-[var(--gold-2)] transition";
const lbl = "block text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-wide";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface-1)] border border-[var(--gold-bg)] rounded-2xl p-6">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-2)", letterSpacing: 1.5, marginBottom: 20, textTransform: "uppercase" }}>{title}</h3>
      {children}
    </div>
  );
}

// ── Watermark helper ──────────────────────────────────────────────────────────
async function applyWatermark(file: File, brokerName: string): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Draw original image
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Watermark settings
      const fontSize = Math.max(16, Math.round(img.width * 0.028));
      ctx.font        = `bold ${fontSize}px Cairo, Tajawal, sans-serif`;
      ctx.fillStyle   = "rgba(255,255,255,0.55)";
      ctx.strokeStyle = "var(--shadow-overlay-2)";
      ctx.lineWidth   = 2;
      ctx.textAlign   = "center";

      const label = `وسيط برو | ${brokerName}`;

      // 3 random positions across the image (within safe margins)
      const randBetween = (min: number, max: number) => min + Math.random() * (max - min);
      const positions = [
        { x: randBetween(img.width * 0.55, img.width * 0.9), y: randBetween(img.height * 0.06, img.height * 0.25) },
        { x: randBetween(img.width * 0.2, img.width * 0.8),  y: randBetween(img.height * 0.35, img.height * 0.65) },
        { x: randBetween(img.width * 0.1, img.width * 0.45), y: randBetween(img.height * 0.75, img.height * 0.94) },
      ];

      positions.forEach(({ x, y }) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-Math.PI / 12); // slight tilt
        ctx.strokeText(label, 0, 0);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });

      canvas.toBlob((blob) => resolve(blob || file), file.type || "image/jpeg", 0.92);
    };
    img.onerror = () => resolve(file); // fallback: no watermark
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

// ── License validation ────────────────────────────────────────────────────────
function licenseStatus(v: string): "empty" | "ok" | "bad" {
  if (!v) return "empty";
  if (/^(71|72)\d{8}$/.test(v)) return "ok";
  return "bad";
}

export default function AddProperty() {
  const router = useRouter();
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [limitBlocked, setLimitBlocked] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading]       = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [aiLoading, setAiLoading]       = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [brokerName, setBrokerName]     = useState("وسيط برو");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", main_category: "", sub_category: "", offer_type: "",
    city: "الرياض", district: "", land_area: "", built_area: "",
    rooms: "", bathrooms: "", floors: "", price: "",
    description: "", main_image: "", extra_images: "", location_url: "",
    latitude: null as number | null, longitude: null as number | null,
    contact_phone: "", ad_license_number: "", is_published: false,
  });

  useEffect(() => {
    checkLimit(supabase, "properties").then(result => {
      if (!result.allowed) setLimitBlocked(result.reason || "وصلت للحد الأقصى");
    });
    supabase.from("broker_identity").select("broker_name").limit(1).single().then(({ data }) => {
      if (data?.broker_name) setBrokerName(data.broker_name);
    });
  }, []);

  useEffect(() => {
    if (form.main_category) {
      setSubCategories(categoriesMap[form.main_category] || []);
      setForm(f => ({ ...f, sub_category: "" }));
    }
  }, [form.main_category]);

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  }

  // ── AI Description ────────────────────────────────────────────────────────
  async function handleAIDescription() {
    const hasData = form.main_category || form.sub_category || form.city || form.district || form.price;
    if (!hasData) {
      toast.error("أدخل بعض بيانات العقار أولاً لكي يكتب الذكاء الاصطناعي وصفاً دقيقاً");
      return;
    }
    setAiLoading(true);
    try {
      const specs: string[] = [];
      if (form.offer_type)    specs.push(`نوع العرض: ${form.offer_type}`);
      if (form.main_category) specs.push(`التصنيف: ${form.main_category}`);
      if (form.sub_category)  specs.push(`النوع: ${form.sub_category}`);
      if (form.city)          specs.push(`المدينة: ${form.city}`);
      if (form.district)      specs.push(`الحي: ${form.district}`);
      if (form.land_area)     specs.push(`مساحة الأرض: ${form.land_area} م²`);
      if (form.built_area)    specs.push(`مسطح البناء: ${form.built_area} م²`);
      if (form.rooms)         specs.push(`الغرف: ${form.rooms}`);
      if (form.bathrooms)     specs.push(`دورات المياه: ${form.bathrooms}`);
      if (form.floors)        specs.push(`الأدوار: ${form.floors}`);
      if (form.price)         specs.push(`السعر: ${Number(form.price).toLocaleString("ar-SA")} ريال`);

      const res = await fetch("/api/ai-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "anthropic",
          model: "claude-opus-4-6",
          mode: "single",
          systemPrompt: "أنت خبير تسويق عقاري سعودي متميز. مهمتك كتابة وصف عقاري احترافي وجذاب باللغة العربية الفصحى. الوصف يجب أن يكون:\n- من 3 إلى 5 فقرات\n- يبرز مميزات العقار بشكل جذاب\n- يستخدم مفردات تسويقية مناسبة للسوق السعودي\n- لا يتجاوز 350 كلمة\n- بدون عناوين أو نقاط — نص متدفق فقط",
          userPrompt: `اكتب وصفاً تسويقياً احترافياً لهذا العقار:\n${specs.join("\n")}${form.title ? `\nعنوان الإعلان: ${form.title}` : ""}`,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      set("description", data.result);
      toast.success("تم توليد الوصف بنجاح");
    } catch (err: any) {
      toast.error("تعذّر توليد الوصف: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  // ── Image Upload with optional watermark ─────────────────────────────────
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        let uploadFile: Blob = file;

        // Apply watermark if enabled
        if (watermarkEnabled && file.type.startsWith("image/")) {
          uploadFile = await applyWatermark(file, brokerName);
        }

        const ext  = file.name.split(".").pop() || "jpg";
        const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("assets")
          .upload(path, uploadFile, { upsert: true, contentType: file.type });

        if (!upErr) {
          const { data } = supabase.storage.from("assets").getPublicUrl(path);
          newUrls.push(data.publicUrl);
        }
      } catch {
        // skip failed image
      }
    }

    setUploadedImages(prev => {
      const merged = [...prev, ...newUrls];
      if (merged.length > 0 && !form.main_image) set("main_image", merged[0]);
      return merged;
    });
    setUploading(false);
  }

  function removeImage(url: string) {
    setUploadedImages(prev => prev.filter(u => u !== url));
    if (form.main_image === url) {
      const remaining = uploadedImages.filter(u => u !== url);
      set("main_image", remaining[0] || "");
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    if (!form.offer_type)    { setError("يرجى اختيار نوع العرض (بيع / إيجار / ...)"); return; }
    if (!form.main_category) { setError("يرجى اختيار التصنيف الرئيسي"); return; }

    const lic = form.ad_license_number.trim();
    if (lic && licenseStatus(lic) === "bad") {
      setError("رقم ترخيص الإعلان غير صحيح — يجب أن يبدأ بـ 71 أو 72 ويكون 10 أرقام");
      return;
    }

    setLoading(true);

    const extraUrls = form.extra_images.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const allImages = [...new Set([...uploadedImages, form.main_image, ...extraUrls].filter(Boolean))];

    const payload: any = {
      title:         form.title,
      main_category: form.main_category,
      sub_category:  form.sub_category,
      offer_type:    form.offer_type,
      city:          form.city,
      district:      form.district,
      land_area:     form.land_area  ? Number(form.land_area)  : null,
      built_area:    form.built_area ? Number(form.built_area) : null,
      rooms:         form.rooms      ? Number(form.rooms)      : null,
      bathrooms:     form.bathrooms  ? Number(form.bathrooms)  : null,
      floors:        form.floors     ? Number(form.floors)     : null,
      price:         form.price      ? Number(form.price)      : null,
      description:   form.description,
      main_image:    form.main_image || null,
      location_url:  form.location_url || null,
      latitude:      form.latitude,
      longitude:     form.longitude,
      contact_phone: form.contact_phone || null,
      is_published:  form.is_published,
    };
    if (allImages.length) payload.images = allImages;
    if (lic) payload.ad_license_number = lic;

    const { error: err } = await supabase.from("properties").insert([payload]);

    if (err) {
      setError("خطأ من قاعدة البيانات: " + err.message);
      setLoading(false);
      return;
    }

    toast.success("تم حفظ العقار بنجاح");
    router.push("/dashboard/properties");
  }

  // ── حد الخطة ──────────────────────────────────────────────────────────────
  if (limitBlocked) {
    return (
      <div dir="rtl" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--gold-bg-soft)", border: "1px solid var(--gold-bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={26} style={{ color: "var(--gold-2)" }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-strong)", marginBottom: 10 }}>تجاوزت حد خطتك</h2>
        <p style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.7, marginBottom: 24 }}>{limitBlocked}</p>
        <Link href="/dashboard/subscription" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))", color: "var(--bg-page)", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          عرض الخطط والترقية
        </Link>
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard/properties" style={{ fontSize: 13, color: "var(--text-faint)", textDecoration: "none" }}>← العودة للعقارات</Link>
        </div>
      </div>
    );
  }

  const licSt = licenseStatus(form.ad_license_number);

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6" style={{ color: "var(--text-faint)", fontSize: 13 }}>
        <Link href="/dashboard/properties" className="hover:text-[var(--gold-2)] transition no-underline" style={{ color: "var(--text-faint)" }}>العقارات</Link>
        <ArrowRight size={14} />
        <span style={{ color: "var(--text-strong)" }}>إضافة عقار جديد</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">إضافة عقار جديد</h2>
          <p style={{ color: "var(--text-faint)", fontSize: 13 }}>أدخل بيانات العقار ثم احفظ</p>
        </div>
        <button
          type="button"
          onClick={() => set("is_published", !form.is_published)}
          className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition"
          style={{
            background: form.is_published ? "var(--gold-bg)" : "var(--bg-surface-2)",
            border: "1px solid " + (form.is_published ? "var(--gold-bg-strong)" : "var(--gold-bg)"),
            color: form.is_published ? "var(--gold-2)" : "var(--text-faint)",
            fontSize: 13, fontWeight: 600,
          }}
        >
          {form.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
          {form.is_published ? "منشور" : "مسودة"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

        {/* ═══ الأساسيات ═══ */}
        <Section title="الأساسيات">
          <div className="space-y-4">
            <div>
              <label className={lbl}>عنوان العقار *</label>
              <input name="title" value={form.title} onChange={handleChange} required className={inp} placeholder="مثال: فيلا فاخرة في حي النرجس — 5 غرف" />
            </div>

            <div>
              <label className={lbl}>نوع العرض *</label>
              <div className="flex gap-2 flex-wrap">
                {offerTypes.map(t => (
                  <button key={t} type="button" onClick={() => set("offer_type", t)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition"
                    style={{
                      background: form.offer_type === t ? "var(--gold-bg-hover)" : "var(--bg-surface-2)",
                      color: form.offer_type === t ? "var(--gold-2)" : "var(--text-soft)",
                      border: "1px solid " + (form.offer_type === t ? "rgba(198,145,76,0.35)" : "var(--gold-bg-soft)"),
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>التصنيف الرئيسي *</label>
                <select name="main_category" value={form.main_category} onChange={handleChange} required className={inp}>
                  <option value="">اختر...</option>
                  {Object.keys(categoriesMap).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>التصنيف الفرعي</label>
                <select name="sub_category" value={form.sub_category} onChange={handleChange} className={inp} disabled={!form.main_category}>
                  <option value="">اختر...</option>
                  {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ الموقع ═══ */}
        <Section title="الموقع">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>المدينة *</label>
                <input name="city" value={form.city} onChange={handleChange} required className={inp} />
              </div>
              <div>
                <label className={lbl}>الحي *</label>
                <input name="district" value={form.district} onChange={handleChange} required className={inp} placeholder="مثال: النرجس" />
              </div>
            </div>
            <MapsLinkInput
              lat={form.latitude}
              lng={form.longitude}
              onChange={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng, location_url: `https://www.google.com/maps?q=${lat},${lng}` }))}
              onClear={() => setForm(f => ({ ...f, latitude: null, longitude: null, location_url: "" }))}
            />
          </div>
        </Section>

        {/* ═══ المواصفات ═══ */}
        <Section title="المواصفات">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>مساحة الأرض م²</label>
                <input name="land_area" value={form.land_area} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
              </div>
              <div>
                <label className={lbl}>مسطح البناء م²</label>
                <input name="built_area" value={form.built_area} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>الغرف</label>
                <input name="rooms" value={form.rooms} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
              </div>
              <div>
                <label className={lbl}>دورات المياه</label>
                <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
              </div>
              <div>
                <label className={lbl}>عدد الأدوار</label>
                <input name="floors" value={form.floors} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ السعر والتواصل ═══ */}
        <Section title="السعر والتواصل">
          <div className="space-y-4">
            <div>
              <label className={lbl} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                السعر <SARIcon size={11} color="secondary" />
              </label>
              <input name="price" value={form.price} onChange={handleChange} type="number" className={inp} placeholder="0" dir="ltr" />
            </div>
            <div>
              <label className={lbl}>رقم التواصل</label>
              <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className={inp} placeholder="05xxxxxxxx" dir="ltr" />
            </div>

            {/* License number with live validation */}
            <div>
              <label className={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>رقم ترخيص الإعلان العقاري</span>
                <span style={{ color: "var(--text-faint)", fontWeight: 400, fontSize: 10 }}>اختياري — يبدأ بـ 71 أو 72 ويكون 10 أرقام</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="ad_license_number"
                  value={form.ad_license_number}
                  onChange={e => set("ad_license_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={inp}
                  placeholder="71xxxxxxxx"
                  dir="ltr"
                  style={{
                    paddingLeft: 40,
                    borderColor: licSt === "ok" ? "rgba(52,211,153,0.5)"
                               : licSt === "bad" ? "rgba(248,113,113,0.5)"
                               : "var(--gold-bg-hover)",
                  }}
                />
                {licSt !== "empty" && (
                  <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                    {licSt === "ok"
                      ? <CheckCircle2 size={16} style={{ color: "var(--success-2)" }} />
                      : <AlertCircle  size={16} style={{ color: "var(--danger)" }} />}
                  </div>
                )}
              </div>
              {licSt === "bad" && (
                <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 5 }}>
                  الرقم غير صحيح — يجب أن يبدأ بـ 71 أو 72 ويتكون من 10 أرقام بالضبط
                </p>
              )}
              {licSt === "ok" && (
                <p style={{ fontSize: 11, color: "var(--success-2)", marginTop: 5 }}>رقم الترخيص صحيح</p>
              )}
            </div>
          </div>
        </Section>

        {/* ═══ الوصف + AI ═══ */}
        <Section title="الوصف">
          <div className="space-y-3">
            {/* AI button */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                اكتب الوصف يدوياً أو استخدم الذكاء الاصطناعي لتوليده تلقائياً
              </p>
              <button
                type="button"
                onClick={handleAIDescription}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, var(--gold-bg-hover), var(--gold-bg-soft))",
                  border: "1px solid var(--gold-bg-strong)",
                  color: "var(--gold-2)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: aiLoading ? "not-allowed" : "pointer",
                }}
              >
                {aiLoading
                  ? <><Loader2 size={15} className="animate-spin" /> جاري التوليد...</>
                  : <><Sparkles size={15} /> اكتب بالذكاء الاصطناعي</>}
              </button>
            </div>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              className={inp}
              placeholder="صف العقار بتفاصيل تساعد المشتري أو المستأجر على اتخاذ القرار..."
              style={{ resize: "vertical" }}
            />

            {form.description && (
              <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "left" }} dir="ltr">
                {form.description.length} حرف
              </p>
            )}
          </div>
        </Section>

        {/* ═══ الصور ═══ */}
        <Section title="الصور">
          <div className="space-y-4">

            {/* Watermark toggle */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "rgba(198,145,76,0.04)", border: "1px solid var(--gold-bg)" }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-on-dark)" }}>العلامة المائية التلقائية</p>
                <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>
                  يضيف "وسيط برو | {brokerName}" على الصور في 3 مواضع
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWatermarkEnabled(v => !v)}
                className="relative rounded-full transition-all"
                style={{
                  width: 44, height: 24,
                  background: watermarkEnabled ? "var(--gold-2)" : "var(--bg-surface-3)",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: watermarkEnabled ? 22 : 3,
                    width: 18, height: 18,
                    borderRadius: "50%",
                    background: "white",
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Drop zone */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { handleImageUpload(e.target.files); e.target.value = ""; }} />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onDrop={e => { e.preventDefault(); setIsDragging(false); handleImageUpload(e.dataTransfer.files); }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl transition-all"
              style={{
                border: "2px dashed " + (isDragging ? "var(--gold-2)" : "rgba(198,145,76,0.25)"),
                padding: "36px 20px",
                background: isDragging ? "var(--gold-bg-soft)" : "rgba(198,145,76,0.03)",
                cursor: "pointer",
                transform: isDragging ? "scale(1.01)" : "scale(1)",
              }}>
              {uploading ? (
                <>
                  <div className="w-7 h-7 border-2 rounded-full animate-spin"
                    style={{ borderColor: "var(--gold-bg-strong)", borderTopColor: "var(--gold-2)" }} />
                  <span style={{ color: "var(--text-soft)", fontSize: 13 }}>
                    جاري الرفع{watermarkEnabled ? " وإضافة العلامة المائية" : ""}...
                  </span>
                </>
              ) : isDragging ? (
                <>
                  <Upload size={28} style={{ color: "var(--gold-2)" }} />
                  <p style={{ color: "var(--gold-2)", fontSize: 14, fontWeight: 700 }}>أفلت الصور هنا</p>
                </>
              ) : (
                <>
                  <Upload size={24} style={{ color: "var(--gold-2)" }} />
                  <div className="text-center">
                    <p style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 600 }}>اسحب الصور هنا أو اضغط للاختيار</p>
                    <p style={{ color: "var(--text-faint)", fontSize: 12, marginTop: 4 }}>
                      JPG, PNG — يمكن اختيار أكثر من صورة
                      {watermarkEnabled && " · ستُضاف العلامة المائية تلقائياً"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Image gallery */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedImages.map((url, i) => (
                  <div key={url} className="relative rounded-xl overflow-hidden group"
                    style={{ height: 110, background: "var(--bg-surface-2)", border: "2px solid " + (i === 0 ? "var(--gold-2)" : "transparent") }}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: "var(--gold-2)", color: "var(--bg-page)" }}>رئيسية</div>
                    )}
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "rgba(248,113,113,0.9)" }}>
                      <X size={12} style={{ color: "white" }} />
                    </button>
                    {i !== 0 && (
                      <button type="button"
                        onClick={() => {
                          setUploadedImages(prev => [url, ...prev.filter(u => u !== url)]);
                          set("main_image", url);
                        }}
                        className="absolute bottom-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        style={{ background: "var(--header-bg-3)", color: "var(--gold-2)" }}>
                        تعيين رئيسية
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* URL fallback */}
            <div>
              <label className={lbl}>أو أدخل رابط URL مباشر</label>
              <input name="main_image" value={form.main_image} onChange={handleChange} className={inp} placeholder="https://..." dir="ltr" />
            </div>
          </div>
        </Section>

        {/* ═══ خطأ ═══ */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--danger)" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* ═══ زر الحفظ ═══ */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[var(--bg-page)] transition disabled:opacity-50"
            style={{ background: loading ? "rgba(198,145,76,0.4)" : "linear-gradient(135deg, var(--gold-2), var(--gold-3))", fontSize: 15 }}>
            <Save size={18} />
            {loading ? "جاري الحفظ..." : "حفظ العقار"}
          </button>
          <Link href="/dashboard/properties"
            className="px-6 py-3.5 rounded-xl text-sm font-medium no-underline transition"
            style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)", border: "1px solid var(--gold-bg)" }}>
            إلغاء
          </Link>
        </div>

      </form>
    </div>
  );
}
