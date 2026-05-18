"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import Breadcrumb from "../../components/Breadcrumb";
import GrowthNav from "@/app/components/GrowthNav";
import {
  Share2,
  Copy,
  Check,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  PORTALS,
  formatForPortal,
  type PortalId,
  type PropertyForDistribution,
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
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brokerInfo, setBrokerInfo] = useState<{ name?: string; phone?: string; fal?: string }>({});
  const [copiedPortal, setCopiedPortal] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [pRes, sRes, lRes, iRes] = await Promise.all([
      supabase
        .from("properties")
        .select(
          "id, title, code, main_category, sub_category, offer_type, city, district, price, land_area, rooms, description, images, main_image"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("property_distribution_summary").select("*"),
      supabase
        .from("portal_listings")
        .select("id, property_id, portal, status, external_url, published_at"),
      supabase
        .from("broker_identity")
        .select("broker_name, fal_license, vcard_address, social_handles")
        .limit(1)
        .maybeSingle(),
    ]);

    setProperties((pRes.data || []) as Property[]);
    const summaryMap: Record<string, Summary> = {};
    (sRes.data || []).forEach((s) => {
      if (s.property_id) summaryMap[s.property_id] = s as Summary;
    });
    setSummaries(summaryMap);
    setListings((lRes.data || []) as Listing[]);
    // ملاحظة: broker_identity لا يحتوي phone مباشرة — يأتي من tenants/user profile
    setBrokerInfo({
      name: iRes.data?.broker_name ?? undefined,
      phone: undefined,
      fal: iRes.data?.fal_license ?? undefined,
    });
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q)
    );
  }, [properties, search]);

  const selected = selectedId ? properties.find((p) => p.id === selectedId) : null;
  const selectedListings = selected ? listings.filter((l) => l.property_id === selected.id) : [];

  const propertyForAdapter: PropertyForDistribution | null = selected
    ? {
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
        public_url:
          typeof window !== "undefined"
            ? `${window.location.origin}/property/${selected.code || selected.id}`
            : undefined,
      }
    : null;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!tenant?.id) return;
      await supabase.from("portal_listings").upsert(
        {
          tenant_id: tenant.id,
          property_id: selected.id,
          portal,
          status: "draft",
        },
        { onConflict: "property_id,portal" }
      );
      loadAll();
    }
  }

  async function markPublished(portal: PortalId, externalUrl: string) {
    if (!selected) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!tenant?.id) return;

    const { error } = await supabase.from("portal_listings").upsert(
      {
        tenant_id: tenant.id,
        property_id: selected.id,
        portal,
        status: "published",
        external_url: externalUrl || null,
      },
      { onConflict: "property_id,portal" }
    );

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم تسجيل النشر ✓");
    loadAll();
  }

  async function removeListing(listingId: string) {
    const { error } = await supabase.from("portal_listings").delete().eq("id", listingId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تمت الإزالة");
    loadAll();
  }

  if (loading) {
    return <div className="p-6 text-center text-[var(--text-soft)]">…جارِ التحميل</div>;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        crumbs={[{ label: "لوحة التحكم", href: "/dashboard" }, { label: "توزيع العقارات" }]}
      />

      <GrowthNav />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Share2 className="h-6 w-6 text-[var(--gold-2)]" />
          توزيع العقارات على المنصّات
        </h1>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          اختر عقاراً، انسخ النص المُحسّن لكل منصة، والصقه. سنتتبّع أين نشرت كل عقار.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── قائمة العقارات ── */}
        <div className="space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعنوان، الكود، المدينة…"
              className="w-full rounded-xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] py-2.5 pr-10 pl-3 text-sm text-white outline-none focus:border-[var(--gold-2)]"
            />
          </div>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((p) => {
              const sum = summaries[p.id];
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-xl border p-3 text-right transition ${
                    isSelected
                      ? "border-[var(--gold-2)]/50 bg-[var(--gold-2)]/10"
                      : "border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] hover:border-[var(--gold-2)]/30"
                  }`}
                >
                  <div className="truncate text-sm font-bold text-white">{p.title}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-[var(--text-soft)]">
                    <span>
                      {p.city}
                      {p.district ? ` — ${p.district}` : ""}
                    </span>
                    {sum && sum.published_count > 0 && (
                      <span className="font-bold text-emerald-400">
                        ✓ {sum.published_count} منصّة
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-[var(--text-faint)]">
                لا توجد عقارات
              </div>
            )}
          </div>
        </div>

        {/* ── تفاصيل التوزيع ── */}
        <div className="space-y-3 lg:col-span-2">
          {!selected ? (
            <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-12 text-center">
              <Share2 className="mx-auto mb-3 h-12 w-12 text-[var(--text-faint)]" />
              <p className="text-[var(--text-soft)]">اختر عقاراً من القائمة لعرض خيارات التوزيع</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 text-xs text-[var(--text-soft)]">العقار المُحدّد</div>
                    <div className="text-lg font-bold text-white">{selected.title}</div>
                    <div className="mt-1 text-sm text-[var(--text-soft)]">
                      {selected.code && <span>#{selected.code} • </span>}
                      {selected.city}
                      {selected.district ? ` — ${selected.district}` : ""}
                      {selected.price && ` • ${Number(selected.price).toLocaleString("ar-SA")} ر.س`}
                    </div>
                  </div>
                  <button
                    onClick={loadAll}
                    className="p-1 text-[var(--text-soft)] hover:text-[var(--text-strong)]"
                    title="تحديث"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── المنصّات ── */}
              {PORTALS.map((portal) => {
                const listing = getListingFor(portal.id);
                const text = propertyForAdapter
                  ? formatForPortal(portal.id, propertyForAdapter)
                  : "";
                const isPublished = listing?.status === "published";
                const isDraft = listing?.status === "draft";
                const isCopied = copiedPortal === portal.id;

                return (
                  <div
                    key={portal.id}
                    className={`rounded-2xl border p-5 transition ${
                      isPublished
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-[var(--gold-bg-soft)] bg-[var(--bg-surface-1)]"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{portal.icon}</span>
                        <div>
                          <div className="font-bold text-white">{portal.name}</div>
                          {portal.hint && (
                            <div className="text-xs text-[var(--text-faint)]">{portal.hint}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPublished && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> منشور
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                            <Clock className="h-3 w-3" /> نسخت للنشر
                          </span>
                        )}
                        {portal.directUrl && (
                          <a
                            href={portal.directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-2.5 py-1 text-xs text-white transition hover:bg-[#26262C]"
                          >
                            <ExternalLink className="h-3 w-3" /> افتح المنصة
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <pre className="max-h-48 overflow-y-auto rounded-xl border border-[var(--overlay-soft)] bg-[#0E0E11] p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#d4d4d4]">
                        {text}
                      </pre>
                      {portal.maxLength && (
                        <div className="absolute bottom-2 left-2 rounded bg-[#0E0E11]/80 px-2 py-0.5 text-[10px] text-[var(--text-faint)]">
                          {text.length} / {portal.maxLength}
                          {text.length > portal.maxLength && (
                            <span className="text-red-400"> ⚠️</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => copyText(portal.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-sm text-white transition hover:bg-[#26262C]"
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        نسخ النص
                      </button>

                      {!isPublished && (
                        <MarkPublishedButton onMark={(url) => markPublished(portal.id, url)} />
                      )}

                      {listing && (
                        <button
                          onClick={() => removeListing(listing.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/20"
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
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400 transition hover:bg-emerald-500/20"
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
  const [url, setUrl] = useState("");

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400 transition hover:bg-emerald-500/20"
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
        className="w-48 rounded-lg border border-[var(--overlay-soft)] bg-[var(--bg-surface-2)] px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--gold-2)]"
      />
      <button
        onClick={() => {
          onMark(url);
          setShow(false);
          setUrl("");
        }}
        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-emerald-600"
      >
        تأكيد
      </button>
      <button
        onClick={() => {
          setShow(false);
          setUrl("");
        }}
        className="px-3 py-1.5 text-sm text-[var(--text-soft)] transition hover:text-[var(--text-strong)]"
      >
        ×
      </button>
    </div>
  );
}
