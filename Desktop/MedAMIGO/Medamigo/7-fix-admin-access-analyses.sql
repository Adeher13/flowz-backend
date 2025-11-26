-- ==========================================
-- CORRIGIR ACESSO DE ADMIN À TABELA ANALYSES
-- ==========================================
-- Este script permite que admins vejam TODAS as análises
-- enquanto usuários comuns continuam vendo apenas as suas
-- ==========================================

-- IMPORTANTE: Garantir que user_roles NÃO tenha RLS (evita recursão)
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode ver todas as roles" ON user_roles;
DROP POLICY IF EXISTS "Admin pode gerenciar todas as roles" ON user_roles;

-- Remover policy antiga que só permite ver próprias análises
DROP POLICY IF EXISTS "Usuários podem ver suas próprias análises" ON analyses;

-- Criar nova policy que permite:
-- 1. Usuários comuns verem apenas suas próprias análises
-- 2. Admins verem TODAS as análises
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

-- Criar policy para admin DELETAR qualquer análise
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias análises" ON analyses;

CREATE POLICY "Usuários podem deletar suas análises ou admin deleta qualquer uma"
ON analyses FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Criar policy para admin ATUALIZAR qualquer análise
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias análises" ON analyses;

CREATE POLICY "Usuários podem atualizar suas análises ou admin atualiza qualquer uma"
ON analyses FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- ==========================================
-- VERIFICAR SE FOI APLICADO CORRETAMENTE
-- ==========================================
-- Execute esta query para confirmar:

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'analyses'
ORDER BY cmd;

-- Deve retornar as policies atualizadas com permissão para admin

-- ==========================================
-- TESTAR ACESSO
-- ==========================================
-- Como ADMIN, execute:
-- SELECT * FROM analyses;
-- Deve retornar TODAS as análises (incluindo do João)

-- Como ALUNO, execute:
-- SELECT * FROM analyses;
-- Deve retornar apenas as análises do próprio aluno
-- ==========================================
