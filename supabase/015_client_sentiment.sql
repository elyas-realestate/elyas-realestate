-- ══════════════════════════════════════════════════════════════
-- 015: حقل مشاعر العميل (Hot / Warm / Cold)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE clients ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT NULL;
-- قيم مسموحة: 'hot' | 'warm' | 'cold' | NULL (تلقائي من الـ score)
