import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Compra } from '../types';

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
