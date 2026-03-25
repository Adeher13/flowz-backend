// Controller do Agente IA — CRUD de configuração + disponibilidade
import { supabaseAdmin } from '../services/supabaseService.js'
import { invalidarN8nConfigCache } from '../services/n8nService.js'

// ============================================================
// AGENTE IA — configuração principal
// ============================================================

export async function getAgente(req, res) {
  const empresaId = req.empresaId

  const { data, error } = await supabaseAdmin
    .from('agentes_ia')
    .select('*')
    .eq('empresa_id', empresaId)
    .maybeSingle()

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data || {})
}

export async function salvarAgente(req, res) {
  const empresaId = req.empresaId
  const {
    nome,
    ativo,
    nome_empresa,
    segmento,
    tom_voz,
    sobre_empresa,
    servicos,
    pipeline_id,
    etapa_inicial_id,
    openai_api_key,
    criar_lead_auto,
    transferir_humano,
    n8n_webhook_path,
    modelo_ia,
    temperatura,
    max_tokens,
    mensagem_fora_hora,
    prompt_sistema,
    duracao_atendimento_min,
    dias_antecedencia,
  } = req.body

  const payload = {
    empresa_id: empresaId,
    ...(nome                    !== undefined && { nome }),
    ...(ativo                   !== undefined && { ativo }),
    ...(nome_empresa            !== undefined && { nome_empresa }),
    ...(segmento                !== undefined && { segmento }),
    ...(tom_voz                 !== undefined && { tom_voz }),
    ...(sobre_empresa           !== undefined && { sobre_empresa }),
    ...(servicos                !== undefined && { servicos }),
    ...(pipeline_id             !== undefined && { pipeline_id: pipeline_id || null }),
    ...(etapa_inicial_id        !== undefined && { etapa_inicial_id: etapa_inicial_id || null }),
    ...(openai_api_key          !== undefined && { openai_api_key }),
    ...(criar_lead_auto         !== undefined && { criar_lead_auto }),
    ...(transferir_humano       !== undefined && { transferir_humano }),
    ...(n8n_webhook_path        !== undefined && { n8n_webhook_path }),
    ...(modelo_ia               !== undefined && { modelo_ia }),
    ...(temperatura             !== undefined && { temperatura }),
    ...(max_tokens              !== undefined && { max_tokens }),
    ...(mensagem_fora_hora      !== undefined && { mensagem_fora_hora }),
    ...(prompt_sistema          !== undefined && { prompt_sistema }),
    ...(duracao_atendimento_min !== undefined && { duracao_atendimento_min }),
    ...(dias_antecedencia       !== undefined && { dias_antecedencia }),
  }

  // Verifica se já existe registro para a empresa
  const { data: existente } = await supabaseAdmin
    .from('agentes_ia')
    .select('id')
    .eq('empresa_id', empresaId)
    .maybeSingle()

  let data, error
  if (existente) {
    ;({ data, error } = await supabaseAdmin
      .from('agentes_ia')
      .update(payload)
      .eq('empresa_id', empresaId)
      .select()
      .single())
  } else {
    ;({ data, error } = await supabaseAdmin
      .from('agentes_ia')
      .insert(payload)
      .select()
      .single())
  }

  if (error) return res.status(500).json({ error: error.message })

  // Invalida cache do N8N para forçar reload das configs
  invalidarN8nConfigCache(empresaId)

  return res.json(data)
}

// ============================================================
// DISPONIBILIDADE SEMANAL
// ============================================================

export async function getDisponibilidade(req, res) {
  const empresaId = req.empresaId

  const { data, error } = await supabaseAdmin
    .from('disponibilidade_agente')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('dia_semana')

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data || [])
}

export async function salvarDisponibilidade(req, res) {
  const empresaId = req.empresaId
  // Recebe array: [{ dia_semana, hora_inicio, hora_fim, ativo }]
  const { disponibilidade } = req.body

  if (!Array.isArray(disponibilidade)) {
    return res.status(400).json({ error: 'Envie um array de disponibilidade.' })
  }

  const payload = disponibilidade.map(d => ({
    empresa_id:  empresaId,
    dia_semana:  d.dia_semana,
    hora_inicio: d.hora_inicio,
    hora_fim:    d.hora_fim,
    ativo:       d.ativo ?? true,
  }))

  const { data, error } = await supabaseAdmin
    .from('disponibilidade_agente')
    .upsert(payload, { onConflict: 'empresa_id,dia_semana' })
    .select()

  if (error) return res.status(500).json({ error: error.message })
  return res.json(data)
}

// ============================================================
// ENDPOINT PÚBLICO — N8N consulta horários disponíveis
// Retorna slots livres para a semana atual (sem auth de usuário)
// ============================================================

