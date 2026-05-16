"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  Share2,
  QrCode,
  X,
  Facebook,
  Linkedin,
  Twitter,
  MessageCircle,
  Camera,
  Copy,
  Download,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  getElement,
  buildElementUrl,
  buildElementLabel,
  type ProfileElement,
} from "@/lib/profile-elements";
import SaveContactButton from "@/app/components/SaveContactButton";
import TestimonialsSection from "@/app/components/TestimonialsSection";
import { getBrandIcon, getBrandBg, getBrandFg } from "@/app/components/BrandIcons";

interface ProfileLink {
  id: string;
  element_type: string;
  link_type: string;
  label: string;
  value: string | null;
  subtitle: string | null;
  metadata: Record<string, string> | null;
  bg_color: string | null;
  text_color: string | null;
  display_order: number;
}

// ─────────────────────────────────────────────────────────────
// Avatar من الأحرف الأولى (لا اعتماد خارجي)
// ─────────────────────────────────────────────────────────────
function InitialsAvatar({
  name,
  bg,
  color,
  size = 96,
}: {
  name: string;
  bg: string;
  color: string;
  size?: number;
}) {
  const initial = (name || "؟").trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 800,
        fontFamily: "var(--font-cairo), sans-serif",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────────────────────
export default function ProfileCardClient({ card, links, identity, slug, testimonials }: any) {
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState<ProfileLink | null>(null);

  const displayName = card.display_name || identity?.broker_name || slug;
  const bio = card.bio || identity?.specialization || "";
  const avatarUrl = card.avatar_url || identity?.photo_url || null;
  const accent = card.accent_color || "#C6914C";

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${slug}`
      : `https://elyas-realestate.vercel.app/c/${slug}`;

  // فلتر الـ links من الكتالوج
  const enabledLinks = (links as ProfileLink[]).filter((l: ProfileLink) => l.element_type);

  // الأيقونات الاجتماعية في الأعلى (٦ منصات بحد أقصى)
  const topSocials = enabledLinks
    .filter((l) => {
      const el = getElement(l.element_type);
      return el && el.category === "social";
    })
    .slice(0, 6);

  // العناصر التي تظهر كبطاقات
  const cardLinks = enabledLinks.filter((l) => {
    const el = getElement(l.element_type);
    if (!el) return false;
    // social يظهر في الأعلى كأيقونات (ما لم يكن مكرر — الزائدة عن ٦ تظهر كبطاقات)
    if (el.category === "social" && topSocials.find((s) => s.id === l.id)) return false;
    return true;
  });

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: card.bg_color || "#FAF7F2",
        color: card.text_color || "#1A1206",
        fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
        padding: "20px 16px 40px",
      }}
    >
      {/* أزرار علوية */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setShareOpen(true)}
          aria-label="مشاركة"
          style={iconBtnStyle(card.text_color)}
        >
          <Share2 size={16} />
        </button>
        <button
          onClick={() => setQrOpen(true)}
          aria-label="رمز QR"
          style={iconBtnStyle(card.text_color)}
        >
          <QrCode size={16} />
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* البطاقة الرئيسية: avatar + name + bio */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              margin: "0 auto 14px",
              display: "flex",
              justifyContent: "center",
              filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.08))",
            }}
          >
            {avatarUrl ? (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `3px solid ${accent}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <InitialsAvatar
                name={displayName}
                bg={accent}
                color={card.bg_color || "#FAF7F2"}
                size={100}
              />
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
            {displayName}
          </h1>
          {bio && <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>{bio}</p>}
        </div>

        {/* شريط الأيقونات الاجتماعية في الأعلى — أيقونات رسمية (Simple Icons) */}
        {topSocials.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {topSocials.map((link) => {
              const el = getElement(link.element_type);
              if (!el) return null;
              const url = buildElementUrl(link.element_type, link.metadata || {});
              // Brand icon أولاً (Simple Icons رسمية)، fallback لـ lucide
              const BrandIcon = getBrandIcon(link.element_type);
              const Icon = BrandIcon || el.icon;
              const brandBg = getBrandBg(link.element_type) || el.brandBg || "transparent";
              const brandFg = getBrandFg(link.element_type) || el.brandFg || "inherit";
              return (
                <a
                  key={link.id}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={el.label}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: brandBg,
                    color: brandFg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>
        )}

        {/* ⭐ زر "احفظ في جهات اتصالك" — الميزة المميزة */}
        <div style={{ marginBottom: 16 }}>
          <SaveContactButton
            slug={slug}
            brokerName={displayName}
            accent={accent}
            bgColor={card.bg_color || "#FAF7F2"}
            textColor={card.text_color || "#1A1206"}
            variant="hero"
          />
        </div>

        {/* قائمة العناصر — بطاقات كاملة */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cardLinks.map((link) => (
            <ElementCard
              key={link.id}
              link={link}
              cardTextColor={card.text_color || "#1A1206"}
              cardBgColor={card.bg_color || "#FAF7F2"}
              accent={accent}
              onContactFormOpen={(l) => setContactFormOpen(l)}
            />
          ))}
        </div>

        {/* ⭐ آراء العملاء */}
        {testimonials && testimonials.length > 0 && (
          <TestimonialsSection
            testimonials={testimonials}
            accent={accent}
            bgColor={card.bg_color || "#FAF7F2"}
            textColor={card.text_color || "#1A1206"}
          />
        )}

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            paddingTop: 20,
            opacity: 0.55,
            fontSize: 11,
          }}
        >
          <div>© ٢٠٢٦ {displayName}</div>
          <div style={{ marginTop: 6 }}>
            <Link href={`/${slug}`} style={{ color: accent, textDecoration: "none" }}>
              زيارة الموقع الكامل ←
            </Link>
          </div>
        </div>

        {/* Powered by CTA */}
        {card.show_powered_by && (
          <div
            style={{
              marginTop: 28,
              background: card.text_color || "#1A1206",
              color: card.bg_color || "#FAF7F2",
              borderRadius: 18,
              padding: "20px 18px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              كل ما يُمثّلك في <span style={{ color: accent }}>رابط واحد</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>
              أنشئ بطاقتك الاحترافية الآن
            </div>
            <Link
              href="/"
              style={{
                display: "inline-block",
                padding: "10px 28px",
                borderRadius: 100,
                background: accent,
                color: card.text_color || "#1A1206",
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              ابدأ مجاناً
            </Link>
          </div>
        )}
      </div>

      {shareOpen && (
        <ShareModal
          url={profileUrl}
          name={displayName}
          avatarUrl={avatarUrl}
          cardAccent={accent}
          cardBg={card.bg_color || "#FAF7F2"}
          onClose={() => setShareOpen(false)}
          bgColor={card.bg_color}
          textColor={card.text_color}
        />
      )}
      {qrOpen && (
        <QRModal
          url={profileUrl}
          name={displayName}
          avatarUrl={avatarUrl}
          cardAccent={accent}
          cardBg={card.bg_color || "#FAF7F2"}
          onClose={() => setQrOpen(false)}
          bgColor={card.bg_color}
          textColor={card.text_color}
        />
      )}
      {contactFormOpen && (
        <ContactFormModal
          link={contactFormOpen}
          slug={slug}
          onClose={() => setContactFormOpen(null)}
          bgColor={card.bg_color}
          textColor={card.text_color}
          accent={accent}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// بطاقة عنصر واحد (تتكيّف حسب النوع)
// ─────────────────────────────────────────────────────────────
function ElementCard({
  link,
  cardTextColor,
  cardBgColor,
  accent,
  onContactFormOpen,
}: {
  link: ProfileLink;
  cardTextColor: string;
  cardBgColor: string;
  accent: string;
  onContactFormOpen: (l: ProfileLink) => void;
}) {
  const el = getElement(link.element_type);
  if (!el) return null;
  const meta = link.metadata || {};

  // عناصر الـ divider لها عرض خاص
  if (el.category === "divider") {
    if (el.type === "divider_header") {
      return (
        <div style={{ marginTop: 8, paddingTop: 8, fontSize: 12, fontWeight: 700, opacity: 0.65 }}>
          {meta.label || link.label}
        </div>
      );
    }
    if (el.type === "divider_paragraph") {
      return (
        <div style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.85, padding: "4px 8px" }}>
          {meta.label || link.label}
        </div>
      );
    }
  }

  // الرخص: عرض خاص (رقم + اسم + أيقونة)
  if (el.category === "license") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderRadius: 12,
          background: `${accent}08`,
          border: `1px solid ${accent}25`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{el.emoji || "◇"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{el.label}</div>
            {meta.number && (
              <div style={{ fontSize: 11, opacity: 0.6, fontFamily: "monospace", marginTop: 2 }}>
                {meta.number}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // form_contact: زر يفتح modal داخلي
  if (el.type === "form_contact") {
    return (
      <button
        onClick={() => onContactFormOpen(link)}
        style={{
          ...elementCardStyle(el, cardTextColor, meta),
          width: "100%",
          cursor: "pointer",
          textAlign: "right",
          border: meta.bg_color ? "none" : undefined,
        }}
      >
        <ElementCardInner
          el={el}
          link={link}
          meta={meta}
          cardTextColor={meta.text_color || cardTextColor}
        />
      </button>
    );
  }

  // باقي العناصر: link خارجي
  const url = buildElementUrl(link.element_type, meta);
  if (!url || url === "#contact-form") return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...elementCardStyle(el, cardTextColor, meta), textDecoration: "none" }}
    >
      <ElementCardInner
        el={el}
        link={link}
        meta={meta}
        cardTextColor={meta.text_color || cardTextColor}
      />
    </a>
  );
}

function ElementCardInner({ el, link, meta, cardTextColor }: any) {
  // Brand icon رسمي أولاً، fallback لـ lucide
  const BrandIcon = getBrandIcon(link.element_type);
  const Icon = BrandIcon || el.icon;
  const brandBg = getBrandBg(link.element_type) || el.brandBg || "transparent";
  const brandFg = getBrandFg(link.element_type) || el.brandFg || cardTextColor;
  const label = buildElementLabel(link.element_type, meta) || link.label;
  const subtitle = meta.subtitle || link.subtitle;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: brandBg,
            color: brandFg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <ExternalLink size={13} style={{ opacity: 0.5 }} />
    </>
  );
}

function elementCardStyle(
  el: ProfileElement,
  fallbackText: string,
  meta?: Record<string, any>
): React.CSSProperties {
  // أولوية: meta المخصّص للعنصر (من الـ editor) > brand colors > افتراضي
  const customBg = meta?.bg_color;
  const customText = meta?.text_color;
  const useBrand = el.brandBg && el.brandBg !== "transparent";
  const finalBg = customBg || (useBrand ? el.brandBg : "transparent");
  const finalText = customText || (useBrand ? el.brandFg : fallbackText);
  const hasBg = !!customBg || useBrand;
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderRadius: 14,
    background: finalBg,
    color: finalText,
    border: hasBg ? "none" : `1px solid ${fallbackText}20`,
    fontSize: 14,
  };
}

function iconBtnStyle(textColor: string): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: `${textColor || "#1A1206"}10`,
    border: `1px solid ${textColor || "#1A1206"}20`,
    color: textColor || "#1A1206",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}

// ════════ MODALS ════════

function ShareModal({
  url,
  name,
  avatarUrl,
  cardAccent,
  cardBg,
  onClose,
  bgColor,
  textColor,
}: any) {
  const [copied, setCopied] = useState(false);
  const shareTo = (platform: string) => {
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent(`بطاقة ${name}`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      snapchat: `https://www.snapchat.com/scan?attachmentUrl=${encoded}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "width=600,height=600");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal onClose={onClose} bgColor={bgColor} textColor={textColor} title={`شارك رابط ${name}`}>
      <div style={{ textAlign: "center", padding: "0 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" style={{ width: 70, height: 70, borderRadius: "50%" }} />
          ) : (
            <InitialsAvatar name={name} bg={cardAccent} color={cardBg} size={70} />
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>{name}</div>
        <div
          style={{
            background: `${textColor || "#1A1206"}08`,
            border: `1px solid ${textColor || "#1A1206"}15`,
            borderRadius: 100,
            padding: "10px 16px",
            fontSize: 12,
            marginBottom: 18,
            direction: "ltr",
          }}
        >
          {url}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          <ShareBtn
            label="نسخ"
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
            bg={copied ? "#25D366" : "#888"}
            onClick={copyLink}
          />
          <ShareBtn
            label="واتساب"
            icon={<MessageCircle size={16} />}
            bg="#25D366"
            onClick={() => shareTo("whatsapp")}
          />
          <ShareBtn
            label="سناب"
            icon={<Camera size={16} />}
            bg="#FFFC00"
            color="#000"
            onClick={() => shareTo("snapchat")}
          />
          <ShareBtn
            label="اكس"
            icon={<Twitter size={16} />}
            bg="#000"
            onClick={() => shareTo("x")}
          />
          <ShareBtn
            label="لنكدإن"
            icon={<Linkedin size={16} />}
            bg="#0A66C2"
            onClick={() => shareTo("linkedin")}
          />
          <ShareBtn
            label="فيسبوك"
            icon={<Facebook size={16} />}
            bg="#1877F2"
            onClick={() => shareTo("facebook")}
          />
          <ShareBtn
            label="مشاركة"
            icon={<Share2 size={16} />}
            bg="#888"
            onClick={async () => {
              if (navigator.share) await navigator.share({ url, title: name }).catch(() => {});
              else copyLink();
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

function QRModal({ url, name, avatarUrl, cardAccent, cardBg, onClose, bgColor, textColor }: any) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(url, { width: 400, margin: 1, errorCorrectionLevel: "H" })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [url]);
  function downloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${name}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return (
    <Modal onClose={onClose} bgColor={bgColor} textColor={textColor} title="شارك رمز QR للبروفايل">
      <div style={{ textAlign: "center", padding: "0 8px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" style={{ width: 70, height: 70, borderRadius: "50%" }} />
          ) : (
            <InitialsAvatar name={name} bg={cardAccent} color={cardBg} size={70} />
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>{name}</div>
        <div
          style={{
            background: "#FFFFFF",
            padding: 14,
            borderRadius: 16,
            display: "inline-block",
            marginBottom: 18,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR Code"
              width={200}
              height={200}
              style={{ display: "block" }}
            />
          ) : (
            <div
              style={{
                width: 200,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
              }}
            >
              جارٍ التوليد...
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <button
            onClick={() => navigator.share?.({ url, title: name }).catch(() => {})}
            style={iconBtnStyle(textColor)}
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={downloadQR}
            style={{ ...iconBtnStyle(textColor), border: "none", cursor: "pointer" }}
          >
            <Download size={16} />
          </button>
        </div>
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "center",
            gap: 16,
            fontSize: 11,
            opacity: 0.65,
          }}
        >
          <span>شارك</span>
          <span>حفظ QR</span>
        </div>
      </div>
    </Modal>
  );
}

function ContactFormModal({ link, slug, onClose, bgColor, textColor, accent }: any) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const meta = link.metadata || {};
  const askPhone = meta.ask_phone === true || meta.ask_phone === "true";
  const askEmail = meta.ask_email === true || meta.ask_email === "true";
  const askMessage = meta.ask_message !== false; // default true

  async function submit() {
    if (!name.trim()) return;
    try {
      await fetch("/api/profile-card/contact-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, link_id: link.id, name, phone, email, message }),
      });
      setSent(true);
    } catch {}
  }

  if (sent) {
    return (
      <Modal onClose={onClose} bgColor={bgColor} textColor={textColor} title="تم الإرسال">
        <div style={{ textAlign: "center", padding: "20px 8px" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>تم استلام رسالتك</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
            سيتواصل معك صاحب البطاقة قريباً
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      bgColor={bgColor}
      textColor={textColor}
      title={meta.title || link.label}
    >
      <div style={{ padding: "0 8px" }}>
        {meta.description && (
          <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 14 }}>{meta.description}</p>
        )}
        <FormField label="الاسم *" value={name} onChange={setName} />
        {askPhone && (
          <FormField label="الجوال" value={phone} onChange={setPhone} type="tel" dir="ltr" />
        )}
        {askEmail && (
          <FormField
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            type="email"
            dir="ltr"
          />
        )}
        {askMessage && (
          <FormField label="الرسالة" value={message} onChange={setMessage} multiline />
        )}
        <button
          onClick={submit}
          disabled={!name.trim()}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 100,
            background: accent,
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: name.trim() ? "pointer" : "not-allowed",
            opacity: name.trim() ? 1 : 0.5,
            marginTop: 12,
          }}
        >
          إرسال
        </button>
      </div>
    </Modal>
  );
}

function FormField({ label, value, onChange, type = "text", multiline, dir }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, opacity: 0.75, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          dir={dir}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 13,
            fontFamily: "inherit",
            color: "inherit",
            resize: "vertical",
          }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.04)",
            border: "1px solid rgba(0,0,0,0.1)",
            fontSize: 13,
            fontFamily: "inherit",
            color: "inherit",
          }}
        />
      )}
    </div>
  );
}

function Modal({ children, onClose, bgColor, textColor, title }: any) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: bgColor || "#FAF7F2",
          color: textColor || "#1A1206",
          borderRadius: "20px 20px 0 0",
          padding: "20px 18px 28px",
          animation: "slideUp 0.25s ease",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <button onClick={onClose} style={iconBtnStyle(textColor || "#1A1206")} aria-label="إغلاق">
            <X size={16} />
          </button>
          <div style={{ fontSize: 13, opacity: 0.75 }}>{title}</div>
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

function ShareBtn({ label, icon, bg, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: 10,
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: bg,
          color: color || "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}
