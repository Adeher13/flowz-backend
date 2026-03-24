// Componente raiz — roteamento, proteção de rotas e inicialização de Realtime
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.js'
import { useRealtime } from './hooks/useRealtime.js'
import { useStore } from './store/useStore.js'

import { Landing }       from './pages/Landing.jsx'
import { Login }         from './pages/Login.jsx'
import { Dashboard }     from './pages/Dashboard.jsx'
import { Leads }         from './pages/Leads.jsx'
import { Agenda }        from './pages/Agenda.jsx'
import { Contatos }      from './pages/Contatos.jsx'
import { Configuracoes } from './pages/Configuracoes.jsx'
import { Conversas }     from './pages/Conversas.jsx'
import { AgenteIA }      from './pages/AgenteIA.jsx'
import { NotFound }      from './pages/NotFound.jsx'

// Componente que inicializa auth e realtime uma única vez
function AppCore() {
  useAuth()      // Gerencia sessão e perfil do usuário
  useRealtime()  // Inscreve nos canais Supabase após autenticação
  return null
}

// Rota protegida — aguarda auth carregar, redireciona para login se sem sessão
function ProtectedRoute({ children }) {
  const { session, usuario, authLoading } = useStore()

  // Enquanto verifica a sessão, mostra tela em branco (evita flash)
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#080C14',
        color: '#5A6480', fontFamily: 'DM Sans, sans-serif', fontSize: 14,
      }}>
        Carregando...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Usuário autenticado mas sem perfil — redireciona para completar cadastro
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AppCore />
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Landing page pública */}
        <Route path="/" element={<Landing />} />

        {/* Rotas protegidas */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/leads"
          element={<ProtectedRoute><Leads /></ProtectedRoute>}
        />
        <Route
          path="/agenda"
          element={<ProtectedRoute><Agenda /></ProtectedRoute>}
        />
        <Route
          path="/contatos"
          element={<ProtectedRoute><Contatos /></ProtectedRoute>}
        />
        <Route
          path="/configuracoes"
          element={<ProtectedRoute><Configuracoes /></ProtectedRoute>}
        />
        <Route
          path="/conversas"
          element={<ProtectedRoute><Conversas /></ProtectedRoute>}
        />
        <Route
          path="/agente-ia"
          element={<ProtectedRoute><AgenteIA /></ProtectedRoute>}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
