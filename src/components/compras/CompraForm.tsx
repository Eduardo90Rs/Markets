// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
import { Input, Select, Button } from '../ui';
import { fornecedoresService } from '../../services/fornecedoresService';
import type { Compra, Fornecedor } from '../../types';

const compraSchema = z.object({
  fornecedor_id: z.string().min(1, 'Selecione um fornecedor'),
  data_compra: z.string().min(1, 'Data é obrigatória'),
  valor_total: z.coerce.number().positive('Valor deve ser maior que zero'),
  forma_pagamento: z.enum(['Pix', 'Boleto', 'Cartão', 'Dinheiro', 'Cheque']),
  numero_nf: z.string().optional(),
  data_vencimento: z.string().optional(),
  status_pagamento: z.enum(['pago', 'pendente']),
  observacoes: z.string().optional(),
});

type CompraFormData = z.infer<typeof compraSchema>;

interface CompraFormProps {
  compra?: Compra;
  onSubmit: (data: CompraFormData, file?: File) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CompraForm: React.FC<CompraFormProps> = ({
  compra,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues: compra || {
      status_pagamento: 'pago',
      forma_pagamento: 'Boleto',
      data_compra: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadFornecedores();
    if (compra) {
      reset(compra);
    }
  }, [compra, reset]);

  const loadFornecedores = async () => {
    try {
      const data = await fornecedoresService.getAll();
      setFornecedores(data.filter((f) => f.ativo));
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (data: CompraFormData) => {
    await onSubmit(data, selectedFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Fornecedor *"
          options={[
            { value: '', label: 'Selecione um fornecedor' },
            ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
          ]}
          error={errors.fornecedor_id?.message}
          {...register('fornecedor_id')}
        />

        <Input
          label="Data *"
          type="date"
          error={errors.data_compra?.message}
          {...register('data_compra')}
        />

        <Input
          label="Valor Total *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.valor_total?.message}
          {...register('valor_total')}
        />

        <Select
          label="Forma de Pagamento *"
          options={[
            { value: 'Pix', label: 'Pix' },
            { value: 'Boleto', label: 'Boleto' },
            { value: 'Cartão', label: 'Cartão' },
            { value: 'Dinheiro', label: 'Dinheiro' },
            { value: 'Cheque', label: 'Cheque' },
          ]}
          error={errors.forma_pagamento?.message}
          {...register('forma_pagamento')}
        />

        <Input
          label="Número da Nota Fiscal"
          placeholder="NF-12345"
          error={errors.numero_nf?.message}
          {...register('numero_nf')}
        />

        <Select
          label="Status do Pagamento *"
          options={[
            { value: 'pendente', label: 'Pendente' },
            { value: 'pago', label: 'Pago' },
          ]}
          error={errors.status_pagamento?.message}
          {...register('status_pagamento')}
        />
      </div>

      <Input
        label="Observações"
        placeholder="Observações sobre a compra..."
        error={errors.observacoes?.message}
        {...register('observacoes')}
      />

      {/* Upload de Nota Fiscal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nota Fiscal (imagem/PDF)
        </label>
        <div className="flex items-center space-x-2">
          <label className="flex-1 cursor-pointer">
            <div className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 transition-colors">
              <Upload className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFile ? selectedFile.name : 'Escolher arquivo'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        {compra?.arquivo_nf_url && !selectedFile && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Arquivo atual:{' '}
            <a
              href={compra.arquivo_nf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Ver nota fiscal
            </a>
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {compra ? 'Atualizar' : 'Criar'} Compra
        </Button>
      </div>
    </form>
  );
};
