import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Compra } from '../types';

export const comprasService = {
  // Listar todas as compras do usuário
  async getAll(): Promise<Compra[]> {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores (*)
      `)
      .order('data_compra', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Listar compras com filtros
  async getWithFilters(filters: {
    fornecedor_id?: string;
    data_inicio?: string;
    data_fim?: string;
    status_pagamento?: 'pago' | 'pendente';
  }): Promise<Compra[]> {
    let query = supabase
      .from('compras')
      .select(`
        *,
        fornecedores (*)
      `);

    if (filters.fornecedor_id) {
      query = query.eq('fornecedor_id', filters.fornecedor_id);
    }
    if (filters.data_inicio) {
      query = query.gte('data_compra', filters.data_inicio);
    }
    if (filters.data_fim) {
      query = query.lte('data_compra', filters.data_fim);
    }
    if (filters.status_pagamento) {
      query = query.eq('status_pagamento', filters.status_pagamento);
    }

    query = query.order('data_compra', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Buscar compra por ID
  async getById(id: string): Promise<Compra | null> {
    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova compra
  async create(compra: Omit<Compra, 'id' | 'criado_em' | 'atualizado_em' | 'user_id' | 'fornecedores'>): Promise<Compra> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('compras')
      .insert({
        ...compra,
        user_id: userData.user.id,
      })
      .select(`
        *,
        fornecedores (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar compra
  async update(id: string, compra: Partial<Compra>): Promise<Compra> {
    const { data, error } = await supabase
      .from('compras')
      .update(compra)
      .eq('id', id)
      .select(`
        *,
        fornecedores (*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar compra
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('compras')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload de arquivo (nota fiscal)
  async uploadNF(file: File, compraId: string): Promise<string> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}/${compraId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('notas-fiscais')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('notas-fiscais')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  // Deletar arquivo
  async deleteNF(url: string): Promise<void> {
    const fileName = url.split('/notas-fiscais/').pop();
    if (!fileName) return;

    const { error } = await supabase.storage
      .from('notas-fiscais')
      .remove([fileName]);

    if (error) throw error;
  },

  // Estatísticas do mês atual
  async getMonthStats(): Promise<{
    totalGasto: number;
    numeroCompras: number;
    contasAPagar: number;
  }> {
    const now = new Date();
    const inicio = format(startOfMonth(now), 'yyyy-MM-dd');
    const fim = format(endOfMonth(now), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('compras')
      .select('valor_total, status_pagamento')
      .gte('data_compra', inicio)
      .lte('data_compra', fim);

    if (error) throw error;

    const totalGasto = data?.reduce((sum, compra) => sum + compra.valor_total, 0) || 0;
    const numeroCompras = data?.length || 0;
    const contasAPagar = data?.filter(c => c.status_pagamento === 'pendente').length || 0;

    return { totalGasto, numeroCompras, contasAPagar };
  },

  // Gastos por fornecedor no mês
  async getGastosPorFornecedor(): Promise<Array<{ fornecedor: string; valor: number }>> {
    const now = new Date();
    const inicio = format(startOfMonth(now), 'yyyy-MM-dd');
    const fim = format(endOfMonth(now), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('compras')
      .select(`
        valor_total,
        fornecedores (nome)
      `)
      .gte('data_compra', inicio)
      .lte('data_compra', fim);

    if (error) throw error;

    const gastosPorFornecedor = new Map<string, number>();

    data?.forEach((compra: any) => {
      const nome = compra.fornecedores?.nome || 'Sem fornecedor';
      const atual = gastosPorFornecedor.get(nome) || 0;
      gastosPorFornecedor.set(nome, atual + compra.valor_total);
    });

    return Array.from(gastosPorFornecedor.entries()).map(([fornecedor, valor]) => ({
      fornecedor,
      valor,
    }));
  },

  // Compras próximas do vencimento
  async getProximasVencimento(dias: number = 7): Promise<Compra[]> {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const limite = format(new Date(Date.now() + dias * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('compras')
      .select(`
        *,
        fornecedores (*)
      `)
      .eq('status_pagamento', 'pendente')
      .gte('data_vencimento', hoje)
      .lte('data_vencimento', limite)
      .order('data_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
