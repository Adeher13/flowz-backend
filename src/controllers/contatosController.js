// Controller de contatos — CRUD completo com busca
import { supabaseAdmin } from '../services/supabaseService.js'
import { createError } from '../middlewares/errorHandler.js'

// Lista contatos com busca opcional por nome, email ou telefone
export async function listarContatos(req, res, next) {
  try {
    const { search, origem, tags } = req.query

    let query = supabaseAdmin
      .from('contatos')
      .select('*')
      .eq('empresa_id', req.empresaId)
      .order('nome', { ascending: true })

    if (origem) query = query.eq('origem', origem)
    if (tags)   query = query.contains('tags', [tags])

    if (search) {
      // Busca em nome, email e telefone simultaneamente
      query = query.or(
        `nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`
      )
    }

    const { data, error } = await query

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Busca um contato com seus leads vinculados
export async function getContato(req, res, next) {
  try {
    const { id } = req.params

    const [{ data: contato, error: errContato }, { data: leads }, { data: atividades }] =
      await Promise.all([
        supabaseAdmin
          .from('contatos')
          .select('*')
          .eq('id', id)
          .eq('empresa_id', req.empresaId)
          .single(),
        supabaseAdmin
          .from('leads')
          .select('id, titulo, valor, prioridade, etapa:etapas(nome, cor)')
          .eq('contato_id', id)
          .eq('empresa_id', req.empresaId)
          .order('criado_em', { ascending: false }),
        supabaseAdmin
          .from('atividades')
          .select('*, usuario:usuarios(id, nome, avatar_url)')
          .eq('contato_id', id)
          .eq('empresa_id', req.empresaId)
          .order('criado_em', { ascending: false })
          .limit(20),
      ])

    if (errContato || !contato) throw createError('Contato não encontrado', 404)

    res.json({ ...contato, leads, atividades })
  } catch (err) {
    next(err)
  }
}

// Cria um novo contato
export async function criarContato(req, res, next) {
  try {
    const { nome, telefone, email, origem, tags, notas } = req.body

    if (!nome) throw createError('Nome é obrigatório', 400)

    const { data, error } = await supabaseAdmin
      .from('contatos')
      .insert({
        empresa_id: req.empresaId,
        nome,
        telefone: telefone || null,
        email: email || null,
        origem: origem || 'manual',
        tags: tags || [],
        notas: notas || null,
      })
      .select()
      .single()

    if (error) throw createError(error.message, 500)

    res.status(201).json(data)
  } catch (err) {
    next(err)
  }
}

// Atualiza dados de um contato
export async function atualizarContato(req, res, next) {
  try {
    const { id } = req.params
    const { nome, telefone, email, origem, tags, notas } = req.body

    const { data, error } = await supabaseAdmin
      .from('contatos')
      .update({ nome, telefone, email, origem, tags, notas })
      .eq('id', id)
      .eq('empresa_id', req.empresaId)
      .select()
      .single()

    if (error) throw createError(error.message, 500)
    if (!data) throw createError('Contato não encontrado', 404)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Remove um contato
export async function deletarContato(req, res, next) {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('contatos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', req.empresaId)

    if (error) throw createError(error.message, 500)

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
