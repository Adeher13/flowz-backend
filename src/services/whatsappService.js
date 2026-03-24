// Serviço WhatsApp via Baileys — conexão, anti-ban, envio e recebimento de mensagens
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import qrcode from 'qrcode'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import pino from 'pino'
import { supabaseAdmin } from './supabaseService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_PATH = path.join(__dirname, '../../.baileys-auth')
const CACHE_PATH = path.join(__dirname, '../../.baileys-auth/flowz-cache.json')

// Logger silencioso para não poluir o console
const logger = pino({ level: 'silent' })

// Estado global da conexão
let sock = null
let connectionStatus = 'disconnected' // 'disconnected' | 'connecting' | 'qr' | 'connected'
let currentQR = null
let wsClients = new Set() // clientes WebSocket ouvindo eventos

// Cache de nomes de contato do CRM — evita N+1 queries no Supabase
// telefone (dígitos) → { nome, contatoId } | null
const cacheContatosPorTelefone = new Map()

async function buscarContatoPorTelefone(telefone) {
  if (cacheContatosPorTelefone.has(telefone)) {
    return cacheContatosPorTelefone.get(telefone)
  }
  try {
    const { data } = await supabaseAdmin
      .from('contatos')
      .select('id, nome')
      .ilike('telefone', `%${telefone}%`)
      .limit(1)
      .maybeSingle()
    const resultado = data ? { nome: data.nome, contatoId: data.id } : null
    cacheContatosPorTelefone.set(telefone, resultado)
    return resultado
  } catch {
    return null
  }
}

// Invalida o cache de um telefone (usado após criar/atualizar contato)
export function invalidarCacheContato(telefone) {
  const numero = telefone.replace(/\D/g, '')
  cacheContatosPorTelefone.delete(numero)
}

// ============================================================
// HELPERS — processa lista de chats do Baileys

function processarChats(chats) {
  let aceitos = 0
  for (const chat of chats) {
    const jid = normalizarJid(chat.id)
    if (!isJidIndividual(jid)) continue
    aceitos++

    // lastMessage pode conter o texto da última mensagem
    const ultimaMensagem =
      chat.lastMessage?.message?.conversation ||
      chat.lastMessage?.message?.extendedTextMessage?.text ||
      ''

    upsertConversa(jid, {
      nome: chat.name || null,
      mensagem: ultimaMensagem,
      timestamp: (chat.conversationTimestamp || 0) * 1000,
      fromMe: chat.lastMessage?.key?.fromMe || false,
    })
    // Não incrementa não-lidas nos chats sincronizados
    const c = conversas.get(jid)
    if (c) c.naoLidas = 0
  }

  console.log(`[WhatsApp] processarChats: ${chats.length} recebidos, ${aceitos} individuais aceitos. Total em memória: ${conversas.size}`)
  // Enriquece nomes com dados do CRM (assíncrono)
  enriquecerConversasComCRM()
}

async function enriquecerConversasComCRM() {
  const promessas = []
  for (const [jid, conv] of conversas.entries()) {
    if (!isJidIndividual(jid)) continue
    const telefone = extrairTelefone(jid)
    // Busca no CRM para qualquer conversa cujo nome ainda é o número puro
    const nomeAtual = conv.nome || ''
    const ehApenasNumero = /^\d+$/.test(nomeAtual) || nomeAtual === telefone || nomeAtual === ''
    if (ehApenasNumero) {
      promessas.push(
        buscarContatoPorTelefone(telefone).then(contato => {
          if (contato?.nome) {
            conv.nome = contato.nome
            conv.contatoId = contato.contatoId
          }
        }).catch(() => {})
      )
    }
  }
  if (promessas.length > 0) {
    await Promise.allSettled(promessas)
    broadcast({ type: 'conversas', conversas: getConversas() })
  }
}

