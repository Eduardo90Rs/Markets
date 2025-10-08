import { supabase } from '../lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import type { Receita } from '../types';

export const receitasService = {
  // Listar todas as receitas do usuário
  async getAll(): Promise<Receita[]> {
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Listar receitas com filtros
  async getWithFilters(filters: {
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
    status_recebimento?: 'recebido' | 'pendente';
  }): Promise<Receita[]> {
    let query = supabase.from('receitas').select('*');

    if (filters.data_inicio) {
      query = query.gte('data', filters.data_inicio);
    }
    if (filters.data_fim) {
      query = query.lte('data', filters.data_fim);
    }
    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }
    if (filters.status_recebimento) {
      query = query.eq('status_recebimento', filters.status_recebimento);
    }

    query = query.order('data', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Buscar receita por ID
  async getById(id: string): Promise<Receita | null> {
    const { data, error } = await supabase
      .from('receitas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova receita
  async create(receita: Omit<Receita, 'id' | 'criado_em' | 'atualizado_em' | 'user_id'>): Promise<Receita> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('receitas')
      .insert({
        ...receita,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar receita
  async update(id: string, receita: Partial<Receita>): Promise<Receita> {
    const { data, error } = await supabase
      .from('receitas')
      .update(receita)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar receita
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('receitas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Estatísticas do mês atual
  async getMonthStats(mes?: Date): Promise<{
    totalRecebido: number;
    totalPendente: number;
    numeroReceitas: number;
  }> {
    const dataReferencia = mes || new Date();
    const inicio = format(startOfMonth(dataReferencia), 'yyyy-MM-dd');
    const fim = format(endOfMonth(dataReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('receitas')
      .select('valor, status_recebimento')
      .gte('data', inicio)
      .lte('data', fim);

    if (error) throw error;

    const totalRecebido = data?.filter(r => r.status_recebimento === 'recebido')
      .reduce((sum, r) => sum + r.valor, 0) || 0;
    const totalPendente = data?.filter(r => r.status_recebimento === 'pendente')
      .reduce((sum, r) => sum + r.valor, 0) || 0;
    const numeroReceitas = data?.length || 0;

    return { totalRecebido, totalPendente, numeroReceitas };
  },

  // Receitas por categoria no mês
  async getReceitasPorCategoria(mes?: Date): Promise<Array<{ categoria: string; valor: number }>> {
    const dataReferencia = mes || new Date();
    const inicio = format(startOfMonth(dataReferencia), 'yyyy-MM-dd');
    const fim = format(endOfMonth(dataReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('receitas')
      .select('valor, categoria')
      .gte('data', inicio)
      .lte('data', fim);

    if (error) throw error;

    const receitasPorCategoria = new Map<string, number>();

    data?.forEach((receita: any) => {
      const categoria = receita.categoria || 'Sem categoria';
      const atual = receitasPorCategoria.get(categoria) || 0;
      receitasPorCategoria.set(categoria, atual + receita.valor);
    });

    return Array.from(receitasPorCategoria.entries()).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  },
};
