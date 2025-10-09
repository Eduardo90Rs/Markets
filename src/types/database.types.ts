export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      compras: {
        Row: {
          id: string
          user_id: string
          fornecedor_id: string
          data_compra: string
          valor_total: number
          forma_pagamento: string
          numero_nf: string | null
          data_vencimento: string | null
          status_pagamento: string
          observacoes: string | null
          arquivo_nf_url: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          fornecedor_id: string
          data_compra: string
          valor_total: number
          forma_pagamento: string
          numero_nf?: string | null
          data_vencimento?: string | null
          status_pagamento: string
          observacoes?: string | null
          arquivo_nf_url?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          fornecedor_id?: string
          data_compra?: string
          valor_total?: number
          forma_pagamento?: string
          numero_nf?: string | null
          data_vencimento?: string | null
          status_pagamento?: string
          observacoes?: string | null
          arquivo_nf_url?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      despesas: {
        Row: {
          id: string
          user_id: string
          tipo: string
          descricao: string
          valor: number
          categoria: string
          status_pagamento: string
          observacoes: string | null
          data: string | null
          mes_referencia: string | null
          dia_vencimento: number | null
          ativa: boolean | null
          despesa_origem_id: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          tipo: string
          descricao: string
          valor: number
          categoria: string
          status_pagamento: string
          observacoes?: string | null
          data?: string | null
          mes_referencia?: string | null
          dia_vencimento?: number | null
          ativa?: boolean | null
          despesa_origem_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          tipo?: string
          descricao?: string
          valor?: number
          categoria?: string
          status_pagamento?: string
          observacoes?: string | null
          data?: string | null
          mes_referencia?: string | null
          dia_vencimento?: number | null
          ativa?: boolean | null
          despesa_origem_id?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      fornecedores: {
        Row: {
          id: string
          user_id: string
          nome: string
          cnpj: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          produtos_principais: string | null
          prazo_pagamento_padrao: number | null
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          produtos_principais?: string | null
          prazo_pagamento_padrao?: number | null
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          produtos_principais?: string | null
          prazo_pagamento_padrao?: number | null
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
      }
      receitas: {
        Row: {
          id: string
          user_id: string
          data: string
          descricao: string
          valor: number
          categoria: string
          status_recebimento: string
          observacoes: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          data: string
          descricao: string
          valor: number
          categoria: string
          status_recebimento: string
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          data?: string
          descricao?: string
          valor?: number
          categoria?: string
          status_recebimento?: string
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
