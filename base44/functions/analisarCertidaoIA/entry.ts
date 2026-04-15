import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { arquivo_url, modo } = await req.json();

        // MODO 1: Analisar PDF e extrair dados da certidão
        if (modo === 'extrair_dados') {
            if (!arquivo_url) {
                return Response.json({ error: 'arquivo_url é obrigatório' }, { status: 400 });
            }

            const resultado = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um especialista em documentos de compliance e certidões brasileiras.
Analise o documento fornecido e extraia as seguintes informações com máxima precisão:

- nome_documento: Nome oficial do documento/certidão (ex: "Certidão Negativa de Débitos Federais")
- categoria: Uma de: "Jurídica", "Fiscal/Trabalhista", "Econômica", "Técnica/Institucional"
- orgao_emissor: Órgão que emitiu o documento (ex: "Receita Federal", "PGFN", "Caixa Econômica Federal")
- numero_documento: Número de protocolo ou identificação único do documento
- data_emissao: Data de emissão no formato YYYY-MM-DD
- data_validade: Data de validade/expiração no formato YYYY-MM-DD
- link_renovacao: URL do portal de renovação se mencionado no documento (senão null)
- situacao: "regular", "irregular" ou "nao_identificado"
- observacoes: Observações relevantes sobre o documento em português

Se não conseguir identificar alguma informação, retorne null para aquele campo.`,
                file_urls: [arquivo_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        nome_documento: { type: "string" },
                        categoria: { type: "string" },
                        orgao_emissor: { type: "string" },
                        numero_documento: { type: "string" },
                        data_emissao: { type: "string" },
                        data_validade: { type: "string" },
                        link_renovacao: { type: "string" },
                        situacao: { type: "string" },
                        observacoes: { type: "string" }
                    }
                }
            });

            return Response.json({ sucesso: true, dados: resultado });
        }

        // MODO 2: Gerar análise de risco e sugestões para todos os documentos de uma empresa
        if (modo === 'analisar_riscos') {
            const { empresa_id } = await req.json().catch(() => ({}));
            
            const query = empresa_id ? { empresa_id } : {};
            const documentos = await base44.entities.BibliotecaCompliance.filter(query);
            
            const hoje = new Date();
            const docsInfo = documentos.map(d => {
                const diasRestantes = d.data_validade 
                    ? Math.ceil((new Date(d.data_validade) - hoje) / (1000 * 60 * 60 * 24))
                    : null;
                return {
                    nome: d.nome_documento,
                    categoria: d.categoria,
                    validade: d.data_validade,
                    diasRestantes,
                    renovacao_automatica: d.renovacao_automatica
                };
            });

            const analise = await base44.integrations.Core.InvokeLLM({
                prompt: `Você é um especialista em compliance para licitações públicas brasileiras (Lei 14.133/2021).
                
Analise estes documentos de compliance de uma empresa participante de licitações:
${JSON.stringify(docsInfo, null, 2)}

Forneça:
1. nivel_risco: "baixo", "medio" ou "alto"
2. resumo: Resumo executivo da situação (2-3 frases)
3. alertas: Array de alertas urgentes (documentos vencidos ou vencendo em 30 dias)
4. sugestoes: Array de sugestões de renovação prioritárias com prazo recomendado
5. documentos_faltantes: Array de documentos típicos de licitação que parecem faltar na lista

Considere que certidões negativas de débitos federais, estaduais, municipais, FGTS, INSS e CNDT são essenciais.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        nivel_risco: { type: "string" },
                        resumo: { type: "string" },
                        alertas: { type: "array", items: { type: "string" } },
                        sugestoes: { type: "array", items: { type: "string" } },
                        documentos_faltantes: { type: "array", items: { type: "string" } }
                    }
                }
            });

            return Response.json({ sucesso: true, analise });
        }

        return Response.json({ error: 'modo inválido' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});