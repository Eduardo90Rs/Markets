import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Calendar, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Button, Card, Select, Input } from '../ui';
import { receitasService } from '../../services/receitasService';
import { exportReceitasToPDF, exportReceitasToExcel } from '../../utils/exportUtils';
import type { Receita } from '../../types';

export const RelatorioReceitas: React.FC = () => {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [statusRecebimento, setStatusRecebimento] = useState('');

  // Lista de categorias comuns
  const categoriasComuns = [
    'Vendas',
    'Serviços',
    'Comissões',
    'Juros',
    'Aluguel',
    'Dividendos',
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
      if (statusRecebimento) filters.status_recebimento = statusRecebimento;

      const data = await receitasService.getWithFilters(filters);
      setReceitas(data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (receitas.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    const title = `Relatório de Receitas - ${format(new Date(dataInicio), 'dd/MM/yyyy')} a ${format(new Date(dataFim), 'dd/MM/yyyy')}`;
    exportReceitasToPDF(receitas, title);
  };

  const handleExportExcel = () => {
    if (receitas.length === 0) {
      alert('Nenhum dado para exportar. Gere o relatório primeiro.');
      return;
    }

    exportReceitasToExcel(receitas, 'relatorio_receitas');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalGeral = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalRecebido = receitas
    .filter((r) => r.status_recebimento === 'recebido')
    .reduce((sum, r) => sum + r.valor, 0);
  const totalPendente = receitas
    .filter((r) => r.status_recebimento === 'pendente')
    .reduce((sum, r) => sum + r.valor, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card title="Filtros do Relatório">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              { value: 'recebido', label: 'Recebido' },
              { value: 'pendente', label: 'Pendente' },
            ]}
            value={statusRecebimento}
            onChange={(e) => setStatusRecebimento(e.target.value)}
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
      {receitas.length > 0 && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(totalGeral)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {receitas.length} receita{receitas.length !== 1 ? 's' : ''}
              </p>
            </Card>

            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(totalRecebido)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {receitas.filter((r) => r.status_recebimento === 'recebido').length} receita
                {receitas.filter((r) => r.status_recebimento === 'recebido').length !== 1 ? 's' : ''}
              </p>
            </Card>

            <Card className="!p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pendente</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {formatCurrency(totalPendente)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {receitas.filter((r) => r.status_recebimento === 'pendente').length} receita
                {receitas.filter((r) => r.status_recebimento === 'pendente').length !== 1
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

          {/* Receitas Agrupadas por Categoria */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Detalhamento por Categoria
            </h2>

            {(() => {
              // Agrupar receitas por categoria
              const receitasPorCategoria = receitas.reduce((acc, receita) => {
                const categoriaNome = receita.categoria || 'Sem categoria';

                if (!acc[categoriaNome]) {
                  acc[categoriaNome] = {
                    nome: categoriaNome,
                    receitas: [],
                    total: 0,
                  };
                }

                acc[categoriaNome].receitas.push(receita);
                acc[categoriaNome].total += receita.valor;

                return acc;
              }, {} as Record<string, { nome: string; receitas: Receita[]; total: number }>);

              // Ordenar categorias por valor total (maior para menor)
              const categoriasOrdenadas = Object.entries(receitasPorCategoria)
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
                          {dados.receitas.length} receita{dados.receitas.length !== 1 ? 's' : ''}
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
                        {dados.receitas.map((receita) => (
                          <tr
                            key={receita.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {format(new Date(receita.data), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {receita.descricao}
                              {receita.observacoes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {receita.observacoes}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(receita.valor)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  receita.status_recebimento === 'recebido'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}
                              >
                                {receita.status_recebimento === 'recebido' ? 'Recebido' : 'Pendente'}
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

      {!loading && receitas.length === 0 && (
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
