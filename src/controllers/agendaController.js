// Controller de agenda — CRUD de agendamentos com filtro por data
import { supabaseAdmin } from '../services/supabaseService.js'
import { createError } from '../middlewares/errorHandler.js'
import { enviarConfirmacaoAgendamento } from '../services/whatsappService.js'
import { criarEventoCalendar, deletarEventoCalendar } from './googleCalendarController.js'

// Lista agendamentos com filtro de período
export async function listarAgendamentos(req, res, next) {
  try {
    const { data_inicio, data_fim, status, usuario_id } = req.query

    let query = supabaseAdmin
      .from('agendamentos')
      .select(`
        *,
        contato:contatos(id, nome, telefone),
        lead:leads(id, titulo),
        usuario:usuarios(id, nome, avatar_url)
      `)
      .eq('empresa_id', req.empresaId)
      .order('data_hora', { ascending: true })

    if (data_inicio) query = query.gte('data_hora', data_inicio)
    if (data_fim)    query = query.lte('data_hora', data_fim)
    if (status)      query = query.eq('status', status)
    if (usuario_id)  query = query.eq('usuario_id', usuario_id)

    const { data, error } = await query

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Cria um novo agendamento
export async function criarAgendamento(req, res, next) {
  try {
    const {
      lead_id, contato_id, titulo, descricao,
      data_hora, duracao_minutos, usuario_id,
    } = req.body

    if (!titulo || !data_hora) {
      throw createError('Título e data/hora são obrigatórios', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .insert({
        empresa_id: req.empresaId,
        lead_id: lead_id || null,
        contato_id: contato_id || null,
        usuario_id: usuario_id || req.usuario.id,
        titulo,
        descricao: descricao || null,
        data_hora,
        duracao_minutos: duracao_minutos || 60,
        status: 'pendente',
      })
      .select(`
        *,
        contato:contatos(id, nome, telefone),
        lead:leads(id, titulo),
        usuario:usuarios(id, nome, avatar_url)
      `)
      .single()

    if (error) throw createError(error.message, 500)

    // Registra atividade no lead vinculado
    if (lead_id) {
      await supabaseAdmin.from('atividades').insert({
        empresa_id: req.empresaId,
        lead_id,
        contato_id: contato_id || null,
        usuario_id: req.usuario.id,
        tipo: 'reuniao',
        descricao: `Agendamento criado: "${titulo}" para ${new Date(data_hora).toLocaleString('pt-BR')}.`,
      })
    }

    // Sincroniza com Google Calendar (se conectado)
    try {
      const googleEventId = await criarEventoCalendar(req.empresaId, {
        titulo,
        data_hora,
        duracao_min: duracao_minutos || 60,
        notas: descricao,
        contato: data.contato,
      })
      if (googleEventId) {
        await supabaseAdmin
          .from('agendamentos')
          .update({ google_event_id: googleEventId })
          .eq('id', data.id)
        data.google_event_id = googleEventId
      }
    } catch (gcErr) {
      console.error('Erro ao sincronizar Google Calendar:', gcErr)
    }

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

// Atualiza o status de um agendamento
export async function atualizarStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body

    const statusValidos = ['pendente', 'confirmado', 'realizado', 'cancelado']
    if (!statusValidos.includes(status)) {
      throw createError(`Status inválido. Use: ${statusValidos.join(', ')}`, 400)
    }

    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .update({ status })
      .eq('id', id)
      .eq('empresa_id', req.empresaId)
      .select(`
        *,
        contato:contatos(id, nome, telefone)
      `)
      .single()

    if (error) throw createError(error.message, 500)
    if (!data) throw createError('Agendamento não encontrado', 404)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Remove um agendamento
export async function deletarAgendamento(req, res, next) {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('agendamentos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', req.empresaId)

    if (error) throw createError(error.message, 500)

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

// Envia confirmação de agendamento via WhatsApp
export async function confirmarViaWhatsApp(req, res, next) {
  try {
    const { id } = req.params

    const { data: agendamento, error } = await supabaseAdmin
      .from('agendamentos')
      .select('*, contato:contatos(nome, telefone)')
      .eq('id', id)
      .eq('empresa_id', req.empresaId)
      .single()

    if (error || !agendamento) throw createError('Agendamento não encontrado', 404)
    if (!agendamento.contato?.telefone) {
      throw createError('Contato não possui telefone cadastrado', 400)
    }

    await enviarConfirmacaoAgendamento({
      empresaId: req.empresaId,
      telefone: agendamento.contato.telefone,
      nomeContato: agendamento.contato.nome,
      tituloAgendamento: agendamento.titulo,
      dataHora: agendamento.data_hora,
    })

    // Marca lembrete como enviado
    await supabaseAdmin
      .from('agendamentos')
      .update({ lembrete_enviado: true })
      .eq('id', id)

    res.json({ mensagem: 'Confirmação enviada via WhatsApp' })
  } catch (err) {
    next(err)
  }
}
