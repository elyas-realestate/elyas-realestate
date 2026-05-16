"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Sparkles,
  MapPin,
  Home,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase-browser";
import SARIcon from "@/app/components/SARIcon";
import HelpHint from "@/app/components/HelpHint";

// ══════════════════════════════════════════════════════════════════
// /dashboard/clients/[id]/alerts — Smart Matching UI
// إدارة تنبيهات العميل + عرض المطابقات (60%+)
// ══════════════════════════════════════════════════════════════════

interface Client {
  id: string;
  full_name: string;
  phone: string | null;
}

interface Alert {
  id: string;
  client_id: string | null;
  city: string | null;
  district: string | null;
  main_category: string | null;
  sub_category: string | null;
  offer_type: string | null;
  min_price: number | null;
  max_price: number | null;
  min_rooms: number | null;
  min_area: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface Match {
  id: string;
  alert_id: string;
  property_id: string;
  match_score: number | null;
  notified_at: string | null;
  created_at: string | null;
  property?: {
    id: string;
    title: string;
    city: string | null;
    district: string | null;
    price: number | null;
    main_image: string | null;
  };
}

export default function ClientAlertsPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [clientRes, alertsRes] = await Promise.all([
        supabase.from("clients").select("id, full_name, phone").eq("id", clientId).maybeSingle(),
        supabase
          .from("client_property_alerts")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ]);

      setClient(clientRes.data);
      setAlerts(alertsRes.data || []);

