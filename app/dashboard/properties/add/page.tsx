"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categoriesMap: Record<string, string[]> = {
  "سكني": ["شقة","فيلا","أرض سكنية","دور","استوديو","دوبلكس","تاون هاوس","عمارة سكنية","مجمع سكني","قصر","استراحة"],
  "تجاري": ["أرض تجارية","معرض","مكتب","عمارة تجارية","محل تجاري","مستودع تجاري","فندق","شقق فندقية / خدمية","مجمع تجاري","برج تجاري"],
  "زراعي": ["أرض زراعية","مزرعة"],
  "صناعي": ["أرض صناعية","مستودع صناعي","مصنع","ورشة"],
  "أرض خام": ["بدون فرعي"],
};

export default function AddProperty() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", main_category: "", sub_category: "", offer_type: "",
    city: "الرياض", district: "", land_area: "", built_area: "",
    rooms: "", bathrooms: "", floors: "", price: "",
    description: "", main_image: "", images_url: "", location_url: "",
    is_published: false,
  });

  useEffect(() => {
    if (form.main_category) {
      setSubCategories(categoriesMap[form.main_category] || []);
      setForm(f => ({ ...f, sub_category: "" }));
    }
  }, [form.main_category]);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("properties").insert([{
      title: form.title, main_category: form.main_category, sub_category: form.sub_category,
      offer_type: form.offer_type, city: form.city, district: form.district,
      land_area: form.land_area ? Number(form.land_area) : null,
      built_area: form.built_area ? Number(form.built_area) : null,
      rooms: form.rooms ? Number(form.rooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      floors: form.floors ? Number(form.floors) : null,
      price: form.price ? Number(form.price) : null,
      description: form.description, main_image: form.main_image,
      images_url: form.images_url, location_url: form.location_url,
      is_published: form.is_published,
    }]);
    router.push("/dashboard/properties");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/properties" className="text-gray-400 hover:text-white">العقارات</Link>
        <h1 className="text-xl font-bold">إضافة عقار جديد</h1>
      </header>
      <main className="p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">عنوان العقار *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="مثال: فيلا فاخرة في حي النرجس" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">التصنيف الرئيسي *</label>
              <select name="main_category" value={form.main_category} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                <option value="">اختر...</option>
                {Object.keys(categoriesMap).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">التصنيف الفرعي *</label>
              <select name="sub_category" value={form.sub_category} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                <option value="">اختر...</option>
                {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">نوع العرض *</label>
            <select name="offer_type" value={form.offer_type} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
              <option value="">اختر...</option>
              <option>بيع</option>
              <option>إيجار</option>
              <option>استثمار</option>
              <option>تطوير بالشراكة</option>
              <option>إدارة أملاك</option>
              <option>إدارة مرافق</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">المدينة *</label>
              <input name="city" value={form.city} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">الحي *</label>
              <input name="district" value={form.district} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">مساحة الأرض م² *</label>
              <input name="land_area" value={form.land_area} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">مسطح البناء م²</label>
              <input name="built_area" value={form.built_area} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">عدد الغرف</label>
              <input name="rooms" value={form.rooms} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">دورات المياه</label>
              <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">عدد الأدوار</label>
              <input name="floors" value={form.floors} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">السعر (ريال) *</label>
            <input name="price" value={form.price} onChange={handleChange} type="number" required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">الوصف *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">رابط الموقع على الخريطة</label>
            <input name="location_url" value={form.location_url} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" placeholder="https://maps.google.com/..." />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">رابط الصور</label>
            <input name="images_url" value={form.images_url} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
            <label className="text-sm">نشر العقار على الموقع العام</label>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50">
            {loading ? "جاري الحفظ..." : "حفظ العقار"}
          </button>
        </form>
      </main>
    </div>
  );
}