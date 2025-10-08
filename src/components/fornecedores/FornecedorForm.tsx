import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '../ui';
import type { Fornecedor } from '../../types';

const fornecedorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
  produtos_principais: z.string().optional(),
  prazo_pagamento_padrao: z.coerce.number().optional(),
  ativo: z.boolean(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  fornecedor?: Fornecedor;
  onSubmit: (data: FornecedorFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const FornecedorForm: React.FC<FornecedorFormProps> = ({
  fornecedor,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: fornecedor || { ativo: true },
  });

  useEffect(() => {
    if (fornecedor) {
      reset(fornecedor);
    }
  }, [fornecedor, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nome *"
          placeholder="Nome do fornecedor"
          error={errors.nome?.message}
          {...register('nome')}
        />

        <Input
          label="CNPJ"
          placeholder="00.000.000/0000-00"
          error={errors.cnpj?.message}
          {...register('cnpj')}
        />

        <Input
          label="Telefone"
          placeholder="(00) 00000-0000"
          error={errors.telefone?.message}
          {...register('telefone')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="contato@fornecedor.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Endereço"
          placeholder="Rua, número, bairro, cidade"
          error={errors.endereco?.message}
          {...register('endereco')}
        />

        <Input
          label="Prazo de Pagamento (dias)"
          type="number"
          placeholder="30"
          error={errors.prazo_pagamento_padrao?.message}
          {...register('prazo_pagamento_padrao')}
        />
      </div>

      <Input
        label="Produtos Principais"
        placeholder="Ex: Bebidas, Laticínios, Limpeza..."
        error={errors.produtos_principais?.message}
        {...register('produtos_principais')}
      />

      <Select
        label="Status"
        options={[
          { value: 'true', label: 'Ativo' },
          { value: 'false', label: 'Inativo' },
        ]}
        {...register('ativo')}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {fornecedor ? 'Atualizar' : 'Criar'} Fornecedor
        </Button>
      </div>
    </form>
  );
};
