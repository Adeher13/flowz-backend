# 📚 Controle do Semestre - Instruções de Instalação

## 🎯 O que é?

Uma página completa para os alunos controlarem suas notas semestrais, com:

- ✅ Cadastro de semestres com disciplinas
- ✅ Cálculo automático de médias
- ✅ Controle de créditos
- ✅ Status de aprovação/reprovação
- ✅ Estatísticas gerais do curso
- ✅ Interface moderna e intuitiva

## 🗄️ Passo 1: Criar Tabela no Supabase

1. **Abra:** Supabase Dashboard → SQL Editor
2. **Copie** todo o conteúdo do arquivo `10-criar-tabela-semester-grades.sql`
3. **Cole** no editor SQL
4. **Clique** em "RUN"
5. **Aguarde** a mensagem "Success"

✅ Isso criará:

- Tabela `semester_grades` com todos os campos necessários
- Políticas RLS para segurança (alunos veem só suas notas, admins veem tudo)
- Índices para performance
- Triggers para atualização automática

## 🎨 Passo 2: Acessar a Página

A página já está configurada e pronta! Acesse pelo menu lateral:

📍 **Caminho:** Menu Lateral → **Controle do Semestre** (ícone de capelo)

## 🌟 Melhorias no Menu Lateral

### Novidades Visuais:

- 🎨 **Header com gradiente azul/roxo** no topo (avatar + nome)
- ✨ **Botões com gradiente** quando selecionados
- 🔵 **Hover suave** com gradiente claro
- 🔴 **Botão Logout** estilizado em vermelho
- 🎓 **Novo menu**: "Controle do Semestre"

### Cores Aplicadas:

- **Selecionado**: Gradiente azul → roxo com texto branco
- **Hover**: Gradiente azul claro → roxo claro
- **Avatar**: Anel branco com sombra
- **Logout**: Vermelho com hover mais escuro

## 📋 Como Usar a Página

### Adicionar Novo Semestre:

1. Clique em **"Novo Semestre"**
2. Preencha:
   - Número do semestre (1, 2, 3...)
   - Ano (2024, 2025...)
3. **Adicione disciplinas:**
   - Nome da disciplina (ex: Anatomia Humana I)
   - Nota (0.0 a 10.0)
   - Créditos (ex: 4)
   - Status (Cursando, Aprovado, Reprovado)
4. Clique em **"Adicionar"** para cada disciplina
5. Adicione observações (opcional)
6. Clique em **"Salvar Semestre"**

### Editar Semestre:

1. Clique no ícone de **lápis** no card do semestre
2. Edite os dados
3. Salve as alterações

### Remover Semestre:

1. Clique no ícone de **lixeira** no card
2. Confirme a exclusão

## 📊 Estatísticas Calculadas Automaticamente:

### Por Semestre:

- 📈 Média do semestre
- 🎓 Total de créditos
- ✅ Disciplinas aprovadas
- ❌ Disciplinas reprovadas

### Geral (Todos os Semestres):

- 📅 Total de semestres cursados
- 📊 Média geral do curso
- 🏆 Total de créditos acumulados
- ✅ Total de aprovações
- ⚠️ Total de reprovações

## 🎨 Recursos Criativos Incluídos:

1. **Animações suaves** com Framer Motion
2. **Gradientes modernos** azul/roxo/verde
3. **Cards interativos** com hover e sombra
4. **Badges coloridos** por status:
   - 🟢 Verde = Aprovado
   - 🔴 Vermelho = Reprovado
   - 🔵 Azul = Cursando
5. **Estatísticas visuais** com ícones e cores
6. **Interface responsiva** (funciona em mobile)
7. **Empty state** bonito quando não há semestres

## 🔐 Segurança (RLS):

- ✅ Alunos veem apenas suas próprias notas
- ✅ Admins podem ver notas de todos os alunos
- ✅ Cada usuário só pode editar suas próprias notas
- ✅ Admins podem gerenciar todas as notas

## 📱 Responsivo:

- ✅ Desktop (grid 2 colunas)
- ✅ Tablet (grid 1 coluna)
- ✅ Mobile (totalmente adaptado)

## 🚀 Pronto para Uso!

Após executar o SQL no Supabase, a página já está 100% funcional!

**Recursos adicionais:**

- Cálculos automáticos de médias
- Validação de campos obrigatórios
- Mensagens de sucesso/erro
- Interface intuitiva e moderna
- Performance otimizada

---

## 🎨 Preview das Cores do Menu:

```
Header (Avatar + Nome):
- Fundo: Gradiente azul (#2563eb) → roxo (#9333ea)
- Texto nome: Branco bold
- Texto email: Azul claro
- Avatar: Ring branco com sombra

Botões Menu:
- Normal: Cinza escuro
- Hover: Gradiente azul claro → roxo claro
- Selecionado: Gradiente azul → roxo + branco + sombra

Botão Logout:
- Fundo: Vermelho claro
- Border: Vermelho médio
- Hover: Vermelho mais escuro
```

---

**Desenvolvido com ❤️ para MedAMIGO**
