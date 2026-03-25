// Rotas Google Calendar
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import {
  iniciarOAuth,
  callbackOAuth,
  desconectarGoogle,
  statusGoogle,
} from '../controllers/googleCalendarController.js'

const router = Router()

router.get('/auth',         authMiddleware, iniciarOAuth)
router.get('/callback',     callbackOAuth)   // sem auth — é redirect do Google
router.delete('/desconectar', authMiddleware, desconectarGoogle)
router.get('/status',       authMiddleware, statusGoogle)

export default router
