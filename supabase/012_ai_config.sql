-- ══════════════════════════════════════════════════════════════
-- 012: مركز تأسيس الذكاء الاصطناعي
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_config (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID DEFAULT auth.uid(),
  
  -- التوجيهات (System Prompts)
  system_prompt     TEXT DEFAULT '',        -- التوجيه الرئيسي
  personality       TEXT DEFAULT 'professional', -- professional, casual, friendly
  response_language TEXT DEFAULT 'ar',      -- ar, en, ar+en
  
  -- تكوين المزودين
  default_provider  TEXT DEFAULT 'openai',
  default_model     TEXT DEFAULT 'gpt-4o',
  
  -- مفاتيح API (مشفّرة — يمكن تخزينها في vault بدل الجدول)
  openai_key_set     BOOLEAN DEFAULT FALSE,
  anthropic_key_set  BOOLEAN DEFAULT FALSE,
  google_key_set     BOOLEAN DEFAULT FALSE,
  manus_key_set      BOOLEAN DEFAULT FALSE,
  
  -- إعدادات متقدمة
  temperature        NUMERIC DEFAULT 0.8,
  max_tokens         INTEGER DEFAULT 4000,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- قاعدة المعرفة
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID DEFAULT auth.uid(),
  
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,       -- النص المعرفي
  category    TEXT DEFAULT 'عام',  -- عام, عقارات, عملاء, سوق
  is_active   BOOLEAN DEFAULT TRUE,
  
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_config_tenant" ON ai_config
  FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "ai_knowledge_tenant" ON ai_knowledge
  FOR ALL USING (tenant_id = auth.uid());
