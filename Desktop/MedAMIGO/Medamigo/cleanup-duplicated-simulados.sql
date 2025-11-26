-- Script para identificar e remover simulados duplicados

-- 1. Ver quantos simulados cada usuário tem
SELECT 
  user_id,
  COUNT(*) as total_simulados,
  COUNT(DISTINCT simulado_nome) as simulados_unicos
FROM quiz_attempts
WHERE finished_at IS NOT NULL
GROUP BY user_id
ORDER BY total_simulados DESC;

-- 2. Identificar duplicatas exatas (mesmo usuário, mesmo simulado, mesma nota, mesmo horário próximo)
SELECT 
  user_id,
  simulado_nome,
  nota_final,
  finished_at,
  COUNT(*) as duplicatas
FROM quiz_attempts
WHERE finished_at IS NOT NULL
GROUP BY user_id, simulado_nome, nota_final, finished_at
HAVING COUNT(*) > 1
ORDER BY duplicatas DESC;

-- 3. Ver simulados de um usuário específico (substitua 'SEU_USER_ID')
-- SELECT * FROM quiz_attempts 
-- WHERE user_id = 'SEU_USER_ID' 
-- ORDER BY finished_at DESC;

-- 4. CUIDADO: Remover duplicatas mantendo apenas o registro mais recente
-- Execute esta query APENAS se tiver certeza que quer remover duplicatas
-- DELETE FROM quiz_attempts
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--       ROW_NUMBER() OVER (
--         PARTITION BY user_id, simulado_id, finished_at 
--         ORDER BY created_at DESC
--       ) as rn
--     FROM quiz_attempts
--     WHERE finished_at IS NOT NULL
--   ) t
--   WHERE t.rn > 1
-- );

-- 5. Alternativa: Remover duplicatas por timestamp muito próximo (menos de 1 segundo)
-- Esta query mantém apenas o primeiro registro quando há duplicatas no mesmo segundo
-- DELETE FROM quiz_attempts a
-- USING quiz_attempts b
-- WHERE a.id > b.id 
--   AND a.user_id = b.user_id 
--   AND a.simulado_nome = b.simulado_nome
--   AND a.finished_at BETWEEN b.finished_at - INTERVAL '1 second' 
--                         AND b.finished_at + INTERVAL '1 second';

-- 6. Contar total após limpeza
-- SELECT COUNT(*) FROM quiz_attempts WHERE finished_at IS NOT NULL;
