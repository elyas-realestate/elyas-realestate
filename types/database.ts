// ══════════════════════════════════════════════════════════════
// types/database.ts — Barrel: Supabase generated types + aliases
// ══════════════════════════════════════════════════════════════
// المصدر الفعلي للأنواع: database.generated.ts (يولّده Supabase CLI)
// نُعيد تصدير `Database` + كل helper types + aliases المخصّصة (Property, Client, ...).
//
// لتجديد الـ schema:
//   npm run db:types
// ══════════════════════════════════════════════════════════════

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database.generated";

export type {
  Property,
  PropertyRequest,
  Client,
  Deal,
  Contract,
  BrokerIdentity,
  MaintenanceRequest,
  TenantPayment,
  ContentDraft,
  ChatMessage,
} from "./db-aliases";
