// Serviço Supabase — cliente administrativo com service role key
// Usado exclusivamente no backend para operações privilegiadas
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias')
}

// Cliente admin — bypassa RLS quando necessário
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Valida um JWT do Supabase e retorna o usuário autenticado
export async function validateToken(token) {
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}

// Busca o perfil do usuário com dados da empresa vinculada
export async function getUserProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*, empresa:empresas(*)')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}
