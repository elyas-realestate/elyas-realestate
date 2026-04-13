/**
 * مكتبة تسجيل أحداث التدقيق
 * تسجل كل عملية مهمة (إنشاء، تعديل، حذف) في جدول audit_log
 */

import { supabase } from "@/lib/supabase-browser";

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "export" | "import";
export type EntityType = "property" | "client" | "deal" | "task" | "project" | "quotation" | "invoice" | "content" | "settings";

interface AuditEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  entity_name?: string;
  details?: Record<string, any>;
}

/**
 * تسجيل حدث في سجل التدقيق
 * يعمل بشكل صامت — لا يسبب أخطاء للمستخدم إذا فشل التسجيل
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("audit_log").insert([{
      user_id: user.id,
      user_email: user.email,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      entity_name: entry.entity_name || null,
      details: entry.details || {},
    }]);
  } catch {
    // صامت — لا نريد كسر العملية الأصلية
    console.warn("Audit log failed silently");
  }
}

/**
 * تسجيل إنشاء عنصر
 */
export function logCreate(type: EntityType, id: string, name: string, details?: Record<string, any>) {
  return logAudit({ action: "create", entity_type: type, entity_id: id, entity_name: name, details });
}

/**
 * تسجيل تعديل عنصر
 */
export function logUpdate(type: EntityType, id: string, name: string, changes?: Record<string, any>) {
  return logAudit({ action: "update", entity_type: type, entity_id: id, entity_name: name, details: changes });
}

/**
 * تسجيل حذف عنصر
 */
export function logDelete(type: EntityType, id: string, name: string) {
  return logAudit({ action: "delete", entity_type: type, entity_id: id, entity_name: name });
}
