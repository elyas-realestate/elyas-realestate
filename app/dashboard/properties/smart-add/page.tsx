"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@/lib/logger";
import {
  ArrowRight,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
  Check,
  Edit3,
  Save,
  Brain,
  Zap,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { applyWatermark } from "@/lib/watermark";

const inp =
  "w-full bg-[var(--bg-surface-2)] border border-[var(--gold-bg-hover)] rounded-xl px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--border-1)] focus:outline-none focus:border-[var(--gold-2)] transition";
const lbl = "block text-xs font-semibold text-[var(--text-soft)] mb-2 tracking-wide";

type ExtractedData = {
  title: string;
  offer_type: string;
  main_category: string;
  sub_category: string;
  city: string;
  district: string;
  land_area: number | null;
  built_area: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  price: number | null;
  description: string;
  confidence: number;
};

export default function SmartAddProperty() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "review" | "saving">("upload");
  const [textInput, setTextInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // ── Image handling ──
  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
        setImageFiles((prev) => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── AI Analysis ──
  async function handleAnalyze() {
    if (!textInput.trim() && images.length === 0) {
      toast.error("أدخل نصاً أو ارفع صوراً للتحليل");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: textInput.trim() || undefined,
          images: images.length > 0 ? images.slice(0, 3) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "فشل التحليل");
        setAnalyzing(false);
        return;
      }

      setExtracted(data.data);
      setStep("review");
      toast.success("تم تحليل المحتوى بنجاح!");
    } catch {
      toast.error("حدث خطأ أثناء التحليل");
    }
    setAnalyzing(false);
  }

  // ── Save to database ──
  async function handleSave() {
    if (!extracted) return;
    setSaving(true);
    setStep("saving");

    try {
      // Upload images to Supabase Storage with Watermarking
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        let processedFile = file;
        try {
          // جلب اسم الوسيط أو المنصة من الهوية (إن أمكن) أو استخدام ثابت مؤقت للحماية
          const { data: idData } = await supabase
            .from("broker_identity")
            .select("broker_name")
            .limit(1)
            .single();
          const watermarkText = idData?.broker_name || "وسيط برو";
          processedFile = await applyWatermark(file, watermarkText);
        } catch (we) {
          logger.warn("[smart-add] watermark failed, uploading original", {
            error: String(we),
          });
        }

        const ext = processedFile.name.split(".").pop() || "jpg";
        const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("assets")
          .upload(path, processedFile, { upsert: true });
        if (!upErr) {
          const { data } = supabase.storage.from("assets").getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }

      const payload: any = {
        title: extracted.title || "عقار جديد",
        offer_type: extracted.offer_type || "بيع",
        main_category: extracted.main_category || "سكني",
        sub_category: extracted.sub_category || null,
        city: extracted.city || "الرياض",
        district: extracted.district || null,
        land_area: extracted.land_area,
        built_area: extracted.built_area,
        rooms: extracted.rooms,
        bathrooms: extracted.bathrooms,
        floors: extracted.floors,
        price: extracted.price,
        description: extracted.description || null,
        main_image: uploadedUrls[0] || null,
        images: uploadedUrls.length > 0 ? uploadedUrls : null,
        is_published: false,
      };

      const { error } = await supabase.from("properties").insert([payload]);
      if (error) throw error;

      toast.success("تم إضافة العقار بنجاح! 🎉");
      router.push("/dashboard/properties");
    } catch (err) {
      toast.error("فشل الحفظ: " + (err instanceof Error ? err.message : "خطأ غير معروف"));
      setStep("review");
    }
    setSaving(false);
  }

  // ── Update extracted field ──
  function updateField(key: keyof ExtractedData, value: any) {
    if (!extracted) return;
    setExtracted({ ...extracted, [key]: value });
  }

  const confidencePct = extracted ? Math.round(extracted.confidence * 100) : 0;
  const confidenceColor =
    confidencePct >= 80
      ? "var(--success)"
      : confidencePct >= 50
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div
        className="mb-6 flex items-center gap-2"
        style={{ color: "var(--text-faint)", fontSize: 13 }}
      >
        <Link
          href="/dashboard/properties"
          className="no-underline transition hover:text-[var(--gold-2)]"
          style={{ color: "var(--text-faint)" }}
        >
          العقارات
        </Link>
        <ArrowRight size={14} />
        <span style={{ color: "var(--text-strong)" }}>إضافة ذكية بالـ AI</span>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            background: "linear-gradient(135deg, var(--gold-bg-hover), rgba(168,93,255,0.1))",
            border: "1px solid var(--gold-bg-hover)",
          }}
        >
          <Brain size={22} style={{ color: "var(--gold-2)" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold">إضافة عقار ذكية</h2>
          <p style={{ color: "var(--text-faint)", fontSize: 13 }}>
            ارفع صور أو أرسل نص وسيقوم الذكاء الاصطناعي بملء البيانات تلقائياً
          </p>
        </div>
      </div>

      {/* تبديل بين الإدخال اليدوي والذكي */}
      <div
        className="mb-6 flex gap-2 rounded-xl p-1"
        style={{
          background: "var(--bg-surface-1)",
          border: "1px solid var(--gold-bg)",
          maxWidth: "fit-content",
        }}
      >
        <Link
          href="/dashboard/properties/add"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm no-underline"
          style={{ color: "var(--text-soft)" }}
        >
          إدخال يدوي
        </Link>
        <span
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          style={{
            background: "var(--gold-bg)",
            color: "var(--gold-2)",
            border: "1px solid var(--gold-2)",
          }}
        >
          ✨ إدخال ذكي بالـ AI
        </span>
      </div>

      {/* ══ Step indicators ══ */}
      <div className="mb-8 flex items-center gap-2">
        {[
          { num: 1, label: "الرفع", active: step === "upload" },
          { num: 2, label: "المراجعة", active: step === "review" },
          { num: 3, label: "الحفظ", active: step === "saving" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && (
              <div
                style={{
                  width: 40,
                  height: 1,
                  background:
                    s.active || step === "saving" ? "var(--gold-2)" : "var(--bg-surface-3)",
                }}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 12,
                  fontWeight: 700,
                  background: s.active ? "var(--gold-2)" : "var(--gold-bg-soft)",
                  color: s.active ? "var(--bg-page)" : "var(--text-faint)",
                  border: `1px solid ${s.active ? "var(--gold-2)" : "var(--gold-bg-hover)"}`,
                }}
              >
                {step === "saving" && s.num <= 2 ? <Check size={12} /> : s.num}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: s.active ? "var(--gold-2)" : "var(--text-faint)",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════ STEP 1: Upload ══════ */}
      {step === "upload" && (
        <div className="max-w-3xl space-y-5">
          {/* Image Upload */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--gold-2)",
                letterSpacing: 1.5,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              <ImageIcon
                size={14}
                style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }}
              />
              صور العقار
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl transition-all"
              style={{
                border: "2px dashed " + (isDragging ? "var(--gold-2)" : "rgba(198,145,76,0.25)"),
                padding: "36px 20px",
                background: isDragging ? "var(--gold-bg-soft)" : "rgba(198,145,76,0.03)",
                cursor: "pointer",
              }}
            >
              <Upload size={24} style={{ color: "var(--gold-2)" }} />
              <p style={{ color: "var(--text-strong)", fontSize: 14, fontWeight: 600 }}>
                اسحب الصور هنا أو اضغط للاختيار
              </p>
              <p style={{ color: "var(--text-faint)", fontSize: 12 }}>JPG, PNG — حتى 5 صور</p>
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl"
                    style={{ height: 80, background: "var(--bg-surface-2)" }}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"
                      style={{ background: "rgba(248,113,113,0.9)" }}
                    >
                      <X size={10} style={{ color: "white" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Text Input */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <h3
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--gold-2)",
                letterSpacing: 1.5,
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              <FileText
                size={14}
                style={{ display: "inline", marginLeft: 6, verticalAlign: "middle" }}
              />
              النص أو التفاصيل
            </h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={6}
              className={inp}
              placeholder="أدخل أي معلومات عن العقار هنا... مثال:&#10;فيلا 5 غرف في حي النرجس بالرياض&#10;مساحة 400 متر، السعر 2 مليون ريال&#10;أو الصق رسالة واتساب أو إعلان عقاري..."
              style={{ resize: "vertical" }}
            />
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
              يمكنك إدخال النص بأي صيغة — رسالة واتساب، إعلان، تفاصيل مرتبة أو عشوائية
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!textInput.trim() && images.length === 0)}
            className="flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-bold transition disabled:opacity-40"
            style={{
              background: analyzing
                ? "var(--gold-bg-hover)"
                : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: analyzing ? "var(--gold-2)" : "var(--bg-page)",
              border: "none",
              cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" /> جاري التحليل بالذكاء الاصطناعي...
              </>
            ) : (
              <>
                <Sparkles size={18} /> تحليل بالذكاء الاصطناعي
              </>
            )}
          </button>
        </div>
      )}

      {/* ══════ STEP 2: Review ══════ */}
      {step === "review" && extracted && (
        <div className="max-w-3xl space-y-5">
          {/* Confidence Badge */}
          <div
            className="flex items-center justify-between rounded-xl px-5 py-3"
            style={{ background: `${confidenceColor}08`, border: `1px solid ${confidenceColor}25` }}
          >
            <div className="flex items-center gap-3">
              <Zap size={16} style={{ color: confidenceColor }} />
              <span style={{ fontSize: 13, color: "var(--text-on-dark)", fontWeight: 600 }}>
                دقة الاستخراج
              </span>
            </div>
            <span className="font-cairo font-bold" style={{ fontSize: 18, color: confidenceColor }}>
              {confidencePct}%
            </span>
          </div>

          {/* Editable Fields */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
          >
            <div className="mb-5 flex items-center gap-2">
              <Edit3 size={14} style={{ color: "var(--gold-2)" }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-2)" }}>
                راجع وعدّل البيانات المستخرجة
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className={lbl}>العنوان</label>
                <input
                  value={extracted.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className={lbl}>نوع العرض</label>
                  <select
                    value={extracted.offer_type || ""}
                    onChange={(e) => updateField("offer_type", e.target.value)}
                    className={inp}
                  >
                    <option value="بيع">بيع</option>
                    <option value="إيجار">إيجار</option>
                    <option value="استثمار">استثمار</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>التصنيف</label>
                  <select
                    value={extracted.main_category || ""}
                    onChange={(e) => updateField("main_category", e.target.value)}
                    className={inp}
                  >
                    {["سكني", "تجاري", "أرض", "زراعي", "صناعي"].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>النوع الفرعي</label>
                  <input
                    value={extracted.sub_category || ""}
                    onChange={(e) => updateField("sub_category", e.target.value)}
                    className={inp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>المدينة</label>
                  <input
                    value={extracted.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>الحي</label>
                  <input
                    value={extracted.district || ""}
                    onChange={(e) => updateField("district", e.target.value)}
                    className={inp}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
                {[
                  { key: "land_area", label: "مساحة الأرض م²" },
                  { key: "built_area", label: "مسطح البناء م²" },
                  { key: "rooms", label: "الغرف" },
                  { key: "bathrooms", label: "دورات المياه" },
                  { key: "price", label: "السعر (ر.س)" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className={lbl}>{f.label}</label>
                    <input
                      type="number"
                      dir="ltr"
                      value={extracted[f.key as keyof ExtractedData] ?? ""}
                      onChange={(e) =>
                        updateField(
                          f.key as keyof ExtractedData,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className={inp}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className={lbl}>الوصف</label>
                <textarea
                  value={extracted.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  className={inp}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          {/* Image preview */}
          {images.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-soft)",
                  marginBottom: 12,
                }}
              >
                <Eye
                  size={13}
                  style={{ display: "inline", marginLeft: 4, verticalAlign: "middle" }}
                />
                {images.length} صور سيتم رفعها
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((img, i) => (
                  <div key={i} className="overflow-hidden rounded-xl" style={{ height: 70 }}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-8 py-3.5 font-bold transition disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
                color: "var(--bg-page)",
                fontSize: 15,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Save size={18} />
              {saving ? "جاري الحفظ..." : "حفظ العقار"}
            </button>
            <button
              onClick={() => setStep("upload")}
              className="rounded-xl px-6 py-3.5 text-sm font-medium transition"
              style={{
                background: "var(--bg-surface-2)",
                color: "var(--text-soft)",
                border: "1px solid var(--gold-bg)",
                cursor: "pointer",
              }}
            >
              العودة للتعديل
            </button>
          </div>
        </div>
      )}

      {/* ══════ STEP 3: Saving ══════ */}
      {step === "saving" && (
        <div className="mx-auto max-w-md py-20 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "var(--gold-bg-soft)", border: "1px solid var(--gold-bg-hover)" }}
          >
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
          </div>
          <h3 className="mb-2 text-lg font-bold">جاري حفظ العقار...</h3>
          <p style={{ color: "var(--text-faint)", fontSize: 13 }}>يتم رفع الصور وحفظ البيانات</p>
        </div>
      )}
    </div>
  );
}
