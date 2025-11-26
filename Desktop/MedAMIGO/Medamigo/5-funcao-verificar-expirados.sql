-- ==========================================
-- FUNÇÃO PARA ATUALIZAR STATUS EXPIRADOS AUTOMATICAMENTE
-- ==========================================
-- Execute este script no Supabase SQL Editor
-- Esta função será chamada automaticamente para verificar
-- e atualizar o status de acessos expirados
-- ==========================================

-- Criar função que atualiza status expirados
CREATE OR REPLACE FUNCTION check_and_update_expired_access()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET access_status = 'expired'
  WHERE 
    access_expires_at IS NOT NULL 
    AND access_expires_at < NOW()
    AND access_status != 'suspended'
    AND access_status != 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- AGENDAR VERIFICAÇÃO AUTOMÁTICA (OPCIONAL)
-- ==========================================
-- Se você tem pg_cron habilitado no Supabase, pode agendar
-- a função para rodar automaticamente a cada hora:
-- 
-- SELECT cron.schedule(
--   'check-expired-access',
--   '0 * * * *',  -- A cada hora no minuto 0
--   'SELECT check_and_update_expired_access();'
-- );
-- 
-- Para habilitar pg_cron no Supabase:
-- 1. Vá em Database > Extensions
-- 2. Procure por "pg_cron"
-- 3. Clique em "Enable"
-- ==========================================

-- ==========================================
-- ATUALIZAR MANUALMENTE AGORA
-- ==========================================
-- Execute isso para atualizar status expirados imediatamente:
SELECT check_and_update_expired_access();

-- Verificar quantos foram atualizados:
SELECT 
  COUNT(*) as total_expirados,
  COUNT(*) FILTER (WHERE access_status = 'expired') as marcados_expirados
FROM user_profiles
WHERE access_expires_at < NOW();

-- ==========================================
-- VISUALIZAR ALUNOS POR STATUS
-- ==========================================
SELECT 
  access_status,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentual
FROM user_profiles
GROUP BY access_status
ORDER BY quantidade DESC;

-- ==========================================
-- ALUNOS QUE VENCERÃO NOS PRÓXIMOS 7 DIAS
-- ==========================================
SELECT 
  full_name,
  access_expires_at,
  EXTRACT(DAY FROM (access_expires_at - NOW())) as dias_restantes
FROM user_profiles
WHERE 
  access_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND access_status = 'active'
ORDER BY access_expires_at ASC;
