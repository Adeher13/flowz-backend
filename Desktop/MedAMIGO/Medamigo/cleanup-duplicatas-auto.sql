-- Script para identificar e remover duplicatas automaticamente
-- Este script não precisa de ID manual

-- 1. Ver TODOS os usuários com duplicatas
SELECT 
  user_id,
  COUNT(*) as total_simulados,
  COUNT(DISTINCT (simulado_nome, finished_at::date)) as simulados_unicos,
  COUNT(*) - COUNT(DISTINCT (simulado_nome, finished_at::date)) as possiveis_duplicatas
FROM quiz_attempts
WHERE finished_at IS NOT NULL
GROUP BY user_id
HAVING COUNT(*) > COUNT(DISTINCT (simulado_nome, finished_at::date))
ORDER BY possiveis_duplicatas DESC;

-- 2. Ver detalhes das duplicatas (todos os usuários)
WITH duplicatas AS (
  SELECT 
    id,
    user_id,
    simulado_nome,
    finished_at,
    nota_final,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, simulado_nome, DATE_TRUNC('minute', finished_at)
      ORDER BY created_at DESC
    ) as rn
  FROM quiz_attempts
  WHERE finished_at IS NOT NULL
)
SELECT 
  user_id,
  simulado_nome,
  finished_at,
  COUNT(*) as total_duplicatas
FROM duplicatas
WHERE rn > 1
GROUP BY user_id, simulado_nome, finished_at
ORDER BY total_duplicatas DESC
LIMIT 20;

-- 3. OPÇÃO 1: Remover TODAS as duplicatas de TODOS os usuários
-- (mantém apenas o registro mais recente de cada simulado por minuto)
-- CUIDADO: Esta query afeta TODOS os usuários!
DELETE FROM quiz_attempts
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, simulado_nome, DATE_TRUNC('minute', finished_at)
        ORDER BY created_at DESC
      ) as rn
    FROM quiz_attempts
    WHERE finished_at IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 4. OPÇÃO 2: Ver quantos seriam removidos (SEM remover)
SELECT COUNT(*) as registros_a_remover
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, simulado_nome, DATE_TRUNC('minute', finished_at)
      ORDER BY created_at DESC
    ) as rn
  FROM quiz_attempts
  WHERE finished_at IS NOT NULL
) t
WHERE t.rn > 1;

-- 5. Verificar total após limpeza
SELECT 
  COUNT(*) as total_simulados_restantes,
  COUNT(DISTINCT user_id) as total_usuarios
FROM quiz_attempts 
WHERE finished_at IS NOT NULL;
