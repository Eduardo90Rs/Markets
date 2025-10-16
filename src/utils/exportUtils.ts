import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Compra, Receita, Despesa } from '../types';

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
  despesas: {
    total: number;
    fixas: number;
    gerais: number;
    dados: Despesa[];
  };
  lucro: number;
  margemLucro: number;
}

export const exportToPDF = (compras: Compra[], title: string) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Data do relatório
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

  let y = 40;

  // Agrupar compras por fornecedor
  const comprasPorFornecedor = compras.reduce((acc, compra) => {
    const fornecedorNome = compra.fornecedores?.nome || 'Fornecedor não encontrado';
    const fornecedorId = compra.fornecedor_id || 'sem-fornecedor';

    if (!acc[fornecedorId]) {
      acc[fornecedorId] = {
        nome: fornecedorNome,
        compras: [],
        total: 0,
      };
    }

    acc[fornecedorId].compras.push(compra);
    acc[fornecedorId].total += compra.valor_total;

    return acc;
  }, {} as Record<string, { nome: string; compras: Compra[]; total: number }>);

  // Ordenar fornecedores por valor total (maior para menor)
  const fornecedoresOrdenados = Object.entries(comprasPorFornecedor)
    .sort(([, a], [, b]) => b.total - a.total);

  // Iterar sobre fornecedores
  fornecedoresOrdenados.forEach(([, fornecedor], fornecedorIndex) => {
    // Verifica se precisa de nova página
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Nome do fornecedor
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Cor azul
    doc.text(`${fornecedor.nome}`, 14, y);
    doc.setTextColor(0); // Volta para preto
    y += 7;

    // Subtotal do fornecedor
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: R$ ${fornecedor.total.toFixed(2)} | ${fornecedor.compras.length} compra${fornecedor.compras.length !== 1 ? 's' : ''}`, 14, y);
    y += 8;

    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 6;

    // Compras do fornecedor
    fornecedor.compras.forEach((compra, compraIndex) => {
      // Verifica se precisa de nova página
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Data e Valor
      doc.text(`${compraIndex + 1}. Data: ${format(parseISO(compra.data_compra), 'dd/MM/yyyy')} | Valor: R$ ${compra.valor_total.toFixed(2)}`, 18, y);
      y += 5;

      // Forma de pagamento e Status
      const status = compra.status_pagamento === 'pago' ? '✓ Pago' : '○ Pendente';
      doc.text(`   Pagamento: ${compra.forma_pagamento} | Status: ${status}`, 18, y);
      y += 5;

      // NF e Vencimento
      if (compra.numero_nf || compra.data_vencimento) {
        const nf = compra.numero_nf || '-';
        const venc = compra.data_vencimento ? format(parseISO(compra.data_vencimento), 'dd/MM/yyyy') : '-';
        doc.text(`   NF: ${nf} | Vencimento: ${venc}`, 18, y);
        y += 5;
      }

      // Observações
      if (compra.observacoes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`   Obs: ${compra.observacoes.substring(0, 70)}`, 18, y);
        doc.setTextColor(0);
        doc.setFontSize(10);
        y += 5;
      }

      y += 3; // Espaço entre compras
    });

    y += 8; // Espaço entre fornecedores
  });

  // Total Geral
  const totalGeral = compras.reduce((sum, c) => sum + c.valor_total, 0);

  // Linha separadora final
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(0);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 14, y);

  doc.save(`relatorio_compras_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
};

export const exportToExcel = (compras: Compra[], fileName: string) => {
  // Agrupar compras por fornecedor
  const comprasPorFornecedor = compras.reduce((acc, compra) => {
    const fornecedorNome = compra.fornecedores?.nome || 'Fornecedor não encontrado';
    const fornecedorId = compra.fornecedor_id || 'sem-fornecedor';

    if (!acc[fornecedorId]) {
      acc[fornecedorId] = {
        nome: fornecedorNome,
        compras: [],
        total: 0,
      };
    }

    acc[fornecedorId].compras.push(compra);
    acc[fornecedorId].total += compra.valor_total;

    return acc;
  }, {} as Record<string, { nome: string; compras: Compra[]; total: number }>);

  // Ordenar fornecedores por valor total (maior para menor)
  const fornecedoresOrdenados = Object.entries(comprasPorFornecedor)
    .sort(([, a], [, b]) => b.total - a.total);

  const data: any[] = [];

  // Iterar sobre fornecedores
  fornecedoresOrdenados.forEach(([, fornecedor]) => {
    // Cabeçalho do fornecedor
    data.push({
      Fornecedor: fornecedor.nome,
      Data: '',
      'Valor (R$)': '',
      Pagamento: '',
      Status: '',
      NF: '',
      Vencimento: '',
      Observações: '',
    });

    // Compras do fornecedor
    fornecedor.compras.forEach((compra) => {
      data.push({
        Fornecedor: '', // Em branco para não repetir
        Data: format(parseISO(compra.data_compra), 'dd/MM/yyyy'),
        'Valor (R$)': compra.valor_total.toFixed(2),
        Pagamento: compra.forma_pagamento,
        Status: compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
        NF: compra.numero_nf || '-',
        Vencimento: compra.data_vencimento
          ? format(parseISO(compra.data_vencimento), 'dd/MM/yyyy')
          : '-',
        Observações: compra.observacoes || '-',
      });
    });

    // Subtotal do fornecedor
    data.push({
      Fornecedor: `Subtotal ${fornecedor.nome}`,
      Data: '',
      'Valor (R$)': fornecedor.total.toFixed(2),
      Pagamento: '',
      Status: '',
      NF: '',
      Vencimento: '',
      Observações: '',
    });

    // Linha em branco para separar fornecedores
    data.push({
      Fornecedor: '',
      Data: '',
      'Valor (R$)': '',
      Pagamento: '',
      Status: '',
      NF: '',
      Vencimento: '',
      Observações: '',
    });
  });

  // Total geral
  const totalGeral = compras.reduce((sum, c) => sum + c.valor_total, 0);
  data.push({
    Fornecedor: 'TOTAL GERAL',
    Data: '',
    'Valor (R$)': totalGeral.toFixed(2),
    Pagamento: '',
    Status: '',
    NF: '',
    Vencimento: '',
    Observações: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Compras por Fornecedor');

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
  doc.text(`Despesas Fixas: R$ ${data.despesas.fixas.toFixed(2)}`, 14, y);
  y += 6;
  doc.text(`Despesas Gerais: R$ ${data.despesas.gerais.toFixed(2)}`, 14, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Despesas: R$ ${(data.compras.total + data.despesas.total).toFixed(2)}`, 14, y);
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
    ? ((data.compras.total + data.despesas.total) / data.receitas.recebido * 100).toFixed(1)
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
        `${status} ${format(parseISO(receita.data), 'dd/MM')} - ${receita.descricao.substring(0, 35)} - R$ ${receita.valor.toFixed(2)}`,
        14,
        y
      );
      y += 5;
    });
    y += 5;
  }

  // Detalhamento de Despesas
  if (data.despesas.dados.length > 0 && y < 250) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento de Despesas', 14, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Despesas Fixas
    const despesasFixas = data.despesas.dados.filter(d => d.tipo === 'fixa');
    if (despesasFixas.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Fixas:', 14, y);
      doc.setFont('helvetica', 'normal');
      y += 5;

      despesasFixas.forEach((despesa) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.text(
          `Dia ${despesa.dia_vencimento} - ${despesa.descricao.substring(0, 40)} - R$ ${despesa.valor.toFixed(2)}`,
          14,
          y
        );
        y += 5;
      });
      y += 3;
    }

    // Despesas Gerais
    const despesasGerais = data.despesas.dados.filter(d => d.tipo === 'geral');
    if (despesasGerais.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Gerais:', 14, y);
      doc.setFont('helvetica', 'normal');
      y += 5;

      despesasGerais.forEach((despesa) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const dataFormatada = despesa.data ? format(parseISO(despesa.data), 'dd/MM') : '-';
        doc.text(
          `${dataFormatada} - ${despesa.descricao.substring(0, 40)} - R$ ${despesa.valor.toFixed(2)}`,
          14,
          y
        );
        y += 5;
      });
    }
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
    { Indicador: 'Despesas Fixas', Valor: `R$ ${data.despesas.fixas.toFixed(2)}` },
    { Indicador: 'Despesas Gerais', Valor: `R$ ${data.despesas.gerais.toFixed(2)}` },
    { Indicador: 'Total de Despesas', Valor: `R$ ${(data.compras.total + data.despesas.total).toFixed(2)}` },
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
        ? `${((data.compras.total + data.despesas.total) / data.receitas.recebido * 100).toFixed(1)}%`
        : '0.0%'
    },
  ];

  // Aba 2: Receitas
  const receitasSheet = data.receitas.dados.map((receita) => ({
    Data: format(parseISO(receita.data), 'dd/MM/yyyy'),
    Descrição: receita.descricao,
    'Valor (R$)': receita.valor.toFixed(2),
    Categoria: receita.categoria,
    Status: receita.status_recebimento === 'recebido' ? 'Recebido' : 'Pendente',
    Observações: receita.observacoes || '-',
  }));

  // Aba 3: Compras
  const comprasSheet = data.compras.dados.map((compra) => ({
    Data: format(parseISO(compra.data_compra), 'dd/MM/yyyy'),
    Fornecedor: compra.fornecedores?.nome || 'Não encontrado',
    'Valor (R$)': compra.valor_total.toFixed(2),
    'Forma de Pagamento': compra.forma_pagamento,
    Status: compra.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
    'Número NF': compra.numero_nf || '-',
  }));

  // Aba 4: Despesas (Fixas + Gerais)
  const despesasSheet = data.despesas.dados.map((despesa) => ({
    Tipo: despesa.tipo === 'fixa' ? 'Fixa' : 'Geral',
    Data: despesa.tipo === 'geral' && despesa.data ? format(parseISO(despesa.data), 'dd/MM/yyyy') : '-',
    'Dia Vencimento': despesa.tipo === 'fixa' && despesa.dia_vencimento ? despesa.dia_vencimento : '-',
    Descrição: despesa.descricao,
    'Valor (R$)': despesa.valor.toFixed(2),
    Categoria: despesa.categoria,
    Status: despesa.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
    Ativa: despesa.tipo === 'fixa' ? (despesa.ativa ? 'Sim' : 'Não') : '-',
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
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
  }

  XLSX.writeFile(wb, `relatorio_mensal_${format(data.mes, 'yyyy-MM')}.xlsx`);
};

export const exportReceitasToPDF = (receitas: Receita[], title: string) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Data do relatório
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

  let y = 40;

  // Agrupar receitas por categoria
  const receitasPorCategoria = receitas.reduce((acc, receita) => {
    const categoriaNome = receita.categoria || 'Sem categoria';

    if (!acc[categoriaNome]) {
      acc[categoriaNome] = {
        nome: categoriaNome,
        receitas: [],
        total: 0,
      };
    }

    acc[categoriaNome].receitas.push(receita);
    acc[categoriaNome].total += receita.valor;

    return acc;
  }, {} as Record<string, { nome: string; receitas: Receita[]; total: number }>);

  // Ordenar categorias por valor total (maior para menor)
  const categoriasOrdenadas = Object.entries(receitasPorCategoria)
    .sort(([, a], [, b]) => b.total - a.total);

  // Iterar sobre categorias
  categoriasOrdenadas.forEach(([, categoria], categoriaIndex) => {
    // Verifica se precisa de nova página
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Nome da categoria
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Cor verde
    doc.text(`${categoria.nome}`, 14, y);
    doc.setTextColor(0); // Volta para preto
    y += 7;

    // Subtotal da categoria
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: R$ ${categoria.total.toFixed(2)} | ${categoria.receitas.length} receita${categoria.receitas.length !== 1 ? 's' : ''}`, 14, y);
    y += 8;

    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 6;

    // Receitas da categoria
    categoria.receitas.forEach((receita, receitaIndex) => {
      // Verifica se precisa de nova página
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Data, Descrição e Valor
      doc.text(`${receitaIndex + 1}. ${format(parseISO(receita.data), 'dd/MM/yyyy')} - ${receita.descricao.substring(0, 40)}`, 18, y);
      y += 5;

      doc.text(`   Valor: R$ ${receita.valor.toFixed(2)}`, 18, y);
      y += 5;

      // Status
      const status = receita.status_recebimento === 'recebido' ? '✓ Recebido' : '○ Pendente';
      doc.text(`   Status: ${status}`, 18, y);
      y += 5;

      // Observações
      if (receita.observacoes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`   Obs: ${receita.observacoes.substring(0, 70)}`, 18, y);
        doc.setTextColor(0);
        doc.setFontSize(10);
        y += 5;
      }

      y += 3; // Espaço entre receitas
    });

    y += 8; // Espaço entre categorias
  });

  // Total Geral
  const totalGeral = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalRecebido = receitas
    .filter((r) => r.status_recebimento === 'recebido')
    .reduce((sum, r) => sum + r.valor, 0);
  const totalPendente = receitas
    .filter((r) => r.status_recebimento === 'pendente')
    .reduce((sum, r) => sum + r.valor, 0);

  // Linha separadora final
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(0);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 14, y);
  y += 7;

  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text(`Total Recebido: R$ ${totalRecebido.toFixed(2)}`, 14, y);
  y += 6;

  doc.setTextColor(234, 179, 8);
  doc.text(`Total Pendente: R$ ${totalPendente.toFixed(2)}`, 14, y);

  doc.save(`relatorio_receitas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
};

export const exportReceitasToExcel = (receitas: Receita[], fileName: string) => {
  // Agrupar receitas por categoria
  const receitasPorCategoria = receitas.reduce((acc, receita) => {
    const categoriaNome = receita.categoria || 'Sem categoria';

    if (!acc[categoriaNome]) {
      acc[categoriaNome] = {
        nome: categoriaNome,
        receitas: [],
        total: 0,
      };
    }

    acc[categoriaNome].receitas.push(receita);
    acc[categoriaNome].total += receita.valor;

    return acc;
  }, {} as Record<string, { nome: string; receitas: Receita[]; total: number }>);

  // Ordenar categorias por valor total (maior para menor)
  const categoriasOrdenadas = Object.entries(receitasPorCategoria)
    .sort(([, a], [, b]) => b.total - a.total);

  const data: any[] = [];

  // Iterar sobre categorias
  categoriasOrdenadas.forEach(([, categoria]) => {
    // Cabeçalho da categoria
    data.push({
      Categoria: categoria.nome,
      Data: '',
      Descrição: '',
      'Valor (R$)': '',
      Status: '',
      Observações: '',
    });

    // Receitas da categoria
    categoria.receitas.forEach((receita) => {
      data.push({
        Categoria: '', // Em branco para não repetir
        Data: format(parseISO(receita.data), 'dd/MM/yyyy'),
        Descrição: receita.descricao,
        'Valor (R$)': receita.valor.toFixed(2),
        Status: receita.status_recebimento === 'recebido' ? 'Recebido' : 'Pendente',
        Observações: receita.observacoes || '-',
      });
    });

    // Subtotal da categoria
    data.push({
      Categoria: `Subtotal ${categoria.nome}`,
      Data: '',
      Descrição: '',
      'Valor (R$)': categoria.total.toFixed(2),
      Status: '',
      Observações: '',
    });

    // Linha em branco para separar categorias
    data.push({
      Categoria: '',
      Data: '',
      Descrição: '',
      'Valor (R$)': '',
      Status: '',
      Observações: '',
    });
  });

  // Totais gerais
  const totalGeral = receitas.reduce((sum, r) => sum + r.valor, 0);
  const totalRecebido = receitas
    .filter((r) => r.status_recebimento === 'recebido')
    .reduce((sum, r) => sum + r.valor, 0);
  const totalPendente = receitas
    .filter((r) => r.status_recebimento === 'pendente')
    .reduce((sum, r) => sum + r.valor, 0);

  data.push({
    Categoria: 'TOTAL GERAL',
    Data: '',
    Descrição: '',
    'Valor (R$)': totalGeral.toFixed(2),
    Status: '',
    Observações: '',
  });

  data.push({
    Categoria: 'Total Recebido',
    Data: '',
    Descrição: '',
    'Valor (R$)': totalRecebido.toFixed(2),
    Status: '',
    Observações: '',
  });

  data.push({
    Categoria: 'Total Pendente',
    Data: '',
    Descrição: '',
    'Valor (R$)': totalPendente.toFixed(2),
    Status: '',
    Observações: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Receitas por Categoria');

  XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
};

export const exportDespesasToPDF = (despesas: Despesa[], title: string) => {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Data do relatório
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28);

  let y = 40;

  // Agrupar despesas por categoria
  const despesasPorCategoria = despesas.reduce((acc, despesa) => {
    const categoriaNome = despesa.categoria || 'Sem categoria';

    if (!acc[categoriaNome]) {
      acc[categoriaNome] = {
        nome: categoriaNome,
        despesas: [],
        total: 0,
      };
    }

    acc[categoriaNome].despesas.push(despesa);
    acc[categoriaNome].total += despesa.valor;

    return acc;
  }, {} as Record<string, { nome: string; despesas: Despesa[]; total: number }>);

  // Ordenar categorias por valor total (maior para menor)
  const categoriasOrdenadas = Object.entries(despesasPorCategoria)
    .sort(([, a], [, b]) => b.total - a.total);

  // Iterar sobre categorias
  categoriasOrdenadas.forEach(([, categoria], categoriaIndex) => {
    // Verifica se precisa de nova página
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Nome da categoria
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Cor vermelha
    doc.text(`${categoria.nome}`, 14, y);
    doc.setTextColor(0); // Volta para preto
    y += 7;

    // Subtotal da categoria
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: R$ ${categoria.total.toFixed(2)} | ${categoria.despesas.length} despesa${categoria.despesas.length !== 1 ? 's' : ''}`, 14, y);
    y += 8;

    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 6;

    // Despesas da categoria
    categoria.despesas.forEach((despesa, despesaIndex) => {
      // Verifica se precisa de nova página
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Tipo e Descrição
      const tipoLabel = despesa.tipo === 'fixa' ? '[Fixa]' : '[Geral]';
      doc.text(`${despesaIndex + 1}. ${tipoLabel} ${despesa.descricao.substring(0, 35)}`, 18, y);
      y += 5;

      // Data/Vencimento e Valor
      if (despesa.tipo === 'fixa') {
        doc.text(`   Vencimento: Dia ${despesa.dia_vencimento} | Valor: R$ ${despesa.valor.toFixed(2)}`, 18, y);
      } else {
        const dataFormatada = despesa.data ? format(parseISO(despesa.data), 'dd/MM/yyyy') : '-';
        doc.text(`   Data: ${dataFormatada} | Valor: R$ ${despesa.valor.toFixed(2)}`, 18, y);
      }
      y += 5;

      // Status
      const status = despesa.status_pagamento === 'pago' ? '✓ Pago' : '○ Pendente';
      doc.text(`   Status: ${status}`, 18, y);
      y += 5;

      // Observações
      if (despesa.observacoes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`   Obs: ${despesa.observacoes.substring(0, 70)}`, 18, y);
        doc.setTextColor(0);
        doc.setFontSize(10);
        y += 5;
      }

      y += 3; // Espaço entre despesas
    });

    y += 8; // Espaço entre categorias
  });

  // Total Geral
  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'pago')
    .reduce((sum, d) => sum + d.valor, 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'pendente')
    .reduce((sum, d) => sum + d.valor, 0);

  // Linha separadora final
  if (y > 240) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(0);
  doc.line(14, y, 196, y);
  y += 8;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL GERAL: R$ ${totalGeral.toFixed(2)}`, 14, y);
  y += 7;

  doc.setFontSize(12);
  doc.setTextColor(22, 163, 74);
  doc.text(`Total Pago: R$ ${totalPago.toFixed(2)}`, 14, y);
  y += 6;

  doc.setTextColor(234, 179, 8);
  doc.text(`Total Pendente: R$ ${totalPendente.toFixed(2)}`, 14, y);

  doc.save(`relatorio_despesas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
};