function processarContatos(contacts) {
  let atualizado = false
  for (const c of (contacts || [])) {
    if (!c.id) continue
    const jid = normalizarJid(c.id)
    if (!isJidIndividual(jid)) continue
    // Nome: prefere notify (nome salvo no celular) > verifiedName > name
    const nome = c.notify || c.verifiedName || c.name || null
    if (!nome) continue
    const telefone = extrairTelefone(jid)
    const conv = conversas.get(jid)
    if (conv) {
      if (!conv.nome || conv.nome === telefone) {
        conv.nome = nome
        atualizado = true
      }
    }
    // Guarda no cache para uso futuro em upsertConversa
    if (!cacheContatosPorTelefone.has(telefone)) {
      cacheContatosPorTelefone.set(telefone, { nome, contatoId: null, doCelular: true })
    }
  }
  if (atualizado) {
    agendarSalvamento()
    broadcast({ type: 'conversas', conversas: getConversas() })
  }
}

function sincronizarDoStore() {
  // Em Baileys v7, makeInMemoryStore não existe mais.
  // A sincronização acontece via eventos: chats.set (primeira conexão) e carregarCache (restarts).
  // Esta função apenas faz broadcast do estado atual em memória.
  console.log(`[WhatsApp] sincronizarDoStore: ${conversas.size} conversas em memória`)
  if (conversas.size > 0) {
    broadcast({ type: 'conversas', conversas: getConversas() })
  }
}

// ============================================================
// ARMAZENAMENTO DE CONVERSAS EM MEMÓRIA
// (para persistência real, usar Supabase no futuro)
// ============================================================

// Map<jid, { jid, nome, telefone, ultimaMensagem, timestamp, naoLidas }>
const conversas = new Map()

// Map<jid, [{ id, de, texto, timestamp, status, fromMe }]>
const mensagensPorJid = new Map()

const MAX_MSG_POR_CONVERSA = 500

// ============================================================
// PERSISTÊNCIA EM DISCO — salva conversas e mensagens em JSON
// ============================================================

let saveTimer = null

function agendarSalvamento() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(salvarCache, 2000)
}

async function salvarCache() {
  try {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 dias
    const dados = {
      conversas: Array.from(conversas.entries()),
      mensagens: Array.from(mensagensPorJid.entries()).map(([jid, msgs]) => [
        jid,
        msgs.filter(m => m.timestamp > cutoff),
      ]),
      salvoEm: Date.now(),
    }
    await fs.writeFile(CACHE_PATH, JSON.stringify(dados), 'utf8')
  } catch (err) {
    console.warn('[WhatsApp] Falha ao salvar cache:', err.message)
  }
}

export async function carregarCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8')
    const dados = JSON.parse(raw)
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000 // 30 dias

    for (const [jid, conv] of (dados.conversas || [])) {
      if (!isJidIndividual(jid)) continue
      conversas.set(jid, conv)
    }
    for (const [jid, msgs] of (dados.mensagens || [])) {
      if (!isJidIndividual(jid)) continue
      const recentes = (msgs || []).filter(m => m.timestamp > cutoff)
      if (recentes.length > 0) mensagensPorJid.set(jid, recentes)
    }
    console.log(`[WhatsApp] Cache carregado: ${conversas.size} conversas, ${mensagensPorJid.size} históricos.`)
  } catch {
    // Arquivo não existe ainda — primeira execução, tudo bem
  }
}

function extrairTelefone(jid) {
  return jid.replace('@s.whatsapp.net', '').replace('@g.us', '')
}

