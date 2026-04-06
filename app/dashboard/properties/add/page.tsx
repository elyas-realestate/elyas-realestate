"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Save, Eye, EyeOff } from "lucide-react";
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

  async function handleSubmit(e: any) {
    e.preventDefault();
    setError("");

    if (!form.offer_type) { setError("يرجى اختيار نوع العرض (بيع / إيجار / ...)"); return; }
    if (!form.main_category) { setError("يرجى اختيار التصنيف الرئيسي"); return; }

    setLoading(true);

    const extraUrls = form.extra_images.split("\n").map((s: string) => s.trim()).filter(Boolean);
    const allImages = [form.main_image, ...extraUrls].filter(Boolean);

    const { error: err } = await supabase.from("properties").insert([{
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
      images:        allImages.length ? allImages : null,
      location_url:  form.location_url || null,
      contact_phone: form.contact_phone || null,
      is_published:  form.is_published,
    }]);

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

      <div className="flex items-center justify-between mb-8">
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

            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className={lbl}>الصورة الرئيسية — رابط URL</label>
              <input name="main_image" value={form.main_image} onChange={handleChange} className={inp} placeholder="https://..." dir="ltr" />
              {form.main_image && (
                <div className="mt-3 rounded-xl overflow-hidden" style={{ height: 180, background: "#1C1C22" }}>
                  <img src={form.main_image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
            <div>
              <label className={lbl}>صور إضافية — رابط في كل سطر</label>
              <textarea name="extra_images" value={form.extra_images} onChange={handleChange} rows={3} className={inp} placeholder={"https://...\nhttps://...\nhttps://..."} dir="ltr" />
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
