# ⚠️ LEIA ISTO PRIMEIRO - CONFIGURAÇÃO OBRIGATÓRIA

## 🚨 O sistema não funcionará sem configurar o Supabase!

Siga estes passos **ANTES** de rodar o projeto:

---

## 📝 Passo a Passo (5 minutos)

### 1️⃣ Criar Conta no Supabase (GRATUITO)

1. Acesse: **https://supabase.com**
2. Clique em **"Start your project"**
3. Faça login com GitHub ou email
4. Clique em **"New Project"**

### 2️⃣ Configurar Projeto

Preencha:
- **Name**: MercadoDashboard (ou qualquer nome)
- **Database Password**: Crie uma senha forte (guarde!)
- **Region**: South America (São Paulo)
- Clique em **"Create new project"**

⏱️ Aguarde 1-2 minutos enquanto o projeto é criado...

### 3️⃣ Criar Tabelas no Banco

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"+ New query"**
3. Abra o arquivo `supabase-setup.sql` deste projeto
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no SQL Editor do Supabase
6. Clique em **"Run"** (ou pressione Ctrl+Enter)
7. Aguarde a mensagem de sucesso ✅

### 4️⃣ Criar Bucket de Storage

1. No menu lateral, clique em **"Storage"**
2. Clique em **"Create a new bucket"**
3. Nome: `notas-fiscais`
4. **Marque** a opção "Public bucket" ✅
5. Clique em **"Create bucket"**

### 5️⃣ Pegar Suas Credenciais

1. No menu lateral, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Na seção **"Project API keys"**, copie:
   - **Project URL** (algo como: https://xxxxx.supabase.co)
   - **anon public** key (uma chave longa)

### 6️⃣ Configurar o Arquivo .env

1. Na raiz do projeto, edite o arquivo `.env`
2. Substitua os valores:

```env
VITE_SUPABASE_URL=https://seu-projeto-aqui.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-longa-aqui
```

3. **Salve o arquivo**

### 7️⃣ Instalar Dependências e Rodar

```bash
npm install
npm run dev
```

Acesse: **http://localhost:5173**

---

## ✅ Pronto!

Agora você pode:
1. **Cadastrar-se** no sistema
2. **Fazer login**
3. **Adicionar fornecedores**
4. **Registrar compras**
5. **Ver o dashboard**

---

## 🆘 Problemas?

### "Invalid supabaseUrl"
➜ Você não configurou o `.env` ou colocou credenciais erradas

### "Failed to fetch"
➜ Verifique se o projeto Supabase está ativo e se a URL está correta

### "Row Level Security policy violation"
➜ Você não executou o script SQL (`supabase-setup.sql`)

### "Bucket not found"
➜ Você não criou o bucket `notas-fiscais` no Storage

---

## 📚 Documentação Completa

- Veja `README.md` para documentação completa
- Veja `GUIA_RAPIDO.md` para tutoriais detalhados

---

## 💰 Custos

O plano **GRATUITO** do Supabase inclui:
- ✅ 500 MB de banco de dados
- ✅ 1 GB de storage
- ✅ 50.000 usuários ativos/mês
- ✅ Bandwidth ilimitado

**Custo: R$ 0,00/mês** 🎉

---

**Agora sim, mãos à obra! 🚀**
