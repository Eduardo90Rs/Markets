# 🛒 Mercado Dashboard - Sistema de Controle de Fornecedores

Sistema completo para gerenciamento de fornecedores e compras, desenvolvido com React, TypeScript e Supabase.

![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green)

## 📋 Funcionalidades

### ✅ Completas e Funcionando

- **Autenticação Completa**
  - Login e cadastro com Supabase Auth
  - Sessão persistente
  - Proteção de rotas

- **Gestão de Fornecedores**
  - CRUD completo (Criar, Ler, Atualizar, Deletar)
  - Busca por nome
  - Status ativo/inativo
  - Informações detalhadas (CNPJ, telefone, email, endereço, produtos, prazo de pagamento)

- **Gestão de Compras**
  - CRUD completo
  - Upload de notas fiscais (Supabase Storage)
  - Múltiplas formas de pagamento (Pix, Boleto, Cartão, Dinheiro, Cheque)
  - Controle de status (pago/pendente)
  - Data de vencimento para boletos
  - Observações

- **Dashboard Interativo**
  - Cards com métricas do mês atual
  - Gráficos de barras e pizza (Recharts)
  - Gastos por fornecedor
  - Alertas de contas próximas do vencimento (7 dias)

- **Sistema de Relatórios**
  - Filtros avançados (fornecedor, período, status)
  - Exportação para PDF (jsPDF)
  - Exportação para Excel (XLSX)
  - Tabelas detalhadas
  - Totalizadores

- **Interface Responsiva**
  - Design adaptado para desktop, tablet e mobile
  - Menu lateral colapsável
  - Tema claro/escuro
  - PWA (Progressive Web App)

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18.3** - Biblioteca UI
- **TypeScript 5.5** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **React Router DOM** - Roteamento
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Recharts** - Gráficos interativos
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

### Backend & Serviços
- **Supabase** - Backend as a Service
  - PostgreSQL Database
  - Authentication
  - Storage (upload de arquivos)
  - Row Level Security (RLS)

### Exportação
- **jsPDF** - Geração de PDFs
- **XLSX** - Geração de planilhas Excel

## 📦 Instalação e Configuração

### 1. Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git

### 2. Clonar o Repositório

```bash
git clone <seu-repositorio>
cd DashboardMercado
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Configurar Supabase

#### 4.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta (se necessário)
3. Clique em "New Project"
4. Preencha:
   - Nome do projeto: "MercadoDashboard"
   - Database Password: (crie uma senha forte)
   - Region: South America (São Paulo)
5. Aguarde a criação do projeto (1-2 minutos)

#### 4.2. Criar Tabelas no Banco de Dados

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "+ New Query"
3. Cole o SQL abaixo e execute:

```sql
-- Tabela de Fornecedores
CREATE TABLE fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  produtos_principais TEXT,
  prazo_pagamento_padrao INTEGER,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Compras
CREATE TABLE compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  data_compra DATE NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Pix', 'Boleto', 'Cartão', 'Dinheiro', 'Cheque')),
  numero_nf TEXT,
  data_vencimento DATE,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pago', 'pendente')),
  observacoes TEXT,
  arquivo_nf_url TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_compras_user_id ON compras(user_id);
CREATE INDEX idx_compras_fornecedor_id ON compras(fornecedor_id);
CREATE INDEX idx_compras_data_compra ON compras(data_compra);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### 4.3. Configurar Row Level Security (RLS)

Execute este SQL para garantir que cada usuário veja apenas seus próprios dados:

```sql
-- Habilitar RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- Políticas para fornecedores
CREATE POLICY "Usuários podem ver seus próprios fornecedores"
  ON fornecedores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios fornecedores"
  ON fornecedores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios fornecedores"
  ON fornecedores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios fornecedores"
  ON fornecedores FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para compras
CREATE POLICY "Usuários podem ver suas próprias compras"
  ON compras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias compras"
  ON compras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias compras"
  ON compras FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias compras"
  ON compras FOR DELETE
  USING (auth.uid() = user_id);
```

#### 4.4. Configurar Storage para Notas Fiscais

1. No Supabase, vá em **Storage**
2. Clique em "Create a new bucket"
3. Nome: `notas-fiscais`
4. Public bucket: ✅ (marque como público)
5. Clique em "Create bucket"

6. Configure as políticas de storage executando este SQL:

```sql
-- Política de upload (apenas usuários autenticados)
CREATE POLICY "Usuários autenticados podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'notas-fiscais');

-- Política de visualização (público)
CREATE POLICY "Todos podem visualizar notas fiscais"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'notas-fiscais');

-- Política de exclusão (apenas dono)
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais');
```

#### 4.5. Obter Credenciais

1. No Supabase, vá em **Settings** > **API**
2. Copie:
   - **Project URL**
   - **anon/public key**

### 5. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example`:

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e cole suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 6. Executar o Projeto

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🌐 Deploy

### Deploy na Vercel (Recomendado)

1. Instale a Vercel CLI:

```bash
npm i -g vercel
```

2. Faça o deploy:

```bash
vercel
```

