"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SARIcon from "../../../components/SARIcon";


export default function PropertyDetails() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, []);

  async function loadProperty() {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    setProperty(data);
    setLoading(false);
  }

  async function handleDelete() {
    const confirmed = confirm("هل أنت متأكد من حذف هذا العقار؟");
    if (!confirmed) return;
    await supabase.from("properties").delete().eq("id", id);
    router.push("/dashboard/properties");
  }

  function handleWhatsApp() {
    if (!property) return;
    const lines = [
      "🏠 *" + property.title + "*",
      "",
      "🔖 الرمز: " + (property.code || "—"),
      "📋 التصنيف: " + property.main_category + " / " + property.sub_category,
      "💼 نوع العرض: " + property.offer_type,
      "📍 الموقع: " + property.district + " — " + property.city,
      "📐 مساحة الأرض: " + (property.land_area || "—") + " م²",
      "🏗️ مسطح البناء: " + (property.built_area || "—") + " م²",
      "🛏️ الغرف: " + (property.rooms || "—"),
      "🚿 دورات المياه: " + (property.bathrooms || "—"),
      "🏢 الأدوار: " + (property.floors || "—"),
      "💰 السعر: " + (property.price ? property.price.toLocaleString() : "—") + " ريال",
      "",
      "📝 " + (property.description || ""),
    ];
    if (property.location_url) {
      lines.push("📌 الموقع: " + property.location_url);
    }
    if (property.images?.length) {
      lines.push("🖼️ الصور: " + property.images[0]);
    }
    lines.push("");
    lines.push("للتواصل: إلياس الدخيل — وسيط عقاري مرخص");
    const msg = lines.join("\n");
    const encoded = encodeURIComponent(msg);
    window.open("https://wa.me/?text=" + encoded, "_blank");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        العقار غير موجود
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/properties" className="text-gray-400 hover:text-white">
            العقارات →
          </Link>
          <h1 className="text-xl font-bold">{property.title}</h1>
        </div>
        <button onClick={handleDelete} className="text-red-400 hover:text-red-300 text-sm">
          حذف العقار
        </button>
      </header>

      <main className="p-8 max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-blue-400 text-sm bg-blue-900/30 px-3 py-1 rounded-full">
              {property.code || "بدون رمز"}
            </span>
            <span className="text-sm px-3 py-1 rounded-full bg-gray-800 text-gray-400">
              {property.is_published ? "منشور" : "غير منشور"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">التصنيف</p>
              <p className="font-medium">{property.main_category} / {property.sub_category}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">نوع العرض</p>
              <p className="font-medium">{property.offer_type}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">الموقع</p>
              <p className="font-medium">{property.district} — {property.city}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">مساحة الأرض</p>
              <p className="font-medium">{property.land_area || "—"} م²</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">مسطح البناء</p>
              <p className="font-medium">{property.built_area || "—"} م²</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">السعر</p>
              <p className="font-bold text-green-400 text-lg">
                {property.price ? property.price.toLocaleString() : "—"} <SARIcon color="accent" size={14} />
              </p>
            </div>
          </div>
        </div>

        {property.description && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-3">الوصف</h3>
            <p className="text-gray-300 leading-relaxed">{property.description}</p>
          </div>
        )}

        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition"
          >
            مشاركة واتساب
          </button>

          {property.location_url && (
            <a
              href={property.location_url}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-lg font-medium transition no-underline"
              style={{ background: "linear-gradient(135deg, #C18D4A, #A68A3A)", color: "#0A0A0C" }}
            >
              فتح الموقع
            </a>
          )}

          {property.images?.length > 0 && (
            <a
              href={property.images[0]}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-lg font-medium transition no-underline"
              style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(193,141,74,0.15)" }}
            >
              عرض الصور
            </a>
          )}
        </div>
      </main>
    </div>
  );
}