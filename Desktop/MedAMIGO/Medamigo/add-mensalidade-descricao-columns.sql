-- Adicionar colunas de mensalidade e descrição na tabela faculdades

-- Adicionar coluna de mensalidade (valor em reais)
ALTER TABLE faculdades 
ADD COLUMN IF NOT EXISTS mensalidade TEXT;

-- Adicionar coluna de descrição
ALTER TABLE faculdades 
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Comentários para documentação
COMMENT ON COLUMN faculdades.mensalidade IS 'Valor da mensalidade ou "Gratuita" para instituições públicas';
COMMENT ON COLUMN faculdades.descricao IS 'Descrição detalhada da instituição e diferenciais';
