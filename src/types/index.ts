export interface Fornecedor {
  id: string;
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  produtos_principais?: string | null;
  prazo_pagamento_padrao?: number | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  user_id: string;
}

export interface Compra {
  id: string;
  fornecedor_id: string;
  data_compra: string;
  valor_total: number;
  forma_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro' | 'Cheque';
  numero_nf?: string | null;
  data_vencimento?: string | null;
  status_pagamento: 'pago' | 'pendente';
  observacoes?: string | null;
  arquivo_nf_url?: string | null;
  criado_em: string;
  atualizado_em: string;
  user_id: string;
  fornecedores?: Fornecedor;
}

export interface DashboardMetrics {
  totalGastoMes: number;
  numeroComprasMes: number;
  fornecedoresAtivos: number;
  contasAPagar: number;
  contasProximoVencimento: Compra[];
}

export interface GastosPorFornecedor {
  fornecedor: string;
  valor: number;
}

export interface Receita {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  status_recebimento: 'recebido' | 'pendente';
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
  user_id: string;
}

export interface DespesaFixa {
  id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria: string;
  ativa: boolean;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
  user_id: string;
}

export interface User {
  id: string;
  email: string;
  nome?: string;
}
