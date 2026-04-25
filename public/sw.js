/* وسيط برو — Service Worker
 * استراتيجية الـ cache:
 *   - static assets (icons, fonts): cache-first
 *   - API requests: network-first مع fallback للـ cache
 *   - HTML pages: network-first مع offline fallback
 */

const CACHE_NAME = "wasitpro-v1";
const STATIC_ASSETS = [
  "/",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// ── Install: pre-cache static assets ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => null))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch handler ──
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // فقط GET requests
  if (req.method !== "GET") return;

  // تخطّي extensions وschemas غير http(s)
  if (!url.protocol.startsWith("http")) return;

  // تخطّي طلبات Supabase (نعتمد على RLS realtime، لا cache)
  if (url.hostname.endsWith(".supabase.co")) return;

  // تخطّي طلبات AI providers
  if (
    url.hostname.includes("openai.com") ||
    url.hostname.includes("anthropic.com") ||
    url.hostname.includes("googleapis.com")
  ) return;

  // ── API routes: network-first ──
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // ── Static assets (icons, fonts): cache-first ──
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)$/)
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // ── HTML pages: network-first مع offline fallback ──
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirstNav(req));
    return;
  }

  // الباقي: try cache then network
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => new Response("", { status: 503 })))
  );
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok && req.method === "GET") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function networkFirstNav(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    // offline fallback: cached homepage
    const home = await caches.match("/");
    return home || new Response("لا يوجد اتصال بالإنترنت", { status: 503 });
  }
}

// ── Push notifications handler (يعمل لما VAPID يُضبط) ──
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: "وسيط برو", body: event.data.text() };
  }

  const title = data.title || "وسيط برو";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag: data.tag || "general",
    data: { url: data.url || "/dashboard" },
    dir: "rtl",
    lang: "ar",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
