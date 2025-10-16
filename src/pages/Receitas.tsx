import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, DollarSign, FileDown, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, Card, Modal, Select, MonthYearPicker } from '../components/ui';
import { ReceitaForm } from '../components/receitas/ReceitaForm';
import { receitasService } from '../services/receitasService';
import { exportReceitasToPDF, exportReceitasToExcel } from '../utils/exportUtils';
import type { Receita } from '../types';

export const Receitas: React.FC = () => {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReceita, setEditingReceita] = useState<Receita | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterDescricao, setFilterDescricao] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [descricoes, setDescricoes] = useState<string[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalRecebido: 0,
    totalPendente: 0,
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Carregar descrições únicas
  useEffect(() => {
    const loadDescricoes = async () => {
      try {
        const descricoesData = await receitasService.getDescricoesUnicas();
        setDescricoes(descricoesData);
      } catch (error) {
        console.error('Erro ao carregar descrições:', error);
      }
    };

    loadDescricoes();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = {
        data_inicio: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
        data_fim: format(endOfMonth(selectedMonth), 'yyyy-MM-dd'),
      };
      const [receitasData, statsData] = await Promise.all([
        receitasService.getWithFilters(filters),
        receitasService.getMonthStats(selectedMonth),
      ]);
      setReceitas(receitasData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {
        data_inicio: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
        data_fim: format(endOfMonth(selectedMonth), 'yyyy-MM-dd'),
      };
      if (filterCategoria) filters.categoria = filterCategoria;
      if (filterDescricao) filters.descricao = filterDescricao;
      if (filterStatus) filters.status_recebimento = filterStatus;

      const data = await receitasService.getWithFilters(filters);
      setReceitas(data);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
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

  const handleCreate = () => {
    setEditingReceita(undefined);
    setModalOpen(true);
  };

  const handleEdit = (receita: Receita) => {
    setEditingReceita(receita);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    try {
      await receitasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir receita:', error);
      alert('Erro ao excluir receita. Tente novamente.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitLoading(true);
      if (editingReceita) {
        await receitasService.update(editingReceita.id, data);
      } else {
        await receitasService.create(data);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      alert('Erro ao salvar receita. Tente novamente.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const categorias = Array.from(new Set(receitas.map((r) => r.categoria)));

  // Verificar se há filtros ativos
  const hasActiveFilters = filterCategoria || filterDescricao || filterStatus;

  // Calcular totais das receitas filtradas (quando há filtros ativos)
  const filteredTotalGeral = receitas.reduce((sum, r) => sum + r.valor, 0);
  const filteredTotalRecebido = receitas
    .filter((r) => r.status_recebimento === 'recebido')
    .reduce((sum, r) => sum + r.valor, 0);
  const filteredTotalPendente = receitas
    .filter((r) => r.status_recebimento === 'pendente')
    .reduce((sum, r) => sum + r.valor, 0);

  const handleExportPDF = () => {
    if (receitas.length === 0) {
      alert('Nenhuma receita para exportar.');
      return;
    }

    const title = `Relatório de Receitas - ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}`;
    exportReceitasToPDF(receitas, title);
  };

  const handleExportExcel = () => {
    if (receitas.length === 0) {
      alert('Nenhuma receita para exportar.');
      return;
    }

    exportReceitasToExcel(receitas, 'receitas');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receitas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie suas receitas e recebimentos
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-5 w-5" />
              Nova Receita
            </Button>
          </div>
        </div>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recebido no Mês</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(stats.totalRecebido)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendente no Mês</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {formatCurrency(stats.totalPendente)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <DollarSign className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Resumo de Filtros Ativos */}
      {hasActiveFilters && receitas.length > 0 && (
        <Card className="border-2 border-primary-500 dark:border-primary-400">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resultado dos Filtros
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {receitas.length} receita{receitas.length !== 1 ? 's' : ''} encontrada{receitas.length !== 1 ? 's' : ''}
                </p>

                {/* Filtros Ativos */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {filterCategoria && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      Categoria: {filterCategoria}
                    </span>
                  )}
                  {filterDescricao && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Descrição: {filterDescricao}
                    </span>
                  )}
                  {filterStatus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Status: {filterStatus === 'recebido' ? 'Recebido' : 'Pendente'}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Geral</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(filteredTotalGeral)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recebido</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(filteredTotalRecebido)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {receitas.filter((r) => r.status_recebimento === 'recebido').length} receita{receitas.filter((r) => r.status_recebimento === 'recebido').length !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendente</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(filteredTotalPendente)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {receitas.filter((r) => r.status_recebimento === 'pendente').length} receita{receitas.filter((r) => r.status_recebimento === 'pendente').length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Botões de Exportação */}
      {receitas.length > 0 && (
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exportar Receitas
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Exporte as receitas do período selecionado
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
      )}

      {/* Filtros */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Todas' },
                ...categorias.map((cat) => ({ value: cat, label: cat })),
              ]}
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
            />

            <Select
              label="Descrição"
              options={[
                { value: '', label: 'Todas' },
                ...descricoes.map((desc) => ({ value: desc, label: desc })),
              ]}
              value={filterDescricao}
              onChange={(e) => setFilterDescricao(e.target.value)}
            />

            <Select
              label="Status"
              options={[
                { value: '', label: 'Todos' },
                { value: 'recebido', label: 'Recebido' },
                { value: 'pendente', label: 'Pendente' },
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />

            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">
                Aplicar
              </Button>
              <Button variant="secondary" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : receitas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma receita cadastrada</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {receitas.map((receita) => (
            <Card key={receita.id} className="!p-0">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {receita.descricao}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(parseISO(receita.data), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          receita.status_recebimento === 'recebido'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {receita.status_recebimento === 'recebido' ? 'Recebido' : 'Pendente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(receita.valor)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Categoria</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {receita.categoria}
                        </p>
                      </div>
                    </div>

                    {receita.observacoes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {receita.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(receita)}>
                      <Edit2 className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(receita.id)}
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
        title={editingReceita ? 'Editar Receita' : 'Nova Receita'}
      >
        <ReceitaForm
          receita={editingReceita}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitLoading}
        />
      </Modal>
    </div>
  );
};
