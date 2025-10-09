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
} from 'lucide-react';
import { Button, Card, Modal, MonthYearPicker } from '../components/ui';
import { DespesaForm } from '../components/despesas/DespesaForm';
import { despesasService } from '../services/despesasService';
import type { Despesa } from '../types';
import { format } from 'date-fns';
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
