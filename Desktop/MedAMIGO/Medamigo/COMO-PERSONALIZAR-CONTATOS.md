# 📞 PERSONALIZAR CONTATOS DA TELA DE ACESSO EXPIRADO

## 📍 Localização do Arquivo

`src/components/AccessControl.jsx`

## ✏️ O que você precisa alterar:

### 1️⃣ EMAIL (3 ocorrências)

**Linha aproximada: 157, 236, etc**

Procure por:

```javascript
href = 'mailto:contato@medamigo.com';
```

Altere para seu email real:

```javascript
href = 'mailto:seuemail@seudominio.com';
```

E também o texto exibido:

```javascript
contato@medamigo.com
```

Para:

```javascript
seuemail@seudominio.com
```

---

### 2️⃣ WHATSAPP (3 ocorrências)

**Linhas aproximadas: 173, 200, 252, 275**

Procure por:

```javascript
href = 'https://wa.me/5511999999999';
```

Altere para seu número de WhatsApp **COM código do país**:

```javascript
href = 'https://wa.me/5511987654321';
```

Formato: `55` (Brasil) + `11` (DDD) + `987654321` (número sem traços)

E também o texto exibido:

```javascript
(11) 99999-9999
```

Para:

```javascript
(11) 98765-4321
```

---

### 3️⃣ MENSAGEM DO WHATSAPP (2 ocorrências)

**Linhas aproximadas: 200, 275**

**Para acesso expirado:**

```javascript
?text=Olá! Gostaria de renovar meu acesso à plataforma MedAMIGO.
```

**Para acesso suspenso:**

```javascript
?text=Olá! Meu acesso está suspenso e gostaria de regularizar.
```

Personalize essas mensagens se desejar!

---

## 🎨 PERSONALIZAR OFERTA DE DESCONTO

**Linha aproximada: 136-147**

Localize:

```javascript
<h3 className='text-xl font-bold text-green-800'>
  Oferta Especial de Rematrícula!
</h3>
<p className='text-green-800 font-semibold text-lg'>
  🎉 Desconto exclusivo para renovação imediata!
</p>
<p className='text-green-700 mt-2'>
  Faça sua rematrícula agora e ganhe condições especiais...
</p>
```

Altere o texto da oferta conforme sua estratégia de marketing!

---

## 📝 EXEMPLO DE EDIÇÃO COMPLETA

```javascript
// ANTES (exemplo)
<a
  href='mailto:contato@medamigo.com'
  // ...
>
  contato@medamigo.com
</a>

<a
  href='https://wa.me/5511999999999'
  // ...
>
  (11) 99999-9999
</a>

// DEPOIS (exemplo com seus dados)
<a
  href='mailto:assessoria@clinicamedica.com.br'
  // ...
>
  assessoria@clinicamedica.com.br
</a>

<a
  href='https://wa.me/5521987654321'
  // ...
>
  (21) 98765-4321
</a>
```

---

## ⚡ BUSCAR E SUBSTITUIR NO VS CODE

1. Pressione `Ctrl + H` (Windows/Linux) ou `Cmd + H` (Mac)
2. Digite no "Find": `5511999999999`
3. Digite no "Replace": seu número (ex: `5521987654321`)
4. Clique em "Replace All"
5. Repita para o email e outros textos

---

## 🧪 TESTAR

Após fazer as alterações:

1. Para testar a tela de **EXPIRADO**:

   - No Supabase, vá em Table Editor → user_profiles
   - Edite um aluno e coloque `access_expires_at` com data passada
   - Ou coloque `access_status = 'expired'`
   - Faça login com esse aluno

2. Para testar a tela de **SUSPENSO**:

   - Coloque `access_status = 'suspended'`
   - Faça login com esse aluno

3. Clique nos botões de contato e verifique se:
   - Email abre com o endereço correto
   - WhatsApp abre com o número correto e mensagem

---

## ⚠️ IMPORTANTE

- **ADMIN nunca vê essa tela** - Admin sempre tem acesso total
- A verificação é feita automaticamente ao carregar qualquer página
- Se o acesso expirar, o aluno verá APENAS essa tela, sem acesso a nada

---

## 📊 MONITORAMENTO

Use o script SQL `5-funcao-verificar-expirados.sql` para:

- Ver quantos alunos estão expirados
- Ver quem vai expirar nos próximos 7 dias
- Atualizar status automaticamente
