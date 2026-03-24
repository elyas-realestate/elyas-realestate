"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, Phone, MessageCircle, Share2, ArrowRight, Images } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublicPropertyDetails() {
  const params = useParams();
  const id = params.id;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadProperty(); }, []);

  async function loadProperty() {
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .eq("is_published", true)
      .single();
    setProperty(data);
    setLoading(false);
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCall() {
    if (!property?.contact_phone) return;
    window.location.href = "tel:" + property.contact_phone;
  }

  function handleWhatsApp() {
    if (!property?.contact_phone) return;
    const url = window.location.href;
    const msg = property.title + " " + url;
    const encoded = encodeURIComponent(msg);
    const phone = property.contact_phone.replace(/^0/, "966");
    window.open("https://wa.me/" + phone + "?text=" + encoded, "_blank");
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">...</div>;
  if (!property) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">404</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/properties" className="text-gray-400 hover:text-white flex items-center gap-2 text-sm">
            <ArrowRight size={16} />
            {"العقارات"}
          </Link>
          <div className="text-left">
            <p className="font-bold text-sm">{"إلياس الدخيل"}</p>
            <p className="text-gray-400 text-xs">{"وسيط عقاري مرخص"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {property.main_image && (
          <div className="w-full h-80 rounded-xl overflow-hidden mb-8">
            <img src={property.main_image} alt={property.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full">{property.offer_type}</span>
              <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{property.sub_category}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-1 text-gray-400">
              <MapPin size={16} />
              <span>{property.district} — {property.city}</span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-3xl font-bold text-green-400">{property.price?.toLocaleString()}</p>
            <p className="text-gray-400 text-sm">{"ريال سعودي"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {property.land_area && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{property.land_area}</p>
              <p className="text-gray-400 text-sm">{"مساحة الأرض م²"}</p>
            </div>
          )}
          {property.built_area && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{property.built_area}</p>
              <p className="text-gray-400 text-sm">{"مسطح البناء م²"}</p>
            </div>
          )}
          {property.rooms && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{property.rooms}</p>
              <p className="text-gray-400 text-sm">{"غرف"}</p>
            </div>
          )}
          {property.bathrooms && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{property.bathrooms}</p>
              <p className="text-gray-400 text-sm">{"دورات مياه"}</p>
            </div>
          )}
        </div>

        {property.description && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-3">{"الوصف"}</h3>
            <p className="text-gray-300 leading-relaxed">{property.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button onClick={handleWhatsApp} className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition">
            <MessageCircle size={22} />
            {"تواصل عبر واتساب"}
          </button>
          <button onClick={handleCall} className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition">
            <Phone size={22} />
            {"اتصال"}
          </button>
          <button onClick={handleShare} className={"px-6 py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition " + (copied ? "bg-green-800 text-green-300" : "bg-gray-700 hover:bg-gray-600")}>
            <Share2 size={22} />
            {copied ? "تم النسخ ✓" : "مشاركة الإعلان"}
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          {property.location_url && (
            <a href={property.location_url} target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-lg flex items-center gap-2 text-sm transition">
              <MapPin size={16} />
              {"موقع العقار على الخريطة"}
            </a>
          )}
          {property.images_url && (
            <a href={property.images_url} target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-lg flex items-center gap-2 text-sm transition">
              <Images size={16} />
              {"مشاهدة جميع الصور"}
            </a>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm">{"إلياس الدخيل — وسيط عقاري مرخص في الرياض"}</p>
        </div>
      </main>
    </div>
  );
}