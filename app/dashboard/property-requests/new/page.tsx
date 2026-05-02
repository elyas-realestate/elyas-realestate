"use client";
import { supabase } from "@/lib/supabase-browser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PROPERTY_TYPES = ["شقة", "فيلا", "أرض", "محل", "مكتب", "عمارة", "استراحة"];
const REQUEST_TYPES  = ["شراء", "إيجار", "استثمار"];
const PAYMENT_METHODS = ["كاش", "تمويل بنكي", "إيجار شهري", "إيجار سنوي"];
const GOV_SUPPORTS = ["لا", "صندوق التنمية العقاري (REDF)", "سكني", "أخرى"];
const URGENCY = ["عادي", "عاجل", "خلال أسبوع"];

const inp = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none transition";
const inpStyle = { background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg-hover)", color: "var(--text-strong)" };

export default function NewPropertyRequestPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contact_name: "", contact_phone: "",
    request_type: "شراء", main_category: "شقة",
    city: "الرياض", district: "",
    budget_min: "", budget_max: "",
    rooms_min: "", rooms_max: "",
    area_min: "", area_max: "",
    payment_method: "كاش", government_support: "لا",
    urgency_level: "عادي",
    required_features: "",
    message: "",
    whatsapp_opt_in: true,
  });

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contact_name.trim() || !form.contact_phone.trim()) {
      toast.error("الاسم والجوال مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        request_type: form.request_type,
        main_category: form.main_category,
        city: form.city || null,
        district: form.district || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        rooms_min: form.rooms_min ? Number(form.rooms_min) : null,
        rooms_max: form.rooms_max ? Number(form.rooms_max) : null,
        area_min: form.area_min ? Number(form.area_min) : null,
        area_max: form.area_max ? Number(form.area_max) : null,
        payment_method: form.payment_method,
        government_support: form.government_support,
        urgency_level: form.urgency_level,
        required_features: form.required_features || null,
        message: form.message || null,
        whatsapp_opt_in: form.whatsapp_opt_in,
        status: "جديد",
      };
      const { data, error } = await supabase.from("property_requests").insert(payload).select("id").single();
      if (error) throw error;
      toast.success("تم حفظ الطلب — سيقترح المساعد الذكي عقارات مطابقة");
      router.push(`/dashboard/property-requests/${data.id}`);
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div dir="rtl" className="space-y-5 max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/dashboard/property-requests" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة لطلبات العقار
      </Link>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>طلب عقار جديد</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
          سجّل ما يبحث عنه العميل بالضبط، وسيقترح عليك المساعد الذكي عقارات مطابقة من مخزونك.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* بيانات العميل */}
        <Section title="بيانات العميل">
          <Field label="الاسم الكامل *">
            <input className={inp} style={inpStyle} value={form.contact_name} onChange={e => set("contact_name", e.target.value)} required />
          </Field>
          <Field label="رقم الجوال *">
            <input className={inp} style={inpStyle} dir="ltr" value={form.contact_phone}
              onChange={e => set("contact_phone", e.target.value)}
              required pattern="^(\+?966|0)?5\d{8}$" placeholder="05XXXXXXXX" />
          </Field>
          <Field label="" full>
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-soft)" }}>
              <input type="checkbox" checked={form.whatsapp_opt_in} onChange={e => set("whatsapp_opt_in", e.target.checked)} />
              التواصل عبر WhatsApp مفضّل
            </label>
          </Field>
        </Section>

        {/* تفاصيل الطلب */}
        <Section title="ماذا يبحث عنه؟">
          <Field label="نوع الطلب">
            <select className={inp} style={inpStyle} value={form.request_type} onChange={e => set("request_type", e.target.value)}>
              {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="نوع العقار">
            <select className={inp} style={inpStyle} value={form.main_category} onChange={e => set("main_category", e.target.value)}>
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="المدينة">
            <input className={inp} style={inpStyle} value={form.city} onChange={e => set("city", e.target.value)} />
          </Field>
          <Field label="الحي">
            <input className={inp} style={inpStyle} value={form.district} onChange={e => set("district", e.target.value)} placeholder="مثل: النرجس" />
          </Field>
        </Section>

        {/* الميزانية */}
        <Section title="الميزانية والمساحة">
          <Field label="الميزانية من (ر.س)">
            <input type="number" className={inp} style={inpStyle} value={form.budget_min} onChange={e => set("budget_min", e.target.value)} dir="ltr" />
          </Field>
          <Field label="الميزانية إلى (ر.س)">
            <input type="number" className={inp} style={inpStyle} value={form.budget_max} onChange={e => set("budget_max", e.target.value)} dir="ltr" />
          </Field>
          <Field label="عدد الغرف من">
            <input type="number" min="0" className={inp} style={inpStyle} value={form.rooms_min} onChange={e => set("rooms_min", e.target.value)} dir="ltr" />
          </Field>
          <Field label="عدد الغرف إلى">
            <input type="number" min="0" className={inp} style={inpStyle} value={form.rooms_max} onChange={e => set("rooms_max", e.target.value)} dir="ltr" />
          </Field>
          <Field label="المساحة من (م²)">
            <input type="number" className={inp} style={inpStyle} value={form.area_min} onChange={e => set("area_min", e.target.value)} dir="ltr" />
          </Field>
          <Field label="المساحة إلى (م²)">
            <input type="number" className={inp} style={inpStyle} value={form.area_max} onChange={e => set("area_max", e.target.value)} dir="ltr" />
          </Field>
        </Section>

        {/* الدفع والدعم */}
        <Section title="الدفع والدعم الحكومي">
          <Field label="طريقة الدفع">
            <select className={inp} style={inpStyle} value={form.payment_method} onChange={e => set("payment_method", e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="الدعم الحكومي">
            <select className={inp} style={inpStyle} value={form.government_support} onChange={e => set("government_support", e.target.value)}>
              {GOV_SUPPORTS.map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="مستوى الإلحاح">
            <select className={inp} style={inpStyle} value={form.urgency_level} onChange={e => set("urgency_level", e.target.value)}>
              {URGENCY.map(u => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </Section>

        {/* تفاصيل إضافية */}
        <Section title="تفاصيل إضافية" cols={1}>
          <Field label="مميزات مطلوبة" full>
            <input className={inp} style={inpStyle} value={form.required_features} onChange={e => set("required_features", e.target.value)} placeholder="مثل: مدخلين، مسبح، مصعد، قريب من المدارس..." />
          </Field>
          <Field label="رسالة العميل (اختياري)" full>
            <textarea className={inp} style={inpStyle} rows={3} value={form.message} onChange={e => set("message", e.target.value)} placeholder="ما قاله العميل بالضبط — يساعد المساعد على فهم احتياجه" />
          </Field>
        </Section>

        {/* أزرار الحفظ */}
        <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid var(--gold-bg)" }}>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition"
            style={{
              background: saving ? "var(--bg-surface-3)" : "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
              color: saving ? "var(--text-faint)" : "var(--bg-page)",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            حفظ الطلب
          </button>
          <Link href="/dashboard/property-requests"
            className="flex items-center px-5 py-3 rounded-xl font-bold text-sm no-underline"
            style={{ background: "var(--bg-surface-2)", color: "var(--text-soft)", border: "1px solid var(--gold-bg)" }}>
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children, cols = 2 }: { title: string; children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <h3 className="text-sm font-bold mb-4" style={{ color: "var(--gold-2)" }}>{title}</h3>
      <div className={`grid grid-cols-1 ${cols === 2 ? "sm:grid-cols-2" : ""} gap-4`}>{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      {label && <label className="block text-xs mb-1.5" style={{ color: "var(--text-soft)" }}>{label}</label>}
      {children}
    </div>
  );
}
