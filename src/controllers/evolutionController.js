// Controller Evolution API — gerencia instâncias WhatsApp e recebe webhooks
import {
  criarInstancia,
  getInstanciaDaEmpresa,
  conectarInstancia,
  getEstadoConexao,
  desconectarInstancia,
  reiniciarInstancia,
  deletarInstancia,
  enviarTexto,
  configurarWebhook,
  getWebhookConfig,
} from '../services/evolutionService.js'
import { processarWebhookEvo } from '../services/webhookEvolutionService.js'
import { supabaseAdmin } from '../services/supabaseService.js'

// ============================================================
// GERENCIAMENTO DE INSTÂNCIAS
// ============================================================

// GET /api/v1/whatsapp-evo/instancia
// Retorna instância da empresa autenticada (ou cria se não existir)
export async function getInstancia(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)

    if (!instancia) {
      return res.json({ instancia: null, status: 'nao_configurada' })
    }

    // Busca estado real na Evolution API
    let estado = instancia.status || 'unknown'
    try {
      const evo = await getEstadoConexao(instancia.instance_name, empresaId)
      estado = evo?.instance?.state || estado
    } catch {
      // Evolution API offline — usa status salvo no banco
    }

    res.json({ instancia, status: estado })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp-evo/instancia
// Cria uma nova instância para a empresa
export async function criarNovaInstancia(req, res, next) {
  try {
    const empresaId = req.empresaId

    // Verifica se já existe
    const existente = await getInstanciaDaEmpresa(empresaId)
    if (existente) {
      return res.status(409).json({ error: 'Já existe uma instância para esta empresa.' })
    }

    // Se o usuário informou um nome de instância já existente no Cloudify, apenas vincula
    if (req.body?.instanceName) {
      const instanceName = req.body.instanceName.trim()
      await supabaseAdmin
        .from('whatsapp_instancias')
        .upsert({
          empresa_id: empresaId,
          instance_name: instanceName,
          status: 'close',
          criado_em: new Date().toISOString(),
        }, { onConflict: 'empresa_id' })

      // Configura o webhook da instância para apontar para o Flowz
      try {
        await configurarWebhook(instanceName, empresaId)
        console.log(`[Evolution] Webhook configurado para instância ${instanceName}`)
      } catch (err) {
        console.warn(`[Evolution] Falha ao configurar webhook: ${err.message}`)
        // Não falha o request — o webhook pode ser configurado manualmente depois
      }

      return res.status(201).json({ ok: true, instanceName, vinculada: true })
    }

    // Caso contrário, cria nova instância na Evolution API
    const instanceName = `flowz-${empresaId.replace(/-/g, '').slice(0, 12)}`
    const data = await criarInstancia({ empresaId, instanceName })
    res.status(201).json({ ok: true, instanceName, data })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp-evo/instancia/conectar
// Gera QR code para conectar o WhatsApp
export async function conectar(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) {
      return res.status(404).json({ error: 'Instância não configurada.' })
    }

    const data = await conectarInstancia(instancia.instance_name, empresaId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp-evo/instancia/desconectar
export async function desconectar(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não encontrada.' })

    await desconectarInstancia(instancia.instance_name, empresaId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp-evo/instancia/reiniciar
export async function reiniciar(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não encontrada.' })

    await reiniciarInstancia(instancia.instance_name, empresaId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/v1/whatsapp-evo/instancia
export async function deletar(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não encontrada.' })

    await deletarInstancia(instancia.instance_name, empresaId)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp-evo/instancia/estado
export async function getEstado(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.json({ status: 'nao_configurada' })

    const data = await getEstadoConexao(instancia.instance_name, empresaId)
    res.json({ status: data?.instance?.state || 'unknown', instancia })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// ENVIO DE MENSAGENS
// ============================================================

// POST /api/v1/whatsapp-evo/mensagens/enviar
export async function enviar(req, res, next) {
  try {
    const empresaId = req.empresaId
    const { jid, mensagem } = req.body

    if (!jid || !mensagem) {
      return res.status(400).json({ error: 'jid e mensagem são obrigatórios.' })
    }

    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não configurada.' })

    const numero = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const data = await enviarTexto({ instanceName: instancia.instance_name, numero, texto: mensagem, empresaId })
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// CONVERSAS E MENSAGENS (lidas do Supabase)
// ============================================================

// GET /api/v1/whatsapp-evo/conversas
export async function listarConversas(req, res, next) {
  try {
    const empresaId = req.empresaId

    // Busca última mensagem de cada telefone (window function via subquery)
    const { data, error } = await supabaseAdmin
      .from('mensagens_whatsapp')
      .select('telefone, jid, texto, de_mim, criado_em')
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false })

    if (error) throw error

    // Agrupa por telefone: só mantém a mensagem mais recente de cada conversa
    const convMap = new Map()
    for (const m of (data || [])) {
      if (!convMap.has(m.telefone)) {
        convMap.set(m.telefone, {
          jid: m.jid || `${m.telefone}@s.whatsapp.net`,
          telefone: m.telefone,
          ultimaMensagem: m.texto,
          timestamp: new Date(m.criado_em).getTime(),
          fromMe: m.de_mim,
          naoLidas: 0,
          nome: null,
        })
      }
    }

    // Busca nomes dos contatos no CRM
    const conversas = Array.from(convMap.values())
    const telefones = conversas.map(c => c.telefone)

    if (telefones.length > 0) {
      const { data: contatos } = await supabaseAdmin
        .from('contatos')
        .select('nome, telefone')
        .eq('empresa_id', empresaId)

      for (const conv of conversas) {
        const contato = (contatos || []).find(c => c.telefone?.includes(conv.telefone))
        if (contato) conv.nome = contato.nome
      }
    }

    res.json(conversas.sort((a, b) => b.timestamp - a.timestamp))
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp-evo/conversas/:jid/mensagens
export async function listarMensagens(req, res, next) {
  try {
    const empresaId = req.empresaId
    const { jid } = req.params
    const telefone = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const limite = Math.min(parseInt(req.query.limite) || 200, 500)
    const offset = parseInt(req.query.offset) || 0

    const { data, error } = await supabaseAdmin
      .from('mensagens_whatsapp')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('telefone', telefone)
      .order('criado_em', { ascending: true })
      .range(offset, offset + limite - 1)

    if (error) throw error

    const mensagens = (data || []).map(m => ({
      id: m.mensagem_id,
      de: m.de_mim ? 'eu' : m.jid,
      texto: m.texto,
      timestamp: new Date(m.criado_em).getTime(),
      fromMe: m.de_mim,
      status: m.de_mim ? 'enviado' : 'recebido',
      tipo: m.tipo || 'texto',
    }))

    res.json(mensagens)
  } catch (err) {
    next(err)
  }
}

// POST /api/v1/whatsapp-evo/conversas/:jid/enviar
export async function enviarParaConversa(req, res, next) {
  try {
    const empresaId = req.empresaId
    const { jid } = req.params
    const { mensagem } = req.body

    if (!mensagem) return res.status(400).json({ error: 'mensagem é obrigatória.' })

    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não configurada.' })

    const numero = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    await enviarTexto({ instanceName: instancia.instance_name, numero, texto: mensagem, empresaId })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// WEBHOOK — recebe eventos da Evolution API
// ============================================================

// POST /api/v1/whatsapp/webhook  (sem auth — chamado pela Evolution API)
export async function receberWebhook(req, res, next) {
  try {
    // Responde imediatamente para não deixar a Evolution API esperando
    res.status(200).json({ received: true })

    // Processa o evento de forma assíncrona
    processarWebhookEvo(req.body).catch(err => {
      console.error('[Webhook] Erro no processamento:', err.message)
    })
  } catch (err) {
    next(err)
  }
}

// ============================================================
// CONFIGURAÇÃO DO WEBHOOK
// ============================================================

// POST /api/v1/whatsapp-evo/instancia/webhook
export async function configurarWebhookInstancia(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não encontrada.' })

    const data = await configurarWebhook(instancia.instance_name, empresaId)
    res.json({ ok: true, data })
  } catch (err) {
    next(err)
  }
}

// GET /api/v1/whatsapp-evo/instancia/webhook
export async function getWebhook(req, res, next) {
  try {
    const empresaId = req.empresaId
    const instancia = await getInstanciaDaEmpresa(empresaId)
    if (!instancia) return res.status(404).json({ error: 'Instância não encontrada.' })

    const data = await getWebhookConfig(instancia.instance_name, empresaId)
    res.json(data)
  } catch (err) {
    next(err)
  }
}