export async function getHorariosDisponiveisN8N(req, res) {
  const { empresa_id } = req.params

  if (!empresa_id) return res.status(400).json({ error: 'empresa_id obrigatório.' })

  // Busca configuração de disponibilidade
  const { data: disp } = await supabaseAdmin
    .from('disponibilidade_agente')
    .select('*')
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .order('dia_semana')

  if (!disp || disp.length === 0) {
    return res.json({ slots: [], mensagem: 'Nenhuma disponibilidade configurada.' })
  }

  // Busca agendamentos já marcados nos próximos 7 dias
  const agora = new Date()
  const em7dias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000)

  const { data: agendamentos } = await supabaseAdmin
    .from('agenda')
    .select('data_hora, duracao_min')
    .eq('empresa_id', empresa_id)
    .gte('data_hora', agora.toISOString())
    .lte('data_hora', em7dias.toISOString())
    .neq('status', 'cancelado')

  // Gera slots disponíveis (intervalos de 1h)
  const slots = []
  const ocupados = (agendamentos || []).map(a => new Date(a.data_hora).getTime())

  for (let diasAfrente = 1; diasAfrente <= 7; diasAfrente++) {
    const dia = new Date(agora)
    dia.setDate(dia.getDate() + diasAfrente)
    dia.setHours(0, 0, 0, 0)

    const diaSemana = dia.getDay() // 0=Dom...6=Sab
    const config = disp.find(d => d.dia_semana === diaSemana)
    if (!config) continue

    const [hInicio] = config.hora_inicio.split(':').map(Number)
    const [hFim]    = config.hora_fim.split(':').map(Number)

    for (let h = hInicio; h < hFim; h++) {
      const slot = new Date(dia)
      slot.setHours(h, 0, 0, 0)

      // Pula se já passou
      if (slot <= agora) continue

      // Pula se já tem agendamento na hora
      const jaOcupado = ocupados.some(o => Math.abs(o - slot.getTime()) < 60 * 60 * 1000)
      if (jaOcupado) continue

      slots.push({
        dataHora: slot.toISOString(),
        label: slot.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
               + ' às ' + slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  return res.json({ slots })
}

// ============================================================
// ENDPOINT PÚBLICO — N8N cria agendamento via agente
// ============================================================

export async function criarAgendamentoN8N(req, res) {
  const { empresa_id } = req.params
  const { titulo, data_hora, telefone, nome_contato, duracao_min = 60, notas } = req.body

  if (!empresa_id || !titulo || !data_hora) {
    return res.status(400).json({ error: 'empresa_id, titulo e data_hora são obrigatórios.' })
  }

  // Busca ou cria o contato
  let contatoId = null
  if (telefone) {
    const { data: contatoExistente } = await supabaseAdmin
      .from('contatos')
      .select('id')
      .eq('empresa_id', empresa_id)
      .ilike('telefone', `%${telefone.replace(/\D/g, '')}%`)
      .maybeSingle()

    if (contatoExistente) {
      contatoId = contatoExistente.id
    } else if (nome_contato) {
      const { data: novoContato } = await supabaseAdmin
        .from('contatos')
        .insert({ empresa_id, nome: nome_contato, telefone: telefone.replace(/\D/g, '') })
        .select('id')
        .single()
      contatoId = novoContato?.id
    }
  }

  const { data, error } = await supabaseAdmin
    .from('agenda')
    .insert({
      empresa_id,
      titulo,
      data_hora,
      duracao_min,
      contato_id: contatoId,
      notas: notas || `Agendado pelo Agente IA`,
      status: 'confirmado',
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ sucesso: true, agendamento: data })
}

// ============================================================
// ENDPOINT PÚBLICO — N8N cria lead via agente
// ============================================================

export async function criarLeadN8N(req, res) {
  const { empresa_id } = req.params
  const { titulo, nome_contato, telefone, pipeline_id, etapa_id, valor, notas } = req.body

  if (!empresa_id || !titulo) {
    return res.status(400).json({ error: 'empresa_id e titulo são obrigatórios.' })
  }

  // Busca configuração do agente para pegar pipeline padrão
  let pipelineId = pipeline_id
  let etapaId = etapa_id

  if (!pipelineId || !etapaId) {
    const { data: agente } = await supabaseAdmin
      .from('agentes_ia')
      .select('pipeline_id, etapa_inicial_id')
      .eq('empresa_id', empresa_id)
      .maybeSingle()

    pipelineId = pipelineId || agente?.pipeline_id
    etapaId    = etapaId    || agente?.etapa_inicial_id
  }

  // Busca ou cria contato
  let contatoId = null
  if (telefone) {
    const { data: contatoExistente } = await supabaseAdmin
      .from('contatos')
      .select('id')
      .eq('empresa_id', empresa_id)
      .ilike('telefone', `%${telefone.replace(/\D/g, '')}%`)
      .maybeSingle()

    if (contatoExistente) {
      contatoId = contatoExistente.id
    } else if (nome_contato) {
      const { data: novoContato } = await supabaseAdmin
        .from('contatos')
        .insert({ empresa_id, nome: nome_contato, telefone: telefone.replace(/\D/g, '') })
        .select('id')
        .single()
      contatoId = novoContato?.id
    }
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert({
      empresa_id,
      titulo,
      contato_id: contatoId,
      pipeline_id: pipelineId,
      etapa_id: etapaId,
      valor: valor || null,
      notas: notas || null,
      origem: 'agente_ia',
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.json({ sucesso: true, lead: data })
}

// ============================================================
// ENDPOINT PÚBLICO — N8N busca configuração do agente
// ============================================================

export async function getConfiguracaoN8N(req, res) {
  const { empresa_id } = req.params

  const { data: agente } = await supabaseAdmin
    .from('agentes_ia')
    .select('nome, nome_empresa, segmento, tom_voz, sobre_empresa, servicos, prompt_sistema, modelo_ia, temperatura, max_tokens, criar_lead_auto, transferir_humano, horario_inicio, horario_fim, dias_semana, mensagem_fora_hora, openai_api_key')
    .eq('empresa_id', empresa_id)
    .eq('ativo', true)
    .maybeSingle()

  if (!agente) return res.json({ ativo: false })

  return res.json({ ativo: true, ...agente })
}
