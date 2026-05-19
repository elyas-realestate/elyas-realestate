-- ═══════════════════════════════════════════════════════════════
-- 052_add_clients_budget.sql
-- Adds the `budget` column to the `clients` table.
--
-- Background:
--   The Wave 7 cleanup audit (Wave 6C) flagged `clients.budget` as a
--   "schema bug" because the column was referenced in the UI
--   (app/dashboard/clients/page.tsx + clients/[id]/page.tsx) but did
--   not exist in any prior migration. We resolve this by adding the
--   column rather than removing the UI, since budget is a real
--   product feature used in the lead-score and client drawer views.
--
-- Type: text (free-form, supports ranges like "500k–1M ريال")
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS budget text;

COMMENT ON COLUMN public.clients.budget IS
  'الميزانية أو النطاق السعري الذي يبحث عنه العميل (نص حر)';
