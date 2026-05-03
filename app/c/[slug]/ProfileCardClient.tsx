"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  MessageCircle, Mail, Phone, Share2, QrCode, X, Facebook, Linkedin,
  Twitter, Music2, Camera, Youtube, Hash, ExternalLink, Clock, Shield,
  Award, Copy, Download, Check
} from "lucide-react";

// أفاتار من الأحرف الأولى — لا يحتاج external service
function InitialsAvatar({ name, bg, color, size = 96 }: { name: string; bg: string; color: string; size?: number }) {
  const initial = (name || "؟").trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, fontWeight: 800, fontFamily: "var(--font-cairo), sans-serif",
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

const SOCIAL_CONFIGS: Record<string, { icon: any; bg: string; text: string; gradient?: string }> = {
  x:         { icon: Twitter,   bg: "#000000", text: "#FFFFFF" },
  twitter:   { icon: Twitter,   bg: "#000000", text: "#FFFFFF" },
  instagram: { icon: Camera,    bg: "linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)", text: "#FFFFFF" },
  tiktok:    { icon: Music2,    bg: "#000000", text: "#FFFFFF" },
  snapchat:  { icon: Camera,    bg: "#FFFC00", text: "#000000" },
  linkedin:  { icon: Linkedin,  bg: "#0A66C2", text: "#FFFFFF" },
  youtube:   { icon: Youtube,   bg: "#FF0000", text: "#FFFFFF" },
  threads:   { icon: Hash,      bg: "#000000", text: "#FFFFFF" },
  facebook:  { icon: Facebook,  bg: "#1877F2", text: "#FFFFFF" },
  whatsapp:  { icon: MessageCircle, bg: "#25D366", text: "#FFFFFF" },
};

const SOCIAL_LABELS: Record<string, string> = {
  x: "اكس", twitter: "تويتر", instagram: "إنستجرام", tiktok: "تيك توك",
  snapchat: "سناب شات", linkedin: "لينكد إن", youtube: "يوتيوب",
  threads: "ثريدز", facebook: "فيسبوك", whatsapp: "واتساب",
};

export default function ProfileCardClient({ card, links, identity, slug }: any) {
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const displayName = card.display_name || identity?.broker_name || slug;
  const bio = card.bio || identity?.specialization || "وسيط عقاري";
  const avatarUrl = card.avatar_url || identity?.photo_url || null;

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/c/${slug}`
    : `https://elyas-realestate.vercel.app/c/${slug}`;

  // الروابط الاجتماعية من broker_identity
  const socialLinks = card.show_social ? Object.entries(SOCIAL_LABELS).map(([key, label]) => {
    const url = identity?.[`social_${key}`];
    if (!url) return null;
    return { key, label, url };
  }).filter(Boolean) as Array<{ key: string; label: string; url: string }> : [];

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: card.bg_color || "#FAF7F2",
      color: card.text_color || "#1A1206",
      fontFamily: "var(--font-tajawal), 'Tajawal', sans-serif",
      padding: "20px 16px 40px",
    }}>
      {/* Top action buttons */}
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        {card.show_share_button && (
          <button onClick={() => setShareOpen(true)} aria-label="مشاركة"
            style={iconBtnStyle(card.text_color)}>
            <Share2 size={18} />
          </button>
        )}
        {card.show_qr_button && (
          <button onClick={() => setQrOpen(true)} aria-label="QR"
            style={iconBtnStyle(card.text_color)}>
            <QrCode size={18} />
          </button>
        )}
      </div>

      {/* Card body */}
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Avatar + Name + Bio */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            margin: "0 auto 16px", display: "flex", justifyContent: "center",
            filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.08))",
          }}>
            {avatarUrl ? (
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                overflow: "hidden",
                border: `3px solid ${card.accent_color || "#C6914C"}`,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <InitialsAvatar
                name={displayName}
                bg={card.accent_color || "#C6914C"}
                color={card.bg_color || "#FAF7F2"}
                size={96}
              />
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
            {displayName}
          </h1>
          <p style={{ fontSize: 13, opacity: 0.75 }}>{bio}</p>
        </div>

        {/* Direct Contact */}
        {card.show_direct_contact && (
          <Section title="التواصل المباشر" emoji="🔥">
            {identity?.social_whatsapp && (
              <ContactCard
                href={identity.social_whatsapp}
                label="تواصل على واتساب"
                icon={<MessageCircle size={20} />}
                bg="#25D366"
                color="#FFFFFF"
              />
            )}
            {identity?.email && (
              <ContactCard
                href={`mailto:${identity.email}`}
                label="بريدي الإلكتروني"
                icon={<Mail size={20} />}
                bg="transparent"
                color={card.text_color || "#1A1206"}
                border={`1px solid ${card.text_color || "#1A1206"}20`}
              />
            )}
            {identity?.phone && !identity?.social_whatsapp && (
              <ContactCard
                href={`tel:${identity.phone}`}
                label="اتصال هاتفي"
                icon={<Phone size={20} />}
                bg="transparent"
                color={card.text_color || "#1A1206"}
                border={`1px solid ${card.text_color || "#1A1206"}20`}
              />
            )}
          </Section>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <Section title="التواصل الاجتماعي" emoji="💫">
            {socialLinks.map(s => {
              const cfg = SOCIAL_CONFIGS[s.key] || SOCIAL_CONFIGS.x;
              const Icon = cfg.icon;
              return (
                <ContactCard
                  key={s.key}
                  href={s.url}
                  label={s.label}
                  icon={<Icon size={18} />}
                  bg={cfg.bg}
                  color={cfg.text}
                  external
                />
              );
            })}
          </Section>
        )}

        {/* Custom Links from profile_links table */}
        {links.filter((l: any) => l.link_type === "custom").length > 0 && (
          <Section title="روابط مهمة" emoji="🔗">
            {links.filter((l: any) => l.link_type === "custom").map((link: any) => (
              <ContactCard
                key={link.id}
                href={link.value}
                label={link.label}
                icon={<ExternalLink size={18} />}
                bg={link.bg_color || "transparent"}
                color={link.text_color || (card.text_color || "#1A1206")}
                border={!link.bg_color ? `1px solid ${card.text_color || "#1A1206"}20` : undefined}
                external
              />
            ))}
          </Section>
        )}

        {/* Licenses */}
        {card.show_licenses && (identity?.fal_license || identity?.cr_number || identity?.vat_number) && (
          <Section title="الرخص والاعتمادات" emoji="🏆">
            {identity?.fal_license && (
              <LicenseCard icon="◇" label="رخصة فال" value={identity.fal_license} color={card.accent_color} />
            )}
            {identity?.cr_number && (
              <LicenseCard icon="📋" label="السجل التجاري" value={identity.cr_number} color={card.accent_color} />
            )}
            {identity?.vat_number && (
              <LicenseCard icon="💼" label="الرقم الضريبي" value={identity.vat_number} color={card.accent_color} />
            )}
          </Section>
        )}

        {/* Hours */}
        {card.show_hours && (identity?.business_hours_weekday || identity?.business_hours_weekend) && (
          <Section title="أوقات العمل" emoji="🕐">
            <div style={{
              background: `${card.accent_color || "#C6914C"}10`,
              border: `1px solid ${card.accent_color || "#C6914C"}30`,
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 13,
              lineHeight: 2,
            }}>
              {identity?.business_hours_weekday && (
                <div><Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} /> {identity.business_hours_weekday}</div>
              )}
              {identity?.business_hours_weekend && (
                <div><Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: 6 }} /> {identity.business_hours_weekend}</div>
              )}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, opacity: 0.5, fontSize: 11 }}>
          <div>© ٢٠٢٦ {displayName} — جميع الحقوق محفوظة</div>
          <div style={{ marginTop: 6 }}>
            <Link href={`/${slug}`} style={{ color: card.accent_color || "#C6914C", textDecoration: "none" }}>
              زيارة الموقع الكامل ←
            </Link>
          </div>
        </div>

        {/* Powered by CTA */}
        {card.show_powered_by && (
          <div style={{
            marginTop: 28,
            background: card.text_color || "#1A1206",
            color: card.bg_color || "#FAF7F2",
            borderRadius: 18,
            padding: "20px 18px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              كل ما يُمثّلك في <span style={{ color: card.accent_color || "#C6914C" }}>رابط واحد</span>
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 14 }}>أنشئ بطاقتك الاحترافية الآن</div>
            <Link href="/" style={{
              display: "inline-block",
              padding: "10px 28px",
              borderRadius: 100,
              background: card.accent_color || "#C6914C",
              color: card.text_color || "#1A1206",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}>
              ابدأ مجاناً
            </Link>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareOpen && <ShareModal url={profileUrl} name={displayName} avatarUrl={avatarUrl} cardAccent={card.accent_color || "#C6914C"} cardBg={card.bg_color || "#FAF7F2"} onClose={() => setShareOpen(false)} bgColor={card.bg_color} textColor={card.text_color} />}

      {/* QR Modal */}
      {qrOpen && <QRModal url={profileUrl} name={displayName} avatarUrl={avatarUrl} cardAccent={card.accent_color || "#C6914C"} cardBg={card.bg_color || "#FAF7F2"} onClose={() => setQrOpen(false)} bgColor={card.bg_color} textColor={card.text_color} />}
    </div>
  );
}

