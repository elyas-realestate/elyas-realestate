"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PropertyDetails() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProperty(); }, []);

  async function loadProperty() {
    const { data } = await supabase.from("properties").select("*").eq("id", id).single();
    setProperty(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("delete?")) return;
    await supabase.from("properties").delete().eq("id", id);
    router.push("/dashboard/properties");
  }

  function handleWhatsApp() {
    if (!property) return;
    const lines = [
      property.title,
      "Code: " + (property.code || "-"),
      (property.main_category || "") + " / " + (property.sub_category || ""),
      (property.district || "") + " - " + (property.city || ""),
      (property.price ? property.price.toLocaleString() : "-") + " SAR",
      property.description || "",
    ];
    if (property.location_url) lines.push(property.location_url);
    window.open("https://wa.me/?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  }

  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (!property) return <div className="text-white p-8">Not found</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white" dir="rtl">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard/properties" className="text-gray-400 hover:text-white">back</Link>
        <h1 className="text-xl font-bold">{property.title}</h1>
        <Link href={"/dashboard/properties/" + id + "/edit"} className="text-blue-400 hover:text-blue-300 text-sm mr-4">Edit</Link>
        <Link href={"/dashboard/properties/" + id + "/edit"} className="text-blue-400 hover:text-blue-300 text-sm mr-4">Edit</Link>
        <button onClick={handleDelete} className="text-red-400 text-sm">X</button>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div><p className="text-gray-400 text-sm">Category</p><p>{property.main_category} / {property.sub_category}</p></div>
            <div><p className="text-gray-400 text-sm">Type</p><p>{property.offer_type}</p></div>
            <div><p className="text-gray-400 text-sm">Location</p><p>{property.district} - {property.city}</p></div>
            <div><p className="text-gray-400 text-sm">Area</p><p>{property.land_area || "-"} m2</p></div>
            <div><p className="text-gray-400 text-sm">Price</p><p className="text-green-400 font-bold">{property.price ? property.price.toLocaleString() : "-"} SAR</p></div>
          </div>
        </div>
        {property.description && <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6"><p className="text-gray-300">{property.description}</p></div>}
        <div className="flex gap-4">
          <button onClick={handleWhatsApp} className="bg-green-600 px-6 py-3 rounded-lg">WhatsApp</button>
          {property.location_url && <a href={property.location_url} target="_blank" rel="noreferrer" className="bg-blue-600 px-6 py-3 rounded-lg">Map</a>}
        </div>
      </main>
    </div>
  );
}