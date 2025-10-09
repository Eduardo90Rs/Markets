-- ========================================
-- MIGRAÇÃO: DESPESAS FIXAS → DESPESAS
-- Sistema de Despesas Fixas e Gerais
-- ========================================

-- ========================================
-- 1. CRIAR NOVA TABELA DESPESAS
-- ========================================

CREATE TABLE despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de despesa
  tipo TEXT NOT NULL CHECK (tipo IN ('fixa', 'geral')),

  -- Campos comuns
  descricao TEXT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  categoria TEXT NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente' CHECK (status_pagamento IN ('pago', 'pendente')),
  observacoes TEXT,

  -- Campos para Despesas Gerais
  data DATE, -- Data específica da despesa geral

  -- Campos para Despesas Fixas
  mes_referencia DATE, -- Mês/ano de referência (formato: YYYY-MM-01)
  dia_vencimento INTEGER CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  ativa BOOLEAN DEFAULT true, -- Se a despesa fixa está ativa para próximos meses
  despesa_origem_id UUID REFERENCES despesas(id) ON DELETE SET NULL, -- Referência à despesa fixa original quando importada

  -- Timestamps
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CHECK (
    (tipo = 'geral' AND data IS NOT NULL AND mes_referencia IS NULL) OR
    (tipo = 'fixa' AND mes_referencia IS NOT NULL AND dia_vencimento IS NOT NULL AND data IS NULL)
  )
);

-- ========================================
-- 2. CRIAR ÍNDICES
-- ========================================

CREATE INDEX idx_despesas_user_id ON despesas(user_id);
CREATE INDEX idx_despesas_tipo ON despesas(tipo);
CREATE INDEX idx_despesas_data ON despesas(data);
CREATE INDEX idx_despesas_mes_referencia ON despesas(mes_referencia);
CREATE INDEX idx_despesas_status_pagamento ON despesas(status_pagamento);
CREATE INDEX idx_despesas_categoria ON despesas(categoria);
CREATE INDEX idx_despesas_ativa ON despesas(ativa);

-- ========================================
-- 3. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- ========================================

CREATE TRIGGER update_despesas_updated_at
  BEFORE UPDATE ON despesas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. HABILITAR ROW LEVEL SECURITY
-- ========================================

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. CRIAR POLÍTICAS DE SEGURANÇA
-- ========================================

CREATE POLICY "Usuários podem ver suas próprias despesas"
  ON despesas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias despesas"
  ON despesas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias despesas"
  ON despesas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias despesas"
  ON despesas FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 6. MIGRAR DADOS DE DESPESAS_FIXAS
-- ========================================

-- Migrar despesas fixas existentes como despesas fixas do mês atual
INSERT INTO despesas (
  user_id,
  tipo,
  descricao,
  valor,
  categoria,
  status_pagamento,
  observacoes,
  mes_referencia,
  dia_vencimento,
  ativa,
  criado_em,
  atualizado_em
)
SELECT
  user_id,
  'fixa' as tipo,
  nome as descricao,
  valor,
  categoria,
  'pendente' as status_pagamento,
  observacoes,
  DATE_TRUNC('month', CURRENT_DATE) as mes_referencia, -- Mês atual
  dia_vencimento,
  ativa,
  criado_em,
  atualizado_em
FROM despesas_fixas
WHERE ativa = true; -- Apenas despesas ativas

-- ========================================
-- 7. FUNÇÃO PARA IMPORTAR DESPESAS FIXAS DO MÊS ANTERIOR
-- ========================================

CREATE OR REPLACE FUNCTION importar_despesas_fixas_mes_anterior(
  p_user_id UUID,
  p_mes_referencia DATE
)
RETURNS SETOF despesas AS $$
BEGIN
  -- Verifica se já existem despesas fixas para o mês solicitado
  IF EXISTS (
    SELECT 1 FROM despesas
    WHERE user_id = p_user_id
    AND tipo = 'fixa'
    AND mes_referencia = DATE_TRUNC('month', p_mes_referencia)
  ) THEN
    RAISE EXCEPTION 'Já existem despesas fixas para este mês';
  END IF;

  -- Importa despesas fixas do mês anterior
  RETURN QUERY
  INSERT INTO despesas (
    user_id,
    tipo,
    descricao,
    valor,
    categoria,
    status_pagamento,
    observacoes,
    mes_referencia,
    dia_vencimento,
    ativa,
    despesa_origem_id
  )
  SELECT
    d.user_id,
    'fixa' as tipo,
    d.descricao,
    d.valor, -- Mantém o mesmo valor, pode ser editado depois
    d.categoria,
    'pendente' as status_pagamento, -- Reseta para pendente
    d.observacoes,
    DATE_TRUNC('month', p_mes_referencia) as mes_referencia,
    d.dia_vencimento,
    d.ativa,
    COALESCE(d.despesa_origem_id, d.id) as despesa_origem_id -- Mantém referência à origem
  FROM despesas d
  WHERE d.user_id = p_user_id
    AND d.tipo = 'fixa'
    AND d.ativa = true
    AND d.mes_referencia = DATE_TRUNC('month', p_mes_referencia - INTERVAL '1 month')
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. FUNÇÃO PARA OBTER TOTAL DE DESPESAS POR TIPO E MÊS
-- ========================================

CREATE OR REPLACE FUNCTION obter_total_despesas_por_tipo(
  p_user_id UUID,
  p_mes_referencia DATE,
  p_tipo TEXT DEFAULT NULL
)
RETURNS TABLE (
  tipo TEXT,
  total DECIMAL(10, 2),
  total_pago DECIMAL(10, 2),
  total_pendente DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.tipo,
    SUM(d.valor) as total,
    SUM(CASE WHEN d.status_pagamento = 'pago' THEN d.valor ELSE 0 END) as total_pago,
    SUM(CASE WHEN d.status_pagamento = 'pendente' THEN d.valor ELSE 0 END) as total_pendente
  FROM despesas d
  WHERE d.user_id = p_user_id
    AND (
      (d.tipo = 'fixa' AND d.mes_referencia = DATE_TRUNC('month', p_mes_referencia))
      OR
      (d.tipo = 'geral' AND d.data >= DATE_TRUNC('month', p_mes_referencia) AND d.data < DATE_TRUNC('month', p_mes_referencia) + INTERVAL '1 month')
    )
    AND (p_tipo IS NULL OR d.tipo = p_tipo)
  GROUP BY d.tipo;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 9. COMENTÁRIOS E FINALIZAÇÃO
-- ========================================

COMMENT ON TABLE despesas IS 'Tabela unificada para despesas fixas e gerais do sistema';
COMMENT ON COLUMN despesas.tipo IS 'Tipo de despesa: fixa (recorrente mensal) ou geral (única/variável)';
COMMENT ON COLUMN despesas.mes_referencia IS 'Mês de referência para despesas fixas (formato YYYY-MM-01)';
COMMENT ON COLUMN despesas.data IS 'Data específica para despesas gerais';
COMMENT ON COLUMN despesas.despesa_origem_id IS 'Referência à despesa fixa original quando importada de mês anterior';

-- ========================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- ========================================

SELECT 'Migração concluída com sucesso!' AS status;
