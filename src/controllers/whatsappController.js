// Controller WhatsApp — conexão Baileys, envio e inbox de conversas
import {
  conectarWhatsApp,
  desconectarWhatsApp,
  getStatus,
  getSock,
  enviarMensagem,
  enviarMensagemParaJid,
  enviarConfirmacaoAgendamento,
  getConversas,
  getMensagens,
  marcarComoLida,
  buscarContatoParaJid,
  invalidarCacheContato,
  deletarMensagem,
  encaminharMensagem,
  buscarHistoricoAntigo,
} from '../services/whatsappService.js'

// GET /api/v1/whatsapp/status
export async function status(req, res, next) {
  try {
    res.json(getStatus())
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/conectar
export async function conectar(req, res, next) {
  try {
    await conectarWhatsApp()
    res.json({ ok: true, message: 'Iniciando conexão. Aguarde o QR Code via WebSocket.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/desconectar
export async function desconectar(req, res, next) {
  try {
    await desconectarWhatsApp()
    res.json({ ok: true, message: 'WhatsApp desconectado.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/enviar
export async function enviar(req, res, next) {
  try {
    const { telefone, mensagem } = req.body
    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'telefone e mensagem são obrigatórios.' })
    }
    await enviarMensagem({ empresaId: req.empresaId || 'system', telefone, mensagem })
    res.json({ ok: true, message: 'Mensagem enviada.' })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/confirmar-agendamento
export async function confirmarAgendamento(req, res, next) {
  try {
    const { telefone, nomeContato, tituloAgendamento, dataHora } = req.body
    if (!telefone || !nomeContato || !tituloAgendamento || !dataHora) {
      return res.status(400).json({ error: 'Dados incompletos para confirmação.' })
    }
    await enviarConfirmacaoAgendamento({
      empresaId: req.empresaId || 'system',
      telefone,
      nomeContato,
      tituloAgendamento,
      dataHora,
    })
    res.json({ ok: true, message: 'Confirmação enviada via WhatsApp.' })
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp/conversas
export function listarConversas(req, res, next) {
  try {
    res.json(getConversas())
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp/conversas/:jid/mensagens
export function listarMensagens(req, res, next) {
  try {
    const { jid } = req.params
    if (!jid) return res.status(400).json({ error: 'jid é obrigatório.' })
    res.json(getMensagens(jid))
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/conversas/:jid/enviar
export async function enviarParaConversa(req, res, next) {
  try {
    const { jid } = req.params
    const { mensagem } = req.body
    if (!jid || !mensagem) {
      return res.status(400).json({ error: 'jid e mensagem são obrigatórios.' })
    }
    await enviarMensagemParaJid({ empresaId: req.empresaId || 'system', jid, mensagem })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// PATCH /api/v1/whatsapp/conversas/:jid/lida
export function marcarLida(req, res, next) {
  try {
    const { jid } = req.params
    marcarComoLida(jid)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp/conversas/:jid/contato
// Retorna o contato do CRM vinculado ao número deste chat
export async function obterContatoDoChat(req, res, next) {
  try {
    const { jid } = req.params
    const contato = await buscarContatoParaJid(jid)
    if (!contato) {
      return res.json({ encontrado: false, contato: null })
    }
    res.json({ encontrado: true, contato })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/v1/whatsapp/conversas/:jid/contato/cache
// Invalida cache após criar/editar um contato
export function invalidarCache(req, res, next) {
  try {
    const { jid } = req.params
    // jid pode ser o telefone puro ou JID completo
    const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    invalidarCacheContato(telefone)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/v1/whatsapp/conversas/:jid/mensagens/:msgId
// apenasParaMim=true → só remove localmente; false → deleta para todos no WA
export async function deletar(req, res, next) {
  try {
    const { jid, msgId } = req.params
    const apenasParaMim = req.query.apenasParaMim !== 'false'
    if (!jid || !msgId) return res.status(400).json({ error: 'jid e msgId são obrigatórios.' })
    await deletarMensagem({ jid, msgId, apenasParaMim })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp/conversas/:jid/mensagens/:msgId/encaminhar
export async function encaminhar(req, res, next) {
  try {
    const { jid, msgId } = req.params
    const { jidDestino } = req.body
    if (!jid || !msgId || !jidDestino) {
      return res.status(400).json({ error: 'jid, msgId e jidDestino são obrigatórios.' })
    }
    await encaminharMensagem({
      empresaId: req.empresaId || 'system',
      jidOrigem: jid,
      msgId,
      jidDestino,
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp/conversas/:jid/historico?quantidade=50
// Busca mensagens mais antigas que as já carregadas
export async function carregarHistorico(req, res, next) {
  try {
    const { jid } = req.params
    const quantidade = Math.min(parseInt(req.query.quantidade) || 50, 100)
    if (!jid) return res.status(400).json({ error: 'jid é obrigatório.' })
    const mensagens = await buscarHistoricoAntigo(jid, quantidade)
    res.json(mensagens)
  } catch (err) {
    next(err)
  }
}
