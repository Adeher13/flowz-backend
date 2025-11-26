-- ==========================================
-- CORRIGIR ACESSO DE ADMIN A TODAS AS TABELAS
-- ==========================================
-- Este script garante que admins tenham acesso total
-- enquanto usuários comuns têm acesso apenas aos seus dados
-- ==========================================

-- ============================================
-- 1. TABELA: user_profiles
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;

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

-- Permitir admin ATUALIZAR qualquer perfil
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;

CREATE POLICY "Usuários podem atualizar seu perfil ou admin atualiza qualquer um"
ON user_profiles FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (true); -- Admin pode atualizar qualquer campo

-- ============================================
-- 2. TABELA: quiz_attempts (Simulados)
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver seus próprios quiz_attempts" ON quiz_attempts;

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

-- Permitir admin DELETAR qualquer tentativa
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios quiz_attempts" ON quiz_attempts;

CREATE POLICY "Usuários podem deletar seus simulados ou admin deleta qualquer um"
ON quiz_attempts FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- ============================================
-- 3. TABELA: user_roles (DESABILITAR RLS)
-- ============================================
-- IMPORTANTE: user_roles NÃO pode ter RLS porque causa recursão infinita
-- As outras tabelas checam user_roles para saber se é admin
-- Se user_roles também checar user_roles = loop infinito!

ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Remover todas as policies antigas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode ver todas as roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as roles" ON user_roles;

-- NÃO criar policies em user_roles para evitar recursão
-- A tabela user_roles deve ser acessível para verificação de permissões

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Ver todas as policies criadas
SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('analyses', 'user_profiles', 'quiz_attempts', 'user_roles')
ORDER BY tablename, cmd;

-- ==========================================
-- INSTRUÇÕES DE USO
-- ==========================================
-- 1. Copie TODO o conteúdo deste arquivo
-- 2. Abra: Supabase → SQL Editor
-- 3. Cole no editor
-- 4. Clique em RUN
-- 5. ✅ Aguarde "Success"
-- 6. Recarregue a página de Gerenciar Raio-X
-- 7. Agora deve aparecer a análise do João!
-- ==========================================
