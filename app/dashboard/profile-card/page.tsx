"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight, ExternalLink, Eye, EyeOff, Loader2, Save,
  IdCard, Image as ImageIcon, Sparkles, Plus, Trash2, GripVertical, ArrowUpDown
} from "lucide-react";

const PRESET_THEMES = [
  { name: "كريمي ذهبي",  bg: "#FAF7F2", text: "#1A1206", accent: "#C6914C" },
  { name: "أسود فاخر",   bg: "#0A0A0C", text: "#F5F5F5", accent: "#E8B86D" },
  { name: "أبيض نقي",    bg: "#FFFFFF", text: "#0F172A", accent: "#3B82F6" },
  { name: "أخضر زمردي",  bg: "#ECFDF5", text: "#064E3B", accent: "#10B981" },
  { name: "أزرق ملكي",   bg: "#EFF6FF", text: "#1E3A8A", accent: "#3B82F6" },
  { name: "بنفسجي راقي",  bg: "#F5F3FF", text: "#3B0764", accent: "#8B5CF6" },
];

export default function ProfileCardPage() {
  const [card, setCard] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", value: "" });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile-card");
      const j = await res.json();
      if (j.ok) {
        setCard(j.card);
        setLinks(j.links || []);
        setSlug(j.slug || "");
      } else {
        toast.error(j.error || "فشل التحميل");
      }
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function saveCard(updates: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/profile-card", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const j = await res.json();
      if (j.ok) {
        setCard({ ...card, ...updates });
        toast.success("✅ تم الحفظ");
      } else toast.error(j.error || "فشل الحفظ");
    } finally { setSaving(false); }
  }

  async function applyTheme(t: typeof PRESET_THEMES[0]) {
    await saveCard({ bg_color: t.bg, text_color: t.text, accent_color: t.accent });
  }

  async function toggleSection(field: string) {
    await saveCard({ [field]: !card[field] });
  }

  async function addLink() {
    if (!newLink.label.trim() || !newLink.value.trim()) {
      toast.error("املأ الاسم والرابط");
      return;
    }
    const res = await fetch("/api/profile-card/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        link_type: "custom",
        label: newLink.label,
        value: newLink.value,
        display_order: links.length,
      }),
    });
    const j = await res.json();
    if (j.ok) {
      setLinks([...links, j.link]);
      setNewLink({ label: "", value: "" });
      toast.success("✅ أضيف الرابط");
    } else toast.error(j.error);
  }

  async function deleteLink(id: string) {
    if (!confirm("احذف هذا الرابط؟")) return;
    const res = await fetch(`/api/profile-card/links?id=${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setLinks(links.filter(l => l.id !== id));
      toast.success("تم الحذف");
    } else toast.error(j.error);
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>;
  }

  if (!card) {
    return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>لا توجد بطاقة. أعد تحميل الصفحة.</div>;
  }

  return (
    <div dir="rtl" className="space-y-5 max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
            <IdCard size={22} style={{ color: "var(--gold-2)" }} /> بطاقتي التعريفية
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>
            بطاقة احترافية برابط مختصر — مثل Linktree، مخصّصة للوسطاء العقاريين.
          </p>
        </div>

        <Link href={`/c/${slug}`} target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm no-underline"
          style={{
            background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
            color: "var(--bg-page)",
          }}>
          <ExternalLink size={13} /> معاينة /c/{slug}
        </Link>
      </div>

      {/* الهوية */}
      <Section title="الهوية" icon={<ImageIcon size={16} />}>
        <Field label="الاسم المعروض"
          value={card.display_name || ""}
          onChange={v => setCard({ ...card, display_name: v })}
          onBlur={() => saveCard({ display_name: card.display_name })}
          placeholder="إلياس الدخيل" />

        <Field label="الوصف القصير (Bio)"
          value={card.bio || ""}
          onChange={v => setCard({ ...card, bio: v })}
          onBlur={() => saveCard({ bio: card.bio })}
          placeholder="وسيط عقاري معتمد — الرياض" />

        <Field label="رابط الصورة الشخصية (URL)"
          value={card.avatar_url || ""}
          onChange={v => setCard({ ...card, avatar_url: v })}
          onBlur={() => saveCard({ avatar_url: card.avatar_url })}
          placeholder="https://... (اختياري — سنولّد avatar من اسمك)" />
      </Section>

      {/* الثيم */}
      <Section title="الثيم" icon={<Sparkles size={16} />}>
        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>اختر ثيماً جاهزاً، أو خصّص الألوان:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {PRESET_THEMES.map(t => {
            const isActive = card.bg_color === t.bg && card.text_color === t.text;
            return (
              <button key={t.name} onClick={() => applyTheme(t)}
                className="rounded-lg p-3 text-start"
                style={{
                  background: t.bg,
                  color: t.text,
                  border: `2px solid ${isActive ? t.accent : "transparent"}`,
                  cursor: "pointer",
                }}>
                <div className="text-xs font-bold mb-2">{t.name}</div>
                <div className="flex gap-1.5">
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.bg, border: `1px solid ${t.text}30` }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.text }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: t.accent }} />
                </div>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ColorField label="الخلفية" value={card.bg_color} onChange={v => saveCard({ bg_color: v })} />
          <ColorField label="النص" value={card.text_color} onChange={v => saveCard({ text_color: v })} />
          <ColorField label="اللون المميز" value={card.accent_color} onChange={v => saveCard({ accent_color: v })} />
        </div>
      </Section>

      {/* الأقسام المعروضة */}
      <Section title="الأقسام المعروضة" icon={<Eye size={16} />}>
        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>تحكّم بما يظهر للزائرين على بطاقتك:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ToggleRow label="التواصل المباشر (واتساب + إيميل)" enabled={card.show_direct_contact} onClick={() => toggleSection("show_direct_contact")} />
          <ToggleRow label="وسائل التواصل الاجتماعي"            enabled={card.show_social} onClick={() => toggleSection("show_social")} />
          <ToggleRow label="الرخص والاعتمادات"                  enabled={card.show_licenses} onClick={() => toggleSection("show_licenses")} />
          <ToggleRow label="أوقات العمل"                        enabled={card.show_hours} onClick={() => toggleSection("show_hours")} />
          <ToggleRow label="زر المشاركة (أعلى البطاقة)"          enabled={card.show_share_button} onClick={() => toggleSection("show_share_button")} />
          <ToggleRow label="زر QR (أعلى البطاقة)"               enabled={card.show_qr_button} onClick={() => toggleSection("show_qr_button")} />
          <ToggleRow label="بانر CTA (يجلب اشتراكات)"            enabled={card.show_powered_by} onClick={() => toggleSection("show_powered_by")} />
          <ToggleRow label="نشر البطاقة على الويب"                enabled={card.is_published} onClick={() => toggleSection("is_published")} />
        </div>
      </Section>

      {/* روابط مخصصة */}
      <Section title={`روابط مخصصة (${links.filter(l => l.link_type === "custom").length})`} icon={<Plus size={16} />}>
        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
          أضف روابط إضافية (موقع، تطبيق، نموذج، إلخ). الروابط الاجتماعية والرخص تأتي من ملفك الشخصي تلقائياً.
        </p>

        {links.filter(l => l.link_type === "custom").map(link => (
          <div key={link.id} className="flex items-center gap-2 rounded-lg p-3 mb-2" style={{
            background: "var(--bg-surface-2)",
            border: "1px solid var(--gold-bg)",
          }}>
            <GripVertical size={14} style={{ color: "var(--text-faint)" }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{link.label}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{link.value}</div>
            </div>
            <button onClick={() => deleteLink(link.id)} aria-label="حذف"
              style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <div className="rounded-lg p-3 mt-3" style={{ background: "var(--bg-surface-1)", border: "1px dashed var(--gold-bg-hover)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input value={newLink.label} onChange={e => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="اسم الرابط (مثل: موقعي الشخصي)"
              className="rounded px-3 py-2 text-sm"
              style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-strong)" }} />
            <input value={newLink.value} onChange={e => setNewLink({ ...newLink, value: e.target.value })}
              placeholder="https://..."
              className="rounded px-3 py-2 text-sm" dir="ltr"
              style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-strong)" }} />
          </div>
          <button onClick={addLink}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold"
            style={{ background: "var(--gold-2)", color: "var(--bg-page)", border: "none", cursor: "pointer" }}>
            <Plus size={12} /> إضافة
          </button>
        </div>
      </Section>

      {/* تلميح */}
      <div className="rounded-lg p-4 text-xs" style={{
        background: "var(--bg-surface-2)",
        border: "1px dashed var(--gold-bg)",
        color: "var(--text-faint)",
      }}>
        💡 <strong style={{ color: "var(--text-soft)" }}>الروابط الاجتماعية</strong> (تويتر، إنستجرام، تيك توك...) تُدار من
        <Link href="/dashboard/settings" className="mx-1 underline" style={{ color: "var(--gold-2)" }}>إعدادات الموقع</Link>
        وتظهر تلقائياً على بطاقتك بألوانها الرسمية.
      </div>

      {saving && (
        <div className="fixed bottom-4 left-4 px-4 py-2 rounded-lg flex items-center gap-2 text-xs" style={{
          background: "var(--bg-surface-1)", border: "1px solid var(--gold-2)", color: "var(--gold-2)",
        }}>
          <Loader2 size={12} className="animate-spin" /> جاري الحفظ...
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
      <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--gold-2)" }}>{icon} {title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, onBlur, placeholder }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string }) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-soft)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-strong)" }} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-soft)" }}>{label}</label>
      <div className="flex gap-1.5">
        <input type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer" style={{ border: "1px solid var(--gold-bg)" }} />
        <input value={value || ""} onChange={e => onChange(e.target.value)} dir="ltr"
          className="flex-1 rounded px-2 text-xs"
          style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-strong)", fontFamily: "monospace" }} />
      </div>
    </div>
  );
}

function ToggleRow({ label, enabled, onClick }: { label: string; enabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center justify-between rounded-lg p-3 transition"
      style={{
        background: enabled ? "var(--gold-bg)" : "var(--bg-surface-2)",
        border: `1px solid ${enabled ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
        cursor: "pointer", textAlign: "start",
      }}>
      <span className="text-sm" style={{ color: "var(--text-strong)" }}>{label}</span>
      {enabled
        ? <Eye size={14} style={{ color: "var(--gold-2)" }} />
        : <EyeOff size={14} style={{ color: "var(--text-faint)" }} />}
    </button>
  );
}
