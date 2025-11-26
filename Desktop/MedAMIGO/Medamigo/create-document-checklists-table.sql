-- Criar tabela para armazenar o progresso do checklist de documentos
CREATE TABLE IF NOT EXISTS document_checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL CHECK (location IN ('brasil', 'exterior')),
  checked_items JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_document_checklists_user_id ON document_checklists(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE document_checklists ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: usuário pode ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios checklists"
  ON document_checklists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política de INSERT: usuário pode inserir apenas seus próprios dados
CREATE POLICY "Usuários podem inserir seus próprios checklists"
  ON document_checklists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política de UPDATE: usuário pode atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios checklists"
  ON document_checklists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política de DELETE: usuário pode deletar apenas seus próprios dados
CREATE POLICY "Usuários podem deletar seus próprios checklists"
  ON document_checklists
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE document_checklists IS 'Armazena o progresso do checklist de documentos de cada usuário';
COMMENT ON COLUMN document_checklists.location IS 'Localização do estudante: brasil ou exterior';
COMMENT ON COLUMN document_checklists.checked_items IS 'JSON com os IDs dos documentos marcados como completos';
