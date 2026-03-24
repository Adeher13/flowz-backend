// Processador de Webhooks da Evolution API
// Recebe eventos, roteia por empresa, persiste mensagens e dispara N8N
import {
  getInstanciaPorNome,
  atualizarStatusInstancia,
  enviarTexto,
} from './evolutionService.js'
import {
  dispararAgenteIA,
  buscarHistoricoParaIA,
  salvarMensagem,
  getConfiguracaoAgente,
} from './n8nService.js'
import { supabaseAdmin } from './supabaseService.js'

// Clientes WebSocket registrados (mesmo mecanismo do Baileys)
let wsClients = new Set()

export function addWsClientEvo(ws) {
  wsClients.add(ws)
  ws.on('close', () => wsClients.delete(ws))
}

function broadcast(data) {
  const msg = JSON.stringify(data)
  for (const client of wsClients) {
    try { client.send(msg) } catch {}
  }
}

// ============================================================
// ROTEADOR PRINCIPAL DE EVENTOS
// ============================================================

export async function processarWebhookEvo(payload) {
  const { event, instance: instanceName, data } = payload

  if (!event || !instanceName) return

  // Normaliza o evento para maiúsculo com underscore (ex: "messages.upsert" → "MESSAGES_UPSERT")
  const eventNorm = event.toUpperCase().replace(/\./g, '_')

  console.log(`[Webhook] Evento recebido: ${event} → ${eventNorm} (instância: ${instanceName})`)

  // Busca a empresa dona desta instância
  const instancia = await getInstanciaPorNome(instanceName)
  if (!instancia) {
    console.warn(`[Webhook] Instância desconhecida: ${instanceName}`)
    return
  }

  const empresaId = instancia.empresa_id

  switch (eventNorm) {
    case 'CONNECTION_UPDATE':
      await handleConnectionUpdate(instanceName, empresaId, data)
      break
    case 'QRCODE_UPDATED':
      await handleQrcodeUpdated(instanceName, empresaId, data)
      break
    case 'MESSAGES_UPSERT':
      await handleMessagesUpsert(instanceName, empresaId, data)
      break
    case 'MESSAGES_UPDATE':
      await handleMessagesUpdate(instanceName, empresaId, data)
      break
    case 'MESSAGES_DELETE':
      await handleMessagesDelete(instanceName, empresaId, data)
      break
    case 'CHATS_UPSERT':
      await handleChatsUpsert(instanceName, empresaId, data)
      break
    case 'CONTACTS_UPSERT':
      await handleContactsUpsert(instanceName, empresaId, data)
      break
    default:
      // Evento não tratado — ignora silenciosamente
      break
  }
}

// ============================================================
// HANDLERS POR EVENTO
// ============================================================

async function handleConnectionUpdate(instanceName, empresaId, data) {
  const estado = data?.state || 'unknown'
  console.log(`[Webhook] CONNECTION_UPDATE ${instanceName}: ${estado}`)

  await atualizarStatusInstancia(instanceName, estado)

  // Notifica frontend via WebSocket
  broadcast({ type: 'evo_status', instanceName, empresaId, status: estado })
}

async function handleQrcodeUpdated(instanceName, empresaId, data) {
  const qrcode = data?.qrcode
  console.log(`[Webhook] QRCODE_UPDATED ${instanceName}`)

  // Envia QR code base64 para o frontend via WebSocket
  broadcast({
    type: 'evo_qr',
    instanceName,
    empresaId,
    qr: qrcode?.base64 || null,
    code: qrcode?.code || null,
    count: qrcode?.count || 1,
  })
}

