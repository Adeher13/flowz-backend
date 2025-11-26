-- ==========================================
-- CORREÇÃO URGENTE: REMOVER RECURSÃO INFINITA
-- ==========================================
-- Execute IMEDIATAMENTE para corrigir o erro
-- ==========================================

-- 1. DESABILITAR RLS em user_roles (causa da recursão)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as policies de user_roles
DROP POLICY IF EXISTS "Usuários podem ver suas próprias roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode ver todas as roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as roles" ON user_roles;

-- 3. Corrigir policy de analyses
DROP POLICY IF EXISTS "Usuários podem ver suas análises ou admin vê todas" ON analyses;

CREATE POLICY "Usuários podem ver suas análises ou admin vê todas"
ON analyses FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 4. Corrigir policy de user_profiles
DROP POLICY IF EXISTS "Usuários podem ver seu perfil ou admin vê todos" ON user_profiles;

CREATE POLICY "Usuários podem ver seu perfil ou admin vê todos"
ON user_profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- 5. Corrigir policy de quiz_attempts
DROP POLICY IF EXISTS "Usuários podem ver seus simulados ou admin vê todos" ON quiz_attempts;

CREATE POLICY "Usuários podem ver seus simulados ou admin vê todos"
ON quiz_attempts FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- ==========================================
-- VERIFICAR SE FUNCIONOU
-- ==========================================

-- Verificar status de RLS
SELECT 
  tablename, 
  CASE 
    WHEN tablename = 'user_roles' THEN 'DEVE SER false'
    ELSE 'DEVE SER true'
  END as "Status Esperado",
  rowsecurity as "Status Atual"
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('analyses', 'user_profiles', 'quiz_attempts', 'user_roles')
ORDER BY tablename;

-- Ver policies criadas (user_roles NÃO deve ter nenhuma)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('analyses', 'user_profiles', 'quiz_attempts', 'user_roles')
ORDER BY tablename, cmd;

-- ==========================================
-- INSTRUÇÕES
-- ==========================================
-- 1. Copie TODO este script
-- 2. Supabase → SQL Editor
-- 3. Cole e clique RUN
-- 4. Recarregue a página AdminRaioXPage
-- 5. O erro de recursão deve sumir!
-- ==========================================
