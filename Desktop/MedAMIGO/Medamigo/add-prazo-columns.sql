-- Adicionar colunas de controle de prazo na tabela analyses

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS prazo_dias INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS prazo_entrega TIMESTAMP WITH TIME ZONE;

-- Atualizar prazo_entrega para análises existentes (8 dias após created_at)
UPDATE analyses 
SET prazo_entrega = created_at + INTERVAL '8 days'
WHERE prazo_entrega IS NULL;

-- Comentários
COMMENT ON COLUMN analyses.prazo_dias IS 'Prazo em dias para entrega da análise (padrão 8 dias)';
COMMENT ON COLUMN analyses.prazo_entrega IS 'Data/hora estimada de entrega da análise';
