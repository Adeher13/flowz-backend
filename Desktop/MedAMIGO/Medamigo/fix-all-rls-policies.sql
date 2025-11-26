-- Script completo para ativar RLS e criar policies em todas as tabelas principais

-- ============================================
-- 1. TABELA: analyses (Raio-X Acadêmico)
-- ============================================

-- Ativar RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias análises" ON analyses;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias análises" ON analyses;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias análises" ON analyses;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias análises" ON analyses;

-- Criar policies
CREATE POLICY "Usuários podem ver suas próprias análises"
ON analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias análises"
ON analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias análises"
ON analyses FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias análises"
ON analyses FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 2. TABELA: quiz_attempts (Simulados)
-- ============================================

-- Ativar RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios quiz_attempts" ON quiz_attempts;

-- Criar policies
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

-- ============================================
-- 3. TABELA: profiles (Perfis de usuário)
-- ============================================

-- Ativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;

-- Criar policies
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. TABELAS PÚBLICAS (sem autenticação necessária)
-- ============================================

-- Faculdades - todos podem ver
ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver faculdades" ON faculdades;
CREATE POLICY "Todos podem ver faculdades"
ON faculdades FOR SELECT
USING (true);

-- Questões - todos podem ver
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver questões" ON questoes;
CREATE POLICY "Todos podem ver questões"
ON questoes FOR SELECT
USING (true);

-- Simulados - todos podem ver os ativos
ALTER TABLE simulados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ver simulados ativos" ON simulados;
CREATE POLICY "Todos podem ver simulados ativos"
ON simulados FOR SELECT
USING (ativo = true);

-- ============================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se RLS está ativado em todas as tabelas
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('analyses', 'quiz_attempts', 'profiles', 'faculdades', 'questoes', 'simulados')
ORDER BY tablename;

-- Ver todas as policies criadas
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
