import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verificar autenticação de admin (função executada por automação)
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const logs = [];
        let certidoesAtualizadas = 0;
        let certidoesCriadas = 0;

        // 1. Buscar documentos que permitem renovação automática
        const docsRenovaveis = await base44.asServiceRole.entities.BibliotecaCompliance.filter({
            renovacao_automatica: true
        });
        
        logs.push(`✓ Encontrados ${docsRenovaveis.length} documentos com renovação automática habilitada`);

        if (docsRenovaveis.length === 0) {
            return Response.json({ 
                message: 'Nenhum documento configurado para renovação automática',
                logs 
            });
        }

        // 2. Buscar fontes de consulta disponíveis
        const fontesConsulta = await base44.asServiceRole.entities.FonteConsulta.filter({ ativo: true });
        logs.push(`✓ Encontradas ${fontesConsulta.length} fontes de consulta ativas`);

        // 3. Para cada documento renovável, tentar buscar atualização
        for (const doc of docsRenovaveis) {
            logs.push(`\n→ Processando: "${doc.nome_documento}"`);

            // Encontrar fonte de consulta compatível
            const fonte = fontesConsulta.find(f => 
                f.tipo.toLowerCase().includes(doc.nome_documento.toLowerCase()) ||
                doc.nome_documento.toLowerCase().includes(f.tipo.toLowerCase())
            );

            if (!fonte) {
                logs.push(`  ⚠ Nenhuma fonte de consulta encontrada para este documento`);
                continue;
            }

            logs.push(`  ✓ Fonte encontrada: ${fonte.tipo} (${fonte.url})`);

            try {
                // Simular acesso ao portal (em produção, usar puppeteer ou API oficial)
                // Por enquanto, vamos usar IA para processar o documento existente
                
                if (!doc.arquivo_url) {
                    logs.push(`  ⚠ Documento não possui arquivo anexado para análise`);
                    continue;
                }

                // Usar IA para extrair dados do PDF atual e verificar se precisa renovar
                logs.push(`  → Analisando documento com IA...`);
                
                const analiseIA = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: `Analise este documento de certidão/compliance e extraia as seguintes informações em formato JSON:
                    
- numero_documento: string (número da certidão)
- data_emissao: string (data no formato YYYY-MM-DD)
- data_validade: string (data no formato YYYY-MM-DD)
- orgao_emissor: string
- status_documento: string ("vigente", "vencido" ou "vencendo")
- observacoes: string (qualquer observação relevante)

Retorne APENAS o JSON, sem markdown ou texto adicional.`,
                    file_urls: [doc.arquivo_url],
                    response_json_schema: {
                        type: "object",
                        properties: {
                            numero_documento: { type: "string" },
                            data_emissao: { type: "string" },
                            data_validade: { type: "string" },
                            orgao_emissor: { type: "string" },
                            status_documento: { type: "string" },
                            observacoes: { type: "string" }
                        }
                    }
                });

                logs.push(`  ✓ Dados extraídos: Validade ${analiseIA.data_validade}, Status: ${analiseIA.status_documento}`);

                // Verificar se está próximo do vencimento (30 dias)
                const hoje = new Date();
                const dataValidade = new Date(analiseIA.data_validade);
                const diasRestantes = Math.ceil((dataValidade - hoje) / (1000 * 60 * 60 * 24));

                if (diasRestantes <= 30) {
                    logs.push(`  ⚠ ALERTA: Documento vence em ${diasRestantes} dias!`);
                    
                    // Notificar usuário
                    await base44.asServiceRole.integrations.Core.SendEmail({
                        to: user.email,
                        subject: `⚠️ Certidão Vencendo: ${doc.nome_documento}`,
                        body: `
ALERTA DE VENCIMENTO

Documento: ${doc.nome_documento}
Categoria: ${doc.categoria}
Órgão Emissor: ${analiseIA.orgao_emissor}
Data de Validade: ${new Date(analiseIA.data_validade).toLocaleDateString('pt-BR')}
Dias Restantes: ${diasRestantes}

${fonte.link_emissao ? `Portal de Renovação: ${fonte.link_emissao}` : ''}

⚠️ Providencie a renovação com urgência!
                        `
                    });

                    logs.push(`  📧 E-mail de alerta enviado para ${user.email}`);
                }

                // Atualizar registro com os dados mais recentes da análise
                await base44.asServiceRole.entities.BibliotecaCompliance.update(doc.id, {
                    numero_documento: analiseIA.numero_documento,
                    data_emissao: analiseIA.data_emissao,
                    data_validade: analiseIA.data_validade,
                    orgao_emissor: analiseIA.orgao_emissor,
                    observacoes: `${doc.observacoes || ''}\n\nÚltima verificação automática: ${new Date().toLocaleString('pt-BR')}\nStatus: ${analiseIA.status_documento}\n${analiseIA.observacoes || ''}`
                });

                certidoesAtualizadas++;
                logs.push(`  ✅ Documento atualizado com sucesso`);

                // FUTURO: Aqui seria o lugar para integração com robôs RPA (Puppeteer/Playwright)
                // para navegar nos portais e baixar novas certidões automaticamente

            } catch (error) {
                logs.push(`  ❌ Erro ao processar: ${error.message}`);
            }
        }

        // 4. Verificar certidões vencidas ou próximas do vencimento em TODOS os documentos
        const todosDocumentos = await base44.asServiceRole.entities.BibliotecaCompliance.list();
        const documentosAlerta = todosDocumentos.filter(d => {
            if (!d.data_validade) return false;
            const validade = new Date(d.data_validade);
            const diasRestantes = Math.ceil((validade - new Date()) / (1000 * 60 * 60 * 24));
            return diasRestantes <= 30;
        });

        if (documentosAlerta.length > 0) {
            logs.push(`\n⚠️ RESUMO DE ALERTAS: ${documentosAlerta.length} documentos precisam de atenção`);
            
            // Enviar resumo consolidado
            const listaAlerta = documentosAlerta.map(d => {
                const dias = Math.ceil((new Date(d.data_validade) - new Date()) / (1000 * 60 * 60 * 24));
                return `• ${d.nome_documento} (${d.categoria}) - ${dias > 0 ? `Vence em ${dias} dias` : 'VENCIDO'}`;
            }).join('\n');

            await base44.asServiceRole.integrations.Core.SendEmail({
                to: user.email,
                subject: `📊 Relatório de Compliance - ${documentosAlerta.length} Alertas`,
                body: `
RELATÓRIO DE COMPLIANCE AUTOMÁTICO
Data: ${new Date().toLocaleString('pt-BR')}

DOCUMENTOS QUE PRECISAM DE ATENÇÃO:
${listaAlerta}

---
Total de documentos verificados: ${todosDocumentos.length}
Documentos atualizados automaticamente: ${certidoesAtualizadas}

Acesse o sistema para mais detalhes.
                `
            });
        }

        return Response.json({
            success: true,
            message: `Verificação concluída: ${certidoesAtualizadas} certidões atualizadas, ${documentosAlerta.length} alertas`,
            certidoesAtualizadas,
            certidoesCriadas,
            documentosAlerta: documentosAlerta.length,
            logs
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});