// ════════ Components ════════

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.65, marginBottom: 10, paddingRight: 4 }}>
        {emoji} {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function ContactCard({ href, label, icon, bg, color, border, external }: any) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderRadius: 14,
        background: bg, color: color, border: border || "none",
        textDecoration: "none", fontSize: 14, fontWeight: 600,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {icon}
        <span>{label}</span>
      </div>
      <ExternalLink size={14} style={{ opacity: 0.6 }} />
    </a>
  );
}

function LicenseCard({ icon, label, value, color }: any) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderRadius: 12,
      background: `${color}08`, border: `1px solid ${color}25`,
      fontSize: 13,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18, color }}>{icon}</span>
        <span style={{ fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontFamily: "monospace", opacity: 0.7, fontSize: 12 }}>{value}</span>
    </div>
  );
}

function iconBtnStyle(textColor: string): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: "50%",
    background: `${textColor || "#1A1206"}10`,
    border: `1px solid ${textColor || "#1A1206"}20`,
    color: textColor || "#1A1206",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  };
}

// ════════ Modals ════════

function ShareModal({ url, name, avatarUrl, cardAccent, cardBg, onClose, bgColor, textColor }: any) {
  const [copied, setCopied] = useState(false);

  const shareTo = (platform: string) => {
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent(`بطاقة ${name}`);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${encoded}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      x:        `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
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
            <img src={avatarUrl} alt="" style={{ width: 70, height: 70, borderRadius: "50%", display: "block" }} />
          ) : (
            <InitialsAvatar name={name} bg={cardAccent} color={cardBg} size={70} />
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>{name}</div>

        <div style={{
          background: `${textColor || "#1A1206"}08`,
          border: `1px solid ${textColor || "#1A1206"}15`,
          borderRadius: 100, padding: "10px 16px",
          fontSize: 12, marginBottom: 18, direction: "ltr", color: textColor,
        }}>
          {url}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          <ShareBtn label="نسخ"   icon={copied ? <Check size={16}/> : <Copy size={16}/>} bg={copied ? "#25D366" : "#888"} onClick={copyLink} />
          <ShareBtn label="واتساب" icon={<MessageCircle size={16}/>} bg="#25D366" onClick={() => shareTo("whatsapp")} />
          <ShareBtn label="سناب"  icon={<Camera size={16}/>}  bg="#FFFC00" color="#000" onClick={() => shareTo("snapchat")} />
          <ShareBtn label="اكس"   icon={<Twitter size={16}/>} bg="#000" onClick={() => shareTo("x")} />
          <ShareBtn label="لنكدإن" icon={<Linkedin size={16}/>} bg="#0A66C2" onClick={() => shareTo("linkedin")} />
          <ShareBtn label="فيسبوك" icon={<Facebook size={16}/>} bg="#1877F2" onClick={() => shareTo("facebook")} />
          <ShareBtn label="مشاركة" icon={<Share2 size={16}/>} bg="#888" onClick={async () => {
            if (navigator.share) await navigator.share({ url, title: name });
            else copyLink();
          }} />
        </div>
      </div>
    </Modal>
  );
}

function QRModal({ url, name, avatarUrl, cardAccent, cardBg, onClose, bgColor, textColor }: any) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    // QR محلي بدون أي خدمة خارجية
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
            <img src={avatarUrl} alt="" style={{ width: 70, height: 70, borderRadius: "50%", display: "block" }} />
          ) : (
            <InitialsAvatar name={name} bg={cardAccent} color={cardBg} size={70} />
          )}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>{name}</div>

        <div style={{
          background: "#FFFFFF", padding: 14, borderRadius: 16,
          display: "inline-block", marginBottom: 18,
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}>
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Code" width={200} height={200} style={{ display: "block" }} />
          ) : (
            <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
              جارٍ التوليد...
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <button onClick={() => navigator.share?.({ url, title: name }).catch(() => {})} style={iconBtnStyle(textColor)}>
            <Share2 size={16} />
          </button>
          <button onClick={downloadQR} style={{ ...iconBtnStyle(textColor), border: "none", cursor: "pointer" }}>
            <Download size={16} />
          </button>
        </div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 16, fontSize: 11, opacity: 0.65 }}>
          <span>شارك</span>
          <span>حفظ QR</span>
        </div>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, bgColor, textColor, title }: any) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "flex-end",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: bgColor || "#FAF7F2", color: textColor || "#1A1206",
        borderRadius: "20px 20px 0 0",
        padding: "20px 18px 28px",
        animation: "slideUp 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
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
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      background: "transparent", border: "none", cursor: "pointer",
      fontSize: 10, color: "inherit",
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        background: bg, color: color || "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <span>{label}</span>
    </button>
  );
}
