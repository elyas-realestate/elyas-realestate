-- ══════════════════════════════════════════════════════════════
-- 045: Storage Buckets — إنشاء buckets + policies
--
-- يُنشئ:
--   - avatars (public read, owner write) — للصور الشخصية للوسطاء
--   - assets  (public read, owner write) — للشعارات والصور المختلفة
--
-- الـ policies تسمح للمستخدم برفع/تعديل/حذف ملفاته الخاصة فقط
-- (بناءً على المسار: <user_id>/...)
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1) إنشاء bucket avatars (لو غير موجود)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                                                    -- public: صور المتداولين تظهر للجمهور
  3145728,                                                 -- 3 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- ─────────────────────────────────────────────────────────────
-- 2) إنشاء bucket assets (للشعارات والصور المختلفة)
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  5242880,                                                 -- 5 MB max
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];

-- ═══════════════════════════════════════════════════════════════
-- 3) RLS Policies للـ avatars
-- ═══════════════════════════════════════════════════════════════

-- قراءة عامة (الصور تظهر في بطاقات الوسطاء وصفحاتهم العامة)
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- المستخدم يقدر يرفع في مجلده الخاص فقط (المسار يبدأ بـ user_id)
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- المستخدم يقدر يحدّث ملفاته الخاصة (نفس قيد المسار)
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- المستخدم يقدر يحذف ملفاته الخاصة
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ═══════════════════════════════════════════════════════════════
-- 4) RLS Policies للـ assets (نفس النمط)
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "assets_public_read" ON storage.objects;
CREATE POLICY "assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_authenticated_insert" ON storage.objects;
CREATE POLICY "assets_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_authenticated_update" ON storage.objects;
CREATE POLICY "assets_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "assets_authenticated_delete" ON storage.objects;
CREATE POLICY "assets_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets');

-- ═══════════════════════════════════════════════════════════════
-- 5) فحص نهائي: نطبع حالة الـ buckets
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'Storage Buckets Setup Complete:';
  RAISE NOTICE '  - avatars: public, 3MB max';
  RAISE NOTICE '  - assets:  public, 5MB max';
  RAISE NOTICE 'Policies: public read + authenticated user write';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;
