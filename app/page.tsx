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
  const social_linkedin = s?.social_linkedin || "";
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

  return (
    <div dir="rtl" className="bg-[#0A0A0C] text-[#F5F5F5] min-h-screen" style={{ fontFamily: "'Tajawal', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Noto+Kufi+Arabic:wght@400;500;600;700;800;900&display=swap');
        .font-kufi { font-family: 'Noto Kufi Arabic', serif; }
        .accent { color: #C9A84C; }
        .accent-bg { background: linear-gradient(135deg, #C9A84C, #A68A3A); }
        .card { background: #16161A; border: 1px solid rgba(201,168,76,0.12); border-radius: 16px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .card:hover { border-color: rgba(201,168,76,0.3); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        .dot-pattern { background-image: radial-gradient(rgba(201,168,76,0.03) 1px, transparent 1px); background-size: 40px 40px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.8s ease-out both; }
        .fade-d1 { animation-delay: 0.15s; }
        .fade-d2 { animation-delay: 0.3s; }
        .fade-d3 { animation-delay: 0.45s; }
        @keyframes heroZoom { 0% { transform: scale(1.05); } 100% { transform: scale(1.12); } }
      `}</style>

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 right-0 left-0 z-50" style={{ height:72, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 48px', background:'rgba(22,22,26,0.85)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid rgba(201,168,76,0.12)' }}>
        <Link href="/" className="flex items-center gap-3 no-underline">
          <div className="accent-bg flex items-center justify-center font-kufi font-black text-[#0A0A0C]" style={{ width:44, height:44, borderRadius:12, fontSize:20 }}>إ</div>
          <div className="flex flex-col" style={{ lineHeight:1.2 }}>
            <span className="font-kufi font-extrabold text-[17px] text-white">{site_name}</span>
            <span className="accent text-[11px] font-medium">{hero_badge}</span>
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
          <div className="fade-up inline-flex items-center gap-2 accent text-[13px] font-medium" style={{ background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:100, padding:'8px 20px', marginBottom:32 }}>
            <span style={{ width:6, height:6, background:'#C9A84C', borderRadius:'50%', display:'inline-block' }}></span>
            {hero_badge}
          </div>
          <h1 className="font-kufi font-black fade-up fade-d1" style={{ fontSize:'clamp(2.4rem, 5.5vw, 4.2rem)', lineHeight:1.25, marginBottom:20 }}>
            {hero_title.includes('الطريق') ? (
              <>{hero_title.split('الطريق')[0]}<span style={{ background:'linear-gradient(135deg, #E4C76B, #C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>الطريق العقاري</span></>
            ) : (
              <span style={{ background:'linear-gradient(135deg, #E4C76B, #C9A84C)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{hero_title}</span>
            )}
          </h1>
          <p className="fade-up fade-d2" style={{ fontSize:'clamp(1rem, 2vw, 1.2rem)', color:'#9A9AA0', lineHeight:1.8, maxWidth:600, margin:'0 auto 40px' }}>{hero_subtitle}</p>
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
        <section id="why" style={{ padding:'100px 48px', background:'#111114' }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span>القيمة المضافة<span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.6rem)', lineHeight:1.3, marginBottom:16 }}>لماذا تختار {site_name.split(' ')[0]}؟</h2>
            <p style={{ fontSize:16, color:'#9A9AA0', maxWidth:560, margin:'0 auto', lineHeight:1.8 }}>لأن الفرق الحقيقي مو بالإعلان — بل بالفهم، والتنظيم، والمتابعة</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:24, maxWidth:1200, margin:'0 auto' }}>
            {(why_cards as any[]).map((card: any, i: number) => (
              <div key={i} className="card" style={{ padding:'40px 32px' }}>
                <div style={{ width:56, height:56, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:24 }}>{card.icon}</div>
                <h3 className="font-kufi" style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>{card.title}</h3>
                <p style={{ fontSize:14.5, color:'#9A9AA0', lineHeight:1.8 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ PROPERTIES ═══════ */}
      {show_properties && properties.length > 0 && (
        <section style={{ padding:'100px 48px' }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span>عقارات مختارة<span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.6rem)', lineHeight:1.3 }}>لا نعرض كل شي — فقط اللي يستاهل</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:24, maxWidth:1200, margin:'0 auto' }}>
            {properties.map((p: any) => (
              <Link href={"/properties/" + p.id} key={p.id} className="card no-underline text-white" style={{ overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:220, overflow:'hidden', position:'relative', background:'#1C1C22' }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div className="flex items-center justify-center h-full text-[#5A5A62] text-4xl">🏠</div>}
                  <span className="accent-bg" style={{ position:'absolute', top:16, right:16, color:'#0A0A0C', fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:8 }}>{p.offer_type || 'للبيع'}</span>
                </div>
                <div style={{ padding:24 }}>
                  <h3 className="font-kufi" style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{p.title}</h3>
                  <p style={{ fontSize:13.5, color:'#9A9AA0', marginBottom:18 }}>📍 {p.district}، {p.city}</p>
                  <div style={{ display:'flex', gap:16, paddingTop:16, borderTop:'1px solid rgba(201,168,76,0.12)', marginBottom:18 }}>
                    {p.rooms && <span style={{ fontSize:13, color:'#5A5A62' }}>🛏 {p.rooms} غرف</span>}
                    {p.land_area && <span style={{ fontSize:13, color:'#5A5A62' }}>📐 {p.land_area} م²</span>}
                  </div>
                  {p.price && <div className="font-kufi accent" style={{ fontSize:20, fontWeight:800 }}>{Number(p.price).toLocaleString()} <span style={{ fontSize:13, color:'#5A5A62', fontWeight:500 }}>ريال</span></div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center" style={{ marginTop:40 }}>
            <Link href="/properties" className="no-underline text-[#9A9AA0] hover:text-white" style={{ border:'1px solid rgba(201,168,76,0.12)', padding:'14px 36px', borderRadius:12, fontSize:15, fontWeight:600, display:'inline-block', transition:'all 0.3s' }}>عرض جميع العقارات</Link>
          </div>
        </section>
      )}

      {/* ═══════ SERVICES ═══════ */}
      {show_services && (services as any[]).length > 0 && (
        <section id="services" style={{ padding:'100px 48px', background:'#111114' }}>
          <div className="text-center" style={{ marginBottom:64 }}>
            <div className="accent inline-flex items-center gap-2 text-[13px] font-semibold" style={{ letterSpacing:2, marginBottom:16 }}><span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span>خدماتنا<span style={{ width:32, height:1, background:'#C9A84C', opacity:0.4, display:'inline-block' }}></span></div>
            <h2 className="font-kufi font-extrabold" style={{ fontSize:'clamp(1.8rem, 3.5vw, 2.6rem)', lineHeight:1.3 }}>خدمات عقارية متكاملة</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20, maxWidth:1200, margin:'0 auto' }}>
            {(services as any[]).map((svc: any, i: number) => (
              <div key={i} className="card text-center" style={{ padding:'36px 28px' }}>
                <div style={{ width:64, height:64, margin:'0 auto 20px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.12)', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{svc.icon}</div>
                <h3 className="font-kufi" style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>{svc.title}</h3>
                <p style={{ fontSize:13.5, color:'#9A9AA0', lineHeight:1.7 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════ CTA ═══════ */}
      {show_cta && (
        <section id="contact" style={{ padding:'100px 48px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents:'none' }}></div>
          <div className="card relative" style={{ maxWidth:720, margin:'0 auto', padding:'64px 48px', borderRadius:24 }}>
            <h2 className="font-kufi font-extrabold" style={{ fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:16 }}>{cta_title}</h2>
            <p style={{ color:'#9A9AA0', fontSize:16, lineHeight:1.8, marginBottom:36 }}>{cta_subtitle}</p>
            <div className="flex justify-center gap-4 flex-wrap">
              {whatsapp && <a href={"https://wa.me/" + whatsapp} target="_blank" className="accent-bg no-underline text-[#0A0A0C] font-bold flex items-center gap-2" style={{ padding:'14px 36px', borderRadius:12, fontSize:15 }}>💬 واتساب</a>}
              {phone && <a href={"tel:" + phone} className="no-underline text-white font-semibold flex items-center gap-2" style={{ padding:'14px 36px', borderRadius:12, fontSize:15, border:'1px solid rgba(201,168,76,0.12)' }}>📞 اتصل الآن</a>}
              {!whatsapp && !phone && <a href="#" className="accent-bg no-underline text-[#0A0A0C] font-bold" style={{ padding:'14px 36px', borderRadius:12, fontSize:15 }}>💬 تواصل معي</a>}
            </div>
          </div>
        </section>
      )}

      {/* ═══════ FOOTER ═══════ */}
      <footer style={{ background:'#111114', borderTop:'1px solid rgba(201,168,76,0.12)', padding:'64px 48px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 1fr', gap:48, maxWidth:1200, margin:'0 auto 48px' }}>
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom:8 }}>
              <div className="accent-bg flex items-center justify-center font-kufi font-black text-[#0A0A0C]" style={{ width:44, height:44, borderRadius:12, fontSize:20 }}>إ</div>
              <div className="flex flex-col" style={{ lineHeight:1.2 }}>
                <span className="font-kufi font-extrabold text-[17px]">{site_name}</span>
                <span className="accent text-[11px] font-medium">{hero_badge}</span>
              </div>
            </div>
            <p style={{ fontSize:14, color:'#9A9AA0', lineHeight:1.8, marginTop:16, maxWidth:300 }}>{footer_text}</p>
            <div className="flex gap-3" style={{ marginTop:20 }}>
              {social_x && <a href={social_x} target="_blank" className="flex items-center justify-center no-underline text-[#5A5A62] hover:text-[#C9A84C]" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', fontSize:16, transition:'all 0.3s' }}>𝕏</a>}
              {social_instagram && <a href={social_instagram} target="_blank" className="flex items-center justify-center no-underline text-[#5A5A62] hover:text-[#C9A84C]" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', fontSize:16, transition:'all 0.3s' }}>📸</a>}
              {social_tiktok && <a href={social_tiktok} target="_blank" className="flex items-center justify-center no-underline text-[#5A5A62] hover:text-[#C9A84C]" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', fontSize:16, transition:'all 0.3s' }}>♪</a>}
              {social_linkedin && <a href={social_linkedin} target="_blank" className="flex items-center justify-center no-underline text-[#5A5A62] hover:text-[#C9A84C]" style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(201,168,76,0.12)', fontSize:16, transition:'all 0.3s' }}>in</a>}
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