function normalizarJid(jid) {
  if (!jid) return ''
  // Preserva sufixos especiais — não converte para @s.whatsapp.net
  if (jid.includes('@g.us')) return jid
  if (jid.includes('@newsletter')) return jid
  if (jid.includes('@broadcast')) return jid
  if (jid.includes('@lid')) return jid
  return jid.split('@')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

// Retorna true apenas para conversas individuais reais (exclui grupos, newsletters, broadcasts)
function isJidIndividual(jid) {
  return !!jid && jid.endsWith('@s.whatsapp.net') && jid !== 'status@broadcast'
}

function upsertConversa(jid, { nome, mensagem, timestamp, fromMe }) {
  const telefone = extrairTelefone(jid)
  const existente = conversas.get(jid)

  // Prioridade de nome: 1) passado como argumento, 2) existente no cache, 3) cache do celular, 4) telefone
  const nomeDoCelular = cacheContatosPorTelefone.get(telefone)?.nome || null
  const nomeFinal = nome || existente?.nome || nomeDoCelular || telefone

  conversas.set(jid, {
    jid,
    nome: nomeFinal,
    telefone,
    ultimaMensagem: mensagem,
    timestamp,
    naoLidas: fromMe ? (existente?.naoLidas || 0) : (existente?.naoLidas || 0) + 1,
  })
  agendarSalvamento()
}

function adicionarMensagem(jid, msg) {
  if (!mensagensPorJid.has(jid)) {
    mensagensPorJid.set(jid, [])
  }
  const lista = mensagensPorJid.get(jid)

  // Deduplicação por ID — evita duplicatas de histórico/sync
  if (msg.id && lista.some(m => m.id === msg.id)) return

  lista.push(msg)
  // Mantém apenas as últimas MAX_MSG_POR_CONVERSA mensagens
  if (lista.length > MAX_MSG_POR_CONVERSA) {
    lista.splice(0, lista.length - MAX_MSG_POR_CONVERSA)
  }

  agendarSalvamento()
}

// ============================================================
// CONTADORES ANTI-BAN POR EMPRESA
// ============================================================

const rateLimits = new Map()

function getRateLimit(empresaId) {
  const now = Date.now()
  let rl = rateLimits.get(empresaId)

  if (!rl) {
    rl = { count: 0, resetAt: now + 3600000, dailyCount: 0, dailyResetAt: now + 86400000 }
    rateLimits.set(empresaId, rl)
  }

  if (now > rl.resetAt) { rl.count = 0; rl.resetAt = now + 3600000 }
  if (now > rl.dailyResetAt) { rl.dailyCount = 0; rl.dailyResetAt = now + 86400000 }

  return rl
}

function checkRateLimit(empresaId) {
  const rl = getRateLimit(empresaId)
  if (rl.count >= 30) throw new Error('Limite de 30 mensagens/hora atingido.')
  if (rl.dailyCount >= 200) throw new Error('Limite de 200 mensagens/dia atingido.')
  rl.count++
  rl.dailyCount++
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function humanDelay() {
  const ms = Math.floor(Math.random() * 3000) + 2000
  await sleep(ms)
}

// ============================================================
// BROADCAST — Notifica todos os clientes WebSocket
// ============================================================

export function addWsClient(ws) {
  wsClients.add(ws)

  // Envia estado atual imediatamente ao conectar
  ws.send(JSON.stringify({ type: 'status', status: connectionStatus }))
  if (connectionStatus === 'qr' && currentQR) {
    ws.send(JSON.stringify({ type: 'qr', qr: currentQR }))
  }

  ws.on('close', () => wsClients.delete(ws))
}

function broadcast(data) {
  const msg = JSON.stringify(data)
  for (const client of wsClients) {
    try { client.send(msg) } catch {}
  }
}

// ============================================================
// DOWNLOAD DE MÍDIA — converte buffer para base64 (max 5MB)
// ============================================================

async function baixarMidia(msg) {
  try {
    const m = msg.message
    if (!m) return null

    // Detecta qual tipo de mídia tem na mensagem
    const mediaMsg =
      m.imageMessage ||
      m.pttMessage ||
      m.audioMessage ||
      m.videoMessage ||
      m.documentMessage ||
      m.stickerMessage ||
      null

    if (!mediaMsg) return null

    const buffer = await downloadMediaMessage(msg, 'buffer', {})
    if (!buffer || buffer.length === 0) return null

    // Limite de 5MB — arquivos maiores exibem só o placeholder
    if (buffer.length > 5 * 1024 * 1024) return null

    const mediaType =
      (m.pttMessage || m.audioMessage) ? 'audio'
      : m.imageMessage ? 'image'
      : m.videoMessage ? 'video'
      : m.documentMessage ? 'document'
      : m.stickerMessage ? 'sticker'
      : 'file'

    return {
      mediaBase64: buffer.toString('base64'),
      mediaMime: mediaMsg.mimetype || 'application/octet-stream',
      mediaType,
      mediaName: m.documentMessage?.fileName || null,
    }
  } catch {
    return null
  }
}

// ============================================================
// CONEXÃO BAILEYS
// ============================================================

export async function conectarWhatsApp() {
  // Se já conectado, não faz nada
  if (connectionStatus === 'connected') return

  // Se travado em 'connecting' por mais de 30s sem QR, reseta
  if (connectionStatus === 'connecting' && !currentQR) {
    if (sock) { sock.end?.(); sock = null }
    connectionStatus = 'disconnected'
  }

  if (connectionStatus === 'connecting') return

  connectionStatus = 'connecting'
  broadcast({ type: 'status', status: 'connecting' })

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH)
  const { version } = await fetchLatestBaileysVersion()

  console.log('[WhatsApp] Iniciando conexão Baileys...')

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['Flowz CRM', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 15000,
    retryRequestDelayMs: 3000,
    generateHighQualityLinkPreview: false,
    // Força sincronização do histórico e contatos ao reconectar
    syncFullHistory: true,
    // Necessário para que o Baileys consiga buscar mensagens antigas do histórico
    getMessage: async (key) => {
      const jid = normalizarJid(key.remoteJid || '')
      const lista = mensagensPorJid.get(jid) || []
      const found = lista.find(m => m.id === key.id)
      return found ? { conversation: found.texto } : { conversation: '' }
    },
  })

  sock.ev.on('creds.update', saveCreds)

  // --------------------------------------------------------
  // Atualização de status da conexão
  // --------------------------------------------------------
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    console.log('[WhatsApp] connection.update:', { connection, hasQR: !!qr, statusCode: lastDisconnect?.error?.output?.statusCode })

    if (qr) {
      console.log('[WhatsApp] QR Code gerado — enviando para o frontend')
      currentQR = await qrcode.toDataURL(qr)
      connectionStatus = 'qr'
      broadcast({ type: 'status', status: 'qr' })
      broadcast({ type: 'qr', qr: currentQR })
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('[WhatsApp] Conexão fechada. Motivo:', reason)
      connectionStatus = 'disconnected'
      currentQR = null
      sock = null
      broadcast({ type: 'status', status: 'disconnected' })

      // Não reconecta automaticamente se foi logout explícito ou credencial inválida
      if (reason !== DisconnectReason.loggedOut && reason !== 401) {
        console.log('[WhatsApp] Tentando reconectar em 5s...')
        setTimeout(conectarWhatsApp, 5000)
      } else {
        console.log('[WhatsApp] Sessão encerrada. Reconexão manual necessária.')
      }
    }

    if (connection === 'open') {
      connectionStatus = 'connected'
      currentQR = null
      broadcast({ type: 'status', status: 'connected' })
      console.log(`[WhatsApp] Conectado! Cache atual: ${conversas.size} conversas, ${mensagensPorJid.size} históricos`)

      // Após conectar, aguarda o store popular e sincroniza os chats
      setTimeout(() => sincronizarDoStore(), 3000)
    }
  })

  // --------------------------------------------------------
  // Recebimento de mensagens — popula conversas em memória
  // 'notify' = mensagem nova em tempo real
  // 'append' = mensagem histórica carregada pelo Baileys ao conectar
  // --------------------------------------------------------
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' && type !== 'append') return

    for (const msg of messages) {
      if (!msg.message) continue

      const jid = normalizarJid(msg.key.remoteJid || '')
      if (!isJidIndividual(jid)) continue

      const fromMe = msg.key.fromMe || false
      const msgId = msg.key.id

      // Mensagens fromMe enviadas via enviarMensagem() já foram registradas com o ID real.
      // Porém, mídia enviada pelo celular (fromMe=true) chega aqui sem ter sido registrada —
      // nesse caso o ID não existirá no cache e deve ser processada normalmente.
      if (fromMe && type === 'notify') {
        const existentes = mensagensPorJid.get(jid) || []
        const jaRegistrada = existentes.some(m => m.id === msgId)
        if (jaRegistrada) continue // texto enviado pelo app — já está no cache, ignora
      }

      // Deduplicação para mensagens históricas (append)
      if (type === 'append' && msgId) {
        const existentes = mensagensPorJid.get(jid) || []
        if (existentes.some(m => m.id === msgId)) continue
      }

      const timestamp = (msg.messageTimestamp || Date.now() / 1000) * 1000

      // Extrai texto da mensagem (suporta texto, legenda de imagem/vídeo, etc.)
      const m = msg.message
      const texto =
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        m?.documentMessage?.caption ||
        (m?.imageMessage ? '📷 Imagem' : null) ||
        (m?.videoMessage ? '🎥 Vídeo' : null) ||
        (m?.pttMessage ? '🎤 Áudio' : null) ||
        (m?.audioMessage ? '🎤 Áudio' : null) ||
        (m?.documentMessage ? '📄 Documento' : null) ||
        (m?.stickerMessage ? '🔖 Sticker' : null) ||
        (m?.locationMessage ? '📍 Localização' : null) ||
        (m?.contactMessage ? '👤 Contato' : null) ||
        '📎 Mídia'

      // Faz download da mídia (base64) se aplicável — inclusive para fromMe (enviada pelo celular)
      const midia = await baixarMidia(msg)

      const novaMensagem = {
        id: msgId,
        de: fromMe ? 'eu' : jid,
        texto,
        timestamp,
        fromMe,
        status: fromMe ? 'enviado' : 'recebido',
        ...midia,
      }

      adicionarMensagem(jid, novaMensagem)

      // Para mensagens recebidas, usa pushName para enriquecer o nome do contato
      if (!fromMe) {
        const telefoneMsg = extrairTelefone(jid)
        const nomePush = msg.pushName || null
        const nomeCelular = cacheContatosPorTelefone.get(telefoneMsg)?.nome || null
        upsertConversa(jid, {
          nome: nomePush || nomeCelular || null,
          mensagem: texto,
          timestamp,
          fromMe: false,
        })

        // Enriquece com nome do CRM de forma assíncrona (fire-and-forget)
        buscarContatoPorTelefone(telefoneMsg).then(contato => {
          if (contato?.nome) {
            const conv = conversas.get(jid)
            if (conv && /^\d+$/.test(conv.nome || '')) {
              conv.nome = contato.nome
              conv.contatoId = contato.contatoId
              broadcast({ type: 'conversas', conversas: getConversas() })
            }
          }
        }).catch(() => {})
      } else {
        upsertConversa(jid, { mensagem: texto, timestamp, fromMe: true })
      }

      // Mensagens históricas (append) não fazem broadcast individual — faz em lote no final
      if (type === 'notify') {
        broadcast({
          type: 'mensagem',
          jid,
          mensagem: novaMensagem,
          conversa: conversas.get(jid),
        })
      }
    }

    // Para mensagens históricas, notifica a lista de conversas atualizada em lote
    if (type === 'append') {
      broadcast({ type: 'conversas', conversas: getConversas() })
    }
  })

  // --------------------------------------------------------
  // Sincroniza lista de chats existentes ao conectar
  // --------------------------------------------------------
  sock.ev.on('chats.set', ({ chats }) => {
    console.log(`[WhatsApp] chats.set disparado com ${chats?.length || 0} chats`)
    processarChats(chats)
    broadcast({ type: 'conversas', conversas: getConversas() })
  })

  sock.ev.on('chats.upsert', (chats) => {
    console.log(`[WhatsApp] chats.upsert com ${chats?.length || 0} chats`)
    processarChats(chats)
    broadcast({ type: 'conversas', conversas: getConversas() })
  })

  sock.ev.on('contacts.set', ({ contacts }) => {
    processarContatos(contacts)
  })

  sock.ev.on('contacts.upsert', (contacts) => {
    processarContatos(contacts)
  })

  // --------------------------------------------------------
  // Histórico de mensagens ao reconectar (Baileys envia automaticamente)
  // --------------------------------------------------------
  sock.ev.on('messages.history.set', ({ messages: msgs, chats: histChats, isLatest }) => {
    console.log(`[WhatsApp] messages.history.set: ${msgs?.length || 0} msgs, ${histChats?.length || 0} chats, isLatest=${isLatest}`)

    // Debug: amostra das primeiras mensagens para entender a estrutura
    if (msgs?.length > 0) {
      const amostra = msgs.slice(0, 3)
      for (const m of amostra) {
        console.log(`[WhatsApp] Amostra msg: jid=${m.key?.remoteJid}, fromMe=${m.key?.fromMe}, ts=${m.messageTimestamp}, hasMsg=${!!m.message}, keys=${m.message ? Object.keys(m.message).join(',') : 'N/A'}`)
      }
    }

    // Processa apenas chats do histórico (sem importar mensagens antigas)
    if (histChats?.length) {
      processarChats(histChats)
    }

    // Conta mensagens por tipo para diagnóstico
    let countFromMe = 0, countDeles = 0, countSemTs = 0, countGrupo = 0
    for (const msg of (msgs || [])) {
      if (!msg.message) continue
      const jid = normalizarJid(msg.key?.remoteJid || '')
      if (!isJidIndividual(jid)) { countGrupo++; continue }
      if (!msg.messageTimestamp) countSemTs++
      if (msg.key?.fromMe) countFromMe++; else countDeles++
    }
    console.log(`[WhatsApp] history breakdown: fromMe=${countFromMe}, deles=${countDeles}, semTimestamp=${countSemTs}, grupos/outros=${countGrupo}`)

    for (const msg of (msgs || [])) {
      if (!msg.message) continue
      const jid = normalizarJid(msg.key?.remoteJid || '')
      if (!isJidIndividual(jid)) continue

      const fromMe = msg.key?.fromMe || false
      const timestamp = (msg.messageTimestamp || 0) * 1000

      // Sem timestamp — usa timestamp atual para não perder a mensagem
      const tsEfetivo = timestamp > 0 ? timestamp : Date.now()

      const hm = msg.message
      const texto =
        hm?.conversation ||
        hm?.extendedTextMessage?.text ||
        hm?.imageMessage?.caption ||
        hm?.videoMessage?.caption ||
        hm?.documentMessage?.caption ||
        (hm?.imageMessage ? '📷 Imagem' : null) ||
        (hm?.videoMessage ? '🎥 Vídeo' : null) ||
        (hm?.pttMessage ? '🎤 Áudio' : null) ||
        (hm?.audioMessage ? '🎤 Áudio' : null) ||
        (hm?.documentMessage ? '📄 Documento' : null) ||
        (hm?.stickerMessage ? '🔖 Sticker' : null) ||
        (hm?.locationMessage ? '📍 Localização' : null) ||
        (hm?.contactMessage ? '👤 Contato' : null) ||
        '📎 Mídia'

      // Só adiciona se não existir ainda (evita duplicatas)
      const existentes = mensagensPorJid.get(jid) || []
      if (!existentes.find(m => m.id === msg.key?.id)) {
        adicionarMensagem(jid, {
          id: msg.key?.id,
          de: fromMe ? 'eu' : jid,
          texto,
          timestamp: tsEfetivo,
          fromMe,
          status: fromMe ? 'enviado' : 'recebido',
        })
      }

      // Garante que a conversa existe e atualiza se mensagem for mais recente
      const conv = conversas.get(jid)
      if (!conv || conv.timestamp < tsEfetivo) {
        upsertConversa(jid, { mensagem: texto, timestamp: tsEfetivo, fromMe })
        const c = conversas.get(jid)
        if (c) c.naoLidas = 0
      }
    }

    console.log(`[WhatsApp] history.set processado: ${mensagensPorJid.size} JIDs com mensagens`)
    broadcast({ type: 'conversas', conversas: getConversas() })
  })
}

