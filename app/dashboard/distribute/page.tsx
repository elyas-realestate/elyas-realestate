"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import {
  Share2, Copy, Check, Search, ExternalLink,
  CheckCircle2, Clock, XCircle, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  PORTALS, formatForPortal,
  type PortalId, type PropertyForDistribution,
} from "@/lib/portal-adapters";
import type { Property } from "@/types/database";

type Listing = {
  id: string;
  property_id: string;
  portal: PortalId;
  status: "draft" | "published" | "expired" | "removed";
  external_url: string | null;
  published_at: string | null;
};

type Summary = {
  property_id: string;
  title: string;
  published_count: number;
  active_portals: string[] | null;
};

export default function DistributePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [summaries, setSummaries]   = useState<Record<string, Summary>>({});
  const [listings, setListings]     = useState<Listing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brokerInfo, setBrokerInfo] = useState<{ name?: string; phone?: string; fal?: string }>({});
  const [copiedPortal, setCopiedPortal] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [pRes, sRes, lRes, iRes] = await Promise.all([
      supabase.from("properties")
        .select("id, title, code, main_category, sub_category, offer_type, city, district, price, land_area, rooms, description, images, main_image")
        .order("created_at", { ascending: false }).limit(200),
      supabase.from("property_distribution_summary").select("*"),
      supabase.from("portal_listings").select("id, property_id, portal, status, external_url, published_at"),
      supabase.from("broker_identity").select("broker_name, fal_license, phone").limit(1).maybeSingle(),
    ]);

    setProperties((pRes.data || []) as Property[]);
    const summaryMap: Record<string, Summary> = {};
    (sRes.data || []).forEach((s: any) => { summaryMap[s.property_id] = s; });
    setSummaries(summaryMap);
    setListings((lRes.data || []) as Listing[]);
    setBrokerInfo({
      name: iRes.data?.broker_name,
      phone: iRes.data?.phone,
      fal: iRes.data?.fal_license,
    });
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) =>
      p.title?.toLowerCase().includes(q) ||
      p.code?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q)
    );
  }, [properties, search]);

  const selected = selectedId ? properties.find((p) => p.id === selectedId) : null;
  const selectedListings = selected
    ? listings.filter((l) => l.property_id === selected.id)
    : [];

  const propertyForAdapter: PropertyForDistribution | null = selected ? {
    id: selected.id,
    title: selected.title,
    code: selected.code,
    main_category: selected.main_category,
    sub_category: selected.sub_category,
    offer_type: selected.offer_type,
    city: selected.city,
    district: selected.district,
    price: selected.price,
    land_area: selected.land_area,
    rooms: selected.rooms,
    description: selected.description,
    images: selected.images,
    main_image: selected.main_image,
    broker_name: brokerInfo.name,
    broker_phone: brokerInfo.phone,
    fal_license: brokerInfo.fal,
    public_url: typeof window !== "undefined"
      ? `${window.location.origin}/property/${selected.code || selected.id}`
      : undefined,
  } : null;

  function getListingFor(portal: PortalId): Listing | undefined {
    return selectedListings.find((l) => l.portal === portal);
  }

  async function copyText(portal: PortalId) {
    if (!propertyForAdapter) return;
    const text = formatForPortal(portal, propertyForAdapter);
    await navigator.clipboard.writeText(text);
    setCopiedPortal(portal);
    toast.success("تم النسخ — الصقه في المنصة");
    setTimeout(() => setCopiedPortal(null), 2000);

    // سجّل كـ draft لو لم يكن موجوداً
    if (!getListingFor(portal) && selected) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tenant } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
      if (!tenant?.id) return;
      await supabase.from("portal_listings").upsert({
        tenant_id: tenant.id,
        property_id: selected.id,
        portal,
        status: "draft",
      }, { onConflict: "property_id,portal" });
      loadAll();
    }
  }

  async function markPublished(portal: PortalId, externalUrl: string) {
    if (!selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tenant } = await supabase.from("tenants").select("id").eq("owner_id", user.id).maybeSingle();
    if (!tenant?.id) return;

    const { error } = await supabase.from("portal_listings").upsert({
      tenant_id: tenant.id,
      property_id: selected.id,
      portal,
      status: "published",
      external_url: externalUrl || null,
    }, { onConflict: "property_id,portal" });

    if (error) { toast.error(error.message); return; }
    toast.success("تم تسجيل النشر ✓");
    loadAll();
  }

  async function removeListing(listingId: string) {
    const { error } = await supabase.from("portal_listings").delete().eq("id", listingId);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت الإزالة");
    loadAll();
  }

  if (loading) {
    return <div className="p-6 text-center text-[#8A8A92]">…جارِ التحميل</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumb crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "توزيع العقارات" }]} />

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="h-6 w-6 text-[#C6914C]" />
          توزيع العقارات على المنصّات
        </h1>
        <p className="text-sm text-[#8A8A92] mt-1">
          اختر عقاراً، انسخ النص المُحسّن لكل منصة، والصقه. سنتتبّع أين نشرت كل عقار.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── قائمة العقارات ── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A5A62]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعنوان، الكود، المدينة…"
              className="w-full bg-[#16161A] border border-[rgba(198,145,76,0.09)] rounded-xl pr-10 pl-3 py-2.5 text-white text-sm focus:border-[#C6914C] outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((p) => {
              const sum = summaries[p.id];
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full text-right rounded-xl p-3 border transition ${
                    isSelected
                      ? "bg-[#C6914C]/10 border-[#C6914C]/50"
                      : "bg-[#16161A] border-[rgba(198,145,76,0.09)] hover:border-[#C6914C]/30"
                  }`}
                >
                  <div className="text-white font-bold text-sm truncate">{p.title}</div>
                  <div className="text-xs text-[#8A8A92] mt-1 flex items-center justify-between">
                    <span>{p.city}{p.district ? ` — ${p.district}` : ""}</span>
                    {sum && sum.published_count > 0 && (
                      <span className="text-emerald-400 font-bold">
                        ✓ {sum.published_count} منصّة
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-[#5A5A62] text-sm py-8">لا توجد عقارات</div>
            )}
          </div>
        </div>

        {/* ── تفاصيل التوزيع ── */}
        <div className="lg:col-span-2 space-y-3">
          {!selected ? (
            <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-12 text-center">
              <Share2 className="h-12 w-12 text-[#5A5A62] mx-auto mb-3" />
              <p className="text-[#8A8A92]">اختر عقاراً من القائمة لعرض خيارات التوزيع</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-[#16161A] border border-[rgba(198,145,76,0.09)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#8A8A92] mb-1">العقار المُحدّد</div>
                    <div className="text-lg font-bold text-white">{selected.title}</div>
                    <div className="text-sm text-[#8A8A92] mt-1">
                      {selected.code && <span>#{selected.code} • </span>}
                      {selected.city}{selected.district ? ` — ${selected.district}` : ""}
                      {selected.price && ` • ${Number(selected.price).toLocaleString("ar-SA")} ر.س`}
                    </div>
                  </div>
                  <button
                    onClick={loadAll}
                    className="text-[#8A8A92] hover:text-white p-1"
                    title="تحديث"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── المنصّات ── */}
              {PORTALS.map((portal) => {
                const listing = getListingFor(portal.id);
                const text = propertyForAdapter ? formatForPortal(portal.id, propertyForAdapter) : "";
                const isPublished = listing?.status === "published";
                const isDraft = listing?.status === "draft";
                const isCopied = copiedPortal === portal.id;

                return (
                  <div
                    key={portal.id}
                    className={`rounded-2xl border p-5 transition ${
                      isPublished
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-[#16161A] border-[rgba(198,145,76,0.09)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{portal.icon}</span>
                        <div>
                          <div className="text-white font-bold">{portal.name}</div>
                          {portal.hint && (
                            <div className="text-xs text-[#5A5A62]">{portal.hint}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPublished && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                            <CheckCircle2 className="h-3 w-3" /> منشور
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                            <Clock className="h-3 w-3" /> نسخت للنشر
                          </span>
                        )}
                        {portal.directUrl && (
                          <a
                            href={portal.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] text-xs text-white transition"
                          >
                            <ExternalLink className="h-3 w-3" /> افتح المنصة
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <pre className="bg-[#0E0E11] border border-[rgba(255,255,255,0.05)] rounded-xl p-3 text-xs text-[#d4d4d4] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto leading-relaxed">
                        {text}
                      </pre>
                      {portal.maxLength && (
                        <div className="absolute bottom-2 left-2 text-[10px] text-[#5A5A62] bg-[#0E0E11]/80 px-2 py-0.5 rounded">
                          {text.length} / {portal.maxLength}
                          {text.length > portal.maxLength && <span className="text-red-400"> ⚠️</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => copyText(portal.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] hover:bg-[#26262C] rounded-lg text-sm text-white transition"
                      >
                        {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        نسخ النص
                      </button>

                      {!isPublished && (
                        <MarkPublishedButton
                          onMark={(url) => markPublished(portal.id, url)}
                        />
                      )}

                      {listing && (
                        <button
                          onClick={() => removeListing(listing.id)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition"
                        >
                          <XCircle className="h-4 w-4" />
                          إزالة
                        </button>
                      )}

                      {listing?.external_url && (
                        <a
                          href={listing.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm transition"
                        >
                          <ExternalLink className="h-4 w-4" />
                          فتح الإعلان
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MarkPublishedButton({ onMark }: { onMark: (url: string) => void }) {
  const [show, setShow] = useState(false);
  const [url, setUrl]   = useState("");

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm transition"
      >
        <CheckCircle2 className="h-4 w-4" />
        علّم كمنشور
      </button>
    );
  }

  return (
    <div className="flex gap-1">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="رابط الإعلان (اختياري)"
        className="bg-[#1F1F24] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#C6914C] w-48"
      />
      <button
        onClick={() => { onMark(url); setShow(false); setUrl(""); }}
        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition"
      >
        تأكيد
      </button>
      <button
        onClick={() => { setShow(false); setUrl(""); }}
        className="px-3 py-1.5 text-[#8A8A92] hover:text-white text-sm transition"
      >
        ×
      </button>
    </div>
  );
}
