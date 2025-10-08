import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Compra, Receita, DespesaFixa } from '../types';

export interface RelatorioMensalData {
  mes: Date;
  receitas: {
    total: number;
    recebido: number;
    pendente: number;
    dados: Receita[];
  };
  compras: {
    total: number;
    numero: number;
    dados: Compra[];
  };
  despesasFixas: {
    total: number;
    dados: DespesaFixa[];
  };
  lucro: number;
  margemLucro: number;
}

export const exportToPDF = (compras: Compra[], title: string) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Data do relatório
  doc.setFontSize(10);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

  let y = 40;

  compras.forEach((compra, index) => {
    // Verifica se precisa de nova página
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${compra.fornecedores?.nome || 'Fornecedor não encontrado'}`, 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 6;

    doc.text(`Data: ${format(new Date(compra.data_compra), 'dd/MM/yyyy')}`, 14, y);
    y += 5;

    doc.text(`Valor: R$ ${compra.valor_total.toFixed(2)}`, 14, y);
    y += 5;

    doc.text(`Forma de Pagamento: ${compra.forma_pagamento}`, 14, y);
    y += 5;

    doc.text(`Status: ${compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}`, 14, y);
    y += 5;

    if (compra.numero_nf) {
      doc.text(`NF: ${compra.numero_nf}`, 14, y);
      y += 5;
    }

    if (compra.data_vencimento) {
      doc.text(`Vencimento: ${format(new Date(compra.data_vencimento), 'dd/MM/yyyy')}`, 14, y);
      y += 5;
    }

    if (compra.observacoes) {
      doc.text(`Obs: ${compra.observacoes.substring(0, 80)}`, 14, y);
      y += 5;
    }

    y += 5; // Espaço entre registros
  });

  // Total
  const total = compras.reduce((sum, c) => sum + c.valor_total, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Total: R$ ${total.toFixed(2)}`, 14, y + 5);

  doc.save(`relatorio_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
};

export const exportToExcel = (compras: Compra[], fileName: string) => {
  const data = compras.map((compra) => ({
    Fornecedor: compra.fornecedores?.nome || 'Não encontrado',
    'Data da Compra': format(new Date(compra.data_compra), 'dd/MM/yyyy'),
    'Valor (R$)': compra.valor_total.toFixed(2),
    'Forma de Pagamento': compra.forma_pagamento,
    Status: compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
    'Número NF': compra.numero_nf || '-',
    Vencimento: compra.data_vencimento
      ? format(new Date(compra.data_vencimento), 'dd/MM/yyyy')
      : '-',
    Observações: compra.observacoes || '-',
  }));

  // Adicionar linha de total
  const total = compras.reduce((sum, c) => sum + c.valor_total, 0);
  data.push({
    Fornecedor: 'TOTAL',
    'Data da Compra': '',
    'Valor (R$)': total.toFixed(2),
    'Forma de Pagamento': '',
    Status: '',
    'Número NF': '',
    Vencimento: '',
    Observações: '',
  } as any);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

  XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
};

export const exportRelatorioMensalToPDF = (data: RelatorioMensalData) => {
  const doc = new jsPDF();
  const mesAno = format(data.mes, "MMMM 'de' yyyy", { locale: ptBR });

  // Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Mensal Financeiro', 14, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(mesAno, 14, 28);

  // Data do relatório
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 35);
  doc.setTextColor(0);

  let y = 50;

  // Seção de Receitas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text('RECEITAS', 14, y);
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Receitas: R$ ${data.receitas.total.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Recebido: R$ ${data.receitas.recebido.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 150, 0);
  doc.text(`Pendente: R$ ${data.receitas.pendente.toFixed(2)}`, 14, y);
  doc.setTextColor(0);
  y += 12;

  // Seção de Despesas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text('DESPESAS', 14, y);
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Compras: R$ ${data.compras.total.toFixed(2)} (${data.compras.numero} compras)`, 14, y);
  y += 6;
  doc.text(`Despesas Fixas: R$ ${data.despesasFixas.total.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Despesas: R$ ${(data.compras.total + data.despesasFixas.total).toFixed(2)}`, 14, y);
  y += 12;

  // Linha separadora
  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 8;

  // Seção de Lucro
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  if (data.lucro >= 0) {
    doc.setTextColor(0, 128, 0);
    doc.text(`LUCRO LÍQUIDO: R$ ${data.lucro.toFixed(2)}`, 14, y);
  } else {
    doc.setTextColor(220, 53, 69);
    doc.text(`PREJUÍZO: R$ ${Math.abs(data.lucro).toFixed(2)}`, 14, y);
  }
  doc.setTextColor(0);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Margem de Lucro: ${data.margemLucro.toFixed(1)}%`, 14, y);
  y += 15;

  // Indicadores
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const ticketMedio = data.compras.numero > 0
    ? (data.compras.total / data.compras.numero).toFixed(2)
    : '0.00';
  doc.text(`Ticket Médio de Compra: R$ ${ticketMedio}`, 14, y);
  y += 6;

  const percentualDespesas = data.receitas.recebido > 0
    ? ((data.compras.total + data.despesasFixas.total) / data.receitas.recebido * 100).toFixed(1)
    : '0.0';
  doc.text(`Percentual de Despesas sobre Receita: ${percentualDespesas}%`, 14, y);
  y += 15;

  // Detalhamento de Receitas
  if (data.receitas.dados.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento de Receitas', 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    data.receitas.dados.forEach((receita, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const status = receita.status_recebimento === 'recebido' ? '✓' : '○';
      doc.text(
        `${status} ${format(new Date(receita.data), 'dd/MM')} - ${receita.descricao.substring(0, 35)} - R$ ${receita.valor.toFixed(2)}`,
        14,
        y
      );
      y += 5;
    });
    y += 5;
  }

  // Detalhamento de Despesas Fixas
  if (data.despesasFixas.dados.length > 0 && y < 250) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Despesas Fixas', 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    data.despesasFixas.dados.filter(d => d.ativa).forEach((despesa) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        `Dia ${despesa.dia_vencimento} - ${despesa.nome.substring(0, 40)} - R$ ${despesa.valor.toFixed(2)}`,
        14,
        y
      );
      y += 5;
    });
  }

  doc.save(`relatorio_mensal_${format(data.mes, 'yyyy-MM')}.pdf`);
};

export const exportRelatorioMensalToExcel = (data: RelatorioMensalData) => {
  const mesAno = format(data.mes, "MMMM 'de' yyyy", { locale: ptBR });

  // Aba 1: Resumo
  const resumo = [
    { Indicador: 'Período', Valor: mesAno },
    { Indicador: '', Valor: '' },
    { Indicador: 'RECEITAS', Valor: '' },
    { Indicador: 'Total de Receitas', Valor: `R$ ${data.receitas.total.toFixed(2)}` },
    { Indicador: 'Receitas Recebidas', Valor: `R$ ${data.receitas.recebido.toFixed(2)}` },
    { Indicador: 'Receitas Pendentes', Valor: `R$ ${data.receitas.pendente.toFixed(2)}` },
    { Indicador: '', Valor: '' },
    { Indicador: 'DESPESAS', Valor: '' },
    { Indicador: 'Total de Compras', Valor: `R$ ${data.compras.total.toFixed(2)}` },
    { Indicador: 'Número de Compras', Valor: data.compras.numero.toString() },
    { Indicador: 'Despesas Fixas', Valor: `R$ ${data.despesasFixas.total.toFixed(2)}` },
    { Indicador: 'Total de Despesas', Valor: `R$ ${(data.compras.total + data.despesasFixas.total).toFixed(2)}` },
    { Indicador: '', Valor: '' },
    { Indicador: 'RESULTADO', Valor: '' },
    { Indicador: 'Lucro Líquido', Valor: `R$ ${data.lucro.toFixed(2)}` },
    { Indicador: 'Margem de Lucro', Valor: `${data.margemLucro.toFixed(1)}%` },
    { Indicador: '', Valor: '' },
    { Indicador: 'INDICADORES', Valor: '' },
    {
      Indicador: 'Ticket Médio de Compra',
      Valor: data.compras.numero > 0
        ? `R$ ${(data.compras.total / data.compras.numero).toFixed(2)}`
        : 'R$ 0.00'
    },
    {
      Indicador: '% Despesas sobre Receita',
      Valor: data.receitas.recebido > 0
        ? `${((data.compras.total + data.despesasFixas.total) / data.receitas.recebido * 100).toFixed(1)}%`
        : '0.0%'
    },
  ];

  // Aba 2: Receitas
  const receitasSheet = data.receitas.dados.map((receita) => ({
    Data: format(new Date(receita.data), 'dd/MM/yyyy'),
    Descrição: receita.descricao,
    'Valor (R$)': receita.valor.toFixed(2),
    Categoria: receita.categoria,
    Status: receita.status_recebimento === 'recebido' ? 'Recebido' : 'Pendente',
    Observações: receita.observacoes || '-',
  }));

  // Aba 3: Compras
  const comprasSheet = data.compras.dados.map((compra) => ({
    Data: format(new Date(compra.data_compra), 'dd/MM/yyyy'),
    Fornecedor: compra.fornecedores?.nome || 'Não encontrado',
    'Valor (R$)': compra.valor_total.toFixed(2),
    'Forma de Pagamento': compra.forma_pagamento,
    Status: compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
    'Número NF': compra.numero_nf || '-',
  }));

  // Aba 4: Despesas Fixas
  const despesasSheet = data.despesasFixas.dados
    .filter(d => d.ativa)
    .map((despesa) => ({
      Nome: despesa.nome,
      'Valor Mensal (R$)': despesa.valor.toFixed(2),
      'Dia Vencimento': despesa.dia_vencimento,
      Categoria: despesa.categoria,
      Status: despesa.ativa ? 'Ativa' : 'Inativa',
      Observações: despesa.observacoes || '-',
    }));

  // Criar workbook
  const wb = XLSX.utils.book_new();

  const wsResumo = XLSX.utils.json_to_sheet(resumo);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  if (receitasSheet.length > 0) {
    const wsReceitas = XLSX.utils.json_to_sheet(receitasSheet);
    XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');
  }

  if (comprasSheet.length > 0) {
    const wsCompras = XLSX.utils.json_to_sheet(comprasSheet);
    XLSX.utils.book_append_sheet(wb, wsCompras, 'Compras');
  }

  if (despesasSheet.length > 0) {
    const wsDespesas = XLSX.utils.json_to_sheet(despesasSheet);
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas Fixas');
  }

  XLSX.writeFile(wb, `relatorio_mensal_${format(data.mes, 'yyyy-MM')}.xlsx`);
};
