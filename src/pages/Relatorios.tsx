import React, { useState, useEffect } from 'react';
import { FileDown, FileSpreadsheet, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button, Card, Select, Input } from '../components/ui';
import { comprasService } from '../services/comprasService';
import { fornecedoresService } from '../services/fornecedoresService';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { RelatorioMensal } from '../components/relatorios/RelatorioMensal';
import { RelatorioReceitas } from '../components/relatorios/RelatorioReceitas';
import type { Compra, Fornecedor } from '../types';

export const Relatorios: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mensal' | 'compras' | 'receitas'>('mensal');
  const [compras, setCompras] = useState<Compra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [fornecedorId, setFornecedorId] = useState('');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statusPagamento, setStatusPagamento] = useState('');

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      const data = await fornecedoresService.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const gerarRelatorio = async () => {
    try {
      setLoading(true);
      const filters: any = {
        data_inicio: dataInicio,
        data_fim: dataFim,
      };

      if (fornecedorId) filters.fornecedor_id = fornecedorId;
      if (statusPagamento) filters.status_pagamento = statusPagamento;

      const data = await comprasService.getWithFilters(filters);
      setCompras(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (compras.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    const title = `Relatório de Compras - ${format(new Date(dataInicio), 'dd/MM/yyyy')} a ${format(new Date(dataFim), 'dd/MM/yyyy')}`;
    exportToPDF(compras, title);
  };

  const handleExportExcel = () => {
    if (compras.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    exportToExcel(compras, 'relatorio_compras');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalGeral = compras.reduce((sum, c) => sum + c.valor_total, 0);
  const totalPago = compras
    .filter((c) => c.status_pagamento === 'pago')
    .reduce((sum, c) => sum + c.valor_total, 0);
  const totalPendente = compras
    .filter((c) => c.status_pagamento === 'pendente')
    .reduce((sum, c) => sum + c.valor_total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Análise completa do seu negócio e relatórios detalhados
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('mensal')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'mensal'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <TrendingUp className="inline h-4 w-4 mr-2" />
          Relatório Mensal
        </button>
        <button
          onClick={() => setActiveTab('compras')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'compras'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Calendar className="inline h-4 w-4 mr-2" />
          Relatório de Compras
        </button>
        <button
          onClick={() => setActiveTab('receitas')}
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'receitas'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <DollarSign className="inline h-4 w-4 mr-2" />
          Relatório de Receitas
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'mensal' ? (
        <RelatorioMensal />
      ) : activeTab === 'receitas' ? (
        <RelatorioReceitas />
      ) : (
        <>
          {/* Filtros */}
          <Card title="Filtros do Relatório">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Fornecedor"
                options={[
                  { value: '', label: 'Todos os fornecedores' },
                  ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
                ]}
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
              />

              <Input
                label="Data Início"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />

              <Input
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />

              <Select
                label="Status"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'pago', label: 'Pago' },
                  { value: 'pendente', label: 'Pendente' },
                ]}
                value={statusPagamento}
                onChange={(e) => setStatusPagamento(e.target.value)}
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={gerarRelatorio} loading={loading}>
                <Calendar className="mr-2 h-5 w-5" />
                Gerar Relatório
              </Button>
            </div>
          </Card>

          {/* Resultados */}
          {compras.length > 0 && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="!p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Geral</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(totalGeral)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {compras.length} compra{compras.length !== 1 ? 's' : ''}
                  </p>
                </Card>

                <Card className="!p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pago</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(totalPago)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {compras.filter((c) => c.status_pagamento === 'pago').length} compra
                    {compras.filter((c) => c.status_pagamento === 'pago').length !== 1 ? 's' : ''}
                  </p>
                </Card>

                <Card className="!p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendente</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                    {formatCurrency(totalPendente)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {compras.filter((c) => c.status_pagamento === 'pendente').length} compra
                    {compras.filter((c) => c.status_pagamento === 'pendente').length !== 1
                      ? 's'
                      : ''}
                  </p>
                </Card>
              </div>

              {/* Ações de Exportação */}
              <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Exportar Relatório
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Escolha o formato para download
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

              {/* Compras Agrupadas por Fornecedor */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalhamento por Fornecedor
                </h2>

                {(() => {
                  // Agrupar compras por fornecedor
                  const comprasPorFornecedor = compras.reduce((acc, compra) => {
                    const fornecedorNome = compra.fornecedores?.nome || 'Fornecedor não encontrado';
                    const fornecedorId = compra.fornecedor_id || 'sem-fornecedor';

                    if (!acc[fornecedorId]) {
                      acc[fornecedorId] = {
                        nome: fornecedorNome,
                        compras: [],
                        total: 0,
                      };
                    }

                    acc[fornecedorId].compras.push(compra);
                    acc[fornecedorId].total += compra.valor_total;

                    return acc;
                  }, {} as Record<string, { nome: string; compras: Compra[]; total: number }>);

                  // Ordenar fornecedores por valor total (maior para menor)
                  const fornecedoresOrdenados = Object.entries(comprasPorFornecedor)
                    .sort(([, a], [, b]) => b.total - a.total);

                  return fornecedoresOrdenados.map(([fornecedorId, dados]) => (
                    <Card key={fornecedorId}>
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {dados.nome}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {dados.compras.length} compra{dados.compras.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                              {formatCurrency(dados.total)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                                Data
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                                Valor
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                                Forma Pgto
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                                NF
                              </th>
                              <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {dados.compras.map((compra) => (
                              <tr
                                key={compra.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                  {format(new Date(compra.data_compra), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(compra.valor_total)}
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                  {compra.forma_pagamento}
                                </td>
                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                  {compra.numero_nf || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      compra.status_pagamento === 'pago'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}
                                  >
                                    {compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ));
                })()}
              </div>
            </>
          )}

          {!loading && compras.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Selecione os filtros e clique em "Gerar Relatório"
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
