import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, MonthYearPicker } from '../components/ui';
import { comprasService } from '../services/comprasService';
import { fornecedoresService } from '../services/fornecedoresService';
import { receitasService } from '../services/receitasService';
import { despesasService } from '../services/despesasService';
import type { Compra, Receita } from '../types';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [stats, setStats] = useState({
    // Receitas
    receitasRecebidas: 0,
    receitasPendentes: 0,
    totalReceitas: 0,
    // Despesas
    totalCompras: 0,
    numeroCompras: 0,
    despesasFixas: 0,
    despesasGerais: 0,
    totalDespesas: 0,
    // Despesas pagas (para gráfico)
    comprasPagas: 0,
    despesasPagas: 0,
    // Resultado
    lucroLiquido: 0,
    margemLucro: 0,
    // Outros
    contasAPagar: 0,
    fornecedoresAtivos: 0,
  });
  const [gastosPorFornecedor, setGastosPorFornecedor] = useState<Array<{ fornecedor: string; valor: number }>>([]);
  const [proximasVencimento, setProximasVencimento] = useState<Compra[]>([]);
  const [receitasPendentes, setReceitasPendentes] = useState<Receita[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth]);

  // Atualiza automaticamente o mês quando a data muda
  useEffect(() => {
    const checkDate = setInterval(() => {
      const currentMonth = startOfMonth(new Date());
      const selectedMonthStart = startOfMonth(selectedMonth);

      if (currentMonth.getTime() !== selectedMonthStart.getTime()) {
        setSelectedMonth(currentMonth);
      }
    }, 60000); // Verifica a cada minuto

    return () => clearInterval(checkDate);
  }, [selectedMonth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        comprasStats,
        receitasStats,
        resumoDespesas,
        comprasPagasData,
        gastos,
        proximas,
        fornecedoresCount,
      ] = await Promise.all([
        comprasService.getMonthStats(selectedMonth),
        receitasService.getMonthStats(selectedMonth),
        despesasService.getResumoDespesasPorMes(selectedMonth),
        comprasService.getWithFilters({
          data_inicio: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
          data_fim: format(endOfMonth(selectedMonth), 'yyyy-MM-dd'),
          status_pagamento: 'pago',
        }),
        comprasService.getGastosPorFornecedor(selectedMonth),
        comprasService.getProximasVencimento(7),
        fornecedoresService.countAtivos(),
      ]);

      // Calcular valores pagos
      const comprasPagas = comprasPagasData.reduce((sum, c) => sum + c.valor_total, 0);
      const despesasPagas = comprasPagas + resumoDespesas.fixas.pagas + resumoDespesas.gerais.pagas;

      // Calcular totais
      const totalDespesas = comprasStats.totalGasto + resumoDespesas.total;
      const lucroLiquido = receitasStats.totalRecebido - totalDespesas;
      const margemLucro = receitasStats.totalRecebido > 0
        ? (lucroLiquido / receitasStats.totalRecebido) * 100
        : 0;

      setStats({
        // Receitas
        receitasRecebidas: receitasStats.totalRecebido,
        receitasPendentes: receitasStats.totalPendente,
        totalReceitas: receitasStats.totalRecebido + receitasStats.totalPendente,
        // Despesas
        totalCompras: comprasStats.totalGasto,
        numeroCompras: comprasStats.numeroCompras,
        despesasFixas: resumoDespesas.fixas.total,
        despesasGerais: resumoDespesas.gerais.total,
        totalDespesas,
        // Despesas pagas (para gráfico)
        comprasPagas,
        despesasPagas,
        // Resultado
        lucroLiquido,
        margemLucro,
        // Outros
        contasAPagar: comprasStats.contasAPagar,
        fornecedoresAtivos: fornecedoresCount,
      });

      setGastosPorFornecedor(gastos);
      setProximasVencimento(proximas);

      // Buscar receitas pendentes
      const receitasPendentesData = await receitasService.getWithFilters({
        status_recebimento: 'pendente',
      });
      setReceitasPendentes(receitasPendentesData.slice(0, 5)); // Apenas as 5 primeiras
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#84cc16', '#eab308', '#f97316', '#fb923c'];

  // Função para gerar cor consistente baseada no nome
  const getColorForSupplier = (supplierName: string, index: number) => {
    // Usa o índice como fallback, mas tenta usar hash do nome para consistência
    const hash = supplierName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return COLORS[Math.abs(hash) % COLORS.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Resumo financeiro completo
          </p>
        </div>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto">
        {/* Receitas Recebidas */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receitas Recebidas</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(stats.receitasRecebidas)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        </Card>

        {/* Receitas Pendentes */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receitas Pendentes</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {formatCurrency(stats.receitasPendentes)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">A receber</span>
          </div>
        </Card>

        {/* Total Receitas */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Receitas</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(stats.totalReceitas)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Recebido + Pendente</span>
          </div>
        </Card>

        {/* Total Compras */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Compras</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(stats.totalCompras)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
              <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">{stats.numeroCompras} compras</span>
          </div>
        </Card>

        {/* Total Despesas */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Despesas</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(stats.totalDespesas)}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fixas + Gerais + Compras</span>
          </div>
        </Card>

        {/* Lucro Líquido */}
        <Card className="!p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Líquido</p>
              <p className={`text-xl font-bold mt-1 ${
                stats.lucroLiquido >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(stats.lucroLiquido)}
              </p>
            </div>
            <div className={`p-2 rounded-full ${
              stats.lucroLiquido >= 0
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {stats.lucroLiquido >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <span className={`font-medium ${
              stats.lucroLiquido >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              Margem: {stats.margemLucro.toFixed(1)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas vs Despesas */}
        <Card title={`Receitas vs Despesas (${format(selectedMonth, "MMM/yyyy", { locale: ptBR })})`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Financeiro',
                  Receitas: stats.receitasRecebidas,
                  Despesas: stats.despesasPagas,
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="Receitas" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Margem de Lucro */}
        <Card title="Margem de Lucro">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Margem',
                  valor: Math.max(0, Math.min(100, stats.margemLucro)),
                }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="name"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              />
              <YAxis
                domain={[0, 100]}
                className="text-xs fill-gray-600 dark:fill-gray-400"
                label={{ value: '%', position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="valor"
                fill={stats.lucroLiquido >= 0 ? '#10b981' : '#ef4444'}
                radius={[8, 8, 0, 0]}
                label={{ position: 'top', formatter: (value: number) => `${value.toFixed(1)}%` }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Distribuição de Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Despesas - Pizza */}
        <Card title="Distribuição de Despesas">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Compras', value: stats.totalCompras },
                  { name: 'Despesas Fixas', value: stats.despesasFixas },
                  { name: 'Despesas Gerais', value: stats.despesasGerais },
                ].filter(item => item.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
              >
                <Cell fill="#0ea5e9" />
                <Cell fill="#f59e0b" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gastos por Fornecedor - Barras */}
        {gastosPorFornecedor.length > 0 && (
          <Card title={`Top Fornecedores (${format(selectedMonth, "MMM/yyyy", { locale: ptBR })})`}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosPorFornecedor.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis
                  dataKey="fornecedor"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                  {gastosPorFornecedor.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColorForSupplier(entry.fornecedor, index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Análise Financeira */}
      <Card title={`📊 Análise Financeira - ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status Financeiro</p>
            <p className={`text-xl font-bold ${
              stats.lucroLiquido >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {stats.lucroLiquido >= 0 ? '✓ Lucro' : '✗ Prejuízo'}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total de Despesas</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalDespesas)}
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">% Despesas/Receita</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {stats.receitasRecebidas > 0
                ? `${((stats.totalDespesas / stats.receitasRecebidas) * 100).toFixed(1)}%`
                : '0.0%'}
            </p>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Receitas Recebidas vs Despesas
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.receitasRecebidas > 0
                ? `${((stats.totalDespesas / stats.receitasRecebidas) * 100).toFixed(0)}%`
                : '0%'} de despesas
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                stats.totalDespesas > stats.receitasRecebidas
                  ? 'bg-red-600 dark:bg-red-400'
                  : 'bg-green-600 dark:bg-green-400'
              }`}
              style={{
                width: `${Math.min(
                  stats.receitasRecebidas > 0
                    ? (stats.totalDespesas / stats.receitasRecebidas) * 100
                    : 0,
                  100
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Receitas Pendentes */}
      {receitasPendentes.length > 0 && (
        <Card title="💰 Receitas Pendentes Importantes">
          <div className="space-y-3">
            {receitasPendentes.map((receita) => (
              <div
                key={receita.id}
                className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {receita.descricao}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data: {format(new Date(receita.data), "dd 'de' MMMM", { locale: ptBR })} • {receita.categoria}
                  </p>
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {formatCurrency(receita.valor)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alertas de Vencimento */}
      {proximasVencimento.length > 0 && (
        <Card title="⚠️ Contas Próximas do Vencimento (7 dias)">
          <div className="space-y-3">
            {proximasVencimento.map((compra) => (
              <div
                key={compra.id}
                className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {compra.fornecedores?.nome || 'Fornecedor não encontrado'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vencimento:{' '}
                    {compra.data_vencimento &&
                      format(new Date(compra.data_vencimento), "dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                  {formatCurrency(compra.valor_total)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
