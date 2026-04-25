// ══════════════════════════════════════════════════════════════
// lib/whatsapp.ts — مُوحِّد إرسال WhatsApp
//   1) إذا كان tenant عنده whatsapp_config مفعَّل → يستخدم Meta Cloud API
//   2) إذا لا → يولّد wa.me link كبديل (يفتح المحادثة في التطبيق)
//
// يدعم: نص حر، قوالب معتمدة، وسائط (صور).
// ══════════════════════════════════════════════════════════════

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { safeDecrypt } from "@/lib/crypto";

export interface WhatsAppConfig {
  tenant_id: string;
  phone_number_id: string | null;
  access_token_enc: string | null;
  display_phone: string | null;
  is_active: boolean;
}

export interface SendTextOptions {
  tenantId: string;
  toPhone: string;          // E.164 format بدون "+" مثلاً 9665xxxxxxxx
  text: string;
  clientId?: string;
  contactName?: string;
}

export interface SendTemplateOptions {
  tenantId: string;
  toPhone: string;
  templateName: string;
  variables?: string[];      // قيم ترتيبية للمتغيرات
  language?: string;         // ar | en
  clientId?: string;
  contactName?: string;
}

export interface SendResult {
  ok: boolean;
  mode: "meta" | "wa_me";
  messageId?: string;
  waMeUrl?: string;
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Normalize Saudi numbers: 0501234567 → 966501234567 */
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/\D/g, "");
  if (p.startsWith("00")) p = p.slice(2);
  if (p.startsWith("05")) p = "966" + p.slice(1);
  if (p.startsWith("5") && p.length === 9) p = "966" + p;
  return p;
}

/** Build a wa.me link with pre-filled message */
export function waMeUrl(phone: string, text: string): string {
  const p = normalizePhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}

async function loadConfig(tenantId: string): Promise<WhatsAppConfig | null> {
  const admin = getServiceClient();
  const { data, error } = await admin
    .from("whatsapp_config")
    .select("tenant_id, phone_number_id, access_token_enc, display_phone, is_active")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as WhatsAppConfig;
}

async function logMessage(opts: {
  tenantId: string;
  contactPhone: string;
  contactName?: string;
  clientId?: string;
  direction: "inbound" | "outbound";
  messageType: "text" | "template";
  bodyText?: string;
  templateName?: string;
  metaMessageId?: string;
  status: "sent" | "delivered" | "read" | "failed" | "received";
  failureReason?: string;
}) {
  const admin = getServiceClient();
  await admin.from("whatsapp_messages").insert({
    tenant_id: opts.tenantId,
    contact_phone: normalizePhone(opts.contactPhone),
    contact_name: opts.contactName,
    client_id: opts.clientId,
    direction: opts.direction,
    message_type: opts.messageType,
    body_text: opts.bodyText,
    template_name: opts.templateName,
    meta_message_id: opts.metaMessageId,
    status: opts.status,
    failure_reason: opts.failureReason,
  });
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * إرسال نص حر للعميل.
 * - إذا Meta API مفعَّل ومُخصَّص: يرسل فعلياً ويُسجِّل
 * - وإلا: يعيد wa.me url للوسيط ليفتحه يدوياً
 */
export async function sendText(opts: SendTextOptions): Promise<SendResult> {
  const config = await loadConfig(opts.tenantId);
  const useMeta = config?.is_active && config.phone_number_id && config.access_token_enc;

  if (!useMeta) {
    // wa.me fallback
    return {
      ok: true,
      mode: "wa_me",
      waMeUrl: waMeUrl(opts.toPhone, opts.text),
    };
  }

  // Meta Cloud API
  try {
    const token = await safeDecrypt(config.access_token_enc!);
    const phoneNumberId = config.phone_number_id!;
    const to = normalizePhone(opts.toPhone);

    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: opts.text },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      await logMessage({
        tenantId: opts.tenantId,
        contactPhone: opts.toPhone,
        contactName: opts.contactName,
        clientId: opts.clientId,
        direction: "outbound",
        messageType: "text",
        bodyText: opts.text,
        status: "failed",
        failureReason: errMsg,
      });
      return { ok: false, mode: "meta", error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    await logMessage({
      tenantId: opts.tenantId,
      contactPhone: opts.toPhone,
      contactName: opts.contactName,
      clientId: opts.clientId,
      direction: "outbound",
      messageType: "text",
      bodyText: opts.text,
      metaMessageId: messageId,
      status: "sent",
    });
    return { ok: true, mode: "meta", messageId };
  } catch (e) {
    return { ok: false, mode: "meta", error: e instanceof Error ? e.message : "unknown" };
  }
}

/**
 * إرسال قالب معتمد من Meta. مطلوب لبدء محادثة مع عميل لم يتفاعل خلال 24 ساعة.
 */
export async function sendTemplate(opts: SendTemplateOptions): Promise<SendResult> {
  const config = await loadConfig(opts.tenantId);
  const useMeta = config?.is_active && config.phone_number_id && config.access_token_enc;

  if (!useMeta) {
    // لا يوجد wa.me fallback للقوالب (template structure محدد)
    // نرجع نص بسيط بدلاً من القالب
    return {
      ok: false,
      mode: "wa_me",
      error: "Meta API غير مفعَّل — القوالب تتطلب Meta API",
    };
  }

  try {
    const token = await safeDecrypt(config.access_token_enc!);
    const phoneNumberId = config.phone_number_id!;
    const to = normalizePhone(opts.toPhone);

    const components: Array<{ type: string; parameters: Array<{ type: string; text: string }> }> = [];
    if (opts.variables && opts.variables.length > 0) {
      components.push({
        type: "body",
        parameters: opts.variables.map((v) => ({ type: "text", text: v })),
      });
    }

    const res = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: opts.templateName,
          language: { code: opts.language || "ar" },
          components,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      await logMessage({
        tenantId: opts.tenantId,
        contactPhone: opts.toPhone,
        contactName: opts.contactName,
        clientId: opts.clientId,
        direction: "outbound",
        messageType: "template",
        templateName: opts.templateName,
        status: "failed",
        failureReason: errMsg,
      });
      return { ok: false, mode: "meta", error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id;
    await logMessage({
      tenantId: opts.tenantId,
      contactPhone: opts.toPhone,
      contactName: opts.contactName,
      clientId: opts.clientId,
      direction: "outbound",
      messageType: "template",
      templateName: opts.templateName,
      metaMessageId: messageId,
      status: "sent",
    });
    return { ok: true, mode: "meta", messageId };
  } catch (e) {
    return { ok: false, mode: "meta", error: e instanceof Error ? e.message : "unknown" };
  }
}

/** سجِّل رسالة واردة من webhook */
export async function logIncomingMessage(opts: {
  tenantId: string;
  contactPhone: string;
  contactName?: string;
  bodyText?: string;
  messageType?: "text" | "image" | "document" | "location" | "audio" | "video" | "interactive";
  metaMessageId?: string;
  mediaUrl?: string;
}): Promise<string | null> {
  const admin = getServiceClient();
  const { data, error } = await admin
    .from("whatsapp_messages")
    .insert({
      tenant_id: opts.tenantId,
      contact_phone: normalizePhone(opts.contactPhone),
      contact_name: opts.contactName,
      direction: "inbound",
      message_type: opts.messageType || "text",
      body_text: opts.bodyText,
      media_url: opts.mediaUrl,
      meta_message_id: opts.metaMessageId,
      status: "received",
    })
    .select("id")
    .single();
  if (error) {
    console.warn("logIncomingMessage error:", error);
    return null;
  }
  return data.id;
}
