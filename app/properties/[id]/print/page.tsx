"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import SARIcon from "../../../components/SARIcon";

export default function PropertyPrintView() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [identity, setIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("properties").select("*").eq("id", params.id as string).single(),
      supabase.from("site_settings").select("*").single(),
      supabase.from("broker_identity").select("*").single(),
    ]).then(([{ data: prop }, { data: s }, { data: ident }]) => {
      setProperty(prop);
      setSettings(s);
      setIdentity(ident);
      setLoading(false);
      // تأخير الطباعة حتى تكتمل الصور والتهيئات
      setTimeout(() => {
        window.print();
      }, 1500);
    });
  }, [params.id]);

  if (loading) return <div dir="rtl" style={{ padding: 40, fontFamily: "'Tajawal', sans-serif" }}>جاري تجهيز المستند للطباعة...</div>;
  if (!property) return <div dir="rtl" style={{ padding: 40, fontFamily: "'Tajawal', sans-serif" }}>العقار غير موجود.</div>;

  const price = property.price ? Number(property.price).toLocaleString("ar-SA") : "السعر عند التواصل";
  const brokerName = identity?.broker_name || settings?.site_name || "إلياس الدخيل";
  const heroImage = property.main_image || (property.images && property.images.length > 0 ? property.images[0] : null);

  return (
    <div dir="rtl" style={{ fontFamily: "'Tajawal', sans-serif", color: "#000", background: "#fff", padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { background: #fff; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #C6914C", paddingBottom: "20px", marginBottom: "30px" }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: "28px", color: "#111" }}>{brokerName}</h2>
          <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
            وسيط عقاري مرخّص {identity?.fal_license && `| رخصة فال: ${identity.fal_license}`}
          </p>
        </div>
        {settings?.site_logo && (
          <img src={settings.site_logo} alt="Logo" style={{ maxHeight: "60px", maxWidth: "120px" }} />
        )}
      </div>

      {/* Title & Info */}
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "10px", lineHeight: "1.4" }}>{property.title}</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <span style={{ padding: "4px 12px", background: "#F5F5F5", borderRadius: "4px", fontSize: "14px", fontWeight: "bold" }}>{property.offer_type || "متاح"}</span>
        <span style={{ padding: "4px 12px", background: "#F5F5F5", borderRadius: "4px", fontSize: "14px" }}>📍 {[property.district, property.city].filter(Boolean).join("، ")}</span>
        {property.sub_category && <span style={{ padding: "4px 12px", background: "#F5F5F5", borderRadius: "4px", fontSize: "14px" }}>{property.sub_category}</span>}
      </div>

      {/* Hero Image */}
      {heroImage && (
        <div style={{ height: "300px", width: "100%", marginBottom: "30px", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd" }}>
          <img src={heroImage} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="عن العقار" />
        </div>
      )}

      {/* Price & Specs */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", marginBottom: "30px" }}>
        
        {/* Price Box */}
        <div style={{ flex: "1", padding: "20px", border: "2px solid #C6914C", borderRadius: "8px", textAlign: "center" }}>
          <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>القيمة</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#C6914C" }}>{price}</span>
            {property.price && <SARIcon size={18} color="accent" />}
          </div>
        </div>

        {/* Specs Grid */}
        <div style={{ flex: "2", display: "flex", flexWrap: "wrap", gap: "15px" }}>
           {[
             { label: "مساحة الأرض", value: property.land_area ? property.land_area + " م²" : null },
             { label: "مسطح البناء", value: property.built_area ? property.built_area + " م²" : null },
             { label: "غرف النوم", value: property.rooms },
             { label: "دورات المياه", value: property.bathrooms },
             { label: "عمر العقار", value: property.age },
             { label: "الشارع", value: property.street_width ? property.street_width + " م" : null },
           ].filter(s => s.value).map((spec, i) => (
             <div key={i} style={{ padding: "12px", background: "#F9F9F9", borderRadius: "6px", flex: "1 1 calc(33.333% - 15px)", minWidth: "120px", textAlign: "center", border: "1px solid #eee" }}>
               <strong style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>{spec.value}</strong>
               <span style={{ fontSize: "12px", color: "#666" }}>{spec.label}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", color: "#C6914C", fontSize: "18px" }}>تفاصيل العقار</h3>
          <p style={{ lineHeight: "1.8", fontSize: "14px", color: "#333", whiteSpace: "pre-line" }}>
            {property.description}
          </p>
        </div>
      )}

      {/* Legal & Footer */}
      <div style={{ marginTop: "auto", borderTop: "2px dotted #ccc", paddingTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
        <div>
          <p style={{ margin: "0 0 5px 0" }}><strong>التواصل:</strong> {property.contact_phone || settings?.phone || "-"}</p>
          {property.ad_license_number && <p style={{ margin: 0 }}><strong>ترخيص الإعلان:</strong> {property.ad_license_number}</p>}
        </div>
        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ margin: "0 0 8px 0" }}>تم الإنشاء بواسطة <strong>استوديوهات منصة وسيط برو</strong></p>
          <button className="no-print" onClick={() => window.print()} style={{ padding: "8px 16px", background: "#C6914C", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
            طباعة المستند
          </button>
        </div>
      </div>

    </div>
  );
}
