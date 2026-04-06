import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getSettings() {
  const { data } = await supabase.from("site_settings").select("*").limit(1).single();
  return data;
}

async function getProperties() {
  const { data } = await supabase.from("properties").select("id, title, district, city, price, offer_type, sub_category, land_area, rooms, images").order("created_at", { ascending: false }).limit(3);
  return data || [];
}

export const revalidate = 60;

export default async function Home() {
  const s = await getSettings();
  const properties = await getProperties();

  const site_name = s?.site_name || "إلياس الدخيل";
  const hero_title = s?.hero_title || "نختصر عليك الطريق العقاري";
  const hero_subtitle = s?.hero_subtitle || "من البحث إلى التملّك، خبرة عملية في سوق الرياض";
  const hero_badge = s?.hero_badge || "وسيط عقاري مرخّص — الرياض";
  const hero_image = s?.hero_image || "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=1920&q=80";
  const phone = s?.phone || "";
  const whatsapp = s?.whatsapp || "";
  const email = s?.email || "";
  const social_x = s?.social_x || "";
  const social_instagram = s?.social_instagram || "";
  const social_tiktok = s?.social_tiktok || "";
  const social_snapchat = s?.social_snapchat || "";
  const social_linkedin = s?.social_linkedin || "";
  const social_youtube = s?.social_youtube || "";
  const social_threads = s?.social_threads || "";
  const social_facebook = s?.social_facebook || "";
  const social_whatsapp_link = s?.social_whatsapp || "";
  const fal_license = s?.fal_license || "";
  const coverage_text = s?.coverage_text || "شمال وشرق الرياض";
  const services = s?.services || [];
  const why_cards = s?.why_cards || [];
  const cta_title = s?.cta_title || "عندك عقار أو تبحث عن واحد؟";
  const cta_subtitle = s?.cta_subtitle || "تواصل معي مباشرة وخلنا نختصر عليك الطريق.";
  const footer_text = s?.footer_text || "وسيط ومسوق عقاري مرخّص.";
  const navbar_links = s?.navbar_links || [];
  const show_properties = s?.show_properties_section !== false;
  const show_services = s?.show_services_section !== false;
  const show_why = s?.show_why_section !== false;
  const show_cta = s?.show_cta_section !== false;
  const login_text = s?.login_link_text || "دخول الفريق";
  const site_logo = s?.site_logo || "";

  // ═══ Visual Editor — dynamic values ═══
  const clrAccent      = s?.color_accent        || "#C9A84C";
  const clrAccentDark  = s?.color_accent_dark   || "#A68A3A";
  const clrBgPrimary   = s?.color_bg_primary    || "#0A0A0C";
  const clrBgSecondary = s?.color_bg_secondary  || "#111114";
  const clrBgCard      = s?.color_bg_card       || "#16161A";
  const clrTextPrimary = s?.color_text_primary  || "#F5F5F5";
  const clrTextSec     = s?.color_text_secondary|| "#9A9AA0";
  const clrTextMuted   = s?.color_text_muted    || "#5A5A62";
  const fntHero        = s?.font_size_hero       || "clamp(2.4rem, 5.5vw, 4.2rem)";
  const fntSection     = s?.font_size_section_title || "clamp(1.8rem, 3.5vw, 2.6rem)";
  const fntBody        = s?.font_size_body       || "15px";
  const fntSmall       = s?.font_size_small      || "13px";

  return (
    <div dir="rtl" style={{ background: clrBgPrimary, color: clrTextPrimary, minHeight: "100vh", fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        :root {
          --accent: ${clrAccent};
          --accent-dark: ${clrAccentDark};
          --bg-primary: ${clrBgPrimary};
          --bg-secondary: ${clrBgSecondary};
          --bg-card: ${clrBgCard};
          --text-primary: ${clrTextPrimary};
          --text-sec: ${clrTextSec};
          --text-muted: ${clrTextMuted};
        }
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent { color: var(--accent); }
        .accent-bg { background: linear-gradient(135deg, var(--accent), var(--accent-dark)); }
        .card { background: var(--bg-card); border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 16px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .card:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .dot-pattern { background-image: radial-gradient(color-mix(in srgb, var(--accent) 3%, transparent) 1px, transparent 1px); background-size: 40px 40px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.8s ease-out both; }
        .fade-d1 { animation-delay: 0.15s; }
        .fade-d2 { animation-delay: 0.3s; }
        .fade-d3 { animation-delay: 0.45s; }
        @keyframes heroZoom { 0% { transform: scale(1.05); } 100% { transform: scale(1.12); } }
        .social-icon { color: var(--text-muted); }
        .social-icon:hover { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 35%, transparent) !important; background: color-mix(in srgb, var(--accent) 5%, transparent); }
      `}</style>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 right-0 left-0 z-50" style={{ height:72, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(22,22,26,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)' }}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          {site_logo ? (
            <img src={site_logo} alt={site_name} style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }} />
          ) : (
            <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width:44, height:44, borderRadius:12, fontSize:20, color: clrBgPrimary }}>إ</div>
          )}
          <div className="flex flex-col" style={{ lineHeight:1.2 }}>
            <span className="font-kufi font-extrabold" style={{ fontSize:17, color: clrTextPrimary }}>{site_name}</span>
            <span className="accent" style={{ fontSize:11, fontWeight:500 }}>{hero_badge}</span>
          </div>
        </Link>
        <div className="flex items-center gap-8">
          {(navbar_links as any[]).map((link: any, i: number) => (
            link.type === "cta" ? (
              <a key={i} href={link.href} className="accent-bg text-[#0A0A0C] no-underline font-bold text-sm" style={{ padding:'10px 24px', borderRadius:10 }}>{link.label}</a>
            ) : link.type === "anchor" ? (
              <a key={i} href={link.href} className="text-[#9A9AA0] hover:text-white no-underline text-sm font-medium" style={{ transition:'color 0.3s' }}>{link.label}</a>
            ) : (
              <Link key={i} href={link.href} className="text-[#9A9AA0] hover:text-white no-underline text-sm font-medium" style={{ transition:'color 0.3s' }}>{link.label}</Link>
            )
          ))}
          <Link href="/login" className="text-[#5A5A62] hover:text-[#9A9AA0] no-underline text-xs" style={{ transition:'color 0.3s', borderRight:'1px solid rgba(201,168,76,0.12)', paddingRight:16, marginRight:-8 }}>{login_text}</Link>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative flex items-center justify-center" style={{ minHeight:'100vh', overflow:'hidden' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,10,12,0.3) 0%, rgba(10,10,12,0.1) 40%, rgba(10,10,12,0.85) 85%, rgba(10,10,12,1) 100%), url(' + hero_image + ') center/cover no-repeat', transform:'scale(1.05)', animation:'heroZoom 20s ease-in-out infinite alternate' }}></div>
        <div className="dot-pattern absolute inset-0"></div>
        <div className="relative z-10 text-center fade-up" style={{ maxWidth:860, padding:'0 24px' }}>
          <div className="fade-up inline-flex items-center gap-2 accent text-[13px] font-medium" style={{ background:'color-mix(in srgb, var(--accent) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius:100, padding:'8px 20px', marginBottom:32 }}>
            <span style={{ width:6, height:6, background:'var(--accent)', borderRadius:'50%', display:'inline-block' }}></span>
            {hero_badge}
          </div>
          <h1 className="font-kufi font-black fade-up fade-d1" style={{ fontSize: fntHero, lineHeight:1.25, marginBottom:20, color: clrTextPrimary }}>
            {hero_title.includes('الطريق') ? (
              <>{hero_title.split('الطريق')[0]}<span style={{ background:`linear-gradient(135deg, ${clrAccent}CC, ${clrAccent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>الطريق العقاري</span></>
            ) : (
              <span style={{ background:`linear-gradient(135deg, ${clrAccent}CC, ${clrAccent})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{hero_title}</span>
            )}
          </h1>
          <p className="fade-up fade-d2" style={{ fontSize: fntBody, color: clrTextSec, lineHeight:1.8, maxWidth:600, margin:'0 auto 40px' }}>{hero_subtitle}</p>
          <div className="fade-up fade-d3 card flex items-center gap-2" style={{ maxWidth:720, margin:'0 auto', padding:8 }}>
            <div className="flex-1 flex flex-col" style={{ padding:'8px 16px', borderLeft:'1px solid rgba(201,168,76,0.12)' }}>
              <span style={{ fontSize:11, color:'#5A5A62', fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>نوع العقار</span>
              <span style={{ fontSize:14, color:'#F5F5F5', fontWeight:500 }}>شقة، فيلا، أرض</span>
            </div>
            <div className="flex-1 flex flex-col" style={{ padding:'8px 16px', borderLeft:'1px solid rgba(201,168,76,0.12)' }}>
              <span style={{ fontSize:11, color:'#5A5A62', fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>المنطقة</span>
              <span style={{ fontSize:14, color:'#F5F5F5', fontWeight:500 }}>{coverage_text}</span>
            </div>
            <div className="flex-1 flex flex-col" style={{ padding:'8px 16px' }}>
              <span style={{ fontSize:11, color:'#5A5A62', fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>العملية</span>
              <span style={{ fontSize:14, color:'#F5F5F5', fontWeight:500 }}>بيع، إيجار</span>
            </div>
            <Link href="/properties" className="accent-bg no-underline text-[#0A0A0C] font-bold text-[15px] flex items-center gap-2" style={{ padding:'14px 28px', borderRadius:10, whiteSpace:'nowrap' }}>🔍 بحث</Link>
          </div>
        </div>
      </section>

      {/* ═══════ WHY ═══════ */}
      {show_why && (why_cards as any[]).length > 0 && (
        <section id="why" style={{ padding:'100px 48px', background: clrBgSecondary }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span>القيمة المضافة<span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize: fntSection, lineHeight:1.3, marginBottom:16, color: clrTextPrimary }}>لماذا تختار {site_name.split(' ')[0]}؟</h2>
            <p style={{ fontSize: fntBody, color: clrTextSec, maxWidth:560, margin:'0 auto', lineHeight:1.8 }}>لأن الفرق الحقيقي مو بالإعلان — بل بالفهم، والتنظيم، والمتابعة</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:24, maxWidth:1200, margin:'0 auto' }}>
            {(why_cards as any[]).map((card: any, i: number) => (
              <div key={i} className="card" style={{ padding:'40px 32px' }}>
                <div style={{ width:56, height:56, background:'color-mix(in srgb, var(--accent) 8%, transparent)', border:'1px solid color-mix(in srgb, var(--accent) 15%, transparent)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:24 }}>{card.icon}</div>
                <h3 className="font-kufi" style={{ fontSize:18, fontWeight:700, marginBottom:12, color: clrTextPrimary }}>{card.title}</h3>
                <p style={{ fontSize: fntBody, color: clrTextSec, lineHeight:1.8 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ PROPERTIES ═══════ */}
      {show_properties && properties.length > 0 && (
        <section style={{ padding:'100px 48px', background: clrBgPrimary }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span>عقارات مختارة<span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize: fntSection, lineHeight:1.3, color: clrTextPrimary }}>لا نعرض كل شي — فقط اللي يستاهل</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:24, maxWidth:1200, margin:'0 auto' }}>
            {properties.map((p: any) => (
              <Link href={"/properties/" + p.id} key={p.id} className="card no-underline" style={{ overflow:'hidden', cursor:'pointer', color: clrTextPrimary }}>
                <div style={{ height:220, overflow:'hidden', position:'relative', background:'#1C1C22' }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div className="flex items-center justify-center h-full text-4xl" style={{ color: clrTextMuted }}>🏠</div>}
                  <span className="accent-bg" style={{ position:'absolute', top:16, right:16, color: clrBgPrimary, fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:8 }}>{p.offer_type || 'للبيع'}</span>
                </div>
                <div style={{ padding:24 }}>
                  <h3 className="font-kufi" style={{ fontSize:17, fontWeight:700, marginBottom:8, color: clrTextPrimary }}>{p.title}</h3>
                  <p style={{ fontSize:13.5, color: clrTextSec, marginBottom:18 }}>📍 {p.district}، {p.city}</p>
                  <div style={{ display:'flex', gap:16, paddingTop:16, borderTop:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)', marginBottom:18 }}>
                    {p.rooms && <span style={{ fontSize:13, color: clrTextMuted }}>🛏 {p.rooms} غرف</span>}
                    {p.land_area && <span style={{ fontSize:13, color: clrTextMuted }}>📐 {p.land_area} م²</span>}
                  </div>
                  {p.price && <div className="font-kufi accent" style={{ fontSize:20, fontWeight:800 }}>{Number(p.price).toLocaleString()} <span style={{ fontSize:13, color: clrTextMuted, fontWeight:500 }}>ريال</span></div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center" style={{ marginTop:40 }}>
            <Link href="/properties" className="no-underline" style={{ border:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)', color: clrTextSec, padding:'14px 36px', borderRadius:12, fontSize:15, fontWeight:600, display:'inline-block', transition:'all 0.3s' }}>عرض جميع العقارات</Link>
          </div>
        </section>
      )}

      {/* ═══════ SERVICES ═══════ */}
      {show_services && (services as any[]).length > 0 && (
        <section id="services" style={{ padding:'100px 48px', background: clrBgSecondary }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span>خدماتنا<span style={{ width:32, height:1, background:'var(--accent)', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize: fntSection, lineHeight:1.3, color: clrTextPrimary }}>خدمات عقارية متكاملة</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20, maxWidth:1200, margin:'0 auto' }}>
            {(services as any[]).map((svc: any, i: number) => (
              <div key={i} className="card text-center" style={{ padding:'36px 28px' }}>
                <div style={{ width:64, height:64, margin:'0 auto 20px', background:'color-mix(in srgb, var(--accent) 6%, transparent)', border:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{svc.icon}</div>
                <h3 className="font-kufi" style={{ fontSize:16, fontWeight:700, marginBottom:10, color: clrTextPrimary }}>{svc.title}</h3>
                <p style={{ fontSize: fntSmall, color: clrTextSec, lineHeight:1.7 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ CTA ═══════ */}
      {show_cta && (
        <section id="contact" style={{ padding:'100px 48px', textAlign:'center', position:'relative', overflow:'hidden', background: clrBgPrimary }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at center, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)`, pointerEvents:'none' }}></div>
          <div className="card relative" style={{ maxWidth:720, margin:'0 auto', padding:'64px 48px', borderRadius:24 }}>
            <h2 className="font-kufi font-extrabold" style={{ fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:16, color: clrTextPrimary }}>{cta_title}</h2>
            <p style={{ color: clrTextSec, fontSize: fntBody, lineHeight:1.8, marginBottom:36 }}>{cta_subtitle}</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {whatsapp && (
                <a href={"https://wa.me/" + whatsapp} target="_blank" rel="noopener noreferrer" className="accent-bg no-underline text-[#0A0A0C] font-bold flex items-center gap-2" style={{ padding:'14px 36px', borderRadius:12, fontSize:15 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  واتساب
                </a>
              )}
              {phone && (
                <a href={"tel:" + phone} className="no-underline text-white font-semibold flex items-center gap-2" style={{ padding:'14px 36px', borderRadius:12, fontSize:15, border:'1px solid rgba(201,168,76,0.12)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                  اتصل الآن
                </a>
              )}
              {!whatsapp && !phone && (
                <a href="#" className="accent-bg no-underline text-[#0A0A0C] font-bold flex items-center gap-2" style={{ padding:'14px 36px', borderRadius:12, fontSize:15 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  تواصل معي
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ background: clrBgSecondary, borderTop:'1px solid color-mix(in srgb, var(--accent) 12%, transparent)', padding:'64px 48px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', gap:48, maxWidth:1200, margin:'0 auto 48px' }}>
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom:8 }}>
              {site_logo ? (
                <img src={site_logo} alt={site_name} style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }} />
              ) : (
                <div className="accent-bg flex items-center justify-center font-kufi font-black" style={{ width:44, height:44, borderRadius:12, fontSize:20, color: clrBgPrimary }}>إ</div>
              )}
              <div className="flex flex-col" style={{ lineHeight:1.2 }}>
                <span className="font-kufi font-extrabold" style={{ fontSize:17, color: clrTextPrimary }}>{site_name}</span>
                <span className="accent" style={{ fontSize:11, fontWeight:500 }}>{hero_badge}</span>
              </div>
            </div>
            <p style={{ fontSize:14, color: clrTextSec, lineHeight:1.8, marginTop:16, maxWidth:300 }}>{footer_text}</p>
            <div className="flex flex-wrap gap-2" style={{ marginTop:20 }}>
              {social_x && (
                <a href={social_x} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              )}
              {social_instagram && (
                <a href={social_instagram} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}
              {social_tiktok && (
                <a href={social_tiktok} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.83 1.56V6.79a4.85 4.85 0 01-1.06-.1z"/></svg>
                </a>
              )}
              {social_snapchat && (
                <a href={social_snapchat} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.065.047c.105 0 .211.002.315.006C13.91.116 15.34.65 16.42 1.647c1.08.997 1.71 2.37 1.78 3.84.02.377.025 1.31.025 2.59 0 .297 0 .61-.002.944.18.08.373.12.568.12.24 0 .48-.05.7-.15.16-.07.33-.11.5-.11.17 0 .34.04.49.12.31.16.5.48.5.83 0 .41-.27.77-.68.9-.26.08-.54.14-.84.17-.14.02-.28.05-.42.08-.3.07-.56.26-.71.52-.12.21-.12.44-.01.68.13.3.5 1.23.5 2.32 0 .19-.02.38-.06.57-.04.19-.12.36-.22.52-.1.15-.22.29-.36.41-.14.12-.3.22-.47.3-.17.08-.35.14-.54.18-.19.04-.38.06-.58.07-.51.02-1.02.12-1.51.3-.49.18-.95.44-1.36.77-.41.33-.77.72-1.06 1.15-.29.43-.5.9-.62 1.4-.03.13-.08.25-.15.36-.07.11-.16.21-.26.29-.1.08-.22.14-.34.18-.12.04-.25.06-.38.06-.14 0-.27-.02-.4-.06-.13-.04-.24-.1-.35-.18-.1-.08-.19-.17-.26-.28-.07-.11-.12-.23-.15-.36-.12-.5-.33-.97-.62-1.4-.29-.43-.65-.82-1.06-1.15-.41-.33-.87-.59-1.36-.77-.49-.18-1-.28-1.51-.3-.2-.01-.39-.03-.58-.07-.19-.04-.37-.1-.54-.18-.17-.08-.33-.18-.47-.3-.14-.12-.26-.26-.36-.41-.1-.16-.18-.33-.22-.52-.04-.19-.06-.38-.06-.57 0-1.09.37-2.02.5-2.32.11-.24.11-.47-.01-.68-.15-.26-.41-.45-.71-.52-.14-.03-.28-.06-.42-.08-.3-.03-.58-.09-.84-.17-.41-.13-.68-.49-.68-.9 0-.35.19-.67.5-.83.15-.08.32-.12.49-.12.17 0 .34.04.5.11.22.1.46.15.7.15.195 0 .388-.04.568-.12-.002-.334-.002-.647-.002-.944 0-1.28.005-2.213.025-2.59.07-1.47.7-2.843 1.78-3.84C8.728.65 10.158.116 11.688.053c.126-.004.252-.006.377-.006z"/></svg>
                </a>
              )}
              {social_linkedin && (
                <a href={social_linkedin} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
              {social_youtube && (
                <a href={social_youtube} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {social_threads && (
                <a href={social_threads} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.028-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.02-5.11.895-6.54 2.39-1.37 1.433-2.087 3.642-2.11 6.505.024 2.86.74 5.07 2.11 6.5 1.43 1.497 3.63 2.372 6.54 2.395 2.745-.02 4.57-.702 5.775-2.11.866-1.003 1.387-2.395 1.558-4.148-.752.168-1.555.245-2.4.23-3.018-.063-5.51-1.278-7.013-3.424-1.26-1.818-1.81-4.26-1.546-6.964.274-2.816 1.33-5.038 3.076-6.43 1.664-1.33 3.902-1.98 6.658-1.928 2.566.046 4.604.76 6.05 2.12 1.436 1.35 2.22 3.305 2.322 5.808.082 2.016-.18 3.81-.775 5.343-.61 1.57-1.526 2.8-2.723 3.656-1.19.85-2.637 1.284-4.303 1.284zm.655-10.055c1.636 0 3.106-.418 4.126-1.18.97-.725 1.505-1.746 1.593-3.038.105-1.52-.27-2.716-1.07-3.466-.834-.78-2.19-1.2-3.942-1.233-1.916-.033-3.368.38-4.28 1.228-.882.82-1.418 2.12-1.6 3.866-.22 2.1.18 3.74 1.153 4.783.837.898 2.09 1.384 3.718 1.418l.302.006v-.384z"/></svg>
                </a>
              )}
              {social_facebook && (
                <a href={social_facebook} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {social_whatsapp_link && (
                <a href={social_whatsapp_link} target="_blank" rel="noopener noreferrer" className="social-icon no-underline flex items-center justify-center" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', transition:'all 0.3s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-kufi" style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>روابط سريعة</h4>
            <div className="flex flex-col gap-3">
              {(navbar_links as any[]).filter((l: any) => l.type !== "cta").map((link: any, i: number) => (
                link.type === "anchor" ? <a key={i} href={link.href} className="no-underline text-[#9A9AA0] hover:text-[#C9A84C] text-sm" style={{ transition:'color 0.3s' }}>{link.label}</a> : <Link key={i} href={link.href} className="no-underline text-[#9A9AA0] hover:text-[#C9A84C] text-sm" style={{ transition:'color 0.3s' }}>{link.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-kufi" style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>الخدمات</h4>
            <div className="flex flex-col gap-3">
              {(services as any[]).map((svc: any, i: number) => <span key={i} className="text-[#9A9AA0] text-sm">{svc.title}</span>)}
            </div>
          </div>
          <div>
            <h4 className="font-kufi" style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>تواصل</h4>
            <div className="flex flex-col gap-3">
              {whatsapp && <a href={"https://wa.me/" + whatsapp} className="no-underline text-[#9A9AA0] hover:text-[#C9A84C] text-sm" style={{ transition:'color 0.3s' }}>واتساب</a>}
              {email && <a href={"mailto:" + email} className="no-underline text-[#9A9AA0] hover:text-[#C9A84C] text-sm" style={{ transition:'color 0.3s' }}>{email}</a>}
              {phone && <a href={"tel:" + phone} className="no-underline text-[#9A9AA0] hover:text-[#C9A84C] text-sm" style={{ transition:'color 0.3s' }}>{phone}</a>}
              <span className="text-[#9A9AA0] text-sm">الرياض، السعودية</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth:1200, margin:'0 auto', paddingTop:32, borderTop:'1px solid rgba(201,168,76,0.12)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'#5A5A62' }}>
          <span>© {new Date().getFullYear()} {site_name}. جميع الحقوق محفوظة.</span>
          {fal_license && <span>رخصة فال — {fal_license}</span>}
        </div>
      </footer>
    </div>
  );
}
