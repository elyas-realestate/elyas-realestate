"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronRight, ExternalLink, Eye, EyeOff, Loader2,
  Plus, Trash2, GripVertical, X, ArrowLeft, Edit2,
  QrCode, Sparkles, Share2, IdCard, Camera
} from "lucide-react";
import {
  ELEMENTS, CATEGORIES, getElement, getCategoryElements,
  type ProfileElement, type ElementCategory, type ElementField
} from "@/lib/profile-elements";

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

  // Library + edit modals
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [newElementType, setNewElementType] = useState<string | null>(null);

  // Identity edit
  const [editingIdentity, setEditingIdentity] = useState(false);

  // Theme picker
  const [themeOpen, setThemeOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile-card");
      const j = await res.json();
      if (j.ok) {
        setCard(j.card);
        setLinks(j.links || []);
        setSlug(j.slug || "");
      } else toast.error(j.error || "فشل التحميل");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveCard(updates: any) {
    const res = await fetch("/api/profile-card", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const j = await res.json();
    if (j.ok) {
      setCard({ ...card, ...updates });
      toast.success("✅ تم الحفظ");
    } else toast.error(j.error || "فشل الحفظ");
  }

  async function toggleLink(id: string, current: boolean) {
    const res = await fetch("/api/profile-card/links", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    const j = await res.json();
    if (j.ok) {
      setLinks(links.map(l => l.id === id ? { ...l, is_active: !current } : l));
    } else toast.error(j.error);
  }

  async function deleteLink(id: string) {
    if (!confirm("احذف هذا العنصر؟")) return;
    const res = await fetch(`/api/profile-card/links?id=${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setLinks(links.filter(l => l.id !== id));
      toast.success("تم الحذف");
    } else toast.error(j.error);
  }

  async function moveLink(id: string, direction: "up" | "down") {
    const idx = links.findIndex(l => l.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= links.length) return;

    const reordered = [...links];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setLinks(reordered);

    // Save new order
    await Promise.all(reordered.map((l, i) =>
      fetch("/api/profile-card/links", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, display_order: i }),
      })
    ));
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} /></div>;
  }
  if (!card) return <div className="text-center py-12">لا توجد بطاقة. أعد التحميل.</div>;

  return (
    <div dir="rtl" className="space-y-4 max-w-3xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs no-underline" style={{ color: "var(--text-faint)" }}>
        <ChevronRight size={12} /> العودة
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-strong)" }}>
          <IdCard size={22} style={{ color: "var(--gold-2)" }} /> البروفايل
        </h1>
        <div className="flex gap-2">
          <Link href={`/c/${slug}`} target="_blank"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs no-underline"
            style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-soft)" }}>
            <Eye size={12} /> شاهد البروفايل
          </Link>
          <button onClick={() => setThemeOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs"
            style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)", color: "var(--text-soft)", cursor: "pointer" }}>
            <Sparkles size={12} /> الثيم
          </button>
        </div>
      </div>

      {/* Avatar + Name + Bio Card */}
      <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: `3px solid ${card.accent_color || "var(--gold-2)"}` }}>
              {card.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={card.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ background: card.accent_color || "var(--gold-2)", color: card.bg_color || "#FAF7F2" }}>
                  {(card.display_name || slug || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name + Bio editable */}
          <button onClick={() => setEditingIdentity(true)}
            className="w-full rounded-xl p-3 text-start"
            style={{ background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg-soft)", cursor: "pointer" }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                  {card.display_name || "أضف اسمك"}
                </div>
                <div className="text-xs mt-1 truncate" style={{ color: "var(--text-faint)" }}>
                  {card.bio || "أضف وصفاً قصيراً يُعبّر عنك"}
                </div>
              </div>
              <Edit2 size={14} style={{ color: "var(--text-faint)" }} />
            </div>
          </button>
        </div>
      </div>

      {/* Add Element Button */}
      <button onClick={() => setLibraryOpen(true)}
        className="w-full rounded-xl py-4 font-bold flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)", border: "none", fontSize: 15, cursor: "pointer",
        }}>
        <Plus size={18} /> أضف للبروفايل
      </button>

      {/* Elements list */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: "var(--bg-surface-1)", border: "1px dashed var(--gold-bg)", color: "var(--text-faint)" }}>
            <div className="text-sm">لم تضف أي عنصر بعد.</div>
            <div className="text-xs mt-2">اضغط الزر أعلاه لتبدأ.</div>
          </div>
        ) : (
          links.map((link, idx) => (
            <ElementRow
              key={link.id}
              link={link}
              isFirst={idx === 0}
              isLast={idx === links.length - 1}
              onToggle={() => toggleLink(link.id, link.is_active)}
              onEdit={() => setEditingLink(link)}
              onDelete={() => deleteLink(link.id)}
              onMoveUp={() => moveLink(link.id, "up")}
              onMoveDown={() => moveLink(link.id, "down")}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {libraryOpen && (
        <ElementLibraryModal
          onClose={() => setLibraryOpen(false)}
          onSelect={(type: string) => {
            setLibraryOpen(false);
            setNewElementType(type);
          }}
        />
      )}
      {newElementType && (
        <ElementEditModal
          elementType={newElementType}
          link={null}
          onClose={() => setNewElementType(null)}
          onSaved={async () => { setNewElementType(null); await load(); }}
        />
      )}
      {editingLink && (
        <ElementEditModal
          elementType={editingLink.element_type}
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={async () => { setEditingLink(null); await load(); }}
        />
      )}
      {editingIdentity && (
        <IdentityEditModal
          card={card}
          onClose={() => setEditingIdentity(false)}
          onSave={async (updates: any) => { await saveCard(updates); setEditingIdentity(false); }}
        />
      )}
      {themeOpen && (
        <ThemeModal card={card} onClose={() => setThemeOpen(false)}
          onApply={async (t: any) => { await saveCard(t); setThemeOpen(false); }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// صف العنصر في القائمة
// ─────────────────────────────────────────────────────────────
function ElementRow({ link, isFirst, isLast, onToggle, onEdit, onDelete, onMoveUp, onMoveDown }: any) {
  const el = getElement(link.element_type);
  if (!el) return null;
  const Icon = el.icon;
  const meta = link.metadata || {};
  const displayLabel = meta.label || el.defaultLabel || el.label;
  const subtitle = meta.username || meta.number || meta.url || meta.email || meta.phone || "";

  return (
    <div className="flex items-center gap-2 rounded-xl p-3" style={{
      background: "var(--bg-surface-1)",
      border: "1px solid var(--gold-bg)",
    }}>
      <div className="flex flex-col gap-0.5">
        <button onClick={onMoveUp} disabled={isFirst}
          style={{ opacity: isFirst ? 0.3 : 0.7, background: "transparent", border: "none", cursor: isFirst ? "default" : "pointer", padding: 2 }}>
          ▲
        </button>
        <button onClick={onMoveDown} disabled={isLast}
          style={{ opacity: isLast ? 0.3 : 0.7, background: "transparent", border: "none", cursor: isLast ? "default" : "pointer", padding: 2 }}>
          ▼
        </button>
      </div>

      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{
        background: el.brandBg || "var(--bg-surface-2)",
        color: el.brandFg || "var(--text-soft)",
      }}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>
          {displayLabel}
        </div>
        {subtitle && (
          <div className="text-xs truncate" style={{ color: "var(--text-faint)" }}>{subtitle}</div>
        )}
      </div>

      <button onClick={onEdit} aria-label="تعديل"
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, color: "var(--text-soft)" }}>
        <Edit2 size={14} />
      </button>
      <button onClick={onDelete} aria-label="حذف"
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, color: "var(--danger)" }}>
        <Trash2 size={14} />
      </button>
      <button onClick={onToggle}
        className="relative"
        style={{
          width: 38, height: 22, borderRadius: 22,
          background: link.is_active ? "var(--success)" : "var(--bg-surface-3)",
          border: "none", cursor: "pointer", padding: 0,
        }}>
        <span style={{
          position: "absolute", top: 2, [link.is_active ? "left" : "right"]: 2 as any,
          width: 18, height: 18, borderRadius: "50%", background: "#FFFFFF",
          transition: "all 0.2s",
        }} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال مكتبة العناصر
// ─────────────────────────────────────────────────────────────
function ElementLibraryModal({ onClose, onSelect }: any) {
  const [activeCategory, setActiveCategory] = useState<ElementCategory>("social");
  const items = getCategoryElements(activeCategory);

  return (
    <ModalShell onClose={onClose} title="مكتبة العناصر">
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-2 px-2" style={{ scrollbarWidth: "thin" }}>
        {CATEGORIES.map(c => (
          <button key={c.key} onClick={() => setActiveCategory(c.key)}
            className="px-3 py-1.5 rounded-full text-xs whitespace-nowrap"
            style={{
              background: activeCategory === c.key ? "var(--text-strong)" : "var(--bg-surface-2)",
              color: activeCategory === c.key ? "var(--bg-page)" : "var(--text-soft)",
              border: "none", cursor: "pointer", fontWeight: 600,
            }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {items.map(el => {
          const Icon = el.icon;
          return (
            <button key={el.type} onClick={() => onSelect(el.type)}
              className="rounded-xl p-3 flex flex-col items-center gap-2 relative"
              style={{
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
                cursor: "pointer", aspectRatio: "1.1/1",
              }}>
              {el.isPremium && (
                <span style={{
                  position: "absolute", top: 6, [/* RTL */ "left" as any]: 6,
                  fontSize: 10, color: "var(--gold-2)",
                }}>⭐</span>
              )}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                background: el.brandBg || "var(--bg-surface-3)",
                color: el.brandFg || "var(--text-soft)",
              }}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-bold text-center" style={{ color: "var(--text-strong)" }}>
                {el.label}
              </span>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال تعديل/إضافة عنصر
// ─────────────────────────────────────────────────────────────
function ElementEditModal({ elementType, link, onClose, onSaved }: any) {
  const el = getElement(elementType);
  const [meta, setMeta] = useState<Record<string, any>>(link?.metadata || {});
  const [saving, setSaving] = useState(false);

  if (!el) return null;

  async function save() {
    setSaving(true);
    try {
      const url = el?.buildUrl ? el.buildUrl(meta) : meta.url || "";
      const label = meta.label || el?.defaultLabel || el?.label || "";

      if (link) {
        // تحديث
        await fetch("/api/profile-card/links", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: link.id, element_type: elementType, label, value: url,
            metadata: meta, link_type: el?.category, is_active: true,
          }),
        });
      } else {
        // إضافة
        await fetch("/api/profile-card/links", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            element_type: elementType, label, value: url,
            metadata: meta, link_type: el?.category,
          }),
        });
      }
      toast.success(link ? "✅ تم التحديث" : "✅ أُضيف العنصر");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    } finally { setSaving(false); }
  }

  return (
    <ModalShell onClose={onClose} title={link ? "تعديل العنصر" : el.label}>
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-surface-2)" }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
          background: el.brandBg || "var(--bg-surface-3)", color: el.brandFg || "var(--text-soft)",
        }}>
          <el.icon size={18} />
        </div>
        <div>
          <div className="text-sm font-bold">{el.label}</div>
          {el.description && <div className="text-xs opacity-70">{el.description}</div>}
        </div>
      </div>

      <div className="space-y-3">
        {el.fields.map(field => (
          <DynamicField key={field.key} field={field}
            value={meta[field.key] ?? ""}
            onChange={(v) => setMeta({ ...meta, [field.key]: v })} />
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full mt-5 py-3 rounded-xl font-bold"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)", border: "none", fontSize: 14,
          cursor: saving ? "wait" : "pointer",
        }}>
        {saving ? "جاري الحفظ..." : link ? "حفظ التعديلات" : "إضافة للبروفايل"}
      </button>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// حقل ديناميكي حسب نوعه
// ─────────────────────────────────────────────────────────────
function DynamicField({ field, value, onChange }: { field: ElementField; value: any; onChange: (v: any) => void }) {
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm";
  const inputStyle = {
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    color: "var(--text-strong)",
  };

  if (field.type === "boolean") {
    return (
      <label className="flex items-center justify-between gap-3 cursor-pointer rounded-xl p-3"
        style={{ background: "var(--bg-surface-2)" }}>
        <span className="text-sm">{field.label}</span>
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--gold-2)" }} />
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="block text-xs mb-1.5" style={{ color: "var(--text-soft)" }}>
          {field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder} rows={3}
          className={inputClass} style={{ ...inputStyle, resize: "vertical" }} />
        {field.helpText && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{field.helpText}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-soft)" }}>
        {field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: 6 }}>
        {field.prefix && (
          <span className="px-3 py-2.5 rounded-lg text-sm flex items-center" style={{
            background: "var(--bg-surface-3)", color: "var(--text-soft)", fontFamily: "monospace",
          }}>{field.prefix}</span>
        )}
        <input type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          dir={field.type === "tel" || field.type === "email" || field.type === "url" ? "ltr" : "auto"}
          className={inputClass} style={{ ...inputStyle, flex: 1 }} />
      </div>
      {field.helpText && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{field.helpText}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// تعديل الهوية
// ─────────────────────────────────────────────────────────────
function IdentityEditModal({ card, onClose, onSave }: any) {
  const [name, setName] = useState(card.display_name || "");
  const [bio, setBio] = useState(card.bio || "");
  const [avatar, setAvatar] = useState(card.avatar_url || "");

  return (
    <ModalShell onClose={onClose} title="تعديل الهوية">
      <div className="space-y-3">
        <DynamicField field={{ key: "display_name", label: "الاسم المعروض", type: "text", placeholder: "إلياس الدخيل", required: true }} value={name} onChange={setName} />
        <DynamicField field={{ key: "bio", label: "الوصف القصير", type: "textarea", placeholder: "وسيط عقاري معتمد — الرياض", helpText: "حد أقصى 140 حرف، يظهر تحت اسمك" }} value={bio} onChange={setBio} />
        <DynamicField field={{ key: "avatar", label: "رابط الصورة (اختياري)", type: "url", placeholder: "https://...", helpText: "إذا تركته فارغاً، نستخدم الحرف الأول من اسمك" }} value={avatar} onChange={setAvatar} />
      </div>
      <button onClick={() => onSave({ display_name: name, bio, avatar_url: avatar || null })}
        className="w-full mt-5 py-3 rounded-xl font-bold"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)", border: "none", fontSize: 14, cursor: "pointer",
        }}>
        حفظ
      </button>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال الثيم
// ─────────────────────────────────────────────────────────────
function ThemeModal({ card, onClose, onApply }: any) {
  return (
    <ModalShell onClose={onClose} title="اختر ثيم البروفايل">
      <div className="grid grid-cols-2 gap-2">
        {PRESET_THEMES.map(t => {
          const isActive = card.bg_color === t.bg && card.text_color === t.text;
          return (
            <button key={t.name}
              onClick={() => onApply({ bg_color: t.bg, text_color: t.text, accent_color: t.accent })}
              className="rounded-xl p-3 text-start"
              style={{
                background: t.bg, color: t.text,
                border: `2px solid ${isActive ? t.accent : "transparent"}`,
                cursor: "pointer",
              }}>
              <div className="text-sm font-bold mb-2">{t.name}</div>
              <div className="flex gap-1.5">
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.bg, border: `1px solid ${t.text}30` }} />
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.text }} />
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: t.accent }} />
              </div>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// إطار المودال المشترك
// ─────────────────────────────────────────────────────────────
function ModalShell({ children, onClose, title }: any) {
  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}>
      <div onClick={e => e.stopPropagation()} dir="rtl"
        style={{
          width: "100%", maxWidth: 540, margin: "0 auto",
          background: "var(--bg-surface-1)", color: "var(--text-strong)",
          borderRadius: "20px 20px 0 0",
          padding: "20px 18px 28px",
          maxHeight: "90vh", overflowY: "auto",
          animation: "slideUp 0.25s ease",
          fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
        }}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={onClose} aria-label="إغلاق"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--bg-surface-2)", border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <X size={16} />
          </button>
          <div className="text-sm font-bold opacity-90">{title}</div>
          <div style={{ width: 36 }} />
        </div>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
