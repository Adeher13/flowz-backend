-- ==========================================
-- PASSO 4: CRIAR PERFIL DO ALUNO DE TESTE
-- ==========================================
-- ⚠️ ANTES DE EXECUTAR:
-- 1. Crie o usuário em Authentication (email: joao.silva@teste.com)
-- 2. Copie o UUID do usuário criado
-- 3. Substitua 'COLE-SEU-UUID-AQUI' abaixo pelo UUID real
-- 4. Execute este script
-- ==========================================

-- Inserir perfil do aluno
INSERT INTO user_profiles (
  user_id,
  full_name,
  avatar_url,
  access_expires_at,
  access_status
) VALUES (
  'COLE-SEU-UUID-AQUI'::uuid,  -- ⬅️ SUBSTITUA AQUI
  'João Silva',
  NULL,
  NOW() + INTERVAL '30 days',  -- Acesso válido por 30 dias
  'active'
);

-- Adicionar role de student (se não existir)
INSERT INTO user_roles (user_id, role)
VALUES ('COLE-SEU-UUID-AQUI'::uuid, 'student')  -- ⬅️ SUBSTITUA AQUI TAMBÉM
ON CONFLICT (user_id, role) DO NOTHING;  -- Ignora se já existir


-- ==========================================
-- VERIFICAR SE FOI CRIADO CORRETAMENTE
-- ==========================================
-- Execute esta query para confirmar:

SELECT 
  up.id,
  up.user_id,
  up.full_name,
  up.access_status,
  up.access_expires_at,
  up.created_at,
  ur.role
FROM user_profiles up
LEFT JOIN user_roles ur ON ur.user_id = up.user_id
WHERE up.full_name = 'João Silva';

-- Deve retornar 1 linha com:
-- - full_name: João Silva
-- - access_status: active
-- - role: student
-- ==========================================
