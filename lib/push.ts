// ══════════════════════════════════════════════════════════════
// lib/push.ts — مُوحِّد إرسال Web Push notifications
// يستخدم web-push npm package + VAPID keys من env vars
// ══════════════════════════════════════════════════════════════

// @ts-expect-error -- web-push installed by Vercel build (in package.json deps)
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// ── إعداد VAPID لمرة واحدة ──
let vapidConfigured = false;
function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || "mailto:noreply@example.com";
  if (!pub || !priv) {
    console.warn("[push] VAPID keys not configured — push disabled");
    return false;
  }
  webpush.setVapidDetails(subj, pub, priv);
  vapidConfigured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * أرسل Push لمستخدم واحد (لكل أجهزته المسجَّلة).
 * يحذف تلقائياً الاشتراكات المنتهية (410 Gone).
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0 };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_secret")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    (subs as Array<{ id: string; endpoint: string; p256dh: string; auth_secret: string }>).map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth_secret },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (e) {
        const err = e as { statusCode?: number; body?: string };
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredIds.push(s.id);
        } else {
          console.warn(`[push] failed for ${s.id}:`, err.statusCode, err.body);
        }
        failed++;
      }
    })
  );

  // ضع المنتهية كـ inactive (بدلاً من حذفها فوراً)
  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .update({ is_active: false })
      .in("id", expiredIds);
  }

  // حدّث last_used_at للمُرسَلة بنجاح
  if (sent > 0) {
    await admin
      .from("push_subscriptions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true);
  }

  return { sent, failed };
}

/** أرسل Push لكل المستخدمين النشطين في tenant معيَّن (مثلاً المالك + أعضاء الفريق) */
export async function sendPushToTenant(tenantId: string, payload: PushPayload): Promise<{ sent: number; failed: number; users: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0, users: 0 };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const userIds = Array.from(new Set((subs || []).map((s: { user_id: string }) => s.user_id)));

  let totalSent = 0;
  let totalFailed = 0;
  for (const uid of userIds) {
    const r = await sendPushToUser(uid, payload);
    totalSent += r.sent;
    totalFailed += r.failed;
  }

  return { sent: totalSent, failed: totalFailed, users: userIds.length };
}
