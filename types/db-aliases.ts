// ══════════════════════════════════════════════════════════════
// types/db-aliases.ts — أسماء مختصرة لجداول DB الشائعة
// ══════════════════════════════════════════════════════════════
// الـ Supabase generator يصدّر:
//   Database["public"]["Tables"]["properties"]["Row"]
// مرهق للاستخدام اليومي. نوفّر aliases مفهومة:
//   import type { Property, Client, Deal } from "@/types/database"
//
// ملاحظات:
// - هذا الملف يبقى ثابتاً عند إعادة توليد database.ts
// - أضف alias جديد فقط لو الجدول مستخدم في 2+ ملف خارج API routes
// - للـ Insert/Update استخدم: TablesInsert<"properties"> / TablesUpdate<...>
// ══════════════════════════════════════════════════════════════

import type { Database } from "./database.generated";
// Note: نستورد من database.generated مباشرة (لا من ./database)
// لتجنّب أي اعتمادات دائرية محتملة.

// ── Tables ────────────────────────────────────────────────────
type Tables = Database["public"]["Tables"];

export type Property = Tables["properties"]["Row"];
export type PropertyRequest = Tables["property_requests"]["Row"];
export type Client = Tables["clients"]["Row"];
export type Deal = Tables["deals"]["Row"];
export type Contract = Tables["contracts"]["Row"];
export type BrokerIdentity = Tables["broker_identity"]["Row"];
export type MaintenanceRequest = Tables["maintenance_requests"]["Row"];
export type TenantPayment = Tables["tenant_payments"]["Row"];
export type ContentDraft = Tables["content"]["Row"];

// ── أنواع UI محلية (ليست من DB) ────────────────────────────────
/** رسالة محادثة AI — للاستخدام في صفحات Expert/Chat */
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  /** علم اختياري لتمييز أن المحادثة حُفظت كمسودة (Expert tab) */
  savedAsDraft?: boolean;
};
