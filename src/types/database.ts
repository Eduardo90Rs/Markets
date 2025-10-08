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
      fornecedores: {
        Row: {
          id: string
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
          user_id: string
        }
        Insert: {
          id?: string
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
          user_id: string
        }
        Update: {
          id?: string
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
          user_id?: string
        }
      }
      compras: {
        Row: {
          id: string
          fornecedor_id: string
          data_compra: string
          valor_total: number
          forma_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro' | 'Cheque'
          numero_nf: string | null
          data_vencimento: string | null
          status_pagamento: 'pago' | 'pendente'
          observacoes: string | null
          arquivo_nf_url: string | null
          criado_em: string
          atualizado_em: string
          user_id: string
        }
        Insert: {
          id?: string
          fornecedor_id: string
          data_compra: string
          valor_total: number
          forma_pagamento: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro' | 'Cheque'
          numero_nf?: string | null
          data_vencimento?: string | null
          status_pagamento?: 'pago' | 'pendente'
          observacoes?: string | null
          arquivo_nf_url?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id: string
        }
        Update: {
          id?: string
          fornecedor_id?: string
          data_compra?: string
          valor_total?: number
          forma_pagamento?: 'Pix' | 'Boleto' | 'Cartão' | 'Dinheiro' | 'Cheque'
          numero_nf?: string | null
          data_vencimento?: string | null
          status_pagamento?: 'pago' | 'pendente'
          observacoes?: string | null
          arquivo_nf_url?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id?: string
        }
      }
      receitas: {
        Row: {
          id: string
          data: string
          descricao: string
          valor: number
          categoria: string
          status_recebimento: 'recebido' | 'pendente'
          observacoes: string | null
          criado_em: string
          atualizado_em: string
          user_id: string
        }
        Insert: {
          id?: string
          data: string
          descricao: string
          valor: number
          categoria: string
          status_recebimento?: 'recebido' | 'pendente'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id: string
        }
        Update: {
          id?: string
          data?: string
          descricao?: string
          valor?: number
          categoria?: string
          status_recebimento?: 'recebido' | 'pendente'
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id?: string
        }
      }
      despesas_fixas: {
        Row: {
          id: string
          nome: string
          valor: number
          dia_vencimento: number
          categoria: string
          ativa: boolean
          observacoes: string | null
          criado_em: string
          atualizado_em: string
          user_id: string
        }
        Insert: {
          id?: string
          nome: string
          valor: number
          dia_vencimento: number
          categoria: string
          ativa?: boolean
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id: string
        }
        Update: {
          id?: string
          nome?: string
          valor?: number
          dia_vencimento?: number
          categoria?: string
          ativa?: boolean
          observacoes?: string | null
          criado_em?: string
          atualizado_em?: string
          user_id?: string
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
