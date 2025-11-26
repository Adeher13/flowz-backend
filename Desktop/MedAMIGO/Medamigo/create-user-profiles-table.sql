-- Criar tabela de perfis de usuários com controle de acesso
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  access_expires_at TIMESTAMPTZ,
  access_status TEXT DEFAULT 'active' CHECK (access_status IN ('active', 'expired', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_access_status ON user_profiles(access_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_access_expires_at ON user_profiles(access_expires_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Função para atualizar status de acesso expirado automaticamente
CREATE OR REPLACE FUNCTION check_expired_access()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET access_status = 'expired'
  WHERE access_expires_at < NOW()
    AND access_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas avatar do próprio perfil
DROP POLICY IF EXISTS "Users can update own avatar" ON user_profiles;
CREATE POLICY "Users can update own avatar"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins podem ver todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins podem atualizar todos os perfis
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins podem inserir perfis
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Policy: Admins podem deletar perfis
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Inserir aluno fictício para testes
-- Nota: Substitua o UUID abaixo por um user_id válido do auth.users após criar o usuário
-- ou execute este INSERT manualmente após criar o usuário via Supabase Auth

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Perfis de usuários com controle de acesso à plataforma';
COMMENT ON COLUMN user_profiles.access_expires_at IS 'Data de expiração do acesso do usuário';
COMMENT ON COLUMN user_profiles.access_status IS 'Status do acesso: active, expired ou suspended';
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL do avatar do usuário (pode ser atualizado pelo próprio usuário)';
