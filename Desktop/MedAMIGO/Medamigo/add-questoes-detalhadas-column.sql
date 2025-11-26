-- Adicionar coluna questoes_detalhadas na tabela quiz_attempts
-- Esta coluna armazenará todas as questões com as respostas do usuário e corretas

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS questoes_detalhadas JSONB;

-- Adicionar comentário para documentação
COMMENT ON COLUMN quiz_attempts.questoes_detalhadas IS 'Array de objetos contendo cada questão, opções, resposta do usuário e resposta correta';
