// Rotas Evolution API + N8N
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getInstancia,
  criarNovaInstancia,
  conectar,
  desconectar,
  reiniciar,
  deletar,
  getEstado,
  enviar,
  listarConversas,
  listarMensagens,
  enviarParaConversa,
  configurarWebhookInstancia,
  getWebhook,
} from '../controllers/evolutionController.js'

const router = Router()

// ── Instância (requer auth) ──────────────────────────────────
router.get('/instancia',             authMiddleware, getInstancia)
router.post('/instancia',            authMiddleware, criarNovaInstancia)
router.get('/instancia/estado',      authMiddleware, getEstado)
router.post('/instancia/conectar',   authMiddleware, conectar)
router.post('/instancia/desconectar',authMiddleware, desconectar)
router.post('/instancia/reiniciar',  authMiddleware, reiniciar)
router.delete('/instancia',          authMiddleware, deletar)

// ── Webhook config (requer auth) ────────────────────────────
router.post('/instancia/webhook',    authMiddleware, configurarWebhookInstancia)
router.get('/instancia/webhook',     authMiddleware, getWebhook)

// ── Conversas e mensagens (requer auth) ──────────────────────
router.get('/conversas',             authMiddleware, listarConversas)
router.get('/conversas/:jid/mensagens', authMiddleware, listarMensagens)
router.post('/conversas/:jid/enviar',   authMiddleware, enviarParaConversa)

// ── Envio avulso (requer auth) ───────────────────────────────
router.post('/enviar',               authMiddleware, enviar)

export default router
