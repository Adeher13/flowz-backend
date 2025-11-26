-- ==========================================
-- VERIFICAR TABELA provas_anteriores
-- ==========================================

-- 1. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'provas_anteriores'
) AS tabela_existe;

-- 2. Ver estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'provas_anteriores' 
ORDER BY ordinal_position;

-- 3. Ver policies de RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'provas_anteriores';

-- 4. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'provas_anteriores';

-- 5. Contar registros existentes
SELECT COUNT(*) as total_questoes FROM provas_anteriores;

-- 6. Ver algumas questões (se existirem)
SELECT 
    id,
    nome_faculdade,
    ano,
    LEFT(enunciado, 50) as enunciado_preview,
    resposta_correta,
    created_at
FROM provas_anteriores 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Testar insert manual (executar apenas se quiser testar)
-- IMPORTANTE: Comente esta linha se não quiser inserir dados de teste
/*
INSERT INTO provas_anteriores (
    nome_faculdade,
    ano,
    enunciado,
    opcao_a,
    opcao_b,
    opcao_c,
    opcao_d,
    resposta_correta,
    disciplina
) VALUES (
    'TESTE - Faculdade',
    2024,
    'Esta é uma questão de teste?',
    'Opção A',
    'Opção B',
    'Opção C',
    'Opção D',
    'A',
    'Teste'
);
*/

-- 8. Ver user_roles (para verificar se admin está configurado)
SELECT 
    ur.user_id,
    ur.role,
    au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin'
LIMIT 5;
