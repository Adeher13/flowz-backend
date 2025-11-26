-- Adicionar coluna explicacao na tabela questoes
-- Esta coluna armazenará a explicação detalhada da resposta correta

ALTER TABLE questoes 
ADD COLUMN IF NOT EXISTS explicacao TEXT;

-- Adicionar comentário para documentação
COMMENT ON COLUMN questoes.explicacao IS 'Explicação detalhada da resposta correta da questão';
