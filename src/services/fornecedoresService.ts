// @ts-nocheck
import { supabase } from '../lib/supabase';
import type { Fornecedor } from '../types';

export const fornecedoresService = {
  // Listar todos os fornecedores do usuário
  async getAll(): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar fornecedores por nome
  async search(query: string): Promise<Fornecedor[]> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .ilike('nome', `%${query}%`)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar fornecedor por ID
  async getById(id: string): Promise<Fornecedor | null> {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo fornecedor
  async create(fornecedor: Omit<Fornecedor, 'id' | 'criado_em' | 'atualizado_em' | 'user_id'>): Promise<Fornecedor> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('fornecedores')
      .insert({
        ...fornecedor,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar fornecedor
  async update(id: string, fornecedor: Partial<Fornecedor>): Promise<Fornecedor> {
    const { data, error } = await supabase
      .from('fornecedores')
      .update(fornecedor)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar fornecedor
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Contar fornecedores ativos
  async countAtivos(): Promise<number> {
    const { count, error } = await supabase
      .from('fornecedores')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    if (error) throw error;
    return count || 0;
  },
};
