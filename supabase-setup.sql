-- ========================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- Sistema de Controle de Fornecedores
-- ========================================

-- Execute este script completo no SQL Editor do Supabase

-- ========================================
-- 1. CRIAR TABELAS
-- ========================================

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

-- ========================================
-- 2. CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_fornecedores_user_id ON fornecedores(user_id);
CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);
CREATE INDEX idx_compras_user_id ON compras(user_id);
CREATE INDEX idx_compras_fornecedor_id ON compras(fornecedor_id);
CREATE INDEX idx_compras_data_compra ON compras(data_compra);
CREATE INDEX idx_compras_status_pagamento ON compras(status_pagamento);
CREATE INDEX idx_compras_data_vencimento ON compras(data_vencimento);

-- ========================================
-- 3. CRIAR TRIGGERS
-- ========================================

-- Função para atualizar automaticamente o campo atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para fornecedores
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para compras
CREATE TRIGGER update_compras_updated_at
  BEFORE UPDATE ON compras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CRIAR POLÍTICAS DE SEGURANÇA
-- ========================================

-- Políticas para FORNECEDORES

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

-- Políticas para COMPRAS

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

-- ========================================
-- 6. POLÍTICAS DE STORAGE (notas-fiscais)
-- ========================================

-- IMPORTANTE: Antes de executar, crie o bucket 'notas-fiscais'
-- manualmente no Supabase Storage como PUBLIC

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

-- Política de exclusão (apenas dono do arquivo)
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'notas-fiscais');

-- ========================================
-- 7. DADOS DE EXEMPLO (OPCIONAL)
-- ========================================

-- Você pode descomentar as linhas abaixo para inserir dados de teste
-- IMPORTANTE: Substitua 'SEU_USER_ID_AQUI' pelo seu ID de usuário real

/*
-- Exemplo de fornecedores
INSERT INTO fornecedores (nome, cnpj, telefone, email, ativo, user_id) VALUES
  ('Distribuidora ABC', '12.345.678/0001-90', '(11) 98765-4321', 'contato@abc.com', true, 'SEU_USER_ID_AQUI'),
  ('Atacado XYZ', '98.765.432/0001-10', '(11) 91234-5678', 'vendas@xyz.com', true, 'SEU_USER_ID_AQUI'),
  ('Fornecedor 123', '11.222.333/0001-44', '(11) 99999-8888', 'info@123.com', true, 'SEU_USER_ID_AQUI');

-- Exemplo de compras (substitua os IDs dos fornecedores pelos IDs reais)
INSERT INTO compras (fornecedor_id, data_compra, valor_total, forma_pagamento, status_pagamento, user_id) VALUES
  ('ID_FORNECEDOR_1', '2025-10-01', 1500.00, 'Pix', 'pago', 'SEU_USER_ID_AQUI'),
  ('ID_FORNECEDOR_2', '2025-10-05', 2300.50, 'Boleto', 'pendente', 'SEU_USER_ID_AQUI'),
  ('ID_FORNECEDOR_3', '2025-10-08', 890.00, 'Cartão', 'pago', 'SEU_USER_ID_AQUI');
*/

-- ========================================
-- FIM DO SCRIPT
-- ========================================

-- Verifique se tudo foi criado corretamente:
SELECT 'Tabelas criadas com sucesso!' AS status;