async function handleMessagesUpsert(instanceName, empresaId, data) {
  // data pode ser um array ou objeto único dependendo da versão da Evolution API
  const msgs = Array.isArray(data) ? data : [data]

  for (const msg of msgs) {
    if (!msg?.key?.remoteJid) continue

    const jid = msg.key.remoteJid
    const deMim = msg.key.fromMe || false
    const mensagemId = msg.key.id
    const timestamp = (msg.messageTimestamp || Date.now() / 1000) * 1000

    // Ignora grupos
    if (jid.endsWith('@g.us') || jid === 'status@broadcast') continue

    // Extrai texto da mensagem (suporta vários tipos)
    const m = msg.message || {}
    const texto =
      m.conversation ||
      m.extendedTextMessage?.text ||
      m.imageMessage?.caption ||
      m.videoMessage?.caption ||
      m.documentMessage?.caption ||
      (m.imageMessage ? '📷 Imagem' : null) ||
      (m.videoMessage ? '🎥 Vídeo' : null) ||
      (m.pttMessage ? '🎤 Áudio' : null) ||
      (m.audioMessage ? '🎤 Áudio' : null) ||
      (m.documentMessage ? `📄 ${m.documentMessage.fileName || 'Documento'}` : null) ||
      (m.stickerMessage ? '🔖 Sticker' : null) ||
      (m.locationMessage ? '📍 Localização' : null) ||
      (m.contactMessage ? '👤 Contato' : null) ||
      '📎 Mídia'

    // Detecta tipo de mídia
    const tipo =
      m.imageMessage ? 'imagem' :
      m.videoMessage ? 'video' :
      (m.pttMessage || m.audioMessage) ? 'audio' :
      m.documentMessage ? 'documento' :
      m.stickerMessage ? 'sticker' :
      'texto'

    // Persiste no Supabase
    try {
      await salvarMensagem({
        empresaId,
        jid,
        mensagemId,
        texto,
        deMim,
        timestamp,
        tipo,
        instanceName,
      })
    } catch (err) {
      // Ignora duplicatas (upsert por mensagem_id)
      if (!err.message?.includes('duplicate')) {
        console.warn(`[Webhook] Falha ao salvar mensagem: ${err.message}`)
      }
    }

    // Monta objeto para o frontend
    const novaMensagem = {
      id: mensagemId,
      de: deMim ? 'eu' : jid,
      texto,
      timestamp,
      fromMe: deMim,
      status: deMim ? 'enviado' : 'recebido',
      tipo,
    }

    const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

    // Notifica frontend em tempo real
    broadcast({
      type: 'evo_mensagem',
      instanceName,
      empresaId,
      jid,
      mensagem: novaMensagem,
      conversa: {
        jid,
        telefone,
        ultimaMensagem: texto,
        timestamp,
        fromMe: deMim,
        naoLidas: deMim ? 0 : 1,
        nome: msg.pushName || null,
      },
    })

    // Agente IA — só processa mensagens recebidas (não fromMe)
    if (!deMim) {
      await processarComAgenteIA({
        instanceName,
        empresaId,
        jid,
        nomeRemetente: msg.pushName || null,
        texto,
        mensagemId,
      })
    }
  }
}

async function handleMessagesUpdate(instanceName, empresaId, data) {
  const updates = Array.isArray(data) ? data : [data]

  for (const update of updates) {
    const { key, update: upd } = update
    if (!key?.remoteJid || !upd?.status) continue

    // Mapeia status da Evolution para formato interno
    const statusMap = {
      SERVER_ACK: 'enviado',
      DELIVERY_ACK: 'entregue',
      READ: 'lido',
      PLAYED: 'lido',
    }
    const statusInterno = statusMap[upd.status] || upd.status.toLowerCase()

    broadcast({
      type: 'evo_status_mensagem',
      instanceName,
      empresaId,
      jid: key.remoteJid,
      msgId: key.id,
      status: statusInterno,
    })
  }
}

async function handleMessagesDelete(instanceName, empresaId, data) {
  const keys = Array.isArray(data) ? data : [data]

  for (const item of keys) {
    const key = item?.key || item
    if (!key?.remoteJid) continue

    broadcast({
      type: 'evo_mensagem_deletada',
      instanceName,
      empresaId,
      jid: key.remoteJid,
      msgId: key.id,
    })
  }
}

async function handleChatsUpsert(instanceName, empresaId, data) {
  // Atualiza lista de conversas no frontend
  broadcast({
    type: 'evo_chats',
    instanceName,
    empresaId,
    chats: Array.isArray(data) ? data : [data],
  })
}

async function handleContactsUpsert(instanceName, empresaId, data) {
  const contacts = Array.isArray(data) ? data : [data]

  // Sincroniza nomes de contatos com a tabela de contatos do CRM
  for (const c of contacts) {
    if (!c.id || !c.notify) continue
    const telefone = c.id.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    if (!telefone) continue

    // Atualiza nome se o contato existir no CRM
    await supabaseAdmin
      .from('contatos')
      .update({ nome_whatsapp: c.notify })
      .eq('empresa_id', empresaId)
      .ilike('telefone', `%${telefone}%`)
  }
}

// ============================================================
// INTEGRAÇÃO COM AGENTE IA (N8N)
// ============================================================

async function processarComAgenteIA({ instanceName, empresaId, jid, nomeRemetente, texto, mensagemId }) {
  // Verifica se a empresa tem agente IA configurado e ativo
  const agente = await getConfiguracaoAgente(empresaId)
  if (!agente) return // Sem agente configurado para esta empresa

  try {
    // Busca histórico recente para dar contexto à IA
    const historico = await buscarHistoricoParaIA(empresaId, jid, 20)

    // Dispara o workflow N8N
    const resultado = await dispararAgenteIA({
      empresaId,
      instanceName,
      remetente: jid,
      nomeRemetente,
      mensagem: texto,
      historico,
    })

    // Se N8N retornou uma resposta para enviar
    if (resultado?.resposta && !resultado?.ignorar) {
      const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

      await enviarTexto({
        instanceName,
        numero: telefone,
        texto: resultado.resposta,
        delay: 1500, // simula digitação
      })

      // Persiste resposta do agente no histórico
      await salvarMensagem({
        empresaId,
        jid,
        mensagemId: `agent-${Date.now()}`,
        texto: resultado.resposta,
        deMim: true,
        timestamp: Date.now(),
        tipo: 'texto',
        instanceName,
      })

      console.log(`[Agente IA] Resposta enviada para ${jid} (empresa ${empresaId})`)
    }
  } catch (err) {
    console.warn(`[Agente IA] Falha ao processar mensagem: ${err.message}`)
  }
}
