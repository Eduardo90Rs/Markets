import { supabase } from '../lib/supabase';
import type { DespesaFixa } from '../types';

export const despesasFixasService = {
  // Listar todas as despesas fixas do usuário
  async getAll(): Promise<DespesaFixa[]> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Listar apenas despesas ativas
  async getAtivas(): Promise<DespesaFixa[]> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('*')
      .eq('ativa', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Listar despesas com filtros
  async getWithFilters(filters: {
    categoria?: string;
    ativa?: boolean;
  }): Promise<DespesaFixa[]> {
    let query = supabase.from('despesas_fixas').select('*');

    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }
    if (filters.ativa !== undefined) {
      query = query.eq('ativa', filters.ativa);
    }

    query = query.order('nome', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Buscar despesa por ID
  async getById(id: string): Promise<DespesaFixa | null> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova despesa fixa
  async create(despesa: Omit<DespesaFixa, 'id' | 'criado_em' | 'atualizado_em' | 'user_id'>): Promise<DespesaFixa> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('despesas_fixas')
      .insert({
        ...despesa,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar despesa fixa
  async update(id: string, despesa: Partial<DespesaFixa>): Promise<DespesaFixa> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .update(despesa)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar despesa fixa
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('despesas_fixas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Calcular total de despesas fixas mensais ativas
  async getTotalMensal(): Promise<number> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('valor')
      .eq('ativa', true);

    if (error) throw error;

    const total = data?.reduce((sum, despesa) => sum + despesa.valor, 0) || 0;
    return total;
  },

  // Despesas por categoria
  async getDespesasPorCategoria(): Promise<Array<{ categoria: string; valor: number }>> {
    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('valor, categoria')
      .eq('ativa', true);

    if (error) throw error;

    const despesasPorCategoria = new Map<string, number>();

    data?.forEach((despesa: any) => {
      const categoria = despesa.categoria || 'Sem categoria';
      const atual = despesasPorCategoria.get(categoria) || 0;
      despesasPorCategoria.set(categoria, atual + despesa.valor);
    });

    return Array.from(despesasPorCategoria.entries()).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  },

  // Despesas com vencimento próximo (dos próximos X dias)
  async getProximasVencimento(diasAntecedencia: number = 5): Promise<DespesaFixa[]> {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const diaLimite = diaAtual + diasAntecedencia;

    const { data, error } = await supabase
      .from('despesas_fixas')
      .select('*')
      .eq('ativa', true)
      .gte('dia_vencimento', diaAtual)
      .lte('dia_vencimento', diaLimite > 31 ? 31 : diaLimite)
      .order('dia_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
