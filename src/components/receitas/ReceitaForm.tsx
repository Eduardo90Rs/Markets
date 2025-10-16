// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '../ui';
import { receitasService } from '../../services/receitasService';
import type { Receita } from '../../types';

const receitaSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().optional(),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  status_recebimento: z.enum(['recebido', 'pendente']),
  observacoes: z.string().optional(),
});

type ReceitaFormData = z.infer<typeof receitaSchema>;

interface ReceitaFormProps {
  receita?: Receita;
  onSubmit: (data: ReceitaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const categorias = [
  'Vendas',
  'Serviços',
  'Comissões',
  'Investimentos',
  'Outros',
];

export const ReceitaForm: React.FC<ReceitaFormProps> = ({
  receita,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [descricoesPrevias, setDescricoesPrevias] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReceitaFormData>({
    resolver: zodResolver(receitaSchema),
    defaultValues: receita || {
      status_recebimento: 'recebido',
      categoria: 'Vendas',
      data: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (receita) {
      reset(receita);
    }
  }, [receita, reset]);

  // Buscar descrições únicas ao carregar o formulário
  useEffect(() => {
    const loadDescricoes = async () => {
      try {
        const descricoes = await receitasService.getDescricoesUnicas();
        setDescricoesPrevias(descricoes);
      } catch (error) {
        console.error('Erro ao carregar descrições:', error);
      }
    };

    loadDescricoes();
  }, []);

  const handleFormSubmit = async (data: ReceitaFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Data *"
          type="date"
          error={errors.data?.message}
          {...register('data')}
        />

        <div>
          <Input
            label="Descrição"
            placeholder="Descrição da receita (digite para ver sugestões)"
            error={errors.descricao?.message}
            list="descricoes-list"
            {...register('descricao')}
          />
          <datalist id="descricoes-list">
            {descricoesPrevias.map((desc, index) => (
              <option key={index} value={desc} />
            ))}
          </datalist>
        </div>

        <Input
          label="Valor *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.valor?.message}
          {...register('valor')}
        />

        <Select
          label="Categoria *"
          options={[
            { value: '', label: 'Selecione uma categoria' },
            ...categorias.map((cat) => ({ value: cat, label: cat })),
          ]}
          error={errors.categoria?.message}
          {...register('categoria')}
        />

        <Select
          label="Status do Recebimento *"
          options={[
            { value: 'pendente', label: 'Pendente' },
            { value: 'recebido', label: 'Recebido' },
          ]}
          error={errors.status_recebimento?.message}
          {...register('status_recebimento')}
        />
      </div>

      <Input
        label="Observações"
        placeholder="Observações sobre a receita..."
        error={errors.observacoes?.message}
        {...register('observacoes')}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {receita ? 'Atualizar' : 'Criar'} Receita
        </Button>
      </div>
    </form>
  );
};
