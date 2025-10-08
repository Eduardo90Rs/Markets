import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import { Button, Card, Input, Modal } from '../components/ui';
import { FornecedorForm } from '../components/fornecedores/FornecedorForm';
import { fornecedoresService } from '../services/fornecedoresService';
import type { Fornecedor } from '../types';

export const Fornecedores: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | undefined>();
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const data = await fornecedoresService.getAll();
      setFornecedores(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const data = await fornecedoresService.search(query);
        setFornecedores(data);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
      }
    } else {
      loadFornecedores();
    }
  };

  const handleCreate = () => {
    setEditingFornecedor(undefined);
    setModalOpen(true);
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      await fornecedoresService.delete(id);
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      alert('Erro ao excluir fornecedor. Verifique se não há compras vinculadas.');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitLoading(true);
      if (editingFornecedor) {
        await fornecedoresService.update(editingFornecedor.id, data);
      } else {
        await fornecedoresService.create(data);
      }
      setModalOpen(false);
      loadFornecedores();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      alert('Erro ao salvar fornecedor. Tente novamente.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredFornecedores = fornecedores;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fornecedores
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus fornecedores
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-5 w-5" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar fornecedor..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredFornecedores.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFornecedores.map((fornecedor) => (
            <Card key={fornecedor.id} className="!p-0">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {fornecedor.nome}
                    </h3>
                    {fornecedor.produtos_principais && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {fornecedor.produtos_principais}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      fornecedor.ativo
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2">
                  {fornecedor.telefone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {fornecedor.telefone}
                    </div>
                  )}
                  {fornecedor.email && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2" />
                      {fornecedor.email}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(fornecedor)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fornecedor.id)}
                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
        title={editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="lg"
      >
        <FornecedorForm
          fornecedor={editingFornecedor}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={submitLoading}
        />
      </Modal>
    </div>
  );
};
