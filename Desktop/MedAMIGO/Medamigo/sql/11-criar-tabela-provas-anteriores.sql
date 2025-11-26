-- ==========================================
-- CRIAR TABELA: provas_anteriores
-- ==========================================
-- Tabela para armazenar questões de provas anteriores de faculdades
-- ==========================================

-- 1. Criar a tabela
CREATE TABLE IF NOT EXISTS provas_anteriores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_faculdade TEXT NOT NULL,
    ano INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    opcao_a TEXT NOT NULL,
    opcao_b TEXT NOT NULL,
    opcao_c TEXT NOT NULL,
    opcao_d TEXT NOT NULL,
    opcao_e TEXT,
    resposta_correta TEXT NOT NULL,
    comentario TEXT,
    disciplina TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_faculdade ON provas_anteriores(nome_faculdade);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_ano ON provas_anteriores(ano);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_disciplina ON provas_anteriores(disciplina);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_created_at ON provas_anteriores(created_at DESC);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_provas_anteriores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provas_anteriores_updated_at
    BEFORE UPDATE ON provas_anteriores
    FOR EACH ROW
    EXECUTE FUNCTION update_provas_anteriores_updated_at();

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE provas_anteriores ENABLE ROW LEVEL SECURITY;

-- 5. Policies de RLS

-- Policy: Usuários autenticados podem ver todas as provas
CREATE POLICY "Usuários autenticados podem ver provas anteriores"
ON provas_anteriores FOR SELECT
TO authenticated
USING (true);

-- Policy: Apenas admins podem inserir
CREATE POLICY "Admins podem inserir provas anteriores"
ON provas_anteriores FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Policy: Apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar provas anteriores"
ON provas_anteriores FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- Policy: Apenas admins podem deletar
CREATE POLICY "Admins podem deletar provas anteriores"
ON provas_anteriores FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    )
);

-- 6. Comentários na tabela e colunas
COMMENT ON TABLE provas_anteriores IS 'Armazena questões de provas anteriores de faculdades para estudo';
COMMENT ON COLUMN provas_anteriores.nome_faculdade IS 'Nome da faculdade/universidade';
COMMENT ON COLUMN provas_anteriores.ano IS 'Ano da prova';
COMMENT ON COLUMN provas_anteriores.enunciado IS 'Texto do enunciado da questão';
COMMENT ON COLUMN provas_anteriores.opcao_a IS 'Alternativa A';
COMMENT ON COLUMN provas_anteriores.opcao_b IS 'Alternativa B';
COMMENT ON COLUMN provas_anteriores.opcao_c IS 'Alternativa C';
COMMENT ON COLUMN provas_anteriores.opcao_d IS 'Alternativa D';
COMMENT ON COLUMN provas_anteriores.opcao_e IS 'Alternativa E (opcional)';
COMMENT ON COLUMN provas_anteriores.resposta_correta IS 'Letra da resposta correta (A, B, C, D ou E)';
COMMENT ON COLUMN provas_anteriores.comentario IS 'Explicação/comentário sobre a resposta correta';
COMMENT ON COLUMN provas_anteriores.disciplina IS 'Disciplina da questão';

-- ==========================================
-- VERIFICAR CRIAÇÃO
-- ==========================================

-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'provas_anteriores' 
ORDER BY ordinal_position;

-- Ver policies criadas
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'provas_anteriores';

-- ==========================================
-- INSTRUÇÕES
-- ==========================================
-- 1. Copie TODO este script
-- 2. Supabase → SQL Editor → New Query
-- 3. Cole e clique RUN
-- 4. A tabela será criada com RLS e policies
-- ==========================================
