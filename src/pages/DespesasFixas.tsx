import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, DollarSign, Calendar } from 'lucide-react';
import { Button, Card, Modal, Select } from '../components/ui';
import { DespesaFixaForm } from '../components/despesas/DespesaFixaForm';
import { despesasFixasService } from '../services/despesasFixasService';
import type { DespesaFixa } from '../types';

export const DespesasFixas: React.FC = () => {
  const [despesas, setDespesas] = useState<DespesaFixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState<DespesaFixa | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filtros
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterAtiva, setFilterAtiva] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [totalMensal, setTotalMensal] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [despesasData, totalData] = await Promise.all([
        despesasFixasService.getAll(),
        despesasFixasService.getTotalMensal(),
      ]);
      setDespesas(despesasData);
      setTotalMensal(totalData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterCategoria) filters.categoria = filterCategoria;
      if (filterAtiva !== '') filters.ativa = filterAtiva === 'true';

      const data = await despesasFixasService.getWithFilters(filters);
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterCategoria('');
    setFilterAtiva('');
    loadData();
  };

  const handleCreate = () => {
    setEditingDespesa(undefined);
    setModalOpen(true);
  };

  const handleEdit = (despesa: DespesaFixa) => {
    setEditingDespesa(despesa);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa fixa?')) return;

    try {
      await despesasFixasService.delete(id);
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
        await despesasFixasService.update(editingDespesa.id, data);
      } else {
        await despesasFixasService.create(data);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const categorias = Array.from(new Set(despesas.map((d) => d.categoria)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Despesas Fixas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas despesas fixas mensais
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-5 w-5" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total de Despesas Fixas Mensais
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(totalMensal)}
            </p>
          </div>
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Card>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              label="Status"
              options={[
                { value: '', label: 'Todas' },
                { value: 'true', label: 'Ativas' },
                { value: 'false', label: 'Inativas' },
              ]}
              value={filterAtiva}
              onChange={(e) => setFilterAtiva(e.target.value)}
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
      ) : despesas.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa fixa cadastrada
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
                          {despesa.nome}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {despesa.categoria}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          despesa.ativa
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {despesa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Valor Mensal
                        </p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(despesa.valor)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Dia do Vencimento
                        </p>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Dia {despesa.dia_vencimento}
                          </p>
                        </div>
                      </div>
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
        title={editingDespesa ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
      >
        <DespesaFixaForm
          despesa={editingDespesa}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitLoading}
        />
      </Modal>
    </div>
  );
};
