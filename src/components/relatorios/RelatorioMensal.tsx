import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, Button, MonthYearPicker } from '../ui';
import { receitasService } from '../../services/receitasService';
import { comprasService } from '../../services/comprasService';
import { despesasService } from '../../services/despesasService';
import { exportRelatorioMensalToPDF, exportRelatorioMensalToExcel } from '../../utils/exportUtils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Receita, Compra, Despesa } from '../../types';

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
    despesas: {
      total: 0,
      fixas: 0,
      gerais: 0,
    },
    lucro: 0,
    margemLucro: 0,
  });

  // Dados completos para exportação
  const [dadosCompletos, setDadosCompletos] = useState<{
    receitas: Receita[];
    compras: Compra[];
    despesas: Despesa[];
  }>({
    receitas: [],
    compras: [],
    despesas: [],
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

      // Buscar despesas (fixas + gerais)
      const despesasData = await despesasService.getDespesasPorMes(selectedMonth);
      const resumoDespesas = await despesasService.getResumoDespesasPorMes(selectedMonth);

      // Calcular lucro e margem
      const totalDespesas = totalCompras + resumoDespesas.total;
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
        despesas: {
          total: resumoDespesas.total,
          fixas: resumoDespesas.fixas.total,
          gerais: resumoDespesas.gerais.total,
        },
        lucro,
        margemLucro,
      });

      // Guardar dados completos para exportação
      setDadosCompletos({
        receitas: receitasData,
        compras: comprasData,
        despesas: despesasData,
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

  const handleExportPDF = () => {
    exportRelatorioMensalToPDF({
      mes: selectedMonth,
      receitas: {
        total: relatorio.receitas.total,
        recebido: relatorio.receitas.recebido,
        pendente: relatorio.receitas.pendente,
        dados: dadosCompletos.receitas,
      },
      compras: {
        total: relatorio.compras.total,
        numero: relatorio.compras.numero,
        dados: dadosCompletos.compras,
      },
      despesas: {
        total: relatorio.despesas.total,
        fixas: relatorio.despesas.fixas,
        gerais: relatorio.despesas.gerais,
        dados: dadosCompletos.despesas,
      },
      lucro: relatorio.lucro,
      margemLucro: relatorio.margemLucro,
    });
  };

  const handleExportExcel = () => {
    exportRelatorioMensalToExcel({
      mes: selectedMonth,
      receitas: {
        total: relatorio.receitas.total,
        recebido: relatorio.receitas.recebido,
        pendente: relatorio.receitas.pendente,
        dados: dadosCompletos.receitas,
      },
      compras: {
        total: relatorio.compras.total,
        numero: relatorio.compras.numero,
        dados: dadosCompletos.compras,
      },
      despesas: {
        total: relatorio.despesas.total,
        fixas: relatorio.despesas.fixas,
        gerais: relatorio.despesas.gerais,
        dados: dadosCompletos.despesas,
      },
      lucro: relatorio.lucro,
      margemLucro: relatorio.margemLucro,
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Relatório Mensal
        </h2>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
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

        {/* Despesas */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Despesas</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(relatorio.despesas.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fixas: {formatCurrency(relatorio.despesas.fixas)} | Gerais:{' '}
                {formatCurrency(relatorio.despesas.gerais)}
              </p>
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
              <span className="text-sm text-gray-600 dark:text-gray-400">Despesas</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(relatorio.despesas.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-600 dark:bg-orange-400 h-2 rounded-full"
                style={{
                  width: `${
                    relatorio.receitas.recebido > 0
                      ? (relatorio.despesas.total / relatorio.receitas.recebido) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fixas: {formatCurrency(relatorio.despesas.fixas)} | Gerais:{' '}
              {formatCurrency(relatorio.despesas.gerais)}
            </p>
          </div>

          {/* Total de Despesas */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Total de Despesas
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {formatCurrency(relatorio.compras.total + relatorio.despesas.total)}
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

      {/* Seção de Exportação */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exportar Relatório Mensal
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Baixe o relatório completo em PDF ou Excel
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-5 w-5" />
              Exportar PDF
            </Button>
            <Button variant="secondary" onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
