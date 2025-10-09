-- ========================================
-- FIX: Corrigir constraint de foreign key
-- Permitir exclusão de despesas mesmo se referenciadas
-- ========================================

-- 1. Remover a constraint antiga (se existir)
-- Primeiro, precisamos descobrir o nome da constraint
-- O Supabase geralmente cria nomes automáticos como "despesas_despesa_origem_id_fkey"

-- Execute este comando primeiro para ver o nome exato da constraint:
-- SELECT conname
-- FROM pg_constraint
-- WHERE conrelid = 'despesas'::regclass
-- AND contype = 'f'
-- AND confrelid = 'despesas'::regclass;

-- 2. Remover a constraint antiga
-- Substitua 'despesas_despesa_origem_id_fkey' pelo nome real se for diferente
ALTER TABLE despesas
DROP CONSTRAINT IF EXISTS despesas_despesa_origem_id_fkey;

-- 3. Adicionar a nova constraint com ON DELETE SET NULL
ALTER TABLE despesas
ADD CONSTRAINT despesas_despesa_origem_id_fkey
FOREIGN KEY (despesa_origem_id)
REFERENCES despesas(id)
ON DELETE SET NULL;

-- ========================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ========================================

SELECT 'Constraint corrigida com sucesso! Agora você pode excluir despesas livremente.' AS status;