      // جلب المطابقات لكل التنبيهات
      if (alertsRes.data && alertsRes.data.length > 0) {
        const alertIds = alertsRes.data.map((a) => a.id);
        const { data: matchesData } = await supabase
          .from("property_alert_matches")
          .select("*, property:properties(id, title, city, district, price, main_image)")
          .in("alert_id", alertIds)
          .order("match_score", { ascending: false })
          .limit(50);
        setMatches(matchesData || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) load();
  }, [clientId]);

  async function runMatching() {
    setRunning(true);
    try {
      const res = await fetch("/api/ai/smart-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      const j = await res.json();
      if (j.ok) {
        toast.success(`✅ ${j.new_matches || 0} مطابقة جديدة من ${j.checked || 0} عقار`);
        await load();
      } else {
        toast.error(j.error || "فشل تشغيل المطابقة");
      }
    } catch (e: any) {
      toast.error(e?.message || "خطأ");
    } finally {
      setRunning(false);
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm("احذف هذا التنبيه؟")) return;
    const { error } = await supabase.from("client_property_alerts").delete().eq("id", id);
    if (error) toast.error("فشل الحذف");
    else {
      toast.success("تم الحذف");
      load();
    }
  }

  async function toggleAlert(id: string, current: boolean) {
    const { error } = await supabase
      .from("client_property_alerts")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) toast.error("فشل");
    else load();
  }

  if (loading) {
    return (
      <div dir="rtl" className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div dir="rtl" className="py-20 text-center">
        <p style={{ color: "var(--text-faint)" }}>العميل غير موجود</p>
        <Link href="/dashboard/clients" style={{ color: "var(--gold-2)" }}>
          العودة للعملاء
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-4">
      <Link
        href={`/dashboard/clients/${clientId}`}
        className="inline-flex items-center gap-1 text-xs no-underline"
        style={{ color: "var(--text-faint)" }}
      >
        <ChevronRight size={12} /> العودة للعميل
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="flex items-center gap-2 text-2xl font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <Bell size={22} style={{ color: "var(--gold-2)" }} /> تنبيهات {client.full_name}
            <HelpHint
              title="نظام المطابقة الذكي"
              body="عرّف معايير العميل (مدن، أحياء، نطاق سعر، نوع العقار). كل ما يُنشَر عقار جديد يطابق ٦٠٪+ من المعايير، تظهر هنا مطابقة جديدة. تقدر تشغّل المطابقة يدوياً الآن أو تتركها تشتغل تلقائياً مع كل عقار جديد."
              size="sm"
            />
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-faint)" }}>
            {alerts.length} {alerts.length === 1 ? "تنبيه" : "تنبيهات"} · {matches.length} مطابقة
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={runMatching}
            disabled={running || alerts.filter((a) => a.is_active).length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
            style={{
              background: running
                ? "var(--bg-surface-2)"
                : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: running ? "var(--text-faint)" : "var(--bg-page)",
              border: "none",
              cursor:
                running || alerts.filter((a) => a.is_active).length === 0
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {running ? "جاري المطابقة..." : "تشغيل المطابقة الآن"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={12} /> تنبيه جديد
          </button>
        </div>
      </div>

      {/* نموذج إضافة */}
      {showAddForm && (
        <AddAlertForm
          clientId={clientId}
          onSaved={() => {
            setShowAddForm(false);
            load();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* قائمة التنبيهات */}
      {alerts.length === 0 ? (
        <div
          className="rounded-xl py-12 text-center"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <Bell size={36} style={{ color: "var(--gold-2)", margin: "0 auto 12px" }} />
          <p className="mb-1 font-bold" style={{ color: "var(--text-strong)" }}>
            لا توجد تنبيهات بعد
          </p>
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            عرّف معايير العميل ليبدأ النظام بإرسال المطابقات
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDelete={() => deleteAlert(alert.id)}
              onToggle={() => toggleAlert(alert.id, !!alert.is_active)}
              matchCount={matches.filter((m) => m.alert_id === alert.id).length}
            />
          ))}
        </div>
      )}

      {/* قائمة المطابقات */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h2
            className="mb-3 flex items-center gap-2 text-lg font-bold"
            style={{ color: "var(--text-strong)" }}
          >
            <CheckCircle2 size={18} style={{ color: "var(--success, #4ade80)" }} />
            المطابقات ({matches.length})
          </h2>
          <div className="space-y-2">
            {matches.slice(0, 20).map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function AlertRow({
  alert,
  onDelete,
  onToggle,
  matchCount,
}: {
  alert: Alert;
  onDelete: () => void;
  onToggle: () => void;
  matchCount: number;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl p-3"
      style={{
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
        opacity: alert.is_active ? 1 : 0.55,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onToggle}
          title={alert.is_active ? "تعطيل" : "تفعيل"}
          style={{
            width: 36,
            height: 20,
            borderRadius: 999,
            background: alert.is_active ? "var(--gold-2)" : "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg)",
            position: "relative",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 1,
              [alert.is_active ? "left" : "right"]: 1,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: alert.is_active ? "var(--bg-page)" : "var(--text-faint)",
              transition: "all 0.2s",
            }}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
            {[alert.city, alert.district, alert.offer_type, alert.sub_category]
              .filter(Boolean)
              .join(" · ") || "تنبيه عام"}
          </div>
          <div className="text-xs" style={{ color: "var(--text-faint)" }}>
            {alert.min_price || alert.max_price ? (
              <span>
                {alert.min_price ? Number(alert.min_price).toLocaleString("ar-SA") : "0"}
                {" — "}
                {alert.max_price ? Number(alert.max_price).toLocaleString("ar-SA") : "∞"} ر.س
              </span>
            ) : (
              "بدون نطاق سعر"
            )}
            {alert.min_rooms ? ` · ${alert.min_rooms}+ غرف` : ""}
            {alert.min_area ? ` · ${alert.min_area}+ م²` : ""}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        {matchCount > 0 && (
          <span
            className="rounded-full px-2 py-1 text-xs font-bold"
            style={{
              background: "rgba(74,222,128,0.1)",
              color: "var(--success, #4ade80)",
            }}
          >
            {matchCount} مطابقة
          </span>
        )}
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-faint)",
            cursor: "pointer",
          }}
          title="حذف"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function MatchRow({ match }: { match: Match }) {
  const scorePercent = Math.round((match.match_score ?? 0) * 100);
  const isHigh = scorePercent >= 80;
  const isMedium = scorePercent >= 60 && scorePercent < 80;

  return (
    <Link
      href={`/properties/${match.property_id}`}
      target="_blank"
      className="flex items-center gap-3 rounded-xl p-3 no-underline"
      style={{
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
        color: "var(--text-strong)",
      }}
    >
      {match.property?.main_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={match.property.main_image}
          alt=""
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            background: "var(--bg-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--text-faint)",
          }}
        >
          <Home size={20} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{match.property?.title || "—"}</div>
        <div
          className="mt-0.5 flex items-center gap-2 text-xs"
          style={{ color: "var(--text-faint)" }}
        >
          <MapPin size={11} />
          {[match.property?.district, match.property?.city].filter(Boolean).join("، ") || "—"}
          {match.property?.price && (
            <>
              <span>·</span>
              <span style={{ color: "var(--gold-2)", fontWeight: 600 }}>
                {Number(match.property.price).toLocaleString("ar-SA")}{" "}
                <SARIcon size={10} color="accent" />
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <span
          className="rounded-full px-2 py-1 text-xs font-bold"
          style={{
            background: isHigh
              ? "rgba(74,222,128,0.15)"
              : isMedium
                ? "rgba(198,145,76,0.15)"
                : "rgba(150,150,150,0.1)",
            color: isHigh
              ? "var(--success, #4ade80)"
              : isMedium
                ? "var(--gold-2)"
                : "var(--text-faint)",
          }}
        >
          {scorePercent}٪
        </span>
        <ExternalLink size={13} style={{ color: "var(--text-faint)" }} />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
function AddAlertForm({
  clientId,
  onSaved,
  onCancel,
}: {
  clientId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    city: "",
    district: "",
    offer_type: "",
    sub_category: "",
    min_price: "",
    max_price: "",
    min_rooms: "",
    min_area: "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("غير مسجّل دخول");
        return;
      }
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_id", userData.user.id)
        .maybeSingle();
      if (!tenant) {
        toast.error("لم يُعثر على وسيط");
        return;
      }

      const payload = {
        tenant_id: tenant.id,
        client_id: clientId,
        city: form.city || null,
        district: form.district || null,
        offer_type: form.offer_type || null,
        sub_category: form.sub_category || null,
        min_price: form.min_price ? Number(form.min_price) : null,
        max_price: form.max_price ? Number(form.max_price) : null,
        min_rooms: form.min_rooms ? Number(form.min_rooms) : null,
        min_area: form.min_area ? Number(form.min_area) : null,
        is_active: true,
      };

      const { error } = await supabase.from("client_property_alerts").insert([payload]);
      if (error) {
        toast.error("فشل الإضافة: " + error.message);
      } else {
        toast.success("✅ أُضيف التنبيه");
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    borderRadius: 8,
    color: "var(--text-strong)",
    fontSize: 13,
    fontFamily: "inherit",
  };

  return (
    <div
      className="space-y-3 rounded-xl p-4"
      style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-2)" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          تنبيه جديد
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            المدينة
          </label>
          <input
            type="text"
            placeholder="الرياض"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            الحي
          </label>
          <input
            type="text"
            placeholder="العليا"
            value={form.district}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            نوع العرض
          </label>
          <select
            value={form.offer_type}
            onChange={(e) => setForm({ ...form, offer_type: e.target.value })}
            style={inputStyle}
          >
            <option value="">— اختر —</option>
            <option value="بيع">بيع</option>
            <option value="إيجار">إيجار</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            التصنيف الفرعي
          </label>
          <input
            type="text"
            placeholder="فيلا / شقة / أرض"
            value={form.sub_category}
            onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            السعر من
          </label>
          <input
            type="number"
            placeholder="500000"
            value={form.min_price}
            onChange={(e) => setForm({ ...form, min_price: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            السعر إلى
          </label>
          <input
            type="number"
            placeholder="2000000"
            value={form.max_price}
            onChange={(e) => setForm({ ...form, max_price: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            الغرف (الأدنى)
          </label>
          <input
            type="number"
            placeholder="3"
            value={form.min_rooms}
            onChange={(e) => setForm({ ...form, min_rooms: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
            المساحة الأدنى (م²)
          </label>
          <input
            type="number"
            placeholder="200"
            value={form.min_area}
            onChange={(e) => setForm({ ...form, min_area: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 rounded-lg py-2.5 text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
            border: "none",
            cursor: saving ? "wait" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {saving ? "جاري الحفظ..." : "حفظ التنبيه"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm"
          style={{
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg)",
            color: "var(--text-faint)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
