-- ==========================================
-- LIMPAR ROLES DUPLICADAS
-- ==========================================
-- Este script remove roles duplicadas mantendo apenas uma por usuário
-- Execute no Supabase SQL Editor
-- ==========================================

-- Ver roles duplicadas
SELECT 
  user_id,
  role,
  COUNT(*) as quantidade
FROM user_roles
GROUP BY user_id, role
HAVING COUNT(*) > 1;

-- Deletar duplicatas mantendo apenas uma
DELETE FROM user_roles a
USING user_roles b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.role = b.role;

-- Verificar resultado
SELECT 
  user_id,
  role,
  COUNT(*) as quantidade
FROM user_roles
GROUP BY user_id, role
ORDER BY user_id, role;

-- ==========================================
-- Ver todos os usuários e suas roles
-- ==========================================
SELECT 
  ur.user_id,
  up.full_name,
  STRING_AGG(ur.role, ', ' ORDER BY ur.role) as roles
FROM user_roles ur
LEFT JOIN user_profiles up ON up.user_id = ur.user_id
GROUP BY ur.user_id, up.full_name
ORDER BY up.full_name;
