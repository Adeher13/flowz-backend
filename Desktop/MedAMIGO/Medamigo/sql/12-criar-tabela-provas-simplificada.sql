-- ==========================================
-- CRIAR TABELA: provas_anteriores (SEM created_by)
-- ==========================================
-- Versão simplificada sem foreign key para auth.users
-- ==========================================

-- IMPORTANTE: Execute este script se o outro der erro de foreign key

-- 1. Dropar tabela se existir (CUIDADO: apaga dados!)
DROP TABLE IF EXISTS provas_anteriores CASCADE;

-- 2. Criar a tabela SEM created_by
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_faculdade ON provas_anteriores(nome_faculdade);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_ano ON provas_anteriores(ano);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_disciplina ON provas_anteriores(disciplina);
CREATE INDEX IF NOT EXISTS idx_provas_anteriores_created_at ON provas_anteriores(created_at DESC);

-- 4. Criar trigger para atualizar updated_at automaticamente
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

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE provas_anteriores ENABLE ROW LEVEL SECURITY;

-- 6. Policies de RLS

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

-- 7. Comentários na tabela e colunas
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

-- 8. Teste de inserção
INSERT INTO provas_anteriores (
    nome_faculdade,
    ano,
    enunciado,
    opcao_a,
    opcao_b,
    opcao_c,
    opcao_d,
    resposta_correta,
    disciplina
) VALUES (
    'TESTE - Instalação',
    2024,
    'Esta é uma questão de teste da instalação. A tabela foi criada corretamente?',
    'Sim, funcionou perfeitamente',
    'Não, deu erro',
    'Parcialmente',
    'Não sei dizer',
    'A',
    'Teste de Sistema'
);

-- 9. Verificar se inseriu
SELECT * FROM provas_anteriores WHERE nome_faculdade LIKE 'TESTE%';

-- 10. Ver total de questões
SELECT COUNT(*) as total_questoes FROM provas_anteriores;
