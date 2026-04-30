-- ══════════════════════════════════════════════════════════════
-- K-9: CEO Assistant — السكرتير الشخصي للمدير عبر WhatsApp
-- موظف خاص يستجيب فقط لرقم CEO (المالك)
-- ══════════════════════════════════════════════════════════════

-- عمود ceo_phones على tenant_ai_config
ALTER TABLE public.tenant_ai_config
  ADD COLUMN IF NOT EXISTS ceo_phones jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.tenant_ai_config.ceo_phones IS
  'أرقام WhatsApp للـ CEO المسموح لها بالتواصل مع ceo_assistant. مصفوفة E.164 بدون +';

-- موظف ceo_assistant جديد تحت cs_manager
INSERT INTO public.ai_employees (
  code, name, manager_id, department, description,
  default_ai_provider, default_ai_model,
  trigger_type, trigger_config,
  display_order, is_active,
  approval_rules
)
SELECT
  'ceo_assistant',
  'السكرتير الشخصي',
  m.id,
  'customer_service',
  'سكرتير شخصي للمدير عبر WhatsApp. يستجيب لأوامر CEO فقط، يجلب معلومات من المنصّة، يصعّد الموافقات، يولّد محتوى عند الطلب، ويُرسل تنبيهات استباقية.',
  'openai',
  'gpt-4o-mini',
  'webhook',
  '{"channel":"whatsapp","scope":"ceo_only"}'::jsonb,
  0,
  true,
  '{
    "max_amount_sar": 0,
    "block_actions": ["send_to_external_clients","modify_critical_data","execute_irreversible"],
    "require_approval_for": ["mass_message","data_deletion","public_announcement"]
  }'::jsonb
FROM public.ai_managers m
WHERE m.code = 'cs_manager'
ON CONFLICT (code) DO NOTHING;

-- ملاحظة: ceo_phones + 7 directives + 3 KB items زُرعت يدوياً عبر execute_sql
-- في جلسة 30 أبريل 2026 — موثَّقة في project_roadmap.md
