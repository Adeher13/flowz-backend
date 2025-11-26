-- ==========================================
-- CRIAR TABELA: semester_grades
-- ==========================================
-- Tabela para armazenar notas dos semestres dos alunos
-- ==========================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS semester_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semester_number INTEGER NOT NULL, -- Ex: 1, 2, 3, 4, 5, 6
  semester_year INTEGER, -- Ex: 2024, 2025
  semester_period TEXT, -- Ex: "2024.1", "2024.2"
  
  -- Disciplinas e notas (JSON array)
  subjects_json JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{ name: "Anatomia", grade: 8.5, credits: 4, status: "Aprovado" }]
  
  -- Estatísticas calculadas
  average_grade DECIMAL(4,2), -- Média do semestre
  total_credits INTEGER DEFAULT 0, -- Total de créditos
  approved_subjects INTEGER DEFAULT 0, -- Disciplinas aprovadas
  failed_subjects INTEGER DEFAULT 0, -- Disciplinas reprovadas
  
  -- Observações
  notes TEXT, -- Observações do aluno sobre o semestre
  
  -- Controle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índice único para evitar duplicatas
  UNIQUE(user_id, semester_number, semester_year)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_semester_grades_user_id ON semester_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_semester_grades_semester ON semester_grades(user_id, semester_number);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_semester_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_semester_grades_updated_at ON semester_grades;
CREATE TRIGGER trigger_update_semester_grades_updated_at
  BEFORE UPDATE ON semester_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_semester_grades_updated_at();

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

ALTER TABLE semester_grades ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias notas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notas" ON semester_grades;
CREATE POLICY "Usuários podem ver suas próprias notas"
ON semester_grades FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- Usuários podem inserir suas próprias notas
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias notas" ON semester_grades;
CREATE POLICY "Usuários podem inserir suas próprias notas"
ON semester_grades FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias notas
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notas" ON semester_grades;
CREATE POLICY "Usuários podem atualizar suas próprias notas"
ON semester_grades FOR UPDATE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias notas
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias notas" ON semester_grades;
CREATE POLICY "Usuários podem deletar suas próprias notas"
ON semester_grades FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

-- ==========================================
-- VERIFICAÇÃO
-- ==========================================

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'semester_grades'
ORDER BY ordinal_position;

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'semester_grades';

-- ==========================================
-- EXEMPLO DE USO
-- ==========================================
-- INSERT INTO semester_grades (
--   user_id,
--   semester_number,
--   semester_year,
--   semester_period,
--   subjects_json
-- ) VALUES (
--   'uuid-do-usuario',
--   1,
--   2024,
--   '2024.1',
--   '[
--     {"name": "Anatomia Humana I", "grade": 8.5, "credits": 6, "status": "Aprovado"},
--     {"name": "Bioquímica", "grade": 7.0, "credits": 4, "status": "Aprovado"}
--   ]'::jsonb
-- );
-- ==========================================
