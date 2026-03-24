// Serviço Evolution API — gerencia instâncias WhatsApp por empresa
// Substitui o Baileys direto por uma API REST robusta e multi-tenant
import { supabaseAdmin } from './supabaseService.js'

const WEBHOOK_BASE = process.env.EVOLUTION_WEBHOOK_URL || process.env.FRONTEND_URL?.replace('5173', '3001') || 'http://localhost:3001'

// ============================================================
// CONFIGURAÇÃO POR EMPRESA — busca URL/Key salvas no banco
// ============================================================

// Cache simples em memória para evitar query no banco a cada chamada
const _configCache = new Map() // empresaId → { url, apiKey, ts }
const CONFIG_TTL = 60_000      // 1 min

async function getConfigEmpresa(empresaId) {
  const cached = _configCache.get(empresaId)
  if (cached && Date.now() - cached.ts < CONFIG_TTL) {
    return { url: cached.url, apiKey: cached.apiKey }
  }

  const { data } = await supabaseAdmin
    .from('empresas')
    .select('evolution_api_url, evolution_api_key')
    .eq('id', empresaId)
    .single()

  const url    = data?.evolution_api_url  || process.env.EVOLUTION_API_URL  || 'http://localhost:8080'
  const apiKey = data?.evolution_api_key  || process.env.EVOLUTION_API_KEY  || ''

  _configCache.set(empresaId, { url, apiKey, ts: Date.now() })
  return { url, apiKey }
}

// Invalida o cache de configuração de uma empresa (após salvar novas configs)
export function invalidarConfigCache(empresaId) {
  _configCache.delete(empresaId)
}

// ============================================================
// CLIENTE HTTP — wrapper para chamadas à Evolution API
// ============================================================

export async function evoFetch(path, options = {}, empresaId = null) {
  let baseUrl, apiKey

  if (empresaId) {
    const config = await getConfigEmpresa(empresaId)
    baseUrl = config.url
    apiKey  = config.apiKey
  } else {
    baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
    apiKey  = process.env.EVOLUTION_API_KEY || ''
  }

  const url = `${baseUrl}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
      ...options.headers,
    },
  })

  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }

  if (!res.ok) {
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`
    throw new Error(`[Evolution] ${res.status} ${path}: ${msg}`)
  }

  return data
}

// ============================================================
// INSTÂNCIAS — uma por empresa/número WhatsApp
// ============================================================

// Cria uma nova instância WhatsApp para a empresa
export async function criarInstancia({ empresaId, instanceName }) {
  const webhookUrl = `${WEBHOOK_BASE}/api/v1/whatsapp/webhook`

  const body = {
    instanceName,
    integration: 'WHATSAPP-BAILEYS',
    qrcode: true,
    rejectCall: false,
    groupsIgnore: true,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false,
    webhook: {
      url: webhookUrl,
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'MESSAGES_DELETE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'CHATS_UPSERT',
        'CONTACTS_UPSERT',
      ],
    },
  }

  const data = await evoFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify(body),
  }, empresaId)

  const { apiKey } = await getConfigEmpresa(empresaId)

  // Persiste no Supabase: instanceName e apikey da instância
  await supabaseAdmin
    .from('whatsapp_instancias')
    .upsert({
      empresa_id: empresaId,
      instance_name: instanceName,
      instance_id: data.instance?.instanceId || null,
      apikey: data.hash?.apikey || apiKey,
      status: 'created',
      criado_em: new Date().toISOString(),
    }, { onConflict: 'empresa_id' })

  return data
}

// Busca instância da empresa no banco
export async function getInstanciaDaEmpresa(empresaId) {
  const { data } = await supabaseAdmin
    .from('whatsapp_instancias')
    .select('*')
    .eq('empresa_id', empresaId)
    .maybeSingle()
  return data
}

// Busca instância pelo nome (usado no webhook)
export async function getInstanciaPorNome(instanceName) {
  const { data } = await supabaseAdmin
    .from('whatsapp_instancias')
    .select('*')
    .eq('instance_name', instanceName)
    .maybeSingle()
  return data
}

// Conecta instância e retorna QR code
export async function conectarInstancia(instanceName, empresaId) {
  return evoFetch(`/instance/connect/${instanceName}`, {}, empresaId)
}

// Retorna estado atual da conexão
export async function getEstadoConexao(instanceName, empresaId) {
  return evoFetch(`/instance/connectionState/${instanceName}`, {}, empresaId)
}

// Desconecta (logout) da instância
export async function desconectarInstancia(instanceName, empresaId) {
  return evoFetch(`/instance/logout/${instanceName}`, { method: 'DELETE' }, empresaId)
}

// Reinicia instância (sem logout)
export async function reiniciarInstancia(instanceName, empresaId) {
  return evoFetch(`/instance/restart/${instanceName}`, { method: 'PUT' }, empresaId)
}

// Deleta instância permanentemente
export async function deletarInstancia(instanceName, empresaId) {
  await evoFetch(`/instance/delete/${instanceName}`, { method: 'DELETE' }, empresaId)
  await supabaseAdmin
    .from('whatsapp_instancias')
    .delete()
    .eq('instance_name', instanceName)
}

// Lista todas instâncias (admin)
export async function listarInstancias(empresaId) {
  return evoFetch('/instance/fetchInstances', {}, empresaId)
}

// ============================================================
// ENVIO DE MENSAGENS
// ============================================================

export async function enviarTexto({ instanceName, numero, texto, delay = 1200, empresaId }) {
  // Normaliza número: remove tudo que não é dígito
  const num = numero.replace(/\D/g, '')
  return evoFetch(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: num,
      text: texto,
      delay,
    }),
  }, empresaId)
}

export async function enviarMidia({ instanceName, numero, tipo, url, legenda, nomeArquivo, delay = 0, empresaId }) {
  const num = numero.replace(/\D/g, '')
  return evoFetch(`/message/sendMedia/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      number: num,
      mediatype: tipo, // 'image' | 'video' | 'audio' | 'document'
      media: url,
      caption: legenda || '',
      fileName: nomeArquivo || '',
      delay,
    }),
  }, empresaId)
}

// ============================================================
// FOTO DE PERFIL
// ============================================================

export async function buscarFotoPerfil(instanceName, numero, empresaId) {
  const num = numero.replace(/\D/g, '')
  return evoFetch(`/chat/fetchProfilePictureUrl/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ number: num }),
  }, empresaId)
}

// ============================================================
// CONFIGURAÇÃO DE WEBHOOK
// ============================================================

export async function configurarWebhook(instanceName, empresaId) {
  const webhookUrl = `${WEBHOOK_BASE}/api/v1/whatsapp/webhook`
  return evoFetch(`/webhook/set/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'MESSAGES_DELETE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'CHATS_UPSERT',
          'CONTACTS_UPSERT',
        ],
      },
    }),
  }, empresaId)
}

export async function getWebhookConfig(instanceName, empresaId) {
  return evoFetch(`/webhook/find/${instanceName}`, {}, empresaId)
}

// ============================================================
// ATUALIZAÇÃO DE STATUS NO BANCO
// ============================================================

export async function atualizarStatusInstancia(instanceName, status) {
  await supabaseAdmin
    .from('whatsapp_instancias')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('instance_name', instanceName)
}