export async function desconectarWhatsApp() {
  if (sock) {
    // end() fecha a conexão SEM apagar as credenciais (logout() apagaria)
    sock.end?.()
    sock = null
  }
  connectionStatus = 'disconnected'
  currentQR = null
  broadcast({ type: 'status', status: 'disconnected' })
}

export function getStatus() {
  return { status: connectionStatus, connected: connectionStatus === 'connected' }
}

// Exporta sock para uso externo (ex: controller pode chamar fetchMessages)
export function getSock() { return sock }

// ============================================================
// GETTERS DE CONVERSAS E MENSAGENS
// ============================================================

export function getConversas() {
  return Array.from(conversas.values())
    .sort((a, b) => b.timestamp - a.timestamp)
}

export function getMensagens(jid) {
  const normalizado = normalizarJid(jid)
  return mensagensPorJid.get(normalizado) || []
}

export function marcarComoLida(jid) {
  const normalizado = normalizarJid(jid)
  const conversa = conversas.get(normalizado)
  if (conversa) conversa.naoLidas = 0
}

export async function buscarContatoParaJid(jid) {
  const normalizado = normalizarJid(jid)
  const telefone = extrairTelefone(normalizado)
  const contato = await buscarContatoPorTelefone(telefone)
  return contato // { nome, contatoId } | null
}

