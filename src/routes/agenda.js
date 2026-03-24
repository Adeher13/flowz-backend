// Rotas de agenda — agendamentos e confirmações
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  listarAgendamentos,
  criarAgendamento,
  atualizarStatus,
  deletarAgendamento,
  confirmarViaWhatsApp,
} from '../controllers/agendaController.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listarAgendamentos)
router.post('/', criarAgendamento)
router.patch('/:id/status', atualizarStatus)
router.post('/:id/whatsapp', confirmarViaWhatsApp)
router.delete('/:id', deletarAgendamento)

export default router
