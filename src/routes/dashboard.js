// Rotas do dashboard — métricas consolidadas
import { Router } from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js'
import { getMetricas } from '../controllers/dashboardController.js'

const router = Router()

router.use(authMiddleware)

router.get('/metricas', getMetricas)

export default router