// Remove mensagem do cache local e, opcionalmente, do WhatsApp para todos
export async function deletarMensagem({ jid, msgId, apenasParaMim }) {
  const normalizado = normalizarJid(jid)
  const lista = mensagensPorJid.get(normalizado) || []
  const msg = lista.find(m => m.id === msgId)

  // Remove do cache local
  const novaLista = lista.filter(m => m.id !== msgId)
  mensagensPorJid.set(normalizado, novaLista)

  // Atualiza última mensagem da conversa se a deletada era a última
  const conv = conversas.get(normalizado)
  if (conv) {
    const ultima = novaLista.at(-1)
    conv.ultimaMensagem = ultima?.texto || ''
    conv.timestamp = ultima?.timestamp || conv.timestamp
  }

  agendarSalvamento()
  broadcast({ type: 'mensagem_deletada', jid: normalizado, msgId })

  // Deleta no WhatsApp (para todos) — só funciona se sock conectado e msg for fromMe
  if (!apenasParaMim && sock && connectionStatus === 'connected' && msg?.fromMe) {
    try {
      await sock.sendMessage(normalizado, {
        delete: {
          remoteJid: normalizado,
          fromMe: true,
          id: msgId,
        },
      })
    } catch (err) {
      console.warn('[WhatsApp] Falha ao deletar para todos:', err.message)
    }
  }
}

