// Controller do dashboard — métricas consolidadas do CRM
import { supabaseAdmin } from '../services/supabaseService.js'
import { createError } from '../middlewares/errorHandler.js'

// Retorna todas as métricas do dashboard em uma única requisição
export async function getMetricas(req, res, next) {
  try {
    const empresaId = req.empresaId
    const agora = new Date()

    // Data de início do dia atual
    const inicioDia = new Date(agora)
    inicioDia.setHours(0, 0, 0, 0)

    // Data de 7 dias atrás (para leads parados)
    const seteDiasAtras = new Date(agora)
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    // Busca pipelines da empresa para obter os IDs
    const { data: pipelines } = await supabaseAdmin
      .from('pipelines')
      .select('id')
      .eq('empresa_id', empresaId)

    const pipelineIds = (pipelines || []).map(p => p.id)

    // Executa demais queries em paralelo
    const [
      { data: leads },
      { data: etapas },
      { data: agendamentosHoje },
      { data: leadsParadosIds },
    ] = await Promise.all([
      // Todos os leads ativos (não perdidos)
      supabaseAdmin
        .from('leads')
        .select('id, titulo, valor, etapa_id, criado_em, atualizado_em, etapa:etapas(id, nome, cor, ordem)')
        .eq('empresa_id', empresaId)
        .eq('perdido', false),

      // Etapas dos pipelines da empresa
      pipelineIds.length > 0
        ? supabaseAdmin
            .from('etapas')
            .select('id, nome, cor, ordem')
            .in('pipeline_id', pipelineIds)
            .order('ordem')
        : Promise.resolve({ data: [] }),

      // Agendamentos de hoje
      supabaseAdmin
        .from('agendamentos')
        .select('*, contato:contatos(nome)')
        .eq('empresa_id', empresaId)
        .gte('data_hora', inicioDia.toISOString())
        .lt('data_hora', new Date(inicioDia.getTime() + 86400000).toISOString())
        .order('data_hora'),

      // Leads sem atualização há mais de 7 dias
      supabaseAdmin
        .from('leads')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('perdido', false)
        .lt('atualizado_em', seteDiasAtras.toISOString()),
    ])

    // Agrupa leads por etapa para o funil
    const leadsPorEtapa = (etapas || []).map(etapa => {
      const leadsNaEtapa = (leads || []).filter(l => l.etapa_id === etapa.id)
      const valorTotal = leadsNaEtapa.reduce(
        (acc, l) => acc + (parseFloat(l.valor) || 0), 0
      )
      return {
        id: etapa.id,
        nome: etapa.nome,
        cor: etapa.cor,
        ordem: etapa.ordem,
        quantidade: leadsNaEtapa.length,
        valorTotal,
      }
    })

    // Filtra os leads parados com mais detalhes
    const idsParados = (leadsParadosIds || []).map(l => l.id)
    const leadsParados = (leads || [])
      .filter(l => idsParados.includes(l.id))
      .map(l => ({
        id: l.id,
        titulo: l.titulo,
        etapa: l.etapa,
        atualizado_em: l.atualizado_em,
      }))

    // Calcula totais gerais
    const totalLeadsAtivos = (leads || []).length
    const valorTotalPipeline = (leads || []).reduce(
      (acc, l) => acc + (parseFloat(l.valor) || 0), 0
    )

    res.json({
      totalLeadsAtivos,
      valorTotalPipeline,
      leadsPorEtapa,
      agendamentosHoje: agendamentosHoje || [],
      leadsParados,
    })
  } catch (err) {
    next(err)
  }
}
