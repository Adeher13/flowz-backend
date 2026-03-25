// Controller Google Calendar — OAuth2 + sincronização de agendamentos
import { supabaseAdmin } from '../services/supabaseService.js'

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI         = process.env.GOOGLE_REDIRECT_URI || 'https://flowz-backend.onrender.com/api/v1/google-calendar/callback'
const FRONTEND_URL         = process.env.FRONTEND_URL || 'https://flowz.app'

// ── Gera URL de autorização OAuth ───────────────────────────
export async function iniciarOAuth(req, res) {
  const empresaId = req.empresaId

  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/calendar',
    access_type:   'offline',
    prompt:        'consent',
    state:         empresaId, // passa empresa_id para recuperar no callback
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return res.json({ url })
}

// ── Callback OAuth — troca code por tokens ──────────────────
export async function callbackOAuth(req, res) {
  const { code, state: empresaId } = req.query

  if (!code || !empresaId) {
    return res.redirect(`${FRONTEND_URL}/configuracoes?erro=google_auth`)
  }

  try {
    // Troca code por tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (!tokens.access_token) {
      return res.redirect(`${FRONTEND_URL}/configuracoes?erro=google_token`)
    }

    const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Salva tokens na empresa
    await supabaseAdmin
      .from('empresas')
      .update({
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token || null,
        google_token_expiry:  expiry,
        google_connected:     true,
      })
      .eq('id', empresaId)

    return res.redirect(`${FRONTEND_URL}/configuracoes?google=conectado`)
  } catch (err) {
    console.error('Erro no callback Google:', err)
    return res.redirect(`${FRONTEND_URL}/configuracoes?erro=google_callback`)
  }
}

// ── Desconectar Google Calendar ──────────────────────────────
export async function desconectarGoogle(req, res) {
  const empresaId = req.empresaId

  await supabaseAdmin
    .from('empresas')
    .update({
      google_access_token:  null,
      google_refresh_token: null,
      google_token_expiry:  null,
      google_connected:     false,
    })
    .eq('id', empresaId)

  return res.json({ sucesso: true })
}

// ── Status da conexão ────────────────────────────────────────
export async function statusGoogle(req, res) {
  const empresaId = req.empresaId

  const { data } = await supabaseAdmin
    .from('empresas')
    .select('google_connected, google_calendar_id')
    .eq('id', empresaId)
    .single()

  return res.json({
    conectado:   data?.google_connected || false,
    calendar_id: data?.google_calendar_id || 'primary',
  })
}

// ── Função interna: refresh token se expirado ────────────────
async function getAccessToken(empresaId) {
  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('google_access_token, google_refresh_token, google_token_expiry')
    .eq('id', empresaId)
    .single()

  if (!empresa?.google_access_token) return null

  // Verifica se token está expirado (com margem de 5 min)
  const expiry = new Date(empresa.google_token_expiry)
  const agora  = new Date(Date.now() + 5 * 60 * 1000)

  if (agora < expiry) return empresa.google_access_token

  // Renova token
  if (!empresa.google_refresh_token) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: empresa.google_refresh_token,
      grant_type:    'refresh_token',
    }),
  })

  const tokens = await res.json()
  if (!tokens.access_token) return null

  const novoExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabaseAdmin
    .from('empresas')
    .update({ google_access_token: tokens.access_token, google_token_expiry: novoExpiry })
    .eq('id', empresaId)

  return tokens.access_token
}

// ── Função exportada: cria evento no Google Calendar ─────────
export async function criarEventoCalendar(empresaId, agendamento) {
  const accessToken = await getAccessToken(empresaId)
  if (!accessToken) return null

  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('google_calendar_id')
    .eq('id', empresaId)
    .single()

  const calendarId = empresa?.google_calendar_id || 'primary'

  const inicio = new Date(agendamento.data_hora)
  const fim    = new Date(inicio.getTime() + (agendamento.duracao_min || 60) * 60 * 1000)

  const evento = {
    summary:     agendamento.titulo,
    description: agendamento.notas || 'Agendado via Flowz',
    start: { dateTime: inicio.toISOString(), timeZone: 'America/Sao_Paulo' },
    end:   { dateTime: fim.toISOString(),    timeZone: 'America/Sao_Paulo' },
  }

  if (agendamento.contato?.email) {
    evento.attendees = [{ email: agendamento.contato.email }]
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evento),
    }
  )

  const data = await res.json()
  return data.id || null
}

// ── Função exportada: deleta evento do Google Calendar ───────
export async function deletarEventoCalendar(empresaId, googleEventId) {
  const accessToken = await getAccessToken(empresaId)
  if (!accessToken || !googleEventId) return

  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('google_calendar_id')
    .eq('id', empresaId)
    .single()

  const calendarId = empresa?.google_calendar_id || 'primary'

  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )
}
