import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
} from 'lucide-react';
import { Card, Select } from '../ui';
import { receitasService } from '../../services/receitasService';
import { comprasService } from '../../services/comprasService';
import { despesasFixasService } from '../../services/despesasFixasService';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RelatorioMensalProps {
  mes?: Date;
}

export const RelatorioMensal: React.FC<RelatorioMensalProps> = ({ mes = new Date() }) => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(mes);

  const [relatorio, setRelatorio] = useState({
    receitas: {
      total: 0,
      recebido: 0,
      pendente: 0,
    },
    compras: {
      total: 0,
      numero: 0,
    },
    despesasFixas: {
      total: 0,
    },
    lucro: 0,
    margemLucro: 0,
  });

  useEffect(() => {
    loadRelatorio();
  }, [selectedMonth]);

  const loadRelatorio = async () => {
    try {
      setLoading(true);

      const inicio = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const fim = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      // Buscar receitas do mês
      const receitasData = await receitasService.getWithFilters({
        data_inicio: inicio,
        data_fim: fim,
      });

      const totalReceitas = receitasData.reduce((sum, r) => sum + r.valor, 0);
      const receitasRecebidas = receitasData
        .filter((r) => r.status_recebimento === 'recebido')
        .reduce((sum, r) => sum + r.valor, 0);
      const receitasPendentes = receitasData
        .filter((r) => r.status_recebimento === 'pendente')
        .reduce((sum, r) => sum + r.valor, 0);

      // Buscar compras do mês
      const comprasData = await comprasService.getWithFilters({
        data_inicio: inicio,
        data_fim: fim,
      });

      const totalCompras = comprasData.reduce((sum, c) => sum + c.valor_total, 0);

      // Buscar despesas fixas
      const totalDespesasFixas = await despesasFixasService.getTotalMensal();

      // Calcular lucro e margem
      const totalDespesas = totalCompras + totalDespesasFixas;
      const lucro = receitasRecebidas - totalDespesas;
      const margemLucro = receitasRecebidas > 0 ? (lucro / receitasRecebidas) * 100 : 0;

      setRelatorio({
        receitas: {
          total: totalReceitas,
          recebido: receitasRecebidas,
          pendente: receitasPendentes,
        },
        compras: {
          total: totalCompras,
          numero: comprasData.length,
        },
        despesasFixas: {
          total: totalDespesasFixas,
        },
        lucro,
        margemLucro,
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Gerar opções de meses (últimos 12 meses)
  const generateMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
      });
    }
    return options;
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [year, month] = e.target.value.split('-');
    setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
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
      {/* Seletor de Mês */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatório Mensal
        </h2>
        <div className="w-64">
          <Select
            label=""
            options={generateMonthOptions()}
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={handleMonthChange}
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receitas</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(relatorio.receitas.recebido)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pendente: {formatCurrency(relatorio.receitas.pendente)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Compras */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compras</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatCurrency(relatorio.compras.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {relatorio.compras.numero} compras
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Despesas Fixas */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Despesas Fixas</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(relatorio.despesasFixas.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mensais</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        {/* Lucro */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lucro Líquido</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  relatorio.lucro >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(relatorio.lucro)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Margem: {formatPercent(relatorio.margemLucro)}
              </p>
            </div>
            <div
              className={`p-3 rounded-lg ${
                relatorio.lucro >= 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}
            >
              {relatorio.lucro >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Análise Detalhada */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Análise Financeira
        </h3>
        <div className="space-y-4">
          {/* Receitas x Despesas */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Receitas Recebidas
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(relatorio.receitas.recebido)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 dark:bg-green-400 h-2 rounded-full"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Compras
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(relatorio.compras.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                style={{
                  width: `${
                    relatorio.receitas.recebido > 0
                      ? (relatorio.compras.total / relatorio.receitas.recebido) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Despesas Fixas
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(relatorio.despesasFixas.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full"
                style={{
                  width: `${
                    relatorio.receitas.recebido > 0
                      ? (relatorio.despesasFixas.total / relatorio.receitas.recebido) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Total de Despesas */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Total de Despesas
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {formatCurrency(relatorio.compras.total + relatorio.despesasFixas.total)}
              </span>
            </div>
          </div>

          {/* Lucro */}
          <div className="pt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Lucro Líquido
              </span>
              <span
                className={`text-base font-bold ${
                  relatorio.lucro >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(relatorio.lucro)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Margem de Lucro
            </p>
            <p
              className={`text-3xl font-bold ${
                relatorio.margemLucro >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatPercent(relatorio.margemLucro)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Ticket Médio de Compra
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {relatorio.compras.numero > 0
                ? formatCurrency(relatorio.compras.total / relatorio.compras.numero)
                : formatCurrency(0)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Receitas Pendentes
            </p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(relatorio.receitas.pendente)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
