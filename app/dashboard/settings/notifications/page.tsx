"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { toast } from "sonner";
import {
  ArrowRight, Smartphone, Bell, BellOff, Download, CheckCircle2,
  AlertCircle, Apple, Loader2, Trash2, Globe, Send,
} from "lucide-react";

type Subscription = {
  id: string;
  device_label: string | null;
  user_agent: string | null;
  created_at: string;
  is_active: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function NotificationsSettings() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [vapidConfigured, setVapidConfigured] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // detect already installed
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    if ((window.navigator as { standalone?: boolean }).standalone) setInstalled(true);

    // capture install prompt
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("appinstalled", onInstalled);

    if ("Notification" in window) setPermission(Notification.permission);

    // VAPID key existence (set in NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    setVapidConfigured(!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

    loadSubs();

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function loadSubs() {
    setLoading(true);
    try {
      const { data } = await supabase.rpc("my_push_subscriptions");
      setSubs((data || []) as Subscription[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      toast.success("تم تثبيت التطبيق");
      setInstallEvent(null);
    }
  }

  async function handleEnableNotifications() {
    if (!("Notification" in window)) {
      toast.error("متصفحك لا يدعم الإشعارات");
      return;
    }
    if (!vapidConfigured) {
      toast.info("الإشعارات قيد التجهيز — راجع لاحقاً");
      return;
    }
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error("لم يتم منح الإذن");
        setBusy(false);
        return;
      }

      // subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "") as unknown as BufferSource,
      });

      // save to DB
      const json = sub.toJSON();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("غير مصرح");

      // get tenant_id
      const { data: tenant } = await supabase
        .from("tenants").select("id").eq("owner_id", userData.user.id).maybeSingle();
      let tid = tenant?.id;
      if (!tid) {
        const { data: m } = await supabase
          .from("tenant_members").select("tenant_id").eq("user_id", userData.user.id).eq("status", "active").maybeSingle();
        tid = m?.tenant_id;
      }
      if (!tid) throw new Error("لم يُعثر على المستأجر");

      await supabase.from("push_subscriptions").upsert({
        tenant_id: tid,
        user_id: userData.user.id,
        endpoint: json.endpoint || "",
        p256dh: json.keys?.p256dh || "",
        auth_secret: json.keys?.auth || "",
        user_agent: navigator.userAgent.slice(0, 500),
        device_label: detectDevice(),
        is_active: true,
      }, { onConflict: "user_id,endpoint" });

      toast.success("تم تفعيل الإشعارات على هذا الجهاز");
      await loadSubs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التفعيل");
    }
    setBusy(false);
  }

  async function handleRemoveSub(id: string) {
    if (!confirm("إيقاف الإشعارات على هذا الجهاز؟")) return;
    setBusy(true);
    try {
      await supabase.from("push_subscriptions").update({ is_active: false }).eq("id", id);
      toast.success("تم الإيقاف");
      await loadSubs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل");
    }
    setBusy(false);
  }

  return (
    <div>
      <Link href="/dashboard"
        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#71717A", marginBottom: 14 }}>
        <ArrowRight size={12} /> الداشبورد
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F4F4F5", marginBottom: 4 }}>
        التطبيق والإشعارات
      </h1>
      <p style={{ fontSize: 13, color: "#71717A", marginBottom: 22 }}>
        ثبّت المنصّة على جوّالك كتطبيق مستقل، وفعّل الإشعارات لتنبيهات فورية
      </p>

      {/* القسم 1: تثبيت كتطبيق */}
      <Card title="تثبيت كتطبيق على الشاشة الرئيسية" icon={Smartphone}>
        {installed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 12, background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 9 }}>
            <CheckCircle2 size={16} style={{ color: "#4ADE80" }} />
            <span style={{ fontSize: 13, color: "#4ADE80" }}>التطبيق مُثبَّت بالفعل على هذا الجهاز</span>
          </div>
        ) : installEvent ? (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 12 }}>
              ثبّت "وسيط برو" كتطبيق مستقل — يفتح بدون شريط المتصفح، أيقونة على الشاشة الرئيسية، وأسرع.
            </p>
            <button onClick={handleInstall}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 18px",
                background: "linear-gradient(135deg, #C6914C, #8A5F2E)",
                color: "#0A0A0C", border: "none", borderRadius: 9,
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Tajawal', sans-serif",
              }}>
              <Download size={15} /> تثبيت التطبيق الآن
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 12 }}>
              لتثبيت التطبيق على جوّالك:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              <Step icon={Apple} title="على iPhone (Safari)">
                اضغط زر المشاركة <span style={{ display: "inline-block", padding: "1px 6px", background: "#27272A", borderRadius: 4 }}>↑</span> ثم
                "إضافة إلى الشاشة الرئيسية"
              </Step>
              <Step icon={Globe} title="على Android (Chrome)">
                اضغط القائمة (⋮) ثم "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"
              </Step>
            </div>
          </div>
        )}
      </Card>

      {/* القسم 2: الإشعارات */}
      <Card title="إشعارات Push" icon={Bell}>
        {!vapidConfigured ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: 14, background: "rgba(232,184,109,0.06)", border: "1px solid rgba(232,184,109,0.2)", borderRadius: 9 }}>
            <AlertCircle size={16} style={{ color: "#E8B86D", marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, color: "#E8B86D", fontWeight: 600, marginBottom: 4 }}>الإشعارات قيد التجهيز</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.7 }}>
                البنية التحتية جاهزة (Service Worker مُسجَّل + جدول الاشتراكات).
                تفعيل الإرسال يحتاج إعداد VAPID keys في إعدادات Vercel.
                لما يكتمل، راح تظهر هنا أزرار التفعيل تلقائياً.
              </div>
            </div>
          </div>
        ) : permission === "denied" ? (
          <div style={{ padding: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9 }}>
            <div style={{ fontSize: 13, color: "#F87171", marginBottom: 6, fontWeight: 600 }}>الإشعارات محظورة</div>
            <div style={{ fontSize: 12, color: "#A1A1AA" }}>
              فعّل الإشعارات يدوياً من إعدادات المتصفح (أيقونة القفل بجانب رابط الموقع → الإشعارات → اسمح).
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 12 }}>
              فعّل الإشعارات لتصلك تنبيهات فورية: عميل جديد، طلب عقار، توقيع عقد، تذكير فاتورة.
            </p>
            <button onClick={handleEnableNotifications} disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 18px",
                background: "rgba(96,165,250,0.1)", color: "#60A5FA",
                border: "1px solid rgba(96,165,250,0.3)", borderRadius: 9,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "'Tajawal', sans-serif", opacity: busy ? 0.6 : 1,
              }}>
              {busy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Bell size={14} />}
              {permission === "granted" ? "تفعيل على هذا الجهاز" : "السماح بالإشعارات"}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </Card>

      {/* اختبار Push */}
      {subs.length > 0 && vapidConfigured && (
        <Card title="اختبار الإشعارات" icon={Send}>
          <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 12 }}>
            أرسل إشعاراً تجريبياً لكل أجهزتك المسجَّلة للتأكد من أن النظام يعمل.
          </p>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/push/notify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: "وسيط برو — اختبار",
                    body: "Push notifications تعمل! 🎉",
                  }),
                });
                const json = await res.json();
                if (json.sent > 0) {
                  toast.success(`تم إرسال إشعار تجريبي (${json.sent} جهاز)`);
                } else {
                  toast.error("لم يُرسَل أي إشعار — تحقق من تفعيل الإشعارات في الجهاز");
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "فشل الإرسال");
              }
            }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
              background: "rgba(96,165,250,0.1)", color: "#60A5FA",
              border: "1px solid rgba(96,165,250,0.3)", borderRadius: 9,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Tajawal', sans-serif",
            }}>
            <Send size={14} /> أرسل إشعار اختباري
          </button>
        </Card>
      )}

      {/* القسم 3: الأجهزة المسجَّلة */}
      {subs.length > 0 && (
        <Card title="الأجهزة المسجَّلة" icon={Smartphone}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {subs.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#18181B", borderRadius: 9 }}>
                <Smartphone size={14} style={{ color: "#A78BFA" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#E4E4E7", fontWeight: 500 }}>{s.device_label || "جهاز غير معروف"}</div>
                  <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>
                    أُضيف في {new Date(s.created_at).toLocaleDateString("ar-SA")}
                  </div>
                </div>
                <button onClick={() => handleRemoveSub(s.id)}
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#F87171", padding: "6px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Trash2 size={12} /> إيقاف
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Bell; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0F0F12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 13, padding: 18, marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#E4E4E7", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} style={{ color: "#C6914C" }} /> {title}
      </h2>
      {children}
    </div>
  );
}

function Step({ icon: Icon, title, children }: { icon: typeof Apple; title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 12, background: "#18181B", borderRadius: 9, border: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon size={14} style={{ color: "#C6914C" }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#E4E4E7" }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: "#A1A1AA", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function detectDevice(): string {
  if (typeof navigator === "undefined") return "غير معروف";
  const ua = navigator.userAgent;
  let os = "كمبيوتر";
  if (/iPhone|iPad/.test(ua)) os = "iPhone";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac/.test(ua)) os = "Mac";
  else if (/Windows/.test(ua)) os = "Windows";

  let browser = "متصفح";
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Edg/.test(ua)) browser = "Edge";

  return `${os} — ${browser}`;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const cleaned = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(cleaned);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
