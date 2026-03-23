"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditProperty() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [form, setForm] = useState<any>({
    title: "", main_category: "", sub_category: "", offer_type: "",
    city: "", district: "", land_area: "", built_area: "",
    rooms: "", bathrooms: "", floors: "", price: "",
    description: "", main_image: "", images_url: "", location_url: "",
    is_published: false,
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
      setForm({
        title: data.title || "",
        main_category: data.main_category || "",
        sub_category: data.sub_category || "",
        offer_type: data.offer_type || "",
        city: data.city || "",
        district: data.district || "",
        land_area: data.land_area || "",
        built_area: data.built_area || "",
        rooms: data.rooms || "",
        bathrooms: data.bathrooms || "",
        floors: data.floors || "",
        price: data.price || "",
        description: data.description || "",
        main_image: data.main_image || "",
        images_url: data.images_url || "",
        location_url: data.location_url || "",
        is_published: data.is_published || false,
      });
    }
    setLoading(false);
  }

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm((f: any) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("properties").update({
      title: form.title,
      main_category: form.main_category,
      sub_category: form.sub_category,
      offer_type: form.offer_type,
      city: form.city,
      district: form.district,
      land_area: form.land_area ? Number(form.land_area) : null,
      built_area: form.built_area ? Number(form.built_area) : null,
      rooms: form.rooms ? Number(form.rooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      floors: form.floors ? Number(form.floors) : null,
      price: form.price ? Number(form.price) : null,
      description: form.description,
      main_image: form.main_image,
      images_url: form.images_url,
      location_url: form.location_url,
      is_published: form.is_published,
    }).eq("id", id);
    setSaving(false);
    router.push("/dashboard/properties/" + id);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <Link href={"/dashboard/properties/" + id} className="text-gray-400 hover:text-white">back</Link>
        <h1 className="text-xl font-bold">Edit Property</h1>
      </header>

      <main className="p-8 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Main Category</label>
              <select name="main_category" value={form.main_category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                {Object.keys(categoriesMap).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sub Category</label>
              <select name="sub_category" value={form.sub_category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
                <option value="">Select...</option>
                {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Offer Type</label>
            <select name="offer_type" value={form.offer_type} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500">
              <option value="">Select...</option>
              <option>بيع</option>
              <option>إيجار</option>
              <option>استثمار</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">City</label>
              <input name="city" value={form.city} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">District</label>
              <input name="district" value={form.district} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Land Area m2</label>
              <input name="land_area" value={form.land_area} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Built Area m2</label>
              <input name="built_area" value={form.built_area} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Rooms</label>
              <input name="rooms" value={form.rooms} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Bathrooms</label>
              <input name="bathrooms" value={form.bathrooms} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Floors</label>
              <input name="floors" value={form.floors} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Price SAR</label>
            <input name="price" value={form.price} onChange={handleChange} type="number" className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Location URL</label>
            <input name="location_url" value={form.location_url} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Images URL</label>
            <input name="images_url" value={form.images_url} onChange={handleChange} className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
            <label className="text-sm">Publish on public site</label>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-lg font-bold text-lg transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}