// Encaminha uma mensagem para outro JID
export async function encaminharMensagem({ empresaId, jidOrigem, msgId, jidDestino }) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp não está conectado.')
  }

  const normalizado = normalizarJid(jidOrigem)
  const lista = mensagensPorJid.get(normalizado) || []
  const msg = lista.find(m => m.id === msgId)

  if (!msg) throw new Error('Mensagem não encontrada no cache.')

  const destino = normalizarJid(jidDestino)
  checkRateLimit(empresaId)

  // Encaminha como texto (se tiver base64 de mídia, envia o texto de fallback)
  const textoEncaminhar = msg.texto || '📎 Mídia encaminhada'
  const result = await sock.sendMessage(destino, { text: `_Encaminhado:_\n${textoEncaminhar}` })

  // Registra no cache do jid destino
  const timestamp = Date.now()
  const novaMensagem = {
    id: result?.key?.id || `fwd-${timestamp}`,
    de: 'eu',
    texto: `_Encaminhado:_\n${textoEncaminhar}`,
    timestamp,
    fromMe: true,
    status: 'enviado',
    encaminhado: true,
  }
  adicionarMensagem(destino, novaMensagem)
  upsertConversa(destino, { mensagem: novaMensagem.texto, timestamp, fromMe: true })
  broadcast({ type: 'mensagem', jid: destino, mensagem: novaMensagem, conversa: conversas.get(destino) })

  return result
}

