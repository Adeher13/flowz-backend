// Rotas WhatsApp
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  status,
  conectar,
  desconectar,
  enviar,
  confirmarAgendamento,
  listarConversas,
  listarMensagens,
  enviarParaConversa,
  marcarLida,
  obterContatoDoChat,
  invalidarCache,
  deletar,
  encaminhar,
  carregarHistorico,
} from '../controllers/whatsappController.js'

const router = Router()

// Conexão/status sem auth — gerenciado pelo admin da instância
router.get('/status', status)
router.post('/conectar', conectar)
router.post('/desconectar', desconectar)

// Inbox de conversas — sem auth por enquanto (preview sem login)
router.get('/conversas', listarConversas)
router.get('/conversas/:jid/mensagens', listarMensagens)
router.get('/conversas/:jid/historico', carregarHistorico)
router.post('/conversas/:jid/enviar', enviarParaConversa)
router.patch('/conversas/:jid/lida', marcarLida)
router.get('/conversas/:jid/contato', obterContatoDoChat)
router.delete('/conversas/:jid/contato/cache', invalidarCache)
router.delete('/conversas/:jid/mensagens/:msgId', deletar)
router.post('/conversas/:jid/mensagens/:msgId/encaminhar', encaminhar)

// Envio avulso e confirmação de agendamento exigem auth
router.post('/enviar', authMiddleware, enviar)
router.post('/confirmar-agendamento', authMiddleware, confirmarAgendamento)

export default router
