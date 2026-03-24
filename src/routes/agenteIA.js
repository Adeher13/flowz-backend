// Rotas do Agente IA — configuração, disponibilidade e endpoints para N8N
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  getAgente,
  salvarAgente,
  getDisponibilidade,
  salvarDisponibilidade,
  getHorariosDisponiveisN8N,
  criarAgendamentoN8N,
  criarLeadN8N,
  getConfiguracaoN8N,
} from '../controllers/agenteIAController.js'

const router = Router()

// ── Rotas autenticadas (frontend) ───────────────────────────
router.get('/',               authMiddleware, getAgente)
router.post('/',              authMiddleware, salvarAgente)
router.get('/disponibilidade', authMiddleware, getDisponibilidade)
router.post('/disponibilidade', authMiddleware, salvarDisponibilidade)

// ── Endpoints públicos para o N8N (sem auth de usuário) ─────
// N8N usa empresa_id no path + chama sem token de usuário
router.get('/n8n/:empresa_id/configuracao',  getConfiguracaoN8N)
router.get('/n8n/:empresa_id/horarios',      getHorariosDisponiveisN8N)
router.post('/n8n/:empresa_id/agendamento',  criarAgendamentoN8N)
router.post('/n8n/:empresa_id/lead',         criarLeadN8N)

export default router
