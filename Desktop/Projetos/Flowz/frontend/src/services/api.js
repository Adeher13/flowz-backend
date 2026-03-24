// Cliente de API — centraliza todas as chamadas ao backend Express
import { supabase } from './supabase.js'

const API_BASE = (import.meta.env.VITE_BACKEND_URL || '') + '/api/v1'

// Realiza uma requisição autenticada ao backend
// Injeta o JWT do Supabase no header Authorization
async function fetchWithAuth(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.erro || `Erro ${response.status}`)
  }

  return data
}

// ============================================================
// API de Auth / Perfil
// ============================================================
export const authApi = {
  registrarPerfil: (body) =>
    fetchWithAuth('/auth/perfil', { method: 'POST', body: JSON.stringify(body) }),

  getPerfil: () => fetchWithAuth('/auth/perfil'),

  atualizarPerfil: (body) =>
    fetchWithAuth('/auth/perfil', { method: 'PUT', body: JSON.stringify(body) }),

  atualizarEmpresa: (body) =>
    fetchWithAuth('/auth/empresa', { method: 'PUT', body: JSON.stringify(body) }),

  getIntegracoes: () => fetchWithAuth('/auth/integracoes'),

  salvarIntegracoes: (body) =>
    fetchWithAuth('/auth/integracoes', { method: 'PUT', body: JSON.stringify(body) }),
}

// ============================================================
// API de Leads
// ============================================================
export const leadsApi = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetchWithAuth(`/leads${query ? `?${query}` : ''}`)
  },

  criar: (body) =>
    fetchWithAuth('/leads', { method: 'POST', body: JSON.stringify(body) }),

  atualizar: (id, body) =>
    fetchWithAuth(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  moverEtapa: (id, etapaId) =>
    fetchWithAuth(`/leads/${id}/etapa`, {
      method: 'PATCH',
      body: JSON.stringify({ etapa_id: etapaId }),
    }),

  deletar: (id) =>
    fetchWithAuth(`/leads/${id}`, { method: 'DELETE' }),

  getAtividades: (id) =>
    fetchWithAuth(`/leads/${id}/atividades`),

  adicionarAtividade: (id, body) =>
    fetchWithAuth(`/leads/${id}/atividades`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

// ============================================================
// API de Contatos
// ============================================================
export const contatosApi = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetchWithAuth(`/contatos${query ? `?${query}` : ''}`)
  },

  get: (id) => fetchWithAuth(`/contatos/${id}`),

  criar: (body) =>
    fetchWithAuth('/contatos', { method: 'POST', body: JSON.stringify(body) }),

  atualizar: (id, body) =>
    fetchWithAuth(`/contatos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deletar: (id) =>
    fetchWithAuth(`/contatos/${id}`, { method: 'DELETE' }),
}

// ============================================================
// API de Agenda
// ============================================================
export const agendaApi = {
  listar: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetchWithAuth(`/agenda${query ? `?${query}` : ''}`)
  },

  criar: (body) =>
    fetchWithAuth('/agenda', { method: 'POST', body: JSON.stringify(body) }),

  atualizarStatus: (id, status) =>
    fetchWithAuth(`/agenda/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  confirmarWhatsApp: (id) =>
    fetchWithAuth(`/agenda/${id}/whatsapp`, { method: 'POST' }),

  deletar: (id) =>
    fetchWithAuth(`/agenda/${id}`, { method: 'DELETE' }),
}

// ============================================================
// API do Dashboard
// ============================================================
export const dashboardApi = {
  metricas: () => fetchWithAuth('/dashboard/metricas'),
}

// ============================================================
// API Evolution API (WhatsApp novo)
// ============================================================
export const evolutionApi = {
  // Instância
  getInstancia: () => fetchWithAuth('/whatsapp-evo/instancia'),
  criarInstancia: (instanceName) => fetchWithAuth('/whatsapp-evo/instancia', {
    method: 'POST',
    body: instanceName ? JSON.stringify({ instanceName }) : undefined,
  }),
  getEstado: () => fetchWithAuth('/whatsapp-evo/instancia/estado'),
  conectar: () => fetchWithAuth('/whatsapp-evo/instancia/conectar', { method: 'POST' }),
  desconectar: () => fetchWithAuth('/whatsapp-evo/instancia/desconectar', { method: 'POST' }),
  reiniciar: () => fetchWithAuth('/whatsapp-evo/instancia/reiniciar', { method: 'POST' }),
  deletar: () => fetchWithAuth('/whatsapp-evo/instancia', { method: 'DELETE' }),
  configurarWebhook: () => fetchWithAuth('/whatsapp-evo/instancia/webhook', { method: 'POST' }),

  // Conversas
  listarConversas: () => fetchWithAuth('/whatsapp-evo/conversas'),
  // antes = timestamp ms da mensagem mais antiga já carregada (para paginar para trás)
  listarMensagens: (jid, antes = null) => {
    const params = antes ? `?antes=${antes}&limite=100` : '?limite=100'
    return fetchWithAuth(`/whatsapp-evo/conversas/${encodeURIComponent(jid)}/mensagens${params}`)
  },
  enviarMensagem: (jid, mensagem) =>
    fetchWithAuth(`/whatsapp-evo/conversas/${encodeURIComponent(jid)}/enviar`, {
      method: 'POST',
      body: JSON.stringify({ mensagem }),
    }),
  getFotoPerfil: (numero) => fetchWithAuth(`/whatsapp-evo/contatos/${numero}/foto`),
  getMidia: (msgId) => fetchWithAuth(`/whatsapp-evo/mensagens/${encodeURIComponent(msgId)}/midia`),
}

// ============================================================
// API Agentes IA (N8N)
// ============================================================
export const agentesApi = {
  get: () => fetchWithAuth('/agente-ia'),
  salvar: (body) => fetchWithAuth('/agente-ia', { method: 'POST', body: JSON.stringify(body) }),
  getDisponibilidade: () => fetchWithAuth('/agente-ia/disponibilidade'),
  salvarDisponibilidade: (disponibilidade) =>
    fetchWithAuth('/agente-ia/disponibilidade', {
      method: 'POST',
      body: JSON.stringify({ disponibilidade }),
    }),
}
