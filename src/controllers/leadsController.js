// Controller de leads — CRUD completo + movimentação no kanban
import { supabaseAdmin } from '../services/supabaseService.js'
import { createError } from '../middlewares/errorHandler.js'

// Lista leads com filtros opcionais
export async function listarLeads(req, res, next) {
  try {
    const { pipeline_id, etapa_id, responsavel_id, busca, perdido } = req.query

    let query = supabaseAdmin
      .from('leads')
      .select(`
        *,
        contato:contatos(id, nome, telefone, email),
        etapa:etapas(id, nome, cor, ordem),
        responsavel:usuarios(id, nome, avatar_url)
      `)
      .eq('empresa_id', req.empresaId)
      .order('criado_em', { ascending: false })

    if (pipeline_id) query = query.eq('pipeline_id', pipeline_id)
    if (etapa_id)    query = query.eq('etapa_id', etapa_id)
    if (responsavel_id) query = query.eq('responsavel_id', responsavel_id)
    if (perdido !== undefined) query = query.eq('perdido', perdido === 'true')
    if (busca) query = query.ilike('titulo', `%${busca}%`)

    const { data, error } = await query

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Cria um novo lead
export async function criarLead(req, res, next) {
  try {
    const {
      contato_id, pipeline_id, etapa_id, titulo,
      valor, responsavel_id, prioridade, data_fechamento,
    } = req.body

    if (!titulo || !pipeline_id || !etapa_id) {
      throw createError('Título, pipeline e etapa são obrigatórios', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        empresa_id: req.empresaId,
        contato_id,
        pipeline_id,
        etapa_id,
        titulo,
        valor: valor || null,
        responsavel_id: responsavel_id || req.usuario.id,
        prioridade: prioridade || 'media',
        data_fechamento: data_fechamento || null,
      })
      .select(`
        *,
        contato:contatos(id, nome, telefone, email),
        etapa:etapas(id, nome, cor, ordem),
        responsavel:usuarios(id, nome, avatar_url)
      `)
      .single()

    if (error) throw createError(error.message, 500)

    // Registra atividade de criação
    await supabaseAdmin.from('atividades').insert({
      empresa_id: req.empresaId,
      lead_id: data.id,
      contato_id: contato_id || null,
      usuario_id: req.usuario.id,
      tipo: 'sistema',
      descricao: `Lead "${titulo}" criado.`,
    })

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

// Atualiza dados de um lead
export async function atualizarLead(req, res, next) {
  try {
    const { id } = req.params
    const {
      titulo, contato_id, valor, responsavel_id,
      prioridade, data_fechamento, perdido, motivo_perda,
      etapa_id, pipeline_id,
    } = req.body

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({
        titulo,
        contato_id,
        valor,
        responsavel_id,
        prioridade,
        data_fechamento,
        perdido,
        motivo_perda,
        ...(etapa_id && { etapa_id }),
        ...(pipeline_id && { pipeline_id }),
      })
      .eq('id', id)
      .eq('empresa_id', req.empresaId)
      .select(`
        *,
        contato:contatos(id, nome, telefone, email),
        etapa:etapas(id, nome, cor, ordem),
        responsavel:usuarios(id, nome, avatar_url)
      `)
      .single()

    if (error) throw createError(error.message, 500)
    if (!data) throw createError('Lead não encontrado', 404)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Move lead para outra etapa do kanban
export async function moverEtapa(req, res, next) {
  try {
    const { id } = req.params
    const { etapa_id } = req.body

    if (!etapa_id) throw createError('etapa_id é obrigatório', 400)

    // Busca nome da nova etapa para registrar na atividade
    const { data: etapa } = await supabaseAdmin
      .from('etapas')
      .select('nome')
      .eq('id', etapa_id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update({ etapa_id })
      .eq('id', id)
      .eq('empresa_id', req.empresaId)
      .select('*')
      .single()

    if (error) throw createError(error.message, 500)
    if (!data) throw createError('Lead não encontrado', 404)

    // Registra movimentação no histórico
    await supabaseAdmin.from('atividades').insert({
      empresa_id: req.empresaId,
      lead_id: id,
      usuario_id: req.usuario.id,
      tipo: 'sistema',
      descricao: `Lead movido para a etapa "${etapa?.nome || etapa_id}".`,
    })

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Remove um lead
export async function deletarLead(req, res, next) {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('empresa_id', req.empresaId)

    if (error) throw createError(error.message, 500)

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// Busca o histórico de atividades de um lead específico
export async function getAtividades(req, res, next) {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('atividades')
      .select('*, usuario:usuarios(id, nome, avatar_url)')
      .eq('lead_id', id)
      .eq('empresa_id', req.empresaId)
      .order('criado_em', { ascending: false })

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Adiciona uma atividade ao lead
export async function adicionarAtividade(req, res, next) {
  try {
    const { id } = req.params
    const { tipo, descricao } = req.body

    if (!tipo || !descricao) {
      throw createError('Tipo e descrição são obrigatórios', 400)
    }

    // Busca o contato_id do lead para vincular à atividade
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('contato_id')
      .eq('id', id)
      .single()

    const { data, error } = await supabaseAdmin
      .from('atividades')
      .insert({
        empresa_id: req.empresaId,
        lead_id: id,
        contato_id: lead?.contato_id || null,
        usuario_id: req.usuario.id,
        tipo,
        descricao,
      })
      .select('*, usuario:usuarios(id, nome, avatar_url)')
      .single()

    if (error) throw createError(error.message, 500)

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}
