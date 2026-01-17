import { PDFDocument, PDFPage, rgb } from "npm:pdf-lib@1.17.1";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.6";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propostaId } = await req.json();

    if (!propostaId) {
      return Response.json({ error: "propostaId required" }, { status: 400 });
    }

    // Fetch proposal document and items
    const propostas = await base44.entities.PropostasDoc.filter({ id: propostaId });
    const proposta = propostas[0];

    if (!proposta) {
      return Response.json({ error: "Proposal not found" }, { status: 404 });
    }

    const itens = await base44.entities.PropostasItens.filter({ proposta_id: propostaId }, "ordem");

    // Fetch opportunity for branding
    const oportunidades = await base44.entities.Oportunidade.filter({ id: proposta.oportunidade_id });
    const oportunidade = oportunidades[0] || {};

    // Create PDF document
    const pdfDoc = await PDFDocument.create();

    // Add title page
    let page = pdfDoc.addPage([595, 842]); // A4
    const { height } = page.getSize();
    page.drawText(proposta.titulo, {
      x: 50,
      y: height - 100,
      size: 24,
      color: rgb(0.15, 0.15, 0.15),
    });

    page.drawText(`Tipo: ${proposta.tipo}`, {
      x: 50,
      y: height - 150,
      size: 12,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Data: ${new Date().toLocaleDateString("pt-BR")}`, {
      x: 50,
      y: height - 180,
      size: 12,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Add content blocks
    let currentPage = page;
    let yPosition = height - 250;

    for (const item of itens) {
      if (item.tipo_bloco === "Texto") {
        // Render HTML content (simplified - just extract text)
        const textContent = stripHtml(item.conteudo_html || "");
        const lines = textContent.split("\n").filter(l => l.trim());

        for (const line of lines) {
          if (yPosition < 50) {
            currentPage = pdfDoc.addPage([595, 842]);
            yPosition = height - 50;
          }

          currentPage.drawText(line, {
            x: 50,
            y: yPosition,
            size: 11,
            color: rgb(0.1, 0.1, 0.1),
          });

          yPosition -= 20;
        }

        yPosition -= 30; // Space between blocks
      } else if (item.tipo_bloco === "Anexo") {
        // Handle PDF attachment
        if (item.biblioteca_compliance_id) {
          try {
            const docs = await base44.entities.BibliotecaCompliance.filter({
              id: item.biblioteca_compliance_id,
            });
            const doc = docs[0];

            if (doc && doc.arquivo_url) {
              const pdfUrl = doc.arquivo_url;
              const pdfBytes = await fetch(pdfUrl).then(r => r.arrayBuffer());
              const pdfToMerge = await PDFDocument.load(pdfBytes);

              // Copy pages from attachment PDF
              const copiedPages = await pdfDoc.copyPages(
                pdfToMerge,
                pdfToMerge.getPageIndices()
              );

              for (const copiedPage of copiedPages) {
                pdfDoc.addPage(copiedPage);
              }

              currentPage = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
              yPosition = height - 50;
            }
          } catch (error) {
            console.error("Error merging attachment PDF:", error);
          }
        }
      }
    }

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfBytes], { type: "application/pdf" }),
    });

    // Update proposal status
    await base44.entities.PropostasDoc.update(propostaId, {
      arquivo_final_url: uploadResult.file_url,
      numero_paginas: pdfDoc.getPageCount(),
      status: "gerada",
    });

    return Response.json({
      success: true,
      file_url: uploadResult.file_url,
      pageCount: pdfDoc.getPageCount(),
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}