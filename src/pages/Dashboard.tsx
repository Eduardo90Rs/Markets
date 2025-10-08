import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '../components/ui';
import { comprasService } from '../services/comprasService';
import { fornecedoresService } from '../services/fornecedoresService';
import type { Compra } from '../types';

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGasto: 0,
    numeroCompras: 0,
    contasAPagar: 0,
    fornecedoresAtivos: 0,
  });
  const [gastosPorFornecedor, setGastosPorFornecedor] = useState<Array<{ fornecedor: string; valor: number }>>([]);
  const [proximasVencimento, setProximasVencimento] = useState<Compra[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [monthStats, gastos, proximas, fornecedoresCount] = await Promise.all([
        comprasService.getMonthStats(),
        comprasService.getGastosPorFornecedor(),
        comprasService.getProximasVencimento(7),
        fornecedoresService.countAtivos(),
      ]);

      setStats({
        ...monthStats,
        fornecedoresAtivos: fornecedoresCount,
      });
      setGastosPorFornecedor(gastos);
      setProximasVencimento(proximas);
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

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral do mês atual
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gasto</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(stats.totalGasto)}
              </p>
            </div>
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400">Mês atual</span>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nº de Compras</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.numeroCompras}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Este mês</span>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Contas a Pagar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.contasAPagar}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Pendentes</span>
          </div>
        </Card>

        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fornecedores</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.fornecedoresAtivos}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ativos</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Fornecedor - Barras */}
        <Card title="Gastos por Fornecedor (Mês Atual)">
          {gastosPorFornecedor.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastosPorFornecedor}>
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
                <Bar dataKey="valor" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </Card>

        {/* Gastos por Fornecedor - Pizza */}
        <Card title="Distribuição de Gastos">
          {gastosPorFornecedor.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gastosPorFornecedor}
                  dataKey="valor"
                  nameKey="fornecedor"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.fornecedor}: ${formatCurrency(entry.valor)}`}
                  labelLine={false}
                >
                  {gastosPorFornecedor.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
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
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </Card>
      </div>

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