// ============================================================
// ENVIO DE MENSAGENS (com anti-ban)
// ============================================================

export async function enviarMensagem({ empresaId, telefone, mensagem }) {
  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp não está conectado.')
  }

  checkRateLimit(empresaId)

  const numero = telefone.replace(/\D/g, '')
  const jid = `${numero}@s.whatsapp.net`

  // Simula "digitando..." antes de enviar
  await sock.sendPresenceUpdate('composing', jid)
  await humanDelay()
  await sock.sendPresenceUpdate('paused', jid)
  await sleep(500)

  const result = await sock.sendMessage(jid, { text: mensagem })

  // Registra mensagem enviada localmente também
  const timestamp = Date.now()
  const novaMensagem = {
    id: result?.key?.id || `out-${timestamp}`,
    de: 'eu',
    texto: mensagem,
    timestamp,
    fromMe: true,
    status: 'enviado',
  }
  adicionarMensagem(jid, novaMensagem)
  upsertConversa(jid, { mensagem, timestamp, fromMe: true })

  broadcast({
    type: 'mensagem',
    jid,
    mensagem: novaMensagem,
    conversa: conversas.get(jid),
  })

  return result
}

// ============================================================
// BUSCAR HISTÓRICO ANTIGO — usa fetchMessageHistory do Baileys
// Retorna mensagens anteriores ao timestamp mais antigo em cache
// ============================================================

