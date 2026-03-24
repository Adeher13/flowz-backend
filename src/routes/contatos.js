// Rotas de contatos — CRUD completo
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  listarContatos,
  getContato,
  criarContato,
  atualizarContato,
  deletarContato,
} from '../controllers/contatosController.js'

const router = Router()

router.use(authMiddleware)

router.get('/', listarContatos)
router.get('/:id', getContato)
router.post('/', criarContato)
router.put('/:id', atualizarContato)
router.delete('/:id', deletarContato)

export default router
