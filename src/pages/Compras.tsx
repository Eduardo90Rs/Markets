import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button, Card, Modal, Select, MonthYearPicker } from '../components/ui';
import { CompraForm } from '../components/compras/CompraForm';
import { comprasService } from '../services/comprasService';
import { fornecedoresService } from '../services/fornecedoresService';
import type { Compra, Fornecedor } from '../types';

export const Compras: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth(new Date()));
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = {
        data_inicio: format(startOfMonth(selectedMonth), 'yyyy-MM-dd'),
        data_fim: format(endOfMonth(selectedMonth), 'yyyy-MM-dd'),
      };
      const [comprasData, fornecedoresData] = await Promise.all([
        comprasService.getWithFilters(filters),
        fornecedoresService.getAll(),
      ]);
      setCompras(comprasData);
      setFornecedores(fornecedoresData);
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
      if (filterFornecedor) filters.fornecedor_id = filterFornecedor;
      if (filterStatus) filters.status_pagamento = filterStatus;

      const data = await comprasService.getWithFilters(filters);
      setCompras(data);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterFornecedor('');
    setFilterStatus('');
    loadData();
  };

  const handleCreate = () => {
    setEditingCompra(undefined);
    setModalOpen(true);
  };

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, arquivo_nf_url?: string | null) => {
    if (!confirm('Tem certeza que deseja excluir esta compra?')) return;

    try {
      if (arquivo_nf_url) {
        await comprasService.deleteNF(arquivo_nf_url);
      }
      await comprasService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir compra:', error);
      alert('Erro ao excluir compra. Tente novamente.');
    }
  };

  const handleSubmit = async (data: any, file?: File) => {
    try {
      setSubmitLoading(true);
      let arquivo_nf_url = editingCompra?.arquivo_nf_url;

      if (file) {
        const compraId = editingCompra?.id || crypto.randomUUID();
        arquivo_nf_url = await comprasService.uploadNF(file, compraId);
      }

      const compraData = { ...data, arquivo_nf_url };

      if (editingCompra) {
        await comprasService.update(editingCompra.id, compraData);
      } else {
        await comprasService.create(compraData);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar compra:', error);
      alert('Erro ao salvar compra. Tente novamente.');
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

  const filteredCompras = compras;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compras</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie suas compras e pagamentos
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-5 w-5" />
              Nova Compra
            </Button>
          </div>
        </div>
        <MonthYearPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Fornecedor"
              options={[
                { value: '', label: 'Todos' },
                ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
              ]}
              value={filterFornecedor}
              onChange={(e) => setFilterFornecedor(e.target.value)}
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
      ) : filteredCompras.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma compra cadastrada</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCompras.map((compra) => (
            <Card key={compra.id} className="!p-0">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {compra.fornecedores?.nome || 'Fornecedor não encontrado'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(compra.data_compra), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          compra.status_pagamento === 'pago'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}
                      >
                        {compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valor</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(compra.valor_total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Forma de Pagamento
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {compra.forma_pagamento}
                        </p>
                      </div>
                      {compra.numero_nf && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">NF</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {compra.numero_nf}
                          </p>
                        </div>
                      )}
                      {compra.data_vencimento && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Vencimento</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(compra.data_vencimento), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {compra.observacoes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        {compra.observacoes}
                      </p>
                    )}
                  </div>

                  <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
                    {compra.arquivo_nf_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(compra.arquivo_nf_url!, '_blank')}
                      >
                        <FileText className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Ver NF</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(compra)}>
                      <Edit2 className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(compra.id, compra.arquivo_nf_url)}
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
        title={editingCompra ? 'Editar Compra' : 'Nova Compra'}
        size="lg"
      >
        <CompraForm
          compra={editingCompra}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitLoading}
        />
      </Modal>
    </div>
  );
};
