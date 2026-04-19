// ══════════════════════════════════════════════════════════════
// أنواع TypeScript لكل الجداول — بديل عن `any`
// ══════════════════════════════════════════════════════════════

export interface Property {
  id: string;
  title: string;
  code?: string;
  main_category?: string;
  sub_category?: string;
  offer_type?: string;
  city?: string;
  district?: string;
  price?: number;
  land_area?: number;
  rooms?: number;
  description?: string;
  images?: string[];
  main_image?: string;
  is_published: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone?: string;
  category?: string;
  city?: string;
  district?: string;
  notes?: string;
  budget?: string;
  code?: string;
  sentiment?: "hot" | "warm" | "cold" | null;
  tenant_id?: string;
  created_at: string;
}

export interface Deal {
  id: string;
  title?: string;
  deal_type?: string;
  property_id?: string;
  current_stage?: string;
  target_value?: number;
  expected_commission?: number;
  commission_paid?: number;
  commission_status?: string;
  priority?: string;
  summary?: string;
  next_action?: string;
  expected_close_date?: string;
  client_name?: string;
  tenant_id?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  due_date?: string;
  tenant_id?: string;
  created_at: string;
}

export interface ContentDraft {
  id: string;
  title?: string;
  main_text: string;
  content_goal?: string;
  main_channel?: string;
  content_format?: string;
  status?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  tenant_id?: string;
  created_at: string;
}

export interface BrokerIdentity {
  id: string;
  broker_name: string;
  fal_license?: string;
  specialization?: string;
  coverage_areas?: string[];
  target_audiences?: string[];
  brand_keywords?: string[];
  avoid_phrases?: string[];
  bio_short?: string;
  bio_long?: string;
  photo_url?: string;
  tenant_id?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  note?: string;
  expense_date: string;
  tenant_id?: string;
  created_at: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  related_party?: string;
  doc_number?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  doc_url?: string;
  tenant_id?: string;
  created_at: string;
}

export interface PropertyRequest {
  id: string;
  name?: string;
  phone?: string;
  message?: string;
  property_id?: string;
  status: string;
  tenant_id?: string;
  created_at: string;
}

export interface SiteAnalytics {
  id: string;
  event_type: string;
  page?: string;
  element?: string;
  tenant_id?: string;
  created_at: string;
}

// ── AI Content Types ──

export interface AIProvider {
  id: string;
  name: string;
  desc: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
  desc: string;
}

export type AIMode = "single" | "chain" | "compare";

export interface QueueItem {
  id: string;
  propertyId: string;
  propertyLabel: string;
  contentGoal: string;
  platform: string;
  contentFormat: string;
  writingTone: string;
  contentLanguage: string;
  postCount: string;
  mode: AIMode;
  provider: string;
  model: string;
  provider2: string;
  model2: string;
}

export interface ResultGroup {
  queueItem: QueueItem;
  posts: string[];
  posts2?: string[];
  draft?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  savedAsDraft?: boolean;
}
