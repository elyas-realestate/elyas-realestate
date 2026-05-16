"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-browser";
import {
  ChevronRight,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  X,
  Edit2,
  QrCode,
  Sparkles,
  IdCard,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  CATEGORIES,
  getElement,
  getCategoryElements,
  buildAutoElements,
  buildElementUrl,
  buildElementLabel,
  type ElementCategory,
  type ElementField,
  type AutoElement,
} from "@/lib/profile-elements";
import CardThemePicker from "@/app/components/CardThemePicker";
import BrokerQRModal from "@/app/components/BrokerQRModal";
import { getBrandIcon, getBrandBg, getBrandFg } from "@/app/components/BrandIcons";
import HelpHint from "@/app/components/HelpHint";

const PRESET_THEMES = [
  { name: "كريمي ذهبي", bg: "#FAF7F2", text: "#1A1206", accent: "#C6914C" },
  { name: "أسود فاخر", bg: "#0A0A0C", text: "#F5F5F5", accent: "#E8B86D" },
  { name: "أبيض نقي", bg: "#FFFFFF", text: "#0F172A", accent: "#3B82F6" },
  { name: "أخضر زمردي", bg: "#ECFDF5", text: "#064E3B", accent: "#10B981" },
  { name: "أزرق ملكي", bg: "#EFF6FF", text: "#1E3A8A", accent: "#3B82F6" },
  { name: "بنفسجي راقي", bg: "#F5F3FF", text: "#3B0764", accent: "#8B5CF6" },
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

  // ⭐ Card Theme picker (٢٠ ثيم مخصص للبطاقة)
  const [cardThemeOpen, setCardThemeOpen] = useState(false);

  // ⭐ QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Auto elements (social/license/etc.) من /settings + /broker_identity
  const [autoElements, setAutoElements] = useState<AutoElement[]>([]);

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

      // ── جلب الـ auto-elements (السوشال + الرخص) من site_settings + broker_identity ──
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: t } = await supabase
          .from("tenants")
          .select("id")
          .eq("owner_id", userData.user.id)
          .maybeSingle();
        if (t?.id) {
          const [siteRes, identityRes] = await Promise.all([
            supabase.from("site_settings").select("*").eq("tenant_id", t.id).maybeSingle(),
            supabase.from("broker_identity").select("*").eq("tenant_id", t.id).maybeSingle(),
          ]);
          const auto = buildAutoElements(siteRes.data, identityRes.data);
          setAutoElements(auto);
        }
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveCard(updates: any) {
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
  }

  async function toggleLink(id: string, current: boolean) {
    const res = await fetch("/api/profile-card/links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !current }),
    });
    const j = await res.json();
    if (j.ok) {
      setLinks(links.map((l) => (l.id === id ? { ...l, is_active: !current } : l)));
    } else toast.error(j.error);
  }

  async function deleteLink(id: string) {
    if (!confirm("احذف هذا العنصر؟")) return;
    const res = await fetch(`/api/profile-card/links?id=${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setLinks(links.filter((l) => l.id !== id));
      toast.success("تم الحذف");
    } else toast.error(j.error);
  }

  async function persistOrder(reordered: any[]) {
    await Promise.all(
      reordered.map((l, i) =>
        fetch("/api/profile-card/links", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: l.id, display_order: i }),
        })
      )
    );
  }

  async function moveLink(id: string, direction: "up" | "down") {
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= links.length) return;

    const reordered = [...links];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setLinks(reordered);
    await persistOrder(reordered);
  }

  // ⭐ Drag & drop: حالة الـ drag + reorder بالسحب
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function handleDragStart(id: string, e: React.DragEvent) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    // استخدام text/plain لتفعيل السحب في كل المتصفحات
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {}
  }

  function handleDragOver(id: string, e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  async function handleDrop(targetId: string, e: React.DragEvent) {
    e.preventDefault();
    const sourceId = draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const sIdx = links.findIndex((l) => l.id === sourceId);
    const tIdx = links.findIndex((l) => l.id === targetId);
    if (sIdx === -1 || tIdx === -1) return;

    const reordered = [...links];
    const [moved] = reordered.splice(sIdx, 1);
    reordered.splice(tIdx, 0, moved);
    setLinks(reordered);
    await persistOrder(reordered);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--gold-2)" }} />
      </div>
    );
  }
  if (!card) return <div className="py-12 text-center">لا توجد بطاقة. أعد التحميل.</div>;

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs no-underline"
        style={{ color: "var(--text-faint)" }}
      >
        <ChevronRight size={12} /> العودة
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1
          className="flex items-center gap-2 text-2xl font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          <IdCard size={22} style={{ color: "var(--gold-2)" }} /> البروفايل
          <HelpHint
            title="بطاقتك التعريفية"
            body="هذه صفحتك العامة التي تشاركها مع العملاء. تظهر روابطك ورخصك تلقائياً، وتقدر تضيف عناصر مخصّصة، وتسحبها لإعادة الترتيب، وتخصّص لون كل عنصر."
            helpUrl="/dashboard/help#profile-card"
          />
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/c/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs no-underline"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
            }}
          >
            <Eye size={12} /> شاهد البروفايل
          </Link>
          {/* ⭐ ثيم البطاقة — ٢٠ ثيم احترافي خاص بالبطاقة */}
          <button
            onClick={() => setCardThemeOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs"
            style={{
              background: "var(--gold-bg)",
              border: "1px solid var(--gold-bg-strong, var(--gold-bg-hover))",
              color: "var(--gold-2)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Sparkles size={12} /> ثيم البطاقة
          </button>
          {/* QR للبطاقة */}
          <button
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <QrCode size={12} /> رمز QR
          </button>
          {/* الثيم العام لِلوحة التحكم — مصدر واحد للحقيقة */}
          <Link
            href="/dashboard/settings?tab=design"
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs no-underline"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
            }}
          >
            <SettingsIcon size={12} /> الثيم العام
          </Link>
        </div>
      </div>

      {/* Avatar + Name + Bio Card */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="h-24 w-24 overflow-hidden rounded-full"
              style={{ border: `3px solid ${card.accent_color || "var(--gold-2)"}` }}
            >
              {card.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={card.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-3xl font-bold"
                  style={{
                    background: card.accent_color || "var(--gold-2)",
                    color: card.bg_color || "#FAF7F2",
                  }}
                >
                  {(card.display_name || slug || "?").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name + Bio editable */}
          <button
            onClick={() => setEditingIdentity(true)}
            className="w-full rounded-xl p-3 text-start"
            style={{
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg-soft)",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                  {card.display_name || "أضف اسمك"}
                </div>
                <div className="mt-1 truncate text-xs" style={{ color: "var(--text-faint)" }}>
                  {card.bio || "أضف وصفاً قصيراً يُعبّر عنك"}
                </div>
              </div>
              <Edit2 size={14} style={{ color: "var(--text-faint)" }} />
            </div>
          </button>
        </div>
      </div>

      {/* Auto-pulled banner */}
      <div
        className="flex items-start gap-2 rounded-xl p-3"
        style={{
          background: "var(--gold-bg-soft)",
          border: "1px solid var(--gold-bg)",
        }}
      >
        <Sparkles size={14} style={{ color: "var(--gold-2)", marginTop: 2 }} />
        <div className="flex-1 text-xs" style={{ color: "var(--text-soft)" }}>
          <div className="font-bold" style={{ color: "var(--text-strong)" }}>
            روابطك ورخصك تأتي تلقائياً
          </div>
          <div className="mt-0.5">
            وسائل التواصل، الواتساب، البريد، والرخص (فال، السجل التجاري، معروف، إلخ) تظهر في بطاقتك
            تلقائياً من{" "}
            <Link
              href="/dashboard/settings"
              className="underline"
              style={{ color: "var(--gold-2)" }}
            >
              الإعدادات
            </Link>
            . هنا تضيف فقط العناصر الإضافية كـ المتاجر، التوصيل، الروابط المخصصة، النماذج.
          </div>
        </div>
      </div>

      {/* ─── الروابط التلقائية من الإعدادات (للمعاينة + التعديل بنقرة) ─── */}
      {autoElements.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--bg-surface-1)", border: "1px solid var(--gold-bg)" }}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--gold-2)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                روابط تلقائية في بطاقتك
              </h3>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "var(--gold-bg)", color: "var(--gold-2)", fontWeight: 600 }}
              >
                {autoElements.length}
              </span>
            </div>
            <Link
              href="/dashboard/settings?tab=contact"
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs no-underline"
              style={{
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
                color: "var(--gold-2)",
                fontWeight: 600,
              }}
            >
              <SettingsIcon size={11} /> تعديل من الإعدادات
            </Link>
          </div>
          <p className="mb-3 text-xs" style={{ color: "var(--text-faint)" }}>
            هذه الروابط تظهر في بطاقتك تلقائياً. لتغيير قيمة أي منها، اذهب إلى الإعدادات.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {autoElements.map((ae) => {
              const el = getElement(ae.type);
              if (!el) return null;
              const BrandIcon = getBrandIcon(ae.type);
              const Icon = BrandIcon || el.icon;
              const brandBg = getBrandBg(ae.type) || el.brandBg || "var(--gold-bg)";
              const brandFg = getBrandFg(ae.type) || el.brandFg || "var(--gold-2)";
              const url = buildElementUrl(ae.type, ae.metadata);
              const label = buildElementLabel(ae.type, ae.metadata) || el.label;
              return (
                <div
                  key={ae.type}
                  className="flex items-center gap-2 rounded-lg p-2.5"
                  style={{
                    background: "var(--bg-surface-2)",
                    border: "1px solid var(--gold-bg-soft)",
                  }}
                >
                  <div
                    className="flex flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ width: 32, height: 32, background: brandBg }}
                  >
                    <Icon size={15} style={{ color: brandFg }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-xs font-bold"
                      style={{ color: "var(--text-strong)" }}
                    >
                      {el.label}
                    </div>
                    <div
                      className="truncate text-xs"
                      style={{ color: "var(--text-faint)", direction: "ltr", textAlign: "right" }}
                    >
                      {label}
                    </div>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="اختبار الرابط"
                      className="flex-shrink-0 rounded p-1.5"
                      style={{ color: "var(--text-faint)" }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Element Button */}
      <button
        onClick={() => setLibraryOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)",
          border: "none",
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        <Plus size={18} /> أضف عنصراً مخصصاً
      </button>

      {/* Elements list — manual فقط */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <div
            className="rounded-xl py-10 text-center"
            style={{
              background: "var(--bg-surface-1)",
              border: "1px dashed var(--gold-bg)",
              color: "var(--text-faint)",
            }}
          >
            <div className="text-sm">لم تضف أي عنصر مخصص بعد.</div>
            <div className="mt-2 text-xs">
              العناصر الأساسية (وسائل تواصل، رخص) تظهر تلقائياً من الإعدادات.
            </div>
          </div>
        ) : (
          links.map((link, idx) => (
            <div
              key={link.id}
              draggable
              onDragStart={(e) => handleDragStart(link.id, e)}
              onDragOver={(e) => handleDragOver(link.id, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(link.id, e)}
              onDragEnd={handleDragEnd}
              style={{
                position: "relative",
                outline:
                  dragOverId === link.id && draggingId !== link.id
                    ? "2px dashed var(--gold-2)"
                    : "none",
                outlineOffset: 2,
                borderRadius: 12,
                transition: "outline 0.12s ease",
              }}
            >
              <ElementRow
                link={link}
                isFirst={idx === 0}
                isLast={idx === links.length - 1}
                onToggle={() => toggleLink(link.id, link.is_active)}
                onEdit={() => setEditingLink(link)}
                onDelete={() => deleteLink(link.id)}
                onMoveUp={() => moveLink(link.id, "up")}
                onMoveDown={() => moveLink(link.id, "down")}
                isDragging={draggingId === link.id}
              />
            </div>
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
          onSaved={async () => {
            setNewElementType(null);
            await load();
          }}
        />
      )}
      {editingLink && (
        <ElementEditModal
          elementType={editingLink.element_type}
          link={editingLink}
          onClose={() => setEditingLink(null)}
          onSaved={async () => {
            setEditingLink(null);
            await load();
          }}
        />
      )}
      {editingIdentity && (
        <IdentityEditModal
          card={card}
          onClose={() => setEditingIdentity(false)}
          onSave={async (updates: any) => {
            await saveCard(updates);
            setEditingIdentity(false);
          }}
        />
      )}
      {/* ThemeModal تم حذفه — التحكم بالثيم العام في /dashboard/settings?tab=design */}

      {/* ⭐ Card Theme Picker — ٢٠ ثيم خاص بالبطاقة */}
      {cardThemeOpen && (
        <CardThemePicker
          currentBg={card.bg_color}
          currentText={card.text_color}
          currentAccent={card.accent_color}
          onApply={async (theme) => {
            await saveCard({
              bg_color: theme.bg_color,
              text_color: theme.text_color,
              accent_color: theme.accent_color,
            });
            setCardThemeOpen(false);
          }}
          onClose={() => setCardThemeOpen(false)}
        />
      )}

      {/* ⭐ QR Modal */}
      {qrModalOpen && slug && (
        <BrokerQRModal
          slug={slug}
          brokerName={card?.display_name || slug}
          accentColor={card?.accent_color || "#C6914C"}
          bgColor={card?.bg_color || "#FAF7F2"}
          textColor={card?.text_color || "#1A1206"}
          onClose={() => setQrModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// صف العنصر في القائمة
// ─────────────────────────────────────────────────────────────
function ElementRow({
  link,
  isFirst,
  isLast,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
  isDragging,
}: any) {
  const el = getElement(link.element_type);
  if (!el) return null;
  const BrandIcon = getBrandIcon(link.element_type);
  const Icon = BrandIcon || el.icon;
  const brandBg = getBrandBg(link.element_type) || el.brandBg || "var(--bg-surface-2)";
  const brandFg = getBrandFg(link.element_type) || el.brandFg || "var(--text-soft)";
  const meta = link.metadata || {};
  const displayLabel = meta.label || el.defaultLabel || el.label;
  const subtitle = meta.username || meta.number || meta.url || meta.email || meta.phone || "";

  return (
    <div
      className="flex items-center gap-2 rounded-xl p-3"
      style={{
        background: "var(--bg-surface-1)",
        border: "1px solid var(--gold-bg)",
        opacity: isDragging ? 0.5 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      {/* Drag handle */}
      <button
        {...(dragHandleProps || {})}
        title="اسحب لإعادة الترتيب"
        style={{
          background: "transparent",
          border: "none",
          cursor: "grab",
          padding: "4px 2px",
          color: "var(--text-faint)",
          opacity: 0.6,
          touchAction: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "0.6";
        }}
      >
        <GripVertical size={16} />
      </button>

      <div className="flex flex-col gap-0.5">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          style={{
            opacity: isFirst ? 0.25 : 0.6,
            background: "transparent",
            border: "none",
            cursor: isFirst ? "default" : "pointer",
            padding: 1,
            fontSize: 9,
          }}
          title="نقل لأعلى"
        >
          ▲
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          style={{
            opacity: isLast ? 0.25 : 0.6,
            background: "transparent",
            border: "none",
            cursor: isLast ? "default" : "pointer",
            padding: 1,
            fontSize: 9,
          }}
          title="نقل لأسفل"
        >
          ▼
        </button>
      </div>

      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{
          background: brandBg,
          color: brandFg,
        }}
      >
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold" style={{ color: "var(--text-strong)" }}>
          {displayLabel}
        </div>
        {subtitle && (
          <div className="truncate text-xs" style={{ color: "var(--text-faint)" }}>
            {subtitle}
          </div>
        )}
      </div>

      <button
        onClick={onEdit}
        aria-label="تعديل"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "var(--text-soft)",
        }}
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={onDelete}
        aria-label="حذف"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          color: "var(--danger)",
        }}
      >
        <Trash2 size={14} />
      </button>
      <button
        onClick={onToggle}
        className="relative"
        style={{
          width: 38,
          height: 22,
          borderRadius: 22,
          background: link.is_active ? "var(--success)" : "var(--bg-surface-3)",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            [link.is_active ? "left" : "right"]: 2 as any,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#FFFFFF",
            transition: "all 0.2s",
          }}
        />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// مودال مكتبة العناصر
// ─────────────────────────────────────────────────────────────
function ElementLibraryModal({ onClose, onSelect }: any) {
  // اخفِ الفئات الفارغة (التي كل عناصرها autoFrom من الإعدادات)
  const visibleCategories = CATEGORIES.filter((c) => getCategoryElements(c.key).length > 0);
  const [activeCategory, setActiveCategory] = useState<ElementCategory>(
    visibleCategories[0]?.key || "content"
  );
  const items = getCategoryElements(activeCategory);

  return (
    <ModalShell onClose={onClose} title="مكتبة العناصر">
      <p className="mb-3 text-xs" style={{ color: "var(--text-faint)" }}>
        💡 وسائل التواصل والرخص تأتي تلقائياً من{" "}
        <Link href="/dashboard/settings" className="underline" style={{ color: "var(--gold-2)" }}>
          الإعدادات
        </Link>
        . هنا فقط العناصر الإضافية.
      </p>
      <div
        className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {visibleCategories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className="rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
            style={{
              background: activeCategory === c.key ? "var(--text-strong)" : "var(--bg-surface-2)",
              color: activeCategory === c.key ? "var(--bg-page)" : "var(--text-soft)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((el) => {
          const BrandIcon = getBrandIcon(el.type);
          const Icon = BrandIcon || el.icon;
          const brandBg = getBrandBg(el.type) || el.brandBg || "var(--bg-surface-3)";
          const brandFg = getBrandFg(el.type) || el.brandFg || "var(--text-soft)";
          return (
            <button
              key={el.type}
              onClick={() => onSelect(el.type)}
              className="relative flex flex-col items-center gap-2 rounded-xl p-3"
              style={{
                background: "var(--bg-surface-2)",
                border: "1px solid var(--gold-bg)",
                cursor: "pointer",
                aspectRatio: "1.1/1",
              }}
            >
              {el.isPremium && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    [/* RTL */ "left" as any]: 6,
                    fontSize: 10,
                    color: "var(--gold-2)",
                  }}
                >
                  ⭐
                </span>
              )}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background: brandBg,
                  color: brandFg,
                }}
              >
                <Icon size={20} />
              </div>
              <span
                className="text-center text-xs font-bold"
                style={{ color: "var(--text-strong)" }}
              >
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
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: link.id,
            element_type: elementType,
            label,
            value: url,
            metadata: meta,
            link_type: el?.category,
            is_active: true,
          }),
        });
      } else {
        // إضافة
        await fetch("/api/profile-card/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            element_type: elementType,
            label,
            value: url,
            metadata: meta,
            link_type: el?.category,
          }),
        });
      }
      toast.success(link ? "✅ تم التحديث" : "✅ أُضيف العنصر");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title={link ? "تعديل العنصر" : el.label}>
      {(() => {
        const BrandIcon = getBrandIcon(el.type);
        const HeaderIcon = BrandIcon || el.icon;
        const headerBg = getBrandBg(el.type) || el.brandBg || "var(--bg-surface-3)";
        const headerFg = getBrandFg(el.type) || el.brandFg || "var(--text-soft)";
        return (
          <div
            className="mb-4 flex items-center gap-3 rounded-xl p-3"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-lg"
              style={{
                background: headerBg,
                color: headerFg,
              }}
            >
              <HeaderIcon size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">{el.label}</div>
              {el.description && <div className="text-xs opacity-70">{el.description}</div>}
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {el.fields.map((field) => (
          <DynamicField
            key={field.key}
            field={field}
            value={meta[field.key] ?? ""}
            onChange={(v) => setMeta({ ...meta, [field.key]: v })}
          />
        ))}
      </div>

      {/* ⭐ تخصيص التصميم لهذا العنصر فقط */}
      <ElementDesignSection meta={meta} setMeta={setMeta} />

      <button
        onClick={save}
        disabled={saving}
        className="mt-5 w-full rounded-xl py-3 font-bold"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)",
          border: "none",
          fontSize: 14,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? "جاري الحفظ..." : link ? "حفظ التعديلات" : "إضافة للبروفايل"}
      </button>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// قسم تصميم العنصر (لكل عنصر منفرد) — يُحفَظ في metadata
// ─────────────────────────────────────────────────────────────
function ElementDesignSection({
  meta,
  setMeta,
}: {
  meta: Record<string, any>;
  setMeta: (m: Record<string, any>) => void;
}) {
  const [open, setOpen] = useState(false);

  const colorPresets = [
    { name: "افتراضي", bg: "", text: "" },
    { name: "ذهبي", bg: "#C6914C", text: "#FFFFFF" },
    { name: "أسود", bg: "#0A0A0C", text: "#F5F5F5" },
    { name: "أبيض", bg: "#FFFFFF", text: "#0F172A" },
    { name: "أخضر", bg: "#10B981", text: "#FFFFFF" },
    { name: "أزرق", bg: "#3B82F6", text: "#FFFFFF" },
    { name: "أحمر", bg: "#EF4444", text: "#FFFFFF" },
    { name: "بنفسجي", bg: "#8B5CF6", text: "#FFFFFF" },
  ];

  return (
    <div
      className="mt-4 rounded-xl"
      style={{
        border: "1px solid var(--gold-bg-soft)",
        background: "var(--bg-surface-2)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-soft)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: "var(--gold-2)" }} />
          تخصيص التصميم (اختياري)
        </span>
        <span style={{ opacity: 0.6, fontSize: 11 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 p-3 pt-0" style={{ borderTop: "1px solid var(--gold-bg-soft)" }}>
          {/* Custom label */}
          <div>
            <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
              تسمية مخصّصة (اختياري)
            </label>
            <input
              type="text"
              value={meta.label || ""}
              onChange={(e) => setMeta({ ...meta, label: e.target.value })}
              placeholder="مثال: حسابي الرسمي"
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: "var(--bg-surface-1)",
                border: "1px solid var(--gold-bg)",
                color: "var(--text-strong)",
              }}
            />
          </div>

          {/* Color presets */}
          <div>
            <label className="mb-2 block text-xs" style={{ color: "var(--text-faint)" }}>
              نمط جاهز
            </label>
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map((p) => {
                const isActive = (meta.bg_color || "") === p.bg;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setMeta({ ...meta, bg_color: p.bg, text_color: p.text })}
                    className="flex items-center justify-center rounded-lg p-2 text-xs font-bold"
                    style={{
                      background: p.bg || "var(--bg-surface-1)",
                      color: p.text || "var(--text-soft)",
                      border: `2px solid ${isActive ? "var(--gold-2)" : "var(--gold-bg-soft)"}`,
                      cursor: "pointer",
                      minHeight: 36,
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom hex */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                لون الخلفية
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={meta.bg_color || "#FAF7F2"}
                  onChange={(e) => setMeta({ ...meta, bg_color: e.target.value })}
                  style={{
                    width: 38,
                    height: 38,
                    padding: 0,
                    border: "1px solid var(--gold-bg)",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: "transparent",
                  }}
                />
                <input
                  type="text"
                  value={meta.bg_color || ""}
                  onChange={(e) => setMeta({ ...meta, bg_color: e.target.value })}
                  placeholder="#FAF7F2"
                  className="flex-1 rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-surface-1)",
                    border: "1px solid var(--gold-bg)",
                    color: "var(--text-strong)",
                    direction: "ltr",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs" style={{ color: "var(--text-faint)" }}>
                لون النص
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={meta.text_color || "#1A1206"}
                  onChange={(e) => setMeta({ ...meta, text_color: e.target.value })}
                  style={{
                    width: 38,
                    height: 38,
                    padding: 0,
                    border: "1px solid var(--gold-bg)",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: "transparent",
                  }}
                />
                <input
                  type="text"
                  value={meta.text_color || ""}
                  onChange={(e) => setMeta({ ...meta, text_color: e.target.value })}
                  placeholder="#1A1206"
                  className="flex-1 rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "var(--bg-surface-1)",
                    border: "1px solid var(--gold-bg)",
                    color: "var(--text-strong)",
                    direction: "ltr",
                    fontFamily: "monospace",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Reset */}
          {(meta.bg_color || meta.text_color || meta.label) && (
            <button
              type="button"
              onClick={() => setMeta({ ...meta, bg_color: "", text_color: "", label: "" })}
              className="text-xs underline"
              style={{
                color: "var(--text-faint)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              استعادة الافتراضي
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// حقل ديناميكي حسب نوعه
// ─────────────────────────────────────────────────────────────
function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ElementField;
  value: any;
  onChange: (v: any) => void;
}) {
  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm";
  const inputStyle = {
    background: "var(--bg-surface-2)",
    border: "1px solid var(--gold-bg)",
    color: "var(--text-strong)",
  };

  if (field.type === "boolean") {
    return (
      <label
        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-3"
        style={{ background: "var(--bg-surface-2)" }}
      >
        <span className="text-sm">{field.label}</span>
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--gold-2)" }}
        />
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="mb-1.5 block text-xs" style={{ color: "var(--text-soft)" }}>
          {field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={inputClass}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        {field.helpText && (
          <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
            {field.helpText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs" style={{ color: "var(--text-soft)" }}>
        {field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
      </label>
      <div style={{ display: "flex", gap: 6 }}>
        {field.prefix && (
          <span
            className="flex items-center rounded-lg px-3 py-2.5 text-sm"
            style={{
              background: "var(--bg-surface-3)",
              color: "var(--text-soft)",
              fontFamily: "monospace",
            }}
          >
            {field.prefix}
          </span>
        )}
        <input
          type={
            field.type === "tel"
              ? "tel"
              : field.type === "email"
                ? "email"
                : field.type === "url"
                  ? "url"
                  : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          dir={
            field.type === "tel" || field.type === "email" || field.type === "url" ? "ltr" : "auto"
          }
          className={inputClass}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      {field.helpText && (
        <p className="mt-1 text-xs" style={{ color: "var(--text-faint)" }}>
          {field.helpText}
        </p>
      )}
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
      {/* تنبيه — الاسم/الصورة يُستوردان تلقائياً من إعدادات المنشأة لو تركتهما فارغين */}
      <div
        className="mb-3 flex items-start gap-2 rounded-lg p-3 text-xs"
        style={{
          background: "var(--gold-bg-soft)",
          border: "1px solid var(--gold-bg)",
          color: "var(--text-soft)",
        }}
      >
        <span style={{ color: "var(--gold-2)", fontWeight: 700 }}>💡</span>
        <div>
          الاسم والصورة هنا يطغيان على القيم من <strong>الإعدادات → الملف الشخصي</strong>. اتركهما
          فارغين لتستخدم بطاقتك نفس اسمك وصورتك في باقي المنصة.
        </div>
      </div>
      <div className="space-y-3">
        <DynamicField
          field={{
            key: "display_name",
            label: "الاسم المعروض (اختياري — للبطاقة فقط)",
            type: "text",
            placeholder: "اتركه فارغاً لاستخدام اسمك من الإعدادات",
          }}
          value={name}
          onChange={setName}
        />
        <DynamicField
          field={{
            key: "bio",
            label: "الوصف القصير",
            type: "textarea",
            placeholder: "وسيط عقاري معتمد — الرياض",
            helpText: "حد أقصى 140 حرف، يظهر تحت اسمك",
          }}
          value={bio}
          onChange={setBio}
        />
        <DynamicField
          field={{
            key: "avatar",
            label: "رابط الصورة (اختياري — للبطاقة فقط)",
            type: "url",
            placeholder: "اتركه فارغاً لاستخدام صورتك من الإعدادات",
            helpText: "إذا تركته فارغاً، نستخدم صورتك في الإعدادات أو الحرف الأول من اسمك",
          }}
          value={avatar}
          onChange={setAvatar}
        />
      </div>
      <button
        onClick={() => onSave({ display_name: name, bio, avatar_url: avatar || null })}
        className="mt-5 w-full rounded-xl py-3 font-bold"
        style={{
          background: "linear-gradient(135deg, var(--gold-2), var(--gold-3))",
          color: "var(--bg-page)",
          border: "none",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        حفظ
      </button>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// ThemeModal — حُذف بالكامل (انتقل التحكم إلى /dashboard/settings?tab=design)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// إطار المودال المشترك
// ─────────────────────────────────────────────────────────────
function ModalShell({ children, onClose, title }: any) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          width: "100%",
          maxWidth: 540,
          margin: "0 auto",
          background: "var(--bg-surface-1)",
          color: "var(--text-strong)",
          borderRadius: "20px 20px 0 0",
          padding: "20px 18px 28px",
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.25s ease",
          fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--bg-surface-2)",
              border: "1px solid var(--gold-bg)",
              color: "var(--text-soft)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
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
