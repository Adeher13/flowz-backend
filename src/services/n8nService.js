// Serviço N8N — dispara workflows de automação e agentes de IA
// Recebe resposta do N8N para enviar de volta via Evolution API
import { supabaseAdmin } from './supabaseService.js'

// ============================================================
// CONFIGURAÇÃO POR EMPRESA — busca URL/Secret do banco
// ============================================================

const _n8nConfigCache = new Map() // empresaId → { url, secret, path, ts }
const N8N_CONFIG_TTL = 60_000

async function getN8nConfigEmpresa(empresaId) {
  const cached = _n8nConfigCache.get(empresaId)
  if (cached && Date.now() - cached.ts < N8N_CONFIG_TTL) {
    return { url: cached.url, secret: cached.secret, path: cached.path }
  }

  const { data } = await supabaseAdmin
    .from('empresas')
    .select('n8n_url, n8n_webhook_secret, n8n_ai_webhook_path')
    .eq('id', empresaId)
    .single()

  const url    = data?.n8n_url              || process.env.N8N_URL              || 'http://localhost:5678'
  const secret = data?.n8n_webhook_secret   || process.env.N8N_WEBHOOK_SECRET   || ''
  const path   = data?.n8n_ai_webhook_path  || process.env.N8N_AI_WEBHOOK_PATH  || 'flowz-ai-agent'

  _n8nConfigCache.set(empresaId, { url, secret, path, ts: Date.now() })
  return { url, secret, path }
}

export function invalidarN8nConfigCache(empresaId) {
  _n8nConfigCache.delete(empresaId)
}

// ============================================================
// DISPARADOR DE WORKFLOW
// ============================================================

// Envia mensagem recebida para o N8N processar com IA
// O N8N retorna { resposta: string } ou { ignorar: true }
export async function dispararAgenteIA({ empresaId, instanceName, remetente, nomeRemetente, mensagem, historico = [] }) {
  const { url: baseUrl, secret, path } = await getN8nConfigEmpresa(empresaId)
  const url = `${baseUrl}/webhook/${path}`

  const payload = {
    empresaId,
    instanceName,
    remetente,           // JID completo: 5511999@s.whatsapp.net
    nomeRemetente,       // pushName do WhatsApp
    mensagem,            // texto da mensagem atual
    historico,           // array de { papel: 'usuario'|'assistente', conteudo: string }
    timestamp: Date.now(),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-webhook-secret': secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    })

    if (!res.ok) {
      console.warn(`[N8N] Webhook retornou ${res.status} para ${empresaId}`)
      return null
    }

    const data = await res.json().catch(() => null)
    return data // { resposta: '...', ignorar: false } ou null
  } catch (err) {
    console.warn(`[N8N] Falha ao disparar agente: ${err.message}`)
    return null
  }
}

// ============================================================
// HISTÓRICO DE CONVERSA — busca do Supabase para contexto da IA
// ============================================================

// Busca as últimas N mensagens de uma conversa para enviar como contexto ao N8N
export async function buscarHistoricoParaIA(empresaId, jid, limite = 20) {
  const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

  const { data: msgs } = await supabaseAdmin
    .from('mensagens_whatsapp')
    .select('de_mim, texto, criado_em')
    .eq('empresa_id', empresaId)
    .eq('telefone', telefone)
    .order('criado_em', { ascending: false })
    .limit(limite)

  if (!msgs || msgs.length === 0) return []

  // Inverte para ordem cronológica e formata para o formato de histórico da IA
  return msgs
    .reverse()
    .map(m => ({
      papel: m.de_mim ? 'assistente' : 'usuario',
      conteudo: m.texto || '',
    }))
}

// ============================================================
// PERSISTÊNCIA DE MENSAGENS
// ============================================================

// Salva mensagem no Supabase para histórico persistente
export async function salvarMensagem({ empresaId, jid, mensagemId, texto, deMim, timestamp, tipo = 'texto' }) {
  const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

  await supabaseAdmin
    .from('mensagens_whatsapp')
    .upsert({
      empresa_id: empresaId,
      telefone,
      jid,
      mensagem_id: mensagemId,
      texto,
      de_mim: deMim,
      tipo,
      criado_em: new Date(timestamp).toISOString(),
    }, { onConflict: 'mensagem_id' })
    .throwOnError()
}

// ============================================================
// CONFIGURAÇÃO DO AGENTE POR EMPRESA
// ============================================================

// Verifica se a empresa tem agente IA ativo
export async function getConfiguracaoAgente(empresaId) {
  const { data } = await supabaseAdmin
    .from('agentes_ia')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .maybeSingle()
  return data // null se não tiver agente configurado
}
