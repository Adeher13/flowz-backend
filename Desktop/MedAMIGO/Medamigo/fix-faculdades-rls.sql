-- Políticas RLS para a tabela faculdades
-- Permitir que administradores possam editar, adicionar e excluir faculdades

-- Habilitar RLS na tabela
ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem visualizar faculdades" ON faculdades;
DROP POLICY IF EXISTS "Admins podem inserir faculdades" ON faculdades;
DROP POLICY IF EXISTS "Admins podem atualizar faculdades" ON faculdades;
DROP POLICY IF EXISTS "Admins podem deletar faculdades" ON faculdades;

-- Política de SELECT: Todos podem ver faculdades (público)
CREATE POLICY "Todos podem visualizar faculdades"
ON faculdades
FOR SELECT
USING (true);

-- Política de INSERT: Apenas admins podem adicionar
CREATE POLICY "Admins podem inserir faculdades"
ON faculdades
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Política de UPDATE: Apenas admins podem atualizar
CREATE POLICY "Admins podem atualizar faculdades"
ON faculdades
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Política de DELETE: Apenas admins podem deletar
CREATE POLICY "Admins podem deletar faculdades"
ON faculdades
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'faculdades';
