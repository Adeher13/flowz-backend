-- ==========================================
-- PASSO 2: CRIAR BUCKET PARA AVATARS
-- ==========================================
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Criar o bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- POLICIES PARA O BUCKET
-- ==========================================
-- Execute cada política separadamente (uma por vez)
-- ==========================================

-- Policy 1: Upload
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Update
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: View (público)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');

-- Policy 4: Delete
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- ✅ Pronto! Bucket criado e configurado
-- ==========================================
