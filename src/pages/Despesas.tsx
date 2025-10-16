import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  FileDown,
  FileSpreadsheet,
  Filter,
  X,
} from 'lucide-react';
import { Button, Card, Modal, MonthYearPicker, Input, Select } from '../components/ui';
import { DespesaForm } from '../components/despesas/DespesaForm';
import { despesasService } from '../services/despesasService';
import { exportDespesasToPDF, exportDespesasToExcel } from '../utils/exportUtils';
import type { Despesa } from '../types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'fixas' | 'gerais';

export const Despesas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('fixas');
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<Despesa | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Filtros
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterDescricao, setFilterDescricao] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [descricoes, setDescricoes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [resumo, setResumo] = useState({
    fixas: { total: 0, pagas: 0, pendentes: 0, quantidade: 0 },
    gerais: { total: 0, pagas: 0, pendentes: 0, quantidade: 0 },
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, activeTab]);

  // Atualiza automaticamente o mês quando a data muda
  useEffect(() => {
    const checkDate = setInterval(() => {
      const currentMonth = new Date();
      const currentYear = currentMonth.getFullYear();
      const currentMonthNum = currentMonth.getMonth();

      const selectedYear = selectedMonth.getFullYear();
      const selectedMonthNum = selectedMonth.getMonth();

      if (currentYear !== selectedYear || currentMonthNum !== selectedMonthNum) {
        setSelectedMonth(new Date(currentYear, currentMonthNum, 1));
      }
    }, 60000); // Verifica a cada minuto

    return () => clearInterval(checkDate);
  }, [selectedMonth]);

  // Carregar descrições únicas para autocomplete
  useEffect(() => {
    const loadDescricoes = async () => {
      try {
        const descricoesData = await despesasService.getDescricoesUnicas();
        setDescricoes(descricoesData);
      } catch (error) {
        console.error('Erro ao carregar descrições:', error);
      }
    };

    loadDescricoes();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar resumo
      const resumoData = await despesasService.getResumoDespesasPorMes(selectedMonth);
      setResumo(resumoData);

      // Carregar despesas da aba ativa
      if (activeTab === 'fixas') {
        const despesasData = await despesasService.getDespesasFixasPorMes(selectedMonth);
        setDespesas(despesasData);
      } else {
        const despesasData = await despesasService.getDespesasGeraisPorMes(selectedMonth);
        setDespesas(despesasData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const inicio = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const fim = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const filters: any = {
        data_inicio: inicio,
        data_fim: fim,
        tipo: activeTab === 'fixas' ? 'fixa' : 'geral',
      };

      if (filterCategoria) filters.categoria = filterCategoria;
      if (filterDescricao) filters.descricao = filterDescricao;
      if (filterStatus) filters.status_pagamento = filterStatus;

      const despesasData = await despesasService.getWithFilters(filters);
      setDespesas(despesasData);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      alert('Erro ao aplicar filtros. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterCategoria('');
    setFilterDescricao('');
    setFilterStatus('');
    loadData();
  };

  const handleExportPDF = () => {
    if (despesas.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const tipoLabel = activeTab === 'fixas' ? 'Fixas' : 'Gerais';
    const mesAno = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });
    const title = `Relatório de Despesas ${tipoLabel} - ${mesAno}`;
    exportDespesasToPDF(despesas, title);
  };

  const handleExportExcel = () => {
    if (despesas.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const tipoLabel = activeTab === 'fixas' ? 'fixas' : 'gerais';
    exportDespesasToExcel(despesas, `relatorio_despesas_${tipoLabel}`);
  };

  const handleCreate = () => {
    setEditingDespesa(undefined);
    setModalOpen(true);
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

    try {
      await despesasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      alert('Erro ao excluir despesa. Tente novamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitLoading(true);
      if (editingDespesa) {
        await despesasService.update(editingDespesa.id, data);
      } else {
        await despesasService.create(data);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa. Tente novamente.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleImportarMesAnterior = async () => {
    if (
      !confirm(
        'Deseja importar as despesas fixas do mês anterior? Você poderá ajustar os valores depois.'
      )
    )
      return;

    try {
      setLoading(true);
      await despesasService.importarDespesasFixasDoMesAnterior(selectedMonth);
      loadData();
      alert('Despesas fixas importadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao importar despesas:', error);
      alert(error.message || 'Erro ao importar despesas. Tente novamente.');
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

  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const resumoAtivo = activeTab === 'fixas' ? resumo.fixas : resumo.gerais;

  // Verificar se há filtros ativos
  const hasActiveFilters = filterCategoria || filterDescricao || filterStatus;

  // Calcular totais filtrados se houver filtros ativos
  const filteredTotals = hasActiveFilters
    ? {
        totalGeral: despesas.reduce((sum, d) => sum + d.valor, 0),
        totalPago: despesas
          .filter((d) => d.status_pagamento === 'pago')
          .reduce((sum, d) => sum + d.valor, 0),
        totalPendente: despesas
          .filter((d) => d.status_pagamento === 'pendente')
          .reduce((sum, d) => sum + d.valor, 0),
      }
    : null;

  // Categorias comuns
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Despesas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas despesas fixas e gerais
          </p>
        </div>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total do Mês</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {formatCurrency(resumo.total)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Despesas Fixas</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(resumo.fixas.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {resumo.fixas.quantidade} despesas
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Despesas Gerais</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {formatCurrency(resumo.gerais.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {resumo.gerais.quantidade} despesas
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>

        {showFilters && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Categoria"
                options={[
                  { value: '', label: 'Todas as categorias' },
                  ...categoriasComuns.map((cat) => ({ value: cat, label: cat })),
                ]}
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
              />

              <Select
                label="Descrição"
                options={[
                  { value: '', label: 'Todas as descrições' },
                  ...descricoes.map((desc) => ({ value: desc, label: desc })),
                ]}
                value={filterDescricao}
                onChange={(e) => setFilterDescricao(e.target.value)}
              />

              <Select
                label="Status"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'pago', label: 'Pago' },
                  { value: 'pendente', label: 'Pendente' },
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="secondary" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Card de Resumo dos Filtros */}
      {hasActiveFilters && despesas.length > 0 && (
        <Card className="border-2 border-primary-500 dark:border-primary-400">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Resultado dos Filtros
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {filterCategoria && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Categoria: {filterCategoria}
                  </span>
                )}
                {filterDescricao && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    Descrição: {filterDescricao}
                  </span>
                )}
                {filterStatus && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Status: {filterStatus === 'pago' ? 'Pago' : 'Pendente'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Total Geral</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(filteredTotals?.totalGeral || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Pago</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(filteredTotals?.totalPago || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Pendente</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(filteredTotals?.totalPendente || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Export Buttons */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exportar Despesas
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Exporte os dados da aba atual para PDF ou Excel
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

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('fixas')}
            className={`${
              activeTab === 'fixas'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Despesas Fixas
          </button>
          <button
            onClick={() => setActiveTab('gerais')}
            className={`${
              activeTab === 'gerais'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Despesas Gerais
          </button>
        </nav>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total {activeTab === 'fixas' ? 'Fixas' : 'Gerais'}:{' '}
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(resumoAtivo.total)}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pagas: {formatCurrency(resumoAtivo.pagas)} | Pendentes:{' '}
            {formatCurrency(resumoAtivo.pendentes)}
          </p>
        </div>
        <div className="flex space-x-2">
          {activeTab === 'fixas' && (
            <Button variant="secondary" onClick={handleImportarMesAnterior}>
              <Download className="mr-2 h-5 w-5" />
              Importar Mês Anterior
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-5 w-5" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : despesas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa {activeTab === 'fixas' ? 'fixa' : 'geral'} cadastrada para este
              mês
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {despesas.map((despesa) => (
            <Card key={despesa.id} className="!p-0">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {despesa.descricao}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {despesa.categoria}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {despesa.status_pagamento === 'pago' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Pendente
                          </span>
                        )}
                        {activeTab === 'fixas' && (
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              despesa.ativa
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}
                          >
                            {despesa.ativa ? 'Ativa' : 'Inativa'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(despesa.valor)}
                        </p>
                      </div>
                      {activeTab === 'fixas' ? (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                          <div className="flex items-center mt-1">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Dia {despesa.dia_vencimento}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Data</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {despesa.data && format(new Date(despesa.data), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {despesa.observacoes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {despesa.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(despesa)}>
                      <Edit2 className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(despesa.id)}
                      className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingDespesa
            ? `Editar Despesa ${activeTab === 'fixas' ? 'Fixa' : 'Geral'}`
            : `Nova Despesa ${activeTab === 'fixas' ? 'Fixa' : 'Geral'}`
        }
      >
        <DespesaForm
          despesa={editingDespesa}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitLoading}
          tipo={activeTab === 'fixas' ? 'fixa' : 'geral'}
          mesReferencia={selectedMonth}
        />
      </Modal>
    </div>
  );
};
