// Controller de autenticação — registro de empresa e usuário pós-signup
import { supabaseAdmin } from '../services/supabaseService.js'
import { createError } from '../middlewares/errorHandler.js'
import { invalidarConfigCache } from '../services/evolutionService.js'
import { invalidarN8nConfigCache } from '../services/n8nService.js'

// Cria o perfil do usuário e uma empresa após o signup via Supabase Auth
// Chamado no primeiro acesso após criar conta
export async function registrarPerfil(req, res, next) {
  try {
    const { nome, nomeEmpresa, segmento } = req.body
    const userId = req.usuario.id
    const email = req.usuario.email

    if (!nome || !nomeEmpresa) {
      throw createError('Nome e nome da empresa são obrigatórios', 400)
    }

    // Verifica se o usuário já tem perfil
    const { data: perfilExistente } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single()

    if (perfilExistente) {
      throw createError('Perfil já cadastrado', 409)
    }

    // Cria a empresa do usuário
    const { data: empresa, error: errEmpresa } = await supabaseAdmin
      .from('empresas')
      .insert({ nome: nomeEmpresa, segmento })
      .select()
      .single()

    if (errEmpresa) throw createError(errEmpresa.message, 500)

    // Cria o pipeline padrão da empresa
    const { data: pipeline, error: errPipeline } = await supabaseAdmin
      .from('pipelines')
      .insert({ empresa_id: empresa.id, nome: 'Pipeline Principal' })
      .select()
      .single()

    if (errPipeline) throw createError(errPipeline.message, 500)

    // Cria etapas padrão do kanban
    const etapasPadrao = [
      { pipeline_id: pipeline.id, nome: 'Novo Lead', cor: '#5A6480', ordem: 0 },
      { pipeline_id: pipeline.id, nome: 'Qualificação', cor: '#7B61FF', ordem: 1 },
      { pipeline_id: pipeline.id, nome: 'Proposta', cor: '#FFB800', ordem: 2 },
      { pipeline_id: pipeline.id, nome: 'Negociação', cor: '#00E5FF', ordem: 3 },
      { pipeline_id: pipeline.id, nome: 'Fechado', cor: '#00FFA3', ordem: 4 },
    ]

    await supabaseAdmin.from('etapas').insert(etapasPadrao)

    // Cria o perfil do usuário vinculado à empresa
    const { data: usuario, error: errUsuario } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: userId,
        empresa_id: empresa.id,
        nome,
        email,
      })
      .select('*, empresa:empresas(*)')
      .single()

    if (errUsuario) throw createError(errUsuario.message, 500)

    res.status(201).json({ usuario, empresa, pipeline })
  } catch (err) {
    next(err)
  }
}

// Retorna o perfil do usuário autenticado
export async function getPerfil(req, res) {
  res.json(req.usuario)
}

// Atualiza dados do perfil do usuário
export async function atualizarPerfil(req, res, next) {
  try {
    const { nome, cargo, avatar_url } = req.body

    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update({ nome, cargo, avatar_url })
      .eq('id', req.usuario.id)
      .select()
      .single()

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Atualiza dados da empresa do usuário autenticado
export async function atualizarEmpresa(req, res, next) {
  try {
    const { nome, segmento, logo_url } = req.body

    const campos = { nome, segmento }
    if (logo_url !== undefined) campos.logo_url = logo_url

    const { data, error } = await supabaseAdmin
      .from('empresas')
      .update(campos)
      .eq('id', req.empresaId)
      .select()
      .single()

    if (error) throw createError(error.message, 500)

    res.json(data)
  } catch (err) {
    next(err)
  }
}

// Retorna configurações de integrações da empresa
export async function getIntegracoes(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select('evolution_api_url, evolution_api_key, n8n_url, n8n_webhook_secret, n8n_ai_webhook_path')
      .eq('id', req.empresaId)
      .single()

    if (error) throw createError(error.message, 500)

    res.json(data || {})
  } catch (err) {
    next(err)
  }
}

// Salva configurações de integrações da empresa
export async function salvarIntegracoes(req, res, next) {
  try {
    const {
      evolution_api_url,
      evolution_api_key,
      n8n_url,
      n8n_webhook_secret,
      n8n_ai_webhook_path,
    } = req.body

    const campos = {}
    if (evolution_api_url !== undefined) campos.evolution_api_url = evolution_api_url || null
    if (evolution_api_key !== undefined) campos.evolution_api_key = evolution_api_key || null
    if (n8n_url !== undefined) campos.n8n_url = n8n_url || null
    if (n8n_webhook_secret !== undefined) campos.n8n_webhook_secret = n8n_webhook_secret || null
    if (n8n_ai_webhook_path !== undefined) campos.n8n_ai_webhook_path = n8n_ai_webhook_path || null

    const { data, error } = await supabaseAdmin
      .from('empresas')
      .update(campos)
      .eq('id', req.empresaId)
      .select('evolution_api_url, evolution_api_key, n8n_url, n8n_webhook_secret, n8n_ai_webhook_path')
      .single()

    if (error) throw createError(error.message, 500)

    // Invalida caches de config para que próximas chamadas busquem os novos valores
    invalidarConfigCache(req.empresaId)
    invalidarN8nConfigCache(req.empresaId)

    res.json(data)
  } catch (err) {
    next(err)
  }
}
