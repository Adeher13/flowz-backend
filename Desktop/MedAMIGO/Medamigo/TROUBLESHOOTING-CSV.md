# 🔍 TROUBLESHOOTING - Importação CSV não aparece no banco

## ✅ Passo 1: Verificar se a tabela foi criada no Supabase

1. Acesse **Supabase → SQL Editor**
2. Execute o script: `sql/verificar-provas-anteriores.sql`
3. Verifique os resultados:
   - **Query 1**: `tabela_existe` deve retornar `true`
   - **Query 4**: `rowsecurity` deve retornar `true`
   - **Query 5**: Deve mostrar o total de questões
   - **Query 8**: Deve mostrar seu email como admin

**Se a tabela NÃO existir:**

- Execute o script: `sql/11-criar-tabela-provas-anteriores.sql`

---

## ✅ Passo 2: Verificar permissões de admin

Execute no SQL Editor:

```sql
SELECT
    ur.user_id,
    ur.role,
    au.email
FROM user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'SEU_EMAIL_AQUI';
```

**Resultado esperado:**

- Deve mostrar seu email com `role = 'admin'`

**Se NÃO aparecer admin:**

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'SEU_EMAIL_AQUI';
```

---

## ✅ Passo 3: Testar inserção manual

Execute no SQL Editor:

```sql
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
    'TESTE Manual',
    2024,
    'Esta é uma questão de teste inserida manualmente?',
    'Sim',
    'Não',
    'Talvez',
    'Não sei',
    'A',
    'Teste'
);
```

**Depois verifique:**

```sql
SELECT * FROM provas_anteriores WHERE nome_faculdade = 'TESTE Manual';
```

**Se der ERRO:**

- ❌ **"permission denied"** → Você não está como admin
- ❌ **"relation does not exist"** → Tabela não foi criada
- ❌ **"violates check constraint"** → Problema nos dados

---

## ✅ Passo 4: Testar importação com logs

1. Na aplicação, clique em **"Importar CSV"**
2. Clique no botão **"Testar Conexão"**
3. Abra o **Console do navegador** (F12 → Console)
4. Selecione o arquivo CSV
5. Clique em **"Importar"**
6. Observe os logs no console:

**Logs esperados:**

```
📄 Conteúdo CSV lido: nome_faculdade,ano,enunciado...
📊 Total de linhas: 6
📋 Headers encontrados: ["nome_faculdade", "ano", "enunciado"...]
✅ 5 provas processadas para inserção
📦 Primeira prova: {nome_faculdade: "USP", ano: 2023...}
📤 Inserindo lote 1: 5 questões
✅ Lote 1 inserido com sucesso: 5 registros
✅ SUCESSO! 5 provas importadas no total
🔄 Recarregando lista de provas...
✅ 5 provas carregadas do Supabase
```

**Se aparecer erro:**

- ❌ **"relation does not exist"** → Tabela não existe
- ❌ **"permission denied for table"** → Problema de RLS/permissão
- ❌ **"violates foreign key constraint"** → created_by inválido

---

## ✅ Passo 5: Verificar RLS (Row Level Security)

Execute no SQL Editor:

```sql
-- Ver policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'provas_anteriores';

-- Desabilitar RLS temporariamente para testar (APENAS PARA DEBUG)
ALTER TABLE provas_anteriores DISABLE ROW LEVEL SECURITY;

-- Depois de testar, REABILITAR:
ALTER TABLE provas_anteriores ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Passo 6: Formato correto do CSV

O arquivo CSV deve ter exatamente este formato:

```csv
nome_faculdade,ano,enunciado,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,resposta_correta,comentario,disciplina
USP,2023,Pergunta aqui?,Opção A,Opção B,Opção C,Opção D,Opção E,A,Comentário aqui,Disciplina
```

**IMPORTANTE:**

- ✅ Primeira linha = headers (nome das colunas)
- ✅ Sem espaços extras
- ✅ Sem linhas em branco no meio
- ✅ `ano` deve ser número (2023, não "2023")
- ✅ `resposta_correta` deve ser A, B, C, D ou E

---

## 🚨 Problemas Comuns

### Problema 1: "Importou mas não aparece"

**Causa:** RLS bloqueando a visualização
**Solução:**

```sql
-- Verificar policy de SELECT
SELECT * FROM pg_policies
WHERE tablename = 'provas_anteriores'
AND cmd = 'SELECT';
```

### Problema 2: "Permission denied"

**Causa:** Usuário não é admin
**Solução:**

```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'SEU_EMAIL';
```

### Problema 3: "Tabela não existe"

**Causa:** Script de criação não foi executado
**Solução:** Execute `sql/11-criar-tabela-provas-anteriores.sql`

### Problema 4: CSV não processa

**Causa:** Formato incorreto do CSV
**Solução:** Use o arquivo `exemplo-provas-anteriores.csv` como modelo

---

## 📞 Checklist Final

- [ ] Tabela `provas_anteriores` existe no Supabase
- [ ] RLS está habilitado na tabela
- [ ] 4 policies criadas (SELECT, INSERT, UPDATE, DELETE)
- [ ] Seu usuário está na tabela `user_roles` como admin
- [ ] Arquivo CSV está no formato correto
- [ ] Console do navegador aberto mostrando logs
- [ ] Botão "Testar Conexão" funciona
- [ ] Inserção manual funciona no SQL Editor

---

## 🎯 Teste Rápido Completo

1. **SQL Editor - Verificar tudo:**

```sql
-- 1. Tabela existe?
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'provas_anteriores'
);

-- 2. Sou admin?
SELECT * FROM user_roles
WHERE user_id = auth.uid();

-- 3. Quantas questões existem?
SELECT COUNT(*) FROM provas_anteriores;

-- 4. Posso inserir?
INSERT INTO provas_anteriores (nome_faculdade, ano, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, resposta_correta)
VALUES ('TESTE', 2024, 'Teste?', 'A', 'B', 'C', 'D', 'A')
RETURNING *;
```

Se TODOS esses comandos funcionarem, o problema pode estar na aplicação.
Se ALGUM falhar, o problema está no banco de dados.
