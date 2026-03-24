-- ============================================================
-- Migration 006: Expansão do Agente IA + Disponibilidade
-- Execute no painel SQL do Supabase
-- ============================================================

-- ── Expand agentes_ia com campos de treinamento ──────────────
ALTER TABLE public.agentes_ia
  ADD COLUMN IF NOT EXISTS nome_empresa        TEXT,
  ADD COLUMN IF NOT EXISTS segmento            TEXT,
  ADD COLUMN IF NOT EXISTS tom_voz             TEXT DEFAULT 'neutro',   -- formal | casual | neutro
  ADD COLUMN IF NOT EXISTS sobre_empresa       TEXT,                     -- texto livre de treinamento
  ADD COLUMN IF NOT EXISTS servicos            TEXT,                     -- produtos/serviços oferecidos
  ADD COLUMN IF NOT EXISTS pipeline_id         UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS etapa_inicial_id    UUID REFERENCES public.etapas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS openai_api_key      TEXT,                     -- chave da OpenAI do cliente
  ADD COLUMN IF NOT EXISTS criar_lead_auto     BOOLEAN DEFAULT TRUE,     -- cria lead automaticamente
  ADD COLUMN IF NOT EXISTS transferir_humano   TEXT DEFAULT 'atendente'; -- palavra-gatilho p/ transferir

-- ── Tabela: disponibilidade semanal do agente ────────────────
-- Horários que o agente pode agendar compromissos
CREATE TABLE IF NOT EXISTS public.disponibilidade_agente (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id    UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  dia_semana    INT NOT NULL,          -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
  hora_inicio   TIME NOT NULL,         -- ex: 09:00
  hora_fim      TIME NOT NULL,         -- ex: 18:00
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para lookup por empresa
CREATE INDEX IF NOT EXISTS disponibilidade_agente_empresa_idx
  ON public.disponibilidade_agente(empresa_id, dia_semana);

-- Garante apenas 1 registro por empresa/dia
CREATE UNIQUE INDEX IF NOT EXISTS disponibilidade_agente_empresa_dia_idx
  ON public.disponibilidade_agente(empresa_id, dia_semana);

-- RLS
ALTER TABLE public.disponibilidade_agente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_ve_propria_disponibilidade" ON public.disponibilidade_agente
  FOR ALL TO authenticated
  USING (empresa_id = get_empresa_id())
  WITH CHECK (empresa_id = get_empresa_id());

CREATE POLICY "service_role_full_access_disponibilidade" ON public.disponibilidade_agente
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
