-- ══════════════════════════════════════════════════════════════
-- وسيط برو — تتبع العمولات
-- شغّل هذا الملف في Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════

-- إضافة عمودَي العمولة لجدول deals
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS commission_paid   NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_status TEXT         DEFAULT 'معلقة'
    CHECK (commission_status IN ('مدفوعة','جزئية','معلقة'));

-- فهرس سريع على حالة العمولة
CREATE INDEX IF NOT EXISTS deals_commission_status_idx ON public.deals(commission_status);
