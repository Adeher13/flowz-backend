-- Script para criar aluno fictício de teste

-- 1. Primeiro, crie o usuário via Supabase Dashboard ou Auth API
-- Email: joao.silva@teste.com
-- Senha: Teste@123

-- 2. Depois de criar o usuário, execute este script substituindo o UUID abaixo
-- pelo user_id real do usuário criado

-- Substitua 'SEU-USER-ID-AQUI' pelo UUID do usuário criado
-- Exemplo: '550e8400-e29b-41d4-a716-446655440000'

INSERT INTO user_profiles (
  user_id,
  full_name,
  avatar_url,
  access_expires_at,
  access_status
) VALUES (
  'SEU-USER-ID-AQUI'::uuid,
  'João Silva',
  NULL,
  NOW() + INTERVAL '30 days',  -- Acesso por 30 dias
  'active'
);

-- Adicionar role de student
INSERT INTO user_roles (user_id, role)
VALUES ('SEU-USER-ID-AQUI'::uuid, 'student');

-- Verificar se foi criado
SELECT 
  up.*,
  ur.role
FROM user_profiles up
LEFT JOIN user_roles ur ON ur.user_id = up.user_id
WHERE up.full_name = 'João Silva';
