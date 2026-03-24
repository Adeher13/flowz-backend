// Aplicação Express — configuração principal do servidor Flowz
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

import leadsRoutes      from './routes/leads.js'
import contatosRoutes   from './routes/contatos.js'
import agendaRoutes     from './routes/agenda.js'
import authRoutes       from './routes/auth.js'
import dashboardRoutes  from './routes/dashboard.js'
import whatsappRoutes   from './routes/whatsapp.js'
import evolutionRoutes  from './routes/evolution.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { addWsClientEvo } from './services/webhookEvolutionService.js'
import { receberWebhook } from './controllers/evolutionController.js'

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// ============================================================
// Segurança e parsing
// ============================================================

app.use(helmet())

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
]

app.use(cors({
  origin: (origin, cb) => {
    // Permite requisições sem origin (ex: Postman, curl) e origens na lista
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS bloqueado para origem: ${origin}`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.use(express.json({ limit: '1mb' }))

// ============================================================
// Rotas da API
// ============================================================

// Webhook Evolution API — sem auth, registrado ANTES das rotas autenticadas
// A Evolution API chama esta rota de fora (POST direto sem token)
app.post('/api/v1/whatsapp/webhook', receberWebhook)

app.use('/api/v1/auth',         authRoutes)
app.use('/api/v1/leads',        leadsRoutes)
app.use('/api/v1/contatos',     contatosRoutes)
app.use('/api/v1/agenda',       agendaRoutes)
app.use('/api/v1/dashboard',    dashboardRoutes)
app.use('/api/v1/whatsapp',     whatsappRoutes)        // Baileys (legado)
app.use('/api/v1/whatsapp-evo', evolutionRoutes)       // Evolution API (novo)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', versao: '1.0.0', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

// ============================================================
// WebSocket — QR Code e status do WhatsApp em tempo real
// ============================================================

// WebSocket Evolution API (novo)
const wssEvo = new WebSocketServer({ server, path: '/ws/whatsapp-evo' })
wssEvo.on('connection', (ws) => {
  console.log('[WS] Cliente conectado ao canal WhatsApp (Evolution)')
  addWsClientEvo(ws)
})

// ============================================================
// Inicialização do servidor
// ============================================================

server.listen(PORT, () => {
  console.log(`[Flowz] Servidor rodando na porta ${PORT}`)
  console.log(`[Flowz] WebSocket Evolution: ws://localhost:${PORT}/ws/whatsapp-evo`)
  console.log(`[Flowz] Ambiente: ${process.env.NODE_ENV || 'development'}`)
})

export default app
