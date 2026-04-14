-- ══════════════════════════════════════════════════════════════
-- 011: حقول إتاحة العقار مع المالك
-- ══════════════════════════════════════════════════════════════

ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_confirmed_available BOOLEAN DEFAULT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_last_check TIMESTAMPTZ DEFAULT NULL;
