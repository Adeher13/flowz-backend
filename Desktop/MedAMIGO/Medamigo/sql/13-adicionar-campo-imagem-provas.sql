-- ==========================================
-- ADICIONAR CAMPO PARA IMAGEM NAS PROVAS E QUESTÕES
-- ==========================================

-- Adicionar coluna para URL da imagem do enunciado em provas_anteriores
ALTER TABLE provas_anteriores 
ADD COLUMN IF NOT EXISTS imagem_enunciado TEXT;

-- Comentário explicativo para provas_anteriores
COMMENT ON COLUMN provas_anteriores.imagem_enunciado IS 'URL da imagem associada ao enunciado da questão (opcional)';

-- Adicionar coluna para URL da imagem do enunciado em questoes (se não existir como imagem_questao)
-- Nota: A coluna já existe como 'imagem_questao' na tabela questoes
-- Caso precise padronizar o nome, descomente a linha abaixo:
-- ALTER TABLE questoes RENAME COLUMN imagem_questao TO imagem_enunciado;

-- Se a coluna não existir, cria com o nome imagem_questao
ALTER TABLE questoes 
ADD COLUMN IF NOT EXISTS imagem_questao TEXT;

-- Comentário explicativo para questoes
COMMENT ON COLUMN questoes.imagem_questao IS 'URL da imagem associada ao enunciado da questão (opcional)';

-- Verificar a estrutura atualizada de provas_anteriores
SELECT 'provas_anteriores' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'provas_anteriores' 
ORDER BY ordinal_position;

-- Verificar a estrutura atualizada de questoes
SELECT 'questoes' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'questoes' 
ORDER BY ordinal_position;
