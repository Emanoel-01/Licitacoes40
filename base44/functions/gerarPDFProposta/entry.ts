import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import jsPDF from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposta_id } = await req.json();

    if (!proposta_id) {
      return Response.json(
        { error: 'proposta_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar proposta e itens
    const proposta = await base44.asServiceRole.entities.PropostasDoc.list().then(
      (list) => list.find((p) => p.id === proposta_id)
    );

    if (!proposta) {
      return Response.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const itens = await base44.asServiceRole.entities.PropostasItens.filter(
      { proposta_id },
      'ordem'
    );

    const docs = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let pageCount = 0;
    let firstPage = true;

    // Processar blocos
    for (const item of itens) {
      if (item.tipo_bloco === 'Texto') {
        // Converter HTML para texto simples (simplificado)
        const texto = item.conteudo_html?.replace(/<[^>]*>/g, '') || '';

        if (!firstPage) {
          docs.addPage();
        }
        firstPage = false;

        // Adicionar cabeçalho
        docs.setFontSize(10);
        docs.text(proposta.titulo, 15, 15);
        docs.setLineWidth(0.5);
        docs.line(15, 20, 195, 20);

        // Adicionar conteúdo
        docs.setFontSize(11);
        const pageHeight = docs.internal.pageSize.height;
        const pageWidth = docs.internal.pageSize.width;
        const margin = 15;
        const maxWidth = pageWidth - 2 * margin;

        const lines = docs.splitTextToSize(texto, maxWidth - 5);
        let yPosition = 30;

        lines.forEach((line) => {
          if (yPosition > pageHeight - 20) {
            docs.addPage();
            yPosition = 15;
          }
          docs.text(line, margin + 5, yPosition);
          yPosition += 5;
        });

        pageCount = docs.internal.pages.length - 1;
      } else if (item.tipo_bloco === 'Anexo') {
        // Para anexos, seria necessário integrar com PDFKit ou similar
        // Por enquanto, apenas registramos
        if (!firstPage) {
          docs.addPage();
        }
        firstPage = false;

        docs.setFontSize(10);
        docs.text(item.titulo_bloco || 'Anexo', 15, 15);
        docs.setLineWidth(0.5);
        docs.line(15, 20, 195, 20);
        docs.setFontSize(11);
        docs.text('[Arquivo anexado: ' + item.titulo_bloco + ']', 15, 35);

        pageCount = docs.internal.pages.length - 1;
      }
    }

    // Adicionar numeração de páginas
    const totalPages = docs.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      docs.setPage(i);
      docs.setFontSize(9);
      docs.text(
        `Página ${i} de ${totalPages}`,
        docs.internal.pageSize.width - 30,
        docs.internal.pageSize.height - 10
      );
    }

    // Upload do PDF
    const pdfBytes = docs.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfFile = new File(
      [pdfBlob],
      `proposta_${proposta_id}_${Date.now()}.pdf`,
      { type: 'application/pdf' }
    );

    const { file_url } = await base44.integrations.Core.UploadFile({
      file: pdfFile,
    });

    // Atualizar proposta
    await base44.asServiceRole.entities.PropostasDoc.update(proposta_id, {
      arquivo_final_url: file_url,
      status: 'gerada',
      numero_paginas: totalPages,
    });

    return Response.json({
      success: true,
      arquivo_url: file_url,
      numero_paginas: totalPages,
    });
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return Response.json(
      { error: error.message || 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
});