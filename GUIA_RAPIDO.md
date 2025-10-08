# 🚀 Guia Rápido de Início

## ⚡ Start Rápido (5 minutos)

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar conta no Supabase
- Acesse: https://supabase.com
- Crie conta gratuita
- Crie novo projeto
- Aguarde 2 minutos

### 3. Configurar banco de dados
1. No Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase-setup.sql`
3. Cole e execute

### 4. Configurar Storage
1. No Supabase, vá em **Storage**
2. Clique em "Create bucket"
3. Nome: `notas-fiscais`
4. Marque como **Public**
5. Crie

### 5. Pegar credenciais
1. No Supabase, vá em **Settings** > **API**
2. Copie:
   - Project URL
   - anon/public key

### 6. Criar arquivo .env
```bash
cp .env.example .env
```

Edite `.env` e cole:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

### 7. Rodar o projeto
```bash
npm run dev
```

Acesse: http://localhost:5173

## 🎯 Primeiro Uso

1. **Cadastre-se** na tela inicial
2. Faça **login**
3. Vá em **Fornecedores** > Adicione alguns fornecedores
4. Vá em **Compras** > Registre algumas compras
5. Veja o **Dashboard** com suas métricas!

## 📋 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Type check
npm run type-check
```

## 🐛 Problemas Comuns

**Erro de variáveis de ambiente:**
- Verifique se o `.env` existe e está preenchido

**Erro ao conectar no Supabase:**
- Verifique se as credenciais estão corretas
- Confirme que o projeto está ativo

**Erro ao fazer upload:**
- Verifique se o bucket `notas-fiscais` foi criado como **público**

**Não vejo meus dados:**
- Isso é normal! O RLS garante que você vê apenas seus dados

## 📺 Demonstração Visual

### Tela de Login
- Login simples com email e senha
- Link para cadastro

### Dashboard
- 4 cards com métricas
- 2 gráficos interativos
- Alertas de vencimento

### Fornecedores
- Lista em cards
- Busca em tempo real
- Modal de criação/edição

### Compras
- Lista detalhada
- Filtros avançados
- Upload de notas fiscais

### Relatórios
- Filtros por período e fornecedor
- Exportação PDF e Excel
- Tabela completa

## 🎨 Temas

- **Tema claro**: Padrão
- **Tema escuro**: Clique no ícone de lua no menu

## 📱 PWA

O sistema pode ser instalado como app:
- Chrome: Menu > Instalar
- Safari: Compartilhar > Adicionar à Tela

## 🔒 Segurança

- Senhas com mínimo 6 caracteres
- JWT com renovação automática
- RLS no banco de dados
- Dados isolados por usuário

## ⚙️ Customização

### Mudar cores
Edite: `tailwind.config.js`

### Mudar logo
Substitua: `public/vite.svg`

### Adicionar campos
1. Atualize o tipo em `src/types/index.ts`
2. Atualize o schema Zod no formulário
3. Atualize o banco no Supabase

## 📞 Precisa de Ajuda?

- Leia o `README.md` completo
- Verifique a documentação do Supabase
- Abra uma issue no GitHub

---

**Pronto! Agora você tem um sistema completo funcionando! 🎉**
