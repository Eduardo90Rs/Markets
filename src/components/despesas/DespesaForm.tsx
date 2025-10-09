import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '../ui';
import type { Despesa } from '../../types';
import { format, startOfMonth } from 'date-fns';

// Schema para Despesas Gerais
const despesaGeralSchema = z.object({
  tipo: z.literal('geral'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  data: z.string().min(1, 'Data é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  status_pagamento: z.enum(['pago', 'pendente']),
  observacoes: z.string().optional(),
});

// Schema para Despesas Fixas
const despesaFixaSchema = z.object({
  tipo: z.literal('fixa'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  dia_vencimento: z.coerce
    .number()
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  status_pagamento: z.enum(['pago', 'pendente']),
  ativa: z.boolean(),
  observacoes: z.string().optional(),
});

const despesaSchema = z.discriminatedUnion('tipo', [despesaGeralSchema, despesaFixaSchema]);

type DespesaFormData = z.infer<typeof despesaSchema>;

interface DespesaFormProps {
  despesa?: Despesa;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  tipo: 'fixa' | 'geral';
  mesReferencia?: Date; // Para despesas fixas
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
  'Marketing',
  'Limpeza',
  'Contabilidade',
  'Material de Escritório',
  'Outros',
];

export const DespesaForm: React.FC<DespesaFormProps> = ({
  despesa,
  onSubmit,
  onCancel,
  loading = false,
  tipo,
  mesReferencia = new Date(),
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<DespesaFormData>({
    resolver: zodResolver(despesaSchema),
    defaultValues: despesa
      ? {
          tipo: despesa.tipo,
          descricao: despesa.descricao,
          valor: despesa.valor,
          categoria: despesa.categoria,
          status_pagamento: despesa.status_pagamento,
          observacoes: despesa.observacoes || '',
          ...(despesa.tipo === 'fixa'
            ? {
                dia_vencimento: despesa.dia_vencimento || 10,
                ativa: despesa.ativa ?? true,
              }
            : {
                data: despesa.data || format(new Date(), 'yyyy-MM-dd'),
              }),
        }
      : {
          tipo,
          status_pagamento: 'pago',
          categoria: 'Outros',
          ...(tipo === 'fixa'
            ? {
                dia_vencimento: 10,
                ativa: true,
              }
            : {
                data: format(new Date(), 'yyyy-MM-dd'),
              }),
        },
  });

  useEffect(() => {
    if (despesa) {
      reset({
        tipo: despesa.tipo,
        descricao: despesa.descricao,
        valor: despesa.valor,
        categoria: despesa.categoria,
        status_pagamento: despesa.status_pagamento,
        observacoes: despesa.observacoes || '',
        ...(despesa.tipo === 'fixa'
          ? {
              dia_vencimento: despesa.dia_vencimento || 10,
              ativa: despesa.ativa ?? true,
            }
          : {
              data: despesa.data || format(new Date(), 'yyyy-MM-dd'),
            }),
      } as any);
    }
  }, [despesa, reset]);

  const handleFormSubmit = async (data: DespesaFormData) => {
    const submitData: any = {
      tipo: data.tipo,
      descricao: data.descricao,
      valor: data.valor,
      categoria: data.categoria,
      status_pagamento: data.status_pagamento,
      observacoes: data.observacoes,
    };

    if (data.tipo === 'fixa') {
      submitData.mes_referencia = format(startOfMonth(mesReferencia), 'yyyy-MM-dd');
      submitData.dia_vencimento = data.dia_vencimento;
      submitData.ativa = data.ativa;
      submitData.data = null;
    } else {
      submitData.data = data.data;
      submitData.mes_referencia = null;
      submitData.dia_vencimento = null;
      submitData.ativa = null;
    }

    await onSubmit(submitData);
  };

  const tipoWatch = watch('tipo');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
      <input type="hidden" {...register('tipo')} value={tipo} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Descrição *"
          placeholder={tipo === 'fixa' ? 'Ex: Aluguel do imóvel' : 'Ex: Reparo no ar-condicionado'}
          error={errors.descricao?.message}
          {...register('descricao')}
        />

        <Input
          label="Valor *"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.valor?.message}
          {...register('valor')}
        />

        {tipo === 'fixa' ? (
          <Input
            label="Dia do Vencimento *"
            type="number"
            min="1"
            max="31"
            placeholder="10"
            error={(errors as any).dia_vencimento?.message}
            {...register('dia_vencimento' as any)}
          />
        ) : (
          <Input
            label="Data *"
            type="date"
            error={(errors as any).data?.message}
            {...register('data' as any)}
          />
        )}

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
          label="Status de Pagamento *"
          options={[
            { value: 'pendente', label: 'Pendente' },
            { value: 'pago', label: 'Pago' },
          ]}
          error={errors.status_pagamento?.message}
          {...register('status_pagamento')}
        />

        {tipo === 'fixa' && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="ativa"
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              {...register('ativa' as any)}
            />
            <label
              htmlFor="ativa"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Despesa Ativa
            </label>
          </div>
        )}
      </div>

      <Input
        label="Observações"
        placeholder="Observações sobre a despesa..."
        error={errors.observacoes?.message}
        {...register('observacoes')}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {despesa ? 'Atualizar' : 'Criar'} Despesa
        </Button>
      </div>
    </form>
  );
};
