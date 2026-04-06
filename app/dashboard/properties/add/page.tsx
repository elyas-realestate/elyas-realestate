"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Save, Eye, EyeOff, Upload, X } from "lucide-react";
import SARIcon from "../../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categoriesMap: Record<string, string[]> = {
  "سكني":    ["شقة","فيلا","دور","استوديو","دوبلكس","تاون هاوس","عمارة سكنية","مجمع سكني","قصر","استراحة"],
  "تجاري":   ["معرض","مكتب","محل تجاري","عمارة تجارية","مستودع","فندق","شقق فندقية","مجمع تجاري","برج تجاري"],
  "زراعي":   ["أرض زراعية","مزرعة"],
  "صناعي":   ["أرض صناعية","مستودع صناعي","مصنع","ورشة"],
  "أرض":     ["أرض سكنية","أرض تجارية","أرض زراعية","أرض صناعية","أرض خام"],
};

const offerTypes = ["بيع", "إيجار", "استثمار", "تطوير بالشراكة"];

const inp = "w-full bg-[#1C1C22] border border-[rgba(198,145,76,0.15)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder:text-[#3A3A42] focus:outline-none focus:border-[#C6914C] transition";
const lbl = "block text-xs font-semibold text-[#9A9AA0] mb-2 tracking-wide";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#16161A] border border-[rgba(198,145,76,0.1)] rounded-2xl p-6">
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#C6914C", letterSpacing: 1.5, marginBottom: 20, textTransform: "uppercase" }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AddProperty() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "", main_category: "", sub_category: "", offer_type: "",
    city: "الرياض", district: "", land_area: "", built_area: "",
    rooms: "", bathrooms: "", floors: "", price: "",
    description: "", main_image: "", extra_images: "", location_url: "",
    contact_phone: "", is_published: false,
  });

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

  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("assets").upload(path, file, { upsert: true });
      if (!upErr) {
        const { data } = supabase.storage.from("assets").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }
    setUploadedImages(prev => [...prev, ...newUrls]);
    if (newUrls.length > 0 && !form.main_image) {
      set("main_image", newUrls[0]);
    }
    setUploading(false);
  }

  function removeImage(url: string) {
    setUploadedImages(prev => prev.filter(u => u !== url));
    if (form.main_image === url) set("main_image", uploadedImages.find(u => u !== url) || "");
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    if (!form.offer_type) { setError("يرجى اختيار نوع العرض (بيع / إيجار / ...)"); return; }
    if (!form.main_category) { setError("يرجى اختيار التصنيف الرئيسي"); return; }

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
      contact_phone: form.contact_phone || null,
      is_published:  form.is_published,
    };
    if (allImages.length) payload.images = allImages;

    const { error: err } = await supabase.from("properties").insert([payload]);

    if (err) {
      setError("خطأ من قاعدة البيانات: " + err.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/properties");
  }

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6" style={{ color: "#5A5A62", fontSize: 13 }}>
        <Link href="/dashboard/properties" className="hover:text-[#C6914C] transition no-underline" style={{ color: "#5A5A62" }}>العقارات</Link>
        <ArrowRight size={14} />
        <span style={{ color: "#F5F5F5" }}>إضافة عقار جديد</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">إضافة عقار جديد</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>أدخل بيانات العقار ثم احفظ</p>
        </div>
        <button
          type="button"
          onClick={() => set("is_published", !form.is_published)}
          className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition"
          style={{ background: form.is_published ? "rgba(198,145,76,0.12)" : "#1C1C22", border: "1px solid " + (form.is_published ? "rgba(198,145,76,0.3)" : "rgba(198,145,76,0.1)"), color: form.is_published ? "#C6914C" : "#5A5A62", fontSize: 13, fontWeight: 600 }}
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
                    style={{ background: form.offer_type === t ? "rgba(198,145,76,0.15)" : "#1C1C22", color: form.offer_type === t ? "#C6914C" : "#9A9AA0", border: "1px solid " + (form.offer_type === t ? "rgba(198,145,76,0.35)" : "rgba(198,145,76,0.08)") }}>
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
            <div>
              <label className={lbl}>رابط الموقع على الخريطة</label>
              <input name="location_url" value={form.location_url} onChange={handleChange} className={inp} placeholder="https://maps.google.com/..." dir="ltr" />
            </div>
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
          </div>
        </Section>

        {/* ═══ الوصف ═══ */}
        <Section title="الوصف">
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inp} placeholder="صف العقار بتفاصيل تساعد المشتري أو المستأجر على اتخاذ القرار..." />
        </Section>

        {/* ═══ الصور ═══ */}
        <Section title="الصور">
          <div className="space-y-4">

            {/* منطقة الرفع — سحب وإفلات + ضغط */}
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
                border: "2px dashed " + (isDragging ? "#C6914C" : "rgba(198,145,76,0.25)"),
                padding: "36px 20px",
                background: isDragging ? "rgba(198,145,76,0.08)" : "rgba(198,145,76,0.03)",
                cursor: "pointer",
                transform: isDragging ? "scale(1.01)" : "scale(1)",
              }}>
              {uploading ? (
                <>
                  <div className="w-7 h-7 border-2 rounded-full animate-spin"
                    style={{ borderColor: "rgba(198,145,76,0.3)", borderTopColor: "#C6914C" }} />
                  <span style={{ color: "#9A9AA0", fontSize: 13 }}>جاري الرفع...</span>
                </>
              ) : isDragging ? (
                <>
                  <Upload size={28} style={{ color: "#C6914C" }} />
                  <p style={{ color: "#C6914C", fontSize: 14, fontWeight: 700 }}>أفلت الصور هنا</p>
                </>
              ) : (
                <>
                  <Upload size={24} style={{ color: "#C6914C" }} />
                  <div className="text-center">
                    <p style={{ color: "#F5F5F5", fontSize: 14, fontWeight: 600 }}>اسحب الصور هنا أو اضغط للاختيار</p>
                    <p style={{ color: "#5A5A62", fontSize: 12, marginTop: 4 }}>JPG, PNG — يمكن اختيار أكثر من صورة</p>
                  </div>
                </>
              )}
            </div>

            {/* معرض الصور المرفوعة */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedImages.map((url, i) => (
                  <div key={url} className="relative rounded-xl overflow-hidden group"
                    style={{ height: 110, background: "#1C1C22", border: "2px solid " + (i === 0 ? "#C6914C" : "transparent") }}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: "#C6914C", color: "#0A0A0C" }}>رئيسية</div>
                    )}
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "rgba(248,113,113,0.9)" }}>
                      <X size={12} style={{ color: "white" }} />
                    </button>
                    {i !== 0 && (
                      <button type="button" onClick={() => { setUploadedImages(prev => [url, ...prev.filter(u => u !== url)]); set("main_image", url); }}
                        className="absolute bottom-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        style={{ background: "rgba(10,10,12,0.8)", color: "#C6914C" }}>تعيين رئيسية</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* أو رابط مباشر */}
            <div>
              <label className={lbl}>أو أدخل رابط URL مباشر</label>
              <input name="main_image" value={form.main_image} onChange={handleChange} className={inp} placeholder="https://..." dir="ltr" />
            </div>
          </div>
        </Section>

        {/* ═══ خطأ ═══ */}
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#F87171" }}>
            <span>⚠</span> {error}
          </div>
        )}

        {/* ═══ زر الحفظ ═══ */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[#0A0A0C] transition disabled:opacity-50"
            style={{ background: loading ? "rgba(198,145,76,0.4)" : "linear-gradient(135deg, #C6914C, #A6743A)", fontSize: 15 }}>
            <Save size={18} />
            {loading ? "جاري الحفظ..." : "حفظ العقار"}
          </button>
          <Link href="/dashboard/properties"
            className="px-6 py-3.5 rounded-xl text-sm font-medium no-underline transition"
            style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(198,145,76,0.1)" }}>
            إلغاء
          </Link>
        </div>

      </form>
    </div>
  );
}
