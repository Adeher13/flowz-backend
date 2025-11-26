-- Script para corrigir permissões RLS da tabela quiz_attempts

-- 1. Verificar se RLS está ativado
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'quiz_attempts';

-- 2. ATIVAR RLS (IMPORTANTE PARA SEGURANÇA)
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 3. Criar/atualizar policies corretas:

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios quiz_attempts" ON quiz_attempts;

-- Criar policies corretas
CREATE POLICY "Usuários podem ver seus próprios quiz_attempts"
ON quiz_attempts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios quiz_attempts"
ON quiz_attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios quiz_attempts"
ON quiz_attempts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios quiz_attempts"
ON quiz_attempts FOR DELETE
USING (auth.uid() = user_id);

-- 4. Verificar se as policies foram criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'quiz_attempts';