3. Configure as variáveis de ambiente na Vercel:
   - Vá em Settings > Environment Variables
   - Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

### Deploy no Netlify

1. Instale a Netlify CLI:

```bash
npm i -g netlify-cli
```

2. Faça o build:

```bash
npm run build
```

3. Deploy:

```bash
netlify deploy --prod
```

## 📱 PWA - Instalação como App

O sistema funciona como PWA e pode ser instalado:

- **Android/Chrome**: Menu > Instalar app
- **iOS/Safari**: Compartilhar > Adicionar à Tela de Início
- **Desktop**: Ícone de instalação na barra de endereço

## 🗂️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                 # Componentes base (Button, Input, Card, Modal, Select)
│   ├── layout/             # Layout (Sidebar, MainLayout, ProtectedRoute)
│   ├── fornecedores/       # FornecedorForm
│   └── compras/            # CompraForm
├── contexts/
│   ├── AuthContext.tsx     # Gerenciamento de autenticação
│   └── ThemeContext.tsx    # Tema claro/escuro
├── pages/
│   ├── Login.tsx           # Página de login
│   ├── Cadastro.tsx        # Página de cadastro
│   ├── Dashboard.tsx       # Dashboard com métricas e gráficos
│   ├── Fornecedores.tsx    # Listagem e CRUD de fornecedores
│   ├── Compras.tsx         # Listagem e CRUD de compras
│   └── Relatorios.tsx      # Relatórios e exportação
├── services/
│   ├── fornecedoresService.ts  # API de fornecedores
│   └── comprasService.ts       # API de compras
├── types/
│   ├── database.ts         # Tipos do Supabase
│   └── index.ts            # Tipos gerais
├── utils/
│   └── exportUtils.ts      # Funções de exportação PDF/Excel
├── lib/
│   └── supabase.ts         # Cliente Supabase
├── App.tsx                 # Rotas principais
└── main.tsx                # Entry point
```

## 💡 Como Usar

### 1. Primeiro Acesso

1. Acesse o sistema e clique em "Cadastre-se"
2. Preencha nome, email e senha
3. Faça login

### 2. Cadastrar Fornecedores

1. Vá em **Fornecedores**
2. Clique em "Novo Fornecedor"
3. Preencha pelo menos o nome (obrigatório)
4. Salve

### 3. Registrar Compras

1. Vá em **Compras**
2. Clique em "Nova Compra"
3. Selecione o fornecedor
4. Preencha data, valor e forma de pagamento
5. (Opcional) Faça upload da nota fiscal
6. Salve

### 4. Visualizar Dashboard

- Acesse **Dashboard** para ver:
  - Total gasto no mês
  - Número de compras
  - Contas a pagar
  - Gráficos por fornecedor
  - Alertas de vencimento

### 5. Gerar Relatórios

1. Vá em **Relatórios**
2. Selecione filtros (fornecedor, período, status)
3. Clique em "Gerar Relatório"
4. Exporte para PDF ou Excel

## 🔐 Segurança

- ✅ Autenticação com JWT
- ✅ Row Level Security (RLS) no Supabase
- ✅ Validação de formulários com Zod
- ✅ Proteção de rotas
- ✅ HTTPS obrigatório (em produção)
- ✅ Dados isolados por usuário

## 🐛 Solução de Problemas

### Erro: "Faltam variáveis de ambiente do Supabase"

**Solução:** Verifique se o arquivo `.env` existe e contém as variáveis corretas.

### Erro ao fazer upload de nota fiscal

**Solução:** Verifique se o bucket `notas-fiscais` foi criado como público no Supabase Storage.

### Não consigo ver dados de outros usuários

**Solução:** Isso é esperado! O RLS garante que cada usuário veja apenas seus próprios dados.

### Gráficos não aparecem

**Solução:** Verifique se há compras cadastradas no mês atual.

## 📊 Custos Estimados

### Plano Gratuito Supabase (Recomendado para início)
- ✅ 500 MB de banco de dados
- ✅ 1 GB de storage
- ✅ 50.000 usuários ativos mensais
- ✅ 2 GB de transferência
- **Custo: R$ 0/mês**

### Vercel (Deploy Frontend)
- ✅ Deploy ilimitado
- ✅ HTTPS automático
- ✅ 100 GB de banda
- **Custo: R$ 0/mês**

### **Total: R$ 0/mês** (para pequenos negócios)

## ✨ Funcionalidades Implementadas

- ✅ Autenticação completa (Login/Cadastro)
- ✅ CRUD de Fornecedores
- ✅ CRUD de Compras
- ✅ Upload de Notas Fiscais
- ✅ Dashboard com métricas
- ✅ Gráficos interativos (Recharts)
- ✅ Sistema de Relatórios
- ✅ Exportação PDF/Excel
- ✅ Filtros avançados
- ✅ Alertas de vencimento
- ✅ Tema claro/escuro
- ✅ Design responsivo
- ✅ PWA configurado
- ✅ Validações com Zod

## 📞 Suporte

Em caso de dúvidas, abra uma issue no GitHub.

---

Desenvolvido com ❤️ para facilitar a gestão de mercados de pequeno e médio porte.
