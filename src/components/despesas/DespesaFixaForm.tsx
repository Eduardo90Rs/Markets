import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '../ui';
import type { DespesaFixa } from '../../types';

const despesaFixaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  dia_vencimento: z.coerce
    .number()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  ativa: z.boolean(),
  observacoes: z.string().optional(),
});

type DespesaFixaFormData = z.infer<typeof despesaFixaSchema>;

interface DespesaFixaFormProps {
  despesa?: DespesaFixa;
  onSubmit: (data: DespesaFixaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const categorias = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Telefone',
  'Salários',
  'Impostos',
  'Seguros',
  'Manutenção',
  'Outros',
];

export const DespesaFixaForm: React.FC<DespesaFixaFormProps> = ({
  despesa,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DespesaFixaFormData>({
    resolver: zodResolver(despesaFixaSchema),
    defaultValues: despesa || {
      ativa: true,
      categoria: 'Outros',
      dia_vencimento: 10,
    },
  });

  useEffect(() => {
    if (despesa) {
      reset(despesa);
    }
  }, [despesa, reset]);

  const handleFormSubmit = async (data: DespesaFixaFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome da Despesa *"
          placeholder="Ex: Aluguel do imóvel"
          error={errors.nome?.message}
          {...register('nome')}
        />

        <Input
          label="Valor Mensal *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.valor?.message}
          {...register('valor')}
        />

        <Input
          label="Dia do Vencimento *"
          type="number"
          min="1"
          max="31"
          placeholder="10"
          error={errors.dia_vencimento?.message}
          {...register('dia_vencimento')}
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ativa"
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            {...register('ativa')}
          />
          <label
            htmlFor="ativa"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Despesa Ativa
          </label>
        </div>
      </div>

      <Input
        label="Observações"
        placeholder="Observações sobre a despesa fixa..."
        error={errors.observacoes?.message}
        {...register('observacoes')}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {despesa ? 'Atualizar' : 'Criar'} Despesa Fixa
        </Button>
      </div>
    </form>
  );
};
