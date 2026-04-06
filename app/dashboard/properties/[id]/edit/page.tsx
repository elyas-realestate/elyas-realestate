"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Save, Eye, EyeOff, Check, Upload, X } from "lucide-react";
import SARIcon from "../../../../components/SARIcon";

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

export default function EditProperty() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({
    title: "", main_category: "", sub_category: "", offer_type: "",
    city: "", district: "", land_area: "", built_area: "",
    rooms: "", bathrooms: "", floors: "", price: "",
    description: "", main_image: "", extra_images: "", location_url: "",
    contact_phone: "", is_published: false,
  });

  useEffect(() => { loadProperty(); }, []);

  useEffect(() => {
    if (form.main_category) {
      setSubCategories(categoriesMap[form.main_category] || []);
    }
  }, [form.main_category]);

  async function loadProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    if (data) {
      const allImgs: string[] = data.images || (data.main_image ? [data.main_image] : []);
      setUploadedImages(allImgs);
      const extraImgs = allImgs.filter((u: string) => u !== data.main_image);
      setForm({
        title:         data.title || "",
        main_category: data.main_category || "",
        sub_category:  data.sub_category || "",
        offer_type:    data.offer_type || "",
        city:          data.city || "",
        district:      data.district || "",
        land_area:     data.land_area || "",
        built_area:    data.built_area || "",
        rooms:         data.rooms || "",
        bathrooms:     data.bathrooms || "",
        floors:        data.floors || "",
        price:         data.price || "",
        description:   data.description || "",
        main_image:    data.main_image || "",
        extra_images:  extraImgs.join("\n"),
        location_url:  data.location_url || "",
        contact_phone: data.contact_phone || "",
        is_published:  data.is_published || false,
      });
    }
    setLoading(false);
  }

  function set(field: string, value: any) {
    setForm((f: any) => ({ ...f, [field]: value }));
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
    if (newUrls.length > 0 && !form.main_image) set("main_image", newUrls[0]);
    setUploading(false);
  }

  function removeImage(url: string) {
    setUploadedImages(prev => prev.filter(u => u !== url));
    if (form.main_image === url) {
      const remaining = uploadedImages.filter(u => u !== url);
      set("main_image", remaining[0] || "");
    }
  }

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSaving(true);

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

    await supabase.from("properties").update(payload).eq("id", id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); router.push("/dashboard/properties/" + id); }, 1200);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32" style={{ color: "#C6914C" }}>
      <div className="w-6 h-6 border-2 border-current rounded-full border-t-transparent animate-spin mr-3" />
      جاري التحميل...
    </div>
  );

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6" style={{ color: "#5A5A62", fontSize: 13 }}>
        <Link href="/dashboard/properties" className="hover:text-[#C6914C] transition no-underline" style={{ color: "#5A5A62" }}>العقارات</Link>
        <ArrowRight size={14} />
        <Link href={"/dashboard/properties/" + id} className="hover:text-[#C6914C] transition no-underline truncate max-w-xs" style={{ color: "#5A5A62" }}>{form.title || "..."}</Link>
        <ArrowRight size={14} />
        <span style={{ color: "#F5F5F5" }}>تعديل</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold mb-1">تعديل العقار</h2>
          <p style={{ color: "#5A5A62", fontSize: 13 }}>عدّل البيانات ثم احفظ التغييرات</p>
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
              <input name="title" value={form.title} onChange={handleChange} required className={inp} />
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
                <input name="district" value={form.district} onChange={handleChange} required className={inp} />
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
                <input name="land_area" value={form.land_area} onChange={handleChange} type="number" className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>مسطح البناء م²</label>
                <input name="built_area" value={form.built_area} onChange={handleChange} type="number" className={inp} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>الغرف</label>
                <input name="rooms" value={form.rooms} onChange={handleChange} type="number" className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>دورات المياه</label>
                <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" className={inp} dir="ltr" />
              </div>
              <div>
                <label className={lbl}>عدد الأدوار</label>
                <input name="floors" value={form.floors} onChange={handleChange} type="number" className={inp} dir="ltr" />
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
              <input name="price" value={form.price} onChange={handleChange} type="number" className={inp} dir="ltr" />
            </div>
            <div>
              <label className={lbl}>رقم التواصل</label>
              <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className={inp} dir="ltr" />
            </div>
          </div>
        </Section>

        {/* ═══ الوصف ═══ */}
        <Section title="الوصف">
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inp} />
        </Section>

        {/* ═══ الصور ═══ */}
        <Section title="الصور">
          <div className="space-y-4">

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
                padding: "32px 20px",
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
                  <Upload size={22} style={{ color: "#C6914C" }} />
                  <div className="text-center">
                    <p style={{ color: "#F5F5F5", fontSize: 14, fontWeight: 600 }}>اسحب الصور هنا أو اضغط للاختيار</p>
                    <p style={{ color: "#5A5A62", fontSize: 12, marginTop: 4 }}>JPG, PNG — يمكن اختيار أكثر من صورة</p>
                  </div>
                </>
              )}
            </div>

            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedImages.map((url, i) => (
                  <div key={url} className="relative rounded-xl overflow-hidden group"
                    style={{ height: 110, background: "#1C1C22", border: "2px solid " + (url === form.main_image || i === 0 ? "#C6914C" : "transparent") }}>
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {(url === form.main_image || i === 0) && (
                      <div className="absolute top-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg font-bold"
                        style={{ background: "#C6914C", color: "#0A0A0C" }}>رئيسية</div>
                    )}
                    <button type="button" onClick={() => removeImage(url)}
                      className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      style={{ background: "rgba(248,113,113,0.9)" }}>
                      <X size={12} style={{ color: "white" }} />
                    </button>
                    {url !== form.main_image && i !== 0 && (
                      <button type="button" onClick={() => { setUploadedImages(prev => [url, ...prev.filter(u => u !== url)]); set("main_image", url); }}
                        className="absolute bottom-1.5 right-1.5 text-xs px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                        style={{ background: "rgba(10,10,12,0.8)", color: "#C6914C" }}>تعيين رئيسية</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className={lbl}>أو أدخل رابط URL مباشر</label>
              <input name="main_image" value={form.main_image} onChange={handleChange} className={inp} placeholder="https://..." dir="ltr" />
            </div>
          </div>
        </Section>

        {/* ═══ أزرار الحفظ ═══ */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving || saved}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[#0A0A0C] transition disabled:opacity-70"
            style={{ background: saved ? "#4ADE80" : saving ? "rgba(198,145,76,0.4)" : "linear-gradient(135deg, #C6914C, #A6743A)", fontSize: 15, minWidth: 160, justifyContent: "center" }}>
            {saved ? <><Check size={18} /> تم الحفظ</> : saving ? "جاري الحفظ..." : <><Save size={18} /> حفظ التغييرات</>}
          </button>
          <Link href={"/dashboard/properties/" + id}
            className="px-6 py-3.5 rounded-xl text-sm font-medium no-underline transition"
            style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(198,145,76,0.1)" }}>
            إلغاء
          </Link>
        </div>

      </form>
    </div>
  );
}
