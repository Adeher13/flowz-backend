// Middleware de autenticação — valida JWT do Supabase e injeta dados do usuário
import { validateToken, getUserProfile } from '../services/supabaseService.js'

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação ausente' })
  }

  const token = authHeader.replace('Bearer ', '')

  // Valida o JWT com o Supabase
  const authUser = await validateToken(token)
  if (!authUser) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }

  // Carrega o perfil completo com empresa_id
  const perfil = await getUserProfile(authUser.id)
  if (!perfil) {
    return res.status(403).json({
      erro: 'Perfil de usuário não encontrado. Complete seu cadastro.',
    })
  }

  // Injeta dados do usuário e empresa em todas as rotas protegidas
  req.usuario = perfil
  req.empresaId = perfil.empresa_id

  next()
}

// Middleware leve — só valida o token JWT, sem exigir perfil existente
// Usado na rota de registro (POST /auth/perfil) onde o perfil ainda não existe
export async function authTokenMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação ausente' })
  }

  const token = authHeader.replace('Bearer ', '')

  const authUser = await validateToken(token)
  if (!authUser) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' })
  }

  // Injeta só id e email — sem buscar perfil no banco
  req.usuario = { id: authUser.id, email: authUser.email }

  next()
}