export const exportDespesasToExcel = (despesas: Despesa[], fileName: string) => {
  // Agrupar despesas por categoria
  const despesasPorCategoria = despesas.reduce((acc, despesa) => {
    const categoriaNome = despesa.categoria || 'Sem categoria';

    if (!acc[categoriaNome]) {
      acc[categoriaNome] = {
        nome: categoriaNome,
        despesas: [],
        total: 0,
      };
    }

    acc[categoriaNome].despesas.push(despesa);
    acc[categoriaNome].total += despesa.valor;

    return acc;
  }, {} as Record<string, { nome: string; despesas: Despesa[]; total: number }>);

  // Ordenar categorias por valor total (maior para menor)
  const categoriasOrdenadas = Object.entries(despesasPorCategoria)
    .sort(([, a], [, b]) => b.total - a.total);

  const data: any[] = [];

  // Iterar sobre categorias
  categoriasOrdenadas.forEach(([, categoria]) => {
    // Cabeçalho da categoria
    data.push({
      Categoria: categoria.nome,
      Tipo: '',
      Data: '',
      'Dia Vencimento': '',
      Descrição: '',
      'Valor (R$)': '',
      Status: '',
      Observações: '',
    });

    // Despesas da categoria
    categoria.despesas.forEach((despesa) => {
      data.push({
        Categoria: '', // Em branco para não repetir
        Tipo: despesa.tipo === 'fixa' ? 'Fixa' : 'Geral',
        Data: despesa.tipo === 'geral' && despesa.data ? format(parseISO(despesa.data), 'dd/MM/yyyy') : '-',
        'Dia Vencimento': despesa.tipo === 'fixa' && despesa.dia_vencimento ? `Dia ${despesa.dia_vencimento}` : '-',
        Descrição: despesa.descricao,
        'Valor (R$)': despesa.valor.toFixed(2),
        Status: despesa.status_pagamento === 'pago' ? 'Pago' : 'Pendente',
        Observações: despesa.observacoes || '-',
      });
    });

    // Subtotal da categoria
    data.push({
      Categoria: `Subtotal ${categoria.nome}`,
      Tipo: '',
      Data: '',
      'Dia Vencimento': '',
      Descrição: '',
      'Valor (R$)': categoria.total.toFixed(2),
      Status: '',
      Observações: '',
    });

    // Linha em branco para separar categorias
    data.push({
      Categoria: '',
      Tipo: '',
      Data: '',
      'Dia Vencimento': '',
      Descrição: '',
      'Valor (R$)': '',
      Status: '',
      Observações: '',
    });
  });

  // Totais gerais
  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas
    .filter((d) => d.status_pagamento === 'pago')
    .reduce((sum, d) => sum + d.valor, 0);
  const totalPendente = despesas
    .filter((d) => d.status_pagamento === 'pendente')
    .reduce((sum, d) => sum + d.valor, 0);

  data.push({
    Categoria: 'TOTAL GERAL',
    Tipo: '',
    Data: '',
    'Dia Vencimento': '',
    Descrição: '',
    'Valor (R$)': totalGeral.toFixed(2),
    Status: '',
    Observações: '',
  });

  data.push({
    Categoria: 'Total Pago',
    Tipo: '',
    Data: '',
    'Dia Vencimento': '',
    Descrição: '',
    'Valor (R$)': totalPago.toFixed(2),
    Status: '',
    Observações: '',
  });

  data.push({
    Categoria: 'Total Pendente',
    Tipo: '',
    Data: '',
    'Dia Vencimento': '',
    Descrição: '',
    'Valor (R$)': totalPendente.toFixed(2),
    Status: '',
    Observações: '',
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Despesas por Categoria');

  XLSX.writeFile(wb, `${fileName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
};
