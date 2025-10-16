import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Calendar, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button, Card, Select, Input } from '../ui';
import { despesasService } from '../../services/despesasService';
import { exportDespesasToPDF, exportDespesasToExcel } from '../../utils/exportUtils';
import type { Despesa } from '../../types';

export const RelatorioDespesas: React.FC = () => {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statusPagamento, setStatusPagamento] = useState('');
  const [tipo, setTipo] = useState('');

  // Lista de categorias comuns
  const categoriasComuns = [
    'Aluguel',
    'Energia',
    'Água',
    'Internet',
    'Telefone',
    'Salários',
    'Impostos',
    'Seguros',
    'Manutenção',
    'Marketing',
    'Limpeza',
    'Contabilidade',
    'Material de Escritório',
    'Outros',
  ];

  const gerarRelatorio = async () => {
    try {
      setLoading(true);
      const filters: any = {
        data_inicio: dataInicio,
        data_fim: dataFim,
      };

      if (categoria) filters.categoria = categoria;
      if (statusPagamento) filters.status_pagamento = statusPagamento;
      if (tipo) filters.tipo = tipo;

      const data = await despesasService.getWithFilters(filters);
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (despesas.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    const title = `Relatório de Despesas - ${format(new Date(dataInicio), 'dd/MM/yyyy')} a ${format(new Date(dataFim), 'dd/MM/yyyy')}`;
    exportDespesasToPDF(despesas, title);
  };

  const handleExportExcel = () => {
    if (despesas.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    exportDespesasToExcel(despesas, 'relatorio_despesas');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'pago')
    .reduce((sum, d) => sum + d.valor, 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'pendente')
    .reduce((sum, d) => sum + d.valor, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card title="Filtros do Relatório">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select
            label="Categoria"
            options={[
              { value: '', label: 'Todas as categorias' },
              ...categoriasComuns.map((cat) => ({ value: cat, label: cat })),
            ]}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
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

          <Select
            label="Tipo"
            options={[
              { value: '', label: 'Todos' },
              { value: 'fixa', label: 'Fixas' },
              { value: 'geral', label: 'Gerais' },
            ]}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
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
      {despesas.length > 0 && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalGeral)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {despesas.length} despesa{despesas.length !== 1 ? 's' : ''}
              </p>
            </Card>

            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pago</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(totalPago)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {despesas.filter((d) => d.status_pagamento === 'pago').length} despesa
                {despesas.filter((d) => d.status_pagamento === 'pago').length !== 1 ? 's' : ''}
              </p>
            </Card>

            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendente</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(totalPendente)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {despesas.filter((d) => d.status_pagamento === 'pendente').length} despesa
                {despesas.filter((d) => d.status_pagamento === 'pendente').length !== 1
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

          {/* Despesas Agrupadas por Categoria */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalhamento por Categoria
            </h2>

            {(() => {
              // Agrupar despesas por categoria
              const despesasPorCategoria = despesas.reduce((acc, despesa) => {
                const categoriaNome = despesa.categoria || 'Sem categoria';

                if (!acc[categoriaNome]) {
                  acc[categoriaNome] = {
                    nome: categoriaNome,
                    despesas: [],
                    total: 0,
                  };
                }

                acc[categoriaNome].despesas.push(despesa);
                acc[categoriaNome].total += despesa.valor;

                return acc;
              }, {} as Record<string, { nome: string; despesas: Despesa[]; total: number }>);

              // Ordenar categorias por valor total (maior para menor)
              const categoriasOrdenadas = Object.entries(despesasPorCategoria)
                .sort(([, a], [, b]) => b.total - a.total);

              return categoriasOrdenadas.map(([categoriaId, dados]) => (
                <Card key={categoriaId}>
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {dados.nome}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {dados.despesas.length} despesa{dados.despesas.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
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
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            Data/Vencimento
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            Descrição
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            Valor
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {dados.despesas.map((despesa) => (
                          <tr
                            key={despesa.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                despesa.tipo === 'fixa'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}>
                                {despesa.tipo === 'fixa' ? 'Fixa' : 'Geral'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {despesa.tipo === 'fixa'
                                ? `Dia ${despesa.dia_vencimento}`
                                : despesa.data && format(new Date(despesa.data), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {despesa.descricao}
                              {despesa.observacoes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {despesa.observacoes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(despesa.valor)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  despesa.status_pagamento === 'pago'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {despesa.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
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

      {!loading && despesas.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Selecione os filtros e clique em "Gerar Relatório"
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
