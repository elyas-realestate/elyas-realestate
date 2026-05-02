"use client";
import { supabase } from "@/lib/supabase-browser";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2, ArrowRight, Sparkles, MessageCircle, Phone, MapPin, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatSAR } from "@/lib/format";

export default function PropertyRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("property_requests").select("*").eq("id", id).single();
    setReq(data);
    setLoading(false);
    if (data && data.status !== "محول") findMatches(data);
  }

  async function findMatches(r: any) {
    setMatching(true);
    setMatchError(null);
    try {
      // matching محلي: نفس النوع + المدينة + الميزانية ضمن النطاق ±10%
      // مهم: Math.round لتفادي floating-point مثل 880000.0000000001 الذي يرفضه PostgREST
      const priceMax = r.budget_max ? Math.round(Number(r.budget_max) * 1.1) : null;
      const priceMin = r.budget_min ? Math.round(Number(r.budget_min) * 0.9) : null;

      let q = supabase
        .from("properties")
        .select("id, title, district, city, price, offer_type, sub_category, area, rooms, images")
        .eq("is_published", true);

      // نطابق على main_category بدل sub_category لأنها أعمّ (شقة/فيلا/أرض/...)
      if (r.main_category) q = q.or(`sub_category.eq.${r.main_category},main_category.eq.${r.main_category}`);
      if (r.city)     q = q.eq("city", r.city);
      if (priceMax)   q = q.lte("price", priceMax);
      if (priceMin)   q = q.gte("price", priceMin);

      const { data, error } = await q.limit(5);
      if (error) {
        console.error("AI Matching error:", error);
        setMatchError(error.message);
        setMatches([]);
        return;
      }
      setMatches(data || []);
    } catch (e: any) {
      console.error("AI Matching exception:", e);
      setMatchError(e?.message || "تعذّر جلب الاقتراحات");
      setMatches([]);
    } finally {
      setMatching(false);
    }
  }

  async function handleConvert() {
    if (!confirm("هل تريد تحويل هذا الطلب إلى صفقة جديدة؟")) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/property-requests/${id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحويل");
      toast.success("تم التحويل لصفقة جديدة");
      router.push(`/dashboard/deals`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setConverting(false);
    }
  }

  function whatsappLink(phone: string, msg: string) {
    const cleaned = phone.replace(/\D/g, "").replace(/^966/, "966").replace(/^0/, "966");
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
  }

  function buildMatchMessage(prop: any) {
    const lines = [
      `السلام عليكم${req.contact_name ? " " + req.contact_name : ""}،`,
      "",
      `بناءً على طلبك، عندي عقار يناسب احتياجك:`,
      "",
      `🏠 ${prop.title}`,
      `📍 ${prop.city || ""}${prop.district ? " - " + prop.district : ""}`,
      prop.price ? `💰 ${formatSAR(prop.price)}` : "",
      prop.area ? `📐 ${prop.area} م²` : "",
      prop.rooms ? `🛏️ ${prop.rooms} غرف` : "",
      "",
      `هل ترغب بترتيب معاينة؟`,
    ].filter(Boolean);
    return lines.join("\n");
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>;
  }
  if (!req) {
    return <div className="text-center py-20" style={{ color: "var(--text-faint)" }}>الطلب غير موجود</div>;
  }

  const isConverted = !!req.converted_to_deal_id;

  return (
    <div dir="rtl" className="space-y-5 max-w-4xl">
      <Link href="/dashboard/property-requests" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة للقائمة
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>
            {req.contact_name || "طلب عقار"}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm flex-wrap" style={{ color: "var(--text-soft)" }}>
            {req.contact_phone && (
              <a href={`tel:${req.contact_phone}`} className="flex items-center gap-1 no-underline" style={{ color: "var(--gold-2)" }} dir="ltr">
                <Phone size={13} /> {req.contact_phone}
              </a>
            )}
            {req.whatsapp_opt_in && req.contact_phone && (
              <a href={whatsappLink(req.contact_phone, "مرحباً، بخصوص طلبك...")} target="_blank" rel="noreferrer" className="flex items-center gap-1 no-underline" style={{ color: "var(--whatsapp)" }}>
                <MessageCircle size={13} /> واتساب
              </a>
            )}
            <span className="text-xs">
              {new Date(req.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        {!isConverted ? (
          <button onClick={handleConvert} disabled={converting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: "var(--bg-page)",
              border: "none",
              cursor: converting ? "wait" : "pointer",
            }}>
            {converting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            تحويل إلى صفقة
          </button>
        ) : (
          <Link href="/dashboard/deals" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm no-underline"
            style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success)" }}>
            <CheckCircle2 size={14} /> محوّل لصفقة — اعرض
          </Link>
        )}
      </div>

      {/* تفاصيل الطلب */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="الاحتياج">
          <Row label="نوع الطلب" value={req.request_type} />
          <Row label="نوع العقار" value={req.main_category} />
          <Row label="الموقع" value={req.city ? `${req.city}${req.district ? " - " + req.district : ""}` : null} icon={MapPin} />
          <Row label="مستوى الإلحاح" value={req.urgency_level} />
        </Card>

        <Card title="الميزانية والمواصفات">
          <Row label="الميزانية" value={req.budget_min || req.budget_max ? `${req.budget_min ? formatSAR(req.budget_min, { short: true }) : "؟"} → ${req.budget_max ? formatSAR(req.budget_max, { short: true }) : "؟"}` : null} />
          <Row label="عدد الغرف" value={req.rooms_min || req.rooms_max ? `${req.rooms_min || "؟"} → ${req.rooms_max || "؟"}` : null} />
          <Row label="المساحة" value={req.area_min || req.area_max ? `${req.area_min || "؟"} → ${req.area_max || "؟"} م²` : null} />
          <Row label="طريقة الدفع" value={req.payment_method} />
          <Row label="الدعم الحكومي" value={req.government_support} />
        </Card>
      </div>

      {req.required_features && (
        <Card title="مميزات مطلوبة"><p className="text-sm" style={{ color: "var(--text-soft)" }}>{req.required_features}</p></Card>
      )}
      {req.message && (
        <Card title="رسالة العميل"><p className="text-sm" style={{ color: "var(--text-soft)", whiteSpace: "pre-wrap" }}>{req.message}</p></Card>
      )}

      {/* AI Matches */}
      {!isConverted && (
        <div className="rounded-xl p-5" style={{ background: "linear-gradient(135deg, var(--gold-bg-soft), var(--bg-surface-1))", border: "1px solid var(--gold-bg-strong)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold flex items-center gap-2" style={{ color: "var(--gold-2)" }}>
              <Sparkles size={16} /> اقتراحات المساعد الذكي ({matches.length})
            </h3>
            <button onClick={() => findMatches(req)} disabled={matching}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--gold-bg-hover)", color: "var(--gold-2)", border: "1px solid var(--gold-bg-strong)" }}>
              {matching ? "جارٍ البحث..." : "تحديث"}
            </button>
          </div>

          {matching ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>
          ) : matchError ? (
            <div className="text-center py-6 text-sm rounded-lg" style={{ color: "var(--danger)", background: "var(--danger-bg)", border: "1px solid var(--danger)" }}>
              <AlertCircle size={20} style={{ color: "var(--danger)", margin: "0 auto 8px" }} />
              تعذّر جلب الاقتراحات.<br/>
              <button onClick={() => findMatches(req)} className="text-xs mt-2 inline-block px-3 py-1 rounded-md" style={{ background: "var(--danger)", color: "#fff", border: "none", cursor: "pointer" }}>إعادة المحاولة</button>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-6 text-sm" style={{ color: "var(--text-soft)" }}>
              <AlertCircle size={20} style={{ color: "var(--text-faint)", margin: "0 auto 8px" }} />
              لا توجد عقارات في مخزونك تطابق هذا الطلب حالياً.<br/>
              <Link href="/dashboard/properties/add" className="text-xs mt-2 inline-block" style={{ color: "var(--gold-2)" }}>أضف عقاراً جديداً</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(m => (
                <div key={m.id} className="rounded-lg p-3 flex items-center gap-3"
                  style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--bg-surface-3)" }}>
                    {m.images?.[0] ? (
                      <img src={m.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Building2 size={18} style={{ color: "var(--text-faint)" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: "var(--text-strong)" }}>{m.title}</div>
                    <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: "var(--text-soft)" }}>
                      {m.price && <span style={{ color: "var(--gold-2)", fontWeight: 600 }}>{formatSAR(m.price, { short: true })}</span>}
                      {m.district && <span>📍 {m.district}</span>}
                      {m.area && <span>{m.area}م²</span>}
                      {m.rooms && <span>{m.rooms} غرف</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/properties/${m.id}`}
                      className="text-xs px-2.5 py-1.5 rounded-lg no-underline"
                      style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)", border: "1px solid var(--gold-bg)" }}>
                      عرض
                    </Link>
                    {req.contact_phone && req.whatsapp_opt_in && (
                      <a href={whatsappLink(req.contact_phone, buildMatchMessage(m))} target="_blank" rel="noreferrer"
                        className="text-xs px-2.5 py-1.5 rounded-lg no-underline flex items-center gap-1"
                        style={{ background: "var(--whatsapp)", color: "#fff" }}>
                        <MessageCircle size={11} /> أرسل
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <h3 className="text-xs font-bold mb-3" style={{ color: "var(--gold-2)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2 py-1.5 text-sm">
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className="flex items-center gap-1 font-medium" style={{ color: "var(--text-strong)" }}>
        {Icon && <Icon size={11} />}{value}
      </span>
    </div>
  );
}
