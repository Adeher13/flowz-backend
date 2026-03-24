// Rotas de autenticação e perfil
import { Router } from 'express'
import { authMiddleware, authTokenMiddleware } from '../middlewares/authMiddleware.js'
import {
  registrarPerfil,
  getPerfil,
  atualizarPerfil,
  atualizarEmpresa,
  getIntegracoes,
  salvarIntegracoes,
} from '../controllers/authController.js'

const router = Router()

// Registro de perfil: só valida o token (perfil ainda não existe)
router.post('/perfil', authTokenMiddleware, registrarPerfil)

// Demais rotas: exigem perfil completo
router.get('/perfil', authMiddleware, getPerfil)
router.put('/perfil', authMiddleware, atualizarPerfil)
router.put('/empresa', authMiddleware, atualizarEmpresa)

router.get('/integracoes', authMiddleware, getIntegracoes)
router.put('/integracoes', authMiddleware, salvarIntegracoes)

export default router
