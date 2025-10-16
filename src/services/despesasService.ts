// @ts-nocheck
import { supabase } from '../lib/supabase';
import type { Despesa } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const despesasService = {
  // ========================================
  // MÉTODOS GERAIS
  // ========================================

  // Listar todas as despesas do usuário
  async getAll(): Promise<Despesa[]> {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar despesa por ID
  async getById(id: string): Promise<Despesa | null> {
    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar nova despesa
  async create(despesa: Omit<Despesa, 'id' | 'criado_em' | 'atualizado_em' | 'user_id'>): Promise<Despesa> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('despesas')
      .insert({
        ...despesa,
        user_id: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar despesa
  async update(id: string, despesa: Partial<Despesa>): Promise<Despesa> {
    const { data, error } = await supabase
      .from('despesas')
      .update(despesa)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar despesa
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('despesas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ========================================
  // MÉTODOS PARA DESPESAS FIXAS
  // ========================================

  // Listar despesas fixas de um mês específico
  async getDespesasFixasPorMes(mesReferencia: Date): Promise<Despesa[]> {
    const mesFormatado = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesFormatado)
      .order('descricao', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Listar despesas fixas ativas de um mês específico
  async getDespesasFixasAtivasPorMes(mesReferencia: Date): Promise<Despesa[]> {
    const mesFormatado = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesFormatado)
      .eq('ativa', true)
      .order('descricao', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Calcular total de despesas fixas de um mês
  async getTotalDespesasFixasPorMes(mesReferencia: Date): Promise<number> {
    const mesFormatado = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('valor')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesFormatado)
      .eq('ativa', true);

    if (error) throw error;

    const total = data?.reduce((sum, despesa) => sum + despesa.valor, 0) || 0;
    return total;
  },

  // Importar despesas fixas do mês anterior
  async importarDespesasFixasDoMesAnterior(mesReferencia: Date): Promise<Despesa[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Usuário não autenticado');

    // Buscar despesas fixas ativas do mês anterior
    const mesAnterior = new Date(mesReferencia);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    const mesAnteriorFormatado = format(startOfMonth(mesAnterior), 'yyyy-MM-dd');
    const mesAtualFormatado = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');

    // Verificar se já existem despesas para o mês atual
    const { data: existentes } = await supabase
      .from('despesas')
      .select('id')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesAtualFormatado)
      .limit(1);

    if (existentes && existentes.length > 0) {
      throw new Error('Já existem despesas fixas para este mês');
    }

    // Buscar despesas fixas do mês anterior
    const { data: despesasAnterior, error: errorBusca } = await supabase
      .from('despesas')
      .select('*')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesAnteriorFormatado)
      .eq('ativa', true);

    if (errorBusca) throw errorBusca;

    if (!despesasAnterior || despesasAnterior.length === 0) {
      throw new Error('Não há despesas fixas do mês anterior para importar');
    }

    // Criar novas despesas para o mês atual
    const novasDespesas = despesasAnterior.map((d) => ({
      user_id: userData.user.id,
      tipo: 'fixa' as const,
      descricao: d.descricao,
      valor: d.valor,
      categoria: d.categoria,
      status_pagamento: 'pendente' as const,
      observacoes: d.observacoes,
      mes_referencia: mesAtualFormatado,
      dia_vencimento: d.dia_vencimento,
      ativa: d.ativa,
      despesa_origem_id: d.despesa_origem_id || d.id,
    }));

    const { data, error } = await supabase
      .from('despesas')
      .insert(novasDespesas)
      .select();

    if (error) throw error;
    return data || [];
  },

  // ========================================
  // MÉTODOS PARA DESPESAS GERAIS
  // ========================================

  // Listar despesas gerais de um período
  async getDespesasGeraisPorPeriodo(dataInicio: Date, dataFim: Date): Promise<Despesa[]> {
    const inicio = format(dataInicio, 'yyyy-MM-dd');
    const fim = format(dataFim, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('tipo', 'geral')
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Listar despesas gerais de um mês
  async getDespesasGeraisPorMes(mesReferencia: Date): Promise<Despesa[]> {
    const inicio = startOfMonth(mesReferencia);
    const fim = endOfMonth(mesReferencia);

    return this.getDespesasGeraisPorPeriodo(inicio, fim);
  },

  // Calcular total de despesas gerais de um período
  async getTotalDespesasGeraisPorPeriodo(dataInicio: Date, dataFim: Date): Promise<number> {
    const inicio = format(dataInicio, 'yyyy-MM-dd');
    const fim = format(dataFim, 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('valor')
      .eq('tipo', 'geral')
      .gte('data', inicio)
      .lte('data', fim);

    if (error) throw error;

    const total = data?.reduce((sum, despesa) => sum + despesa.valor, 0) || 0;
    return total;
  },

  // Calcular total de despesas gerais de um mês
  async getTotalDespesasGeraisPorMes(mesReferencia: Date): Promise<number> {
    const inicio = startOfMonth(mesReferencia);
    const fim = endOfMonth(mesReferencia);

    return this.getTotalDespesasGeraisPorPeriodo(inicio, fim);
  },

  // ========================================
  // MÉTODOS COMBINADOS
  // ========================================

  // Listar todas as despesas de um mês (fixas + gerais)
  async getDespesasPorMes(mesReferencia: Date): Promise<Despesa[]> {
    const [fixas, gerais] = await Promise.all([
      this.getDespesasFixasPorMes(mesReferencia),
      this.getDespesasGeraisPorMes(mesReferencia),
    ]);

    return [...fixas, ...gerais];
  },

  // Calcular total de despesas de um mês (fixas + gerais)
  async getTotalDespesasPorMes(mesReferencia: Date): Promise<number> {
    const [totalFixas, totalGerais] = await Promise.all([
      this.getTotalDespesasFixasPorMes(mesReferencia),
      this.getTotalDespesasGeraisPorMes(mesReferencia),
    ]);

    return totalFixas + totalGerais;
  },

  // Obter resumo de despesas por mês
  async getResumoDespesasPorMes(
    mesReferencia: Date
  ): Promise<{
    fixas: { total: number; pagas: number; pendentes: number; quantidade: number };
    gerais: { total: number; pagas: number; pendentes: number; quantidade: number };
    total: number;
  }> {
    const [fixas, gerais] = await Promise.all([
      this.getDespesasFixasPorMes(mesReferencia),
      this.getDespesasGeraisPorMes(mesReferencia),
    ]);

    const calcularResumo = (despesas: Despesa[]) => {
      const total = despesas.reduce((sum, d) => sum + d.valor, 0);
      const pagas = despesas
        .filter((d) => d.status_pagamento === 'pago')
        .reduce((sum, d) => sum + d.valor, 0);
      const pendentes = despesas
        .filter((d) => d.status_pagamento === 'pendente')
        .reduce((sum, d) => sum + d.valor, 0);

      return {
        total,
        pagas,
        pendentes,
        quantidade: despesas.length,
      };
    };

    const resumoFixas = calcularResumo(fixas);
    const resumoGerais = calcularResumo(gerais);

    return {
      fixas: resumoFixas,
      gerais: resumoGerais,
      total: resumoFixas.total + resumoGerais.total,
    };
  },

  // Despesas por categoria (ambos tipos)
  async getDespesasPorCategoria(
    mesReferencia: Date,
    tipo?: 'fixa' | 'geral'
  ): Promise<Array<{ categoria: string; valor: number }>> {
    let despesas: Despesa[];

    if (tipo === 'fixa') {
      despesas = await this.getDespesasFixasPorMes(mesReferencia);
    } else if (tipo === 'geral') {
      despesas = await this.getDespesasGeraisPorMes(mesReferencia);
    } else {
      despesas = await this.getDespesasPorMes(mesReferencia);
    }

    const despesasPorCategoria = new Map<string, number>();

    despesas.forEach((despesa) => {
      const categoria = despesa.categoria || 'Sem categoria';
      const atual = despesasPorCategoria.get(categoria) || 0;
      despesasPorCategoria.set(categoria, atual + despesa.valor);
    });

    return Array.from(despesasPorCategoria.entries()).map(([categoria, valor]) => ({
      categoria,
      valor,
    }));
  },

  // Despesas com vencimento próximo (apenas fixas)
  async getDespesasFixasProximasVencimento(
    mesReferencia: Date,
    diasAntecedencia: number = 5
  ): Promise<Despesa[]> {
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    const diaLimite = diaAtual + diasAntecedencia;
    const mesFormatado = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('tipo', 'fixa')
      .eq('mes_referencia', mesFormatado)
      .eq('ativa', true)
      .eq('status_pagamento', 'pendente')
      .gte('dia_vencimento', diaAtual)
      .lte('dia_vencimento', diaLimite > 31 ? 31 : diaLimite)
      .order('dia_vencimento', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Buscar descrições únicas já utilizadas (fixas e gerais)
  async getDescricoesUnicas(): Promise<string[]> {
    const { data, error } = await supabase
      .from('despesas')
      .select('descricao')
      .not('descricao', 'is', null)
      .order('descricao', { ascending: true });

    if (error) throw error;

    // Extrair descrições únicas e filtrar valores vazios
    const descricoesUnicas = Array.from(
      new Set(data?.map((d: any) => d.descricao).filter((desc: string) => desc && desc.trim() !== ''))
    );

    return descricoesUnicas;
  },

  // Listar despesas com filtros (fixas e gerais combinadas)
  async getWithFilters(filters: {
    data_inicio?: string;
    data_fim?: string;
    categoria?: string;
    descricao?: string;
    status_pagamento?: 'pago' | 'pendente';
    tipo?: 'fixa' | 'geral';
  }): Promise<Despesa[]> {
    let query = supabase.from('despesas').select('*');

    // Filtro por tipo (opcional)
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo);
    }

    // Filtro por categoria
    if (filters.categoria) {
      query = query.eq('categoria', filters.categoria);
    }

    // Filtro por descrição
    if (filters.descricao) {
      query = query.eq('descricao', filters.descricao);
    }

    // Filtro por status
    if (filters.status_pagamento) {
      query = query.eq('status_pagamento', filters.status_pagamento);
    }

    // Filtro por data - para despesas gerais usamos 'data', para fixas usamos 'mes_referencia'
    // Como a query do Supabase não permite OR direto em filtros complexos, precisamos fazer duas queries
    if (filters.data_inicio && filters.data_fim) {
      // Se um tipo específico foi fornecido, filtramos normalmente
      if (filters.tipo === 'geral') {
        query = query.gte('data', filters.data_inicio).lte('data', filters.data_fim);
      } else if (filters.tipo === 'fixa') {
        query = query.gte('mes_referencia', filters.data_inicio).lte('mes_referencia', filters.data_fim);
      } else {
        // Se nenhum tipo específico, fazemos duas queries e combinamos
        const queryFixas = supabase
          .from('despesas')
          .select('*')
          .eq('tipo', 'fixa')
          .gte('mes_referencia', filters.data_inicio)
          .lte('mes_referencia', filters.data_fim);

        const queryGerais = supabase
          .from('despesas')
          .select('*')
          .eq('tipo', 'geral')
          .gte('data', filters.data_inicio)
          .lte('data', filters.data_fim);

        // Aplicar filtros comuns em ambas as queries
        if (filters.categoria) {
          queryFixas.eq('categoria', filters.categoria);
          queryGerais.eq('categoria', filters.categoria);
        }
        if (filters.descricao) {
          queryFixas.eq('descricao', filters.descricao);
          queryGerais.eq('descricao', filters.descricao);
        }
        if (filters.status_pagamento) {
          queryFixas.eq('status_pagamento', filters.status_pagamento);
          queryGerais.eq('status_pagamento', filters.status_pagamento);
        }

        const [resultFixas, resultGerais] = await Promise.all([queryFixas, queryGerais]);

        if (resultFixas.error) throw resultFixas.error;
        if (resultGerais.error) throw resultGerais.error;

        const despesas = [...(resultFixas.data || []), ...(resultGerais.data || [])];

        // Ordenar por data (para fixas usar mes_referencia, para gerais usar data)
        despesas.sort((a, b) => {
          const dataA = a.tipo === 'fixa' ? a.mes_referencia : a.data;
          const dataB = b.tipo === 'fixa' ? b.mes_referencia : b.data;
          return new Date(dataB).getTime() - new Date(dataA).getTime();
        });

        return despesas;
      }
    }

    // Ordenar por data de criação
    query = query.order('criado_em', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};
