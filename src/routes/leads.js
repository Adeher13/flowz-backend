// Rotas de leads — kanban e histórico de atividades
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  listarLeads,
  criarLead,
  atualizarLead,
  moverEtapa,
  deletarLead,
  getAtividades,
  adicionarAtividade,
} from '../controllers/leadsController.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listarLeads)
router.post('/', criarLead)
router.put('/:id', atualizarLead)
router.patch('/:id/etapa', moverEtapa)
router.delete('/:id', deletarLead)
router.get('/:id/atividades', getAtividades)
router.post('/:id/atividades', adicionarAtividade)

export default router