export async function buscarHistoricoAntigo(jid, quantidade = 50) {
  const normalizado = normalizarJid(jid)

  if (!sock || connectionStatus !== 'connected') {
    throw new Error('WhatsApp não está conectado.')
  }

  const existentes = mensagensPorJid.get(normalizado) || []

  // Cursor = mensagem mais antiga em cache (Baileys precisa do objeto completo)
  // Se não tiver nenhuma, busca as últimas N do histórico geral
  const maisAntiga = existentes[0] || null
  const cursorTimestamp = maisAntiga ? Math.floor(maisAntiga.timestamp / 1000) : Math.floor(Date.now() / 1000)

  try {
    // Baileys v7: fetchMessageHistory(count, cursor, before)
    // cursor pode ser um WAMessageKey ou null para buscar do fim
    const cursorKey = maisAntiga
      ? { remoteJid: normalizado, id: maisAntiga.id, fromMe: maisAntiga.fromMe }
      : null

    const msgs = await sock.fetchMessageHistory(quantidade, cursorKey, cursorTimestamp)

    if (!msgs || msgs.length === 0) return []

    const novas = []
    for (const msg of msgs) {
      if (!msg.message) continue
      const msgJid = normalizarJid(msg.key?.remoteJid || '')
      if (msgJid !== normalizado) continue

      const fromMe = msg.key?.fromMe || false
      const timestamp = (msg.messageTimestamp || 0) * 1000
      const msgId = msg.key?.id

      // Ignora duplicatas
      if (existentes.some(m => m.id === msgId)) continue

      const m = msg.message
      const texto =
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        (m?.imageMessage ? '📷 Imagem' : null) ||
        (m?.videoMessage ? '🎥 Vídeo' : null) ||
        (m?.pttMessage ? '🎤 Áudio' : null) ||
        (m?.audioMessage ? '🎤 Áudio' : null) ||
        (m?.documentMessage ? '📄 Documento' : null) ||
        (m?.stickerMessage ? '🔖 Sticker' : null) ||
        '📎 Mídia'

      const novaMensagem = {
        id: msgId,
        de: fromMe ? 'eu' : normalizado,
        texto,
        timestamp,
        fromMe,
        status: fromMe ? 'enviado' : 'recebido',
      }

      novas.push(novaMensagem)
    }

    // Insere as mensagens antigas no início do cache
    if (novas.length > 0) {
      const listaAtual = mensagensPorJid.get(normalizado) || []
      // Ordena antigas por timestamp crescente e coloca antes das existentes
      const ordenadas = novas.sort((a, b) => a.timestamp - b.timestamp)
      mensagensPorJid.set(normalizado, [...ordenadas, ...listaAtual])
      agendarSalvamento()
    }

    return novas.sort((a, b) => a.timestamp - b.timestamp)
  } catch (err) {
    console.warn('[WhatsApp] fetchMessageHistory falhou:', err.message)
    // Fallback: retorna o que já temos em cache antes do cursor
    return []
  }
}

export async function enviarMensagemParaJid({ empresaId = 'system', jid, mensagem }) {
  const telefone = extrairTelefone(jid)
  return enviarMensagem({ empresaId, telefone, mensagem })
}

export async function enviarConfirmacaoAgendamento({ empresaId, telefone, nomeContato, tituloAgendamento, dataHora }) {
  const data = new Date(dataHora)
  const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const mensagem =
    `Olá, ${nomeContato}! 👋\n\n` +
    `Confirmando seu agendamento:\n\n` +
    `📋 *${tituloAgendamento}*\n` +
    `📅 ${dataFormatada} às ${horaFormatada}\n\n` +
    `Responda *SIM* para confirmar ou *NÃO* para cancelar.\n\n` +
    `Aguardamos você! 😊`

  return enviarMensagem({ empresaId, telefone, mensagem })
}
