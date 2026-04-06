"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, Pencil, Trash2, MapPin, Bed, Bath, Layers, Maximize2, ExternalLink, Share2 } from "lucide-react";
import SARIcon from "../../../components/SARIcon";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PropertyDetails() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadProperty(); }, []);

  async function loadProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    setProperty(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا العقار؟ لا يمكن التراجع.")) return;
    setDeleting(true);
    await supabase.from("properties").delete().eq("id", id);
    router.push("/dashboard/properties");
  }

  function handleShare() {
    const text = [
      property.title,
      property.sub_category + " — " + property.offer_type,
      property.district + "، " + property.city,
      property.price ? Number(property.price).toLocaleString("ar-SA") + " ريال سعودي" : "",
      property.description || "",
      property.location_url || "",
      window.location.origin + "/properties/" + id,
    ].filter(Boolean).join("\n");
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32" style={{ color: "#C6914C" }}>
      <div className="w-6 h-6 border-2 border-current rounded-full border-t-transparent animate-spin mr-3" />
      جاري التحميل...
    </div>
  );

  if (!property) return (
    <div className="text-center py-32" style={{ color: "#5A5A62" }}>العقار غير موجود</div>
  );

  const images: string[] = property.images || (property.main_image ? [property.main_image] : []);
  const price = property.price ? Number(property.price).toLocaleString("ar-SA") : null;

  const specs = [
    property.land_area  && { icon: Maximize2, label: "مساحة الأرض",   value: property.land_area + " م²" },
    property.built_area && { icon: Maximize2, label: "مسطح البناء",   value: property.built_area + " م²" },
    property.rooms      && { icon: Bed,       label: "الغرف",          value: property.rooms },
    property.bathrooms  && { icon: Bath,      label: "دورات المياه",   value: property.bathrooms },
    property.floors     && { icon: Layers,    label: "الأدوار",        value: property.floors },
  ].filter(Boolean) as any[];

  return (
    <div dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6" style={{ color: "#5A5A62", fontSize: 13 }}>
        <Link href="/dashboard/properties" className="hover:text-[#C6914C] transition no-underline" style={{ color: "#5A5A62" }}>العقارات</Link>
        <ArrowRight size={14} />
        <span style={{ color: "#F5F5F5" }} className="truncate max-w-xs">{property.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span style={{ background: "linear-gradient(135deg, #C6914C, #A6743A)", color: "#0A0A0C", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 8 }}>
              {property.offer_type === "بيع" ? "للبيع" : property.offer_type === "إيجار" ? "للإيجار" : property.offer_type}
            </span>
            {property.sub_category && (
              <span style={{ background: "rgba(198,145,76,0.08)", color: "#9A9AA0", fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(198,145,76,0.12)" }}>
                {property.sub_category}
              </span>
            )}
            <span style={{ background: property.is_published ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.08)", color: property.is_published ? "#4ADE80" : "#F87171", fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "1px solid " + (property.is_published ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)") }}>
              {property.is_published ? "منشور" : "مسودة"}
            </span>
            {property.code && (
              <span style={{ color: "#3A3A42", fontSize: 11, fontFamily: "monospace" }}>{property.code}</span>
            )}
          </div>
          <h2 className="text-2xl font-bold">{property.title}</h2>
          {(property.district || property.city) && (
            <div className="flex items-center gap-1 mt-2" style={{ color: "#9A9AA0", fontSize: 13 }}>
              <MapPin size={13} />
              <span>{[property.district, property.city].filter(Boolean).join("، ")}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm"
            style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(198,145,76,0.1)" }}>
            <Share2 size={14} /> واتساب
          </button>
          {property.is_published && (
            <a href={"/properties/" + id} target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm no-underline"
              style={{ background: "#1C1C22", color: "#9A9AA0", border: "1px solid rgba(198,145,76,0.1)" }}>
              <ExternalLink size={14} /> عرض
            </a>
          )}
          <Link href={"/dashboard/properties/" + id + "/edit"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition text-sm no-underline font-medium"
            style={{ background: "rgba(198,145,76,0.12)", color: "#C6914C", border: "1px solid rgba(198,145,76,0.25)" }}>
            <Pencil size={14} /> تعديل
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition text-sm"
            style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images + Description */}
        <div className="lg:col-span-2 space-y-5">

          {/* Images */}
          {images.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <div style={{ height: 320, background: "#1C1C22", position: "relative" }}>
                <img src={images[activeImg]} alt={property.title} className="w-full h-full object-cover" />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="flex-shrink-0 rounded-lg overflow-hidden transition"
                      style={{ width: 72, height: 52, border: "2px solid " + (i === activeImg ? "#C6914C" : "transparent") }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#C6914C", letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" }}>الوصف</h4>
              <p style={{ color: "#9A9AA0", lineHeight: 1.8, fontSize: 14 }}>{property.description}</p>
            </div>
          )}

          {/* Map */}
          {property.location_url && (
            <a href={property.location_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl no-underline transition"
              style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)", color: "#9A9AA0" }}>
              <MapPin size={16} style={{ color: "#C6914C" }} />
              <span style={{ fontSize: 13 }}>فتح الموقع على الخريطة</span>
              <ExternalLink size={12} className="mr-auto" />
            </a>
          )}
        </div>

        {/* Right: Price + Specs */}
        <div className="space-y-4">

          {/* Price card */}
          <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.15)" }}>
            <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8, letterSpacing: 0.5 }}>السعر</p>
            {price ? (
              <div className="flex items-center gap-2">
                <span className="font-kufi" style={{ fontSize: 28, fontWeight: 900, color: "#C6914C" }}>{price}</span>
                <SARIcon size={18} color="accent" />
              </div>
            ) : (
              <p style={{ color: "#5A5A62", fontSize: 14 }}>السعر عند التواصل</p>
            )}
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#C6914C", letterSpacing: 1.5, marginBottom: 14, textTransform: "uppercase" }}>المواصفات</h4>
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: "#5A5A62", fontSize: 13 }}>
                      <spec.icon size={13} />
                      <span>{spec.label}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#F5F5F5" }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {property.contact_phone && (
            <div className="rounded-2xl p-5" style={{ background: "#16161A", border: "1px solid rgba(198,145,76,0.1)" }}>
              <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8, letterSpacing: 0.5 }}>رقم التواصل</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#F5F5F5", direction: "ltr", textAlign: "right" }}>{property.contact_phone}</p>
            </div>
          )}

          {property.ad_license_number && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(198,145,76,0.04)", border: "1px solid rgba(198,145,76,0.15)" }}>
              <p style={{ fontSize: 11, color: "#5A5A62", marginBottom: 8, letterSpacing: 0.5 }}>رقم ترخيص الإعلان</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#C6914C", direction: "ltr", textAlign: "right" }}>{property.ad_license_number}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
