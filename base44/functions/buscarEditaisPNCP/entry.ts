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
        let oportunidadesCriadas = 0;
        let editaisAnalisados = 0;

        // 1. Buscar filtros ativos
        const filtros = await base44.asServiceRole.entities.FiltroLicitacao.filter({ ativo: true });
        logs.push(`✓ Encontrados ${filtros.length} filtros ativos`);

        if (filtros.length === 0) {
            return Response.json({ 
                message: 'Nenhum filtro ativo encontrado',
                logs 
            });
        }

        // 2. Para cada filtro, buscar editais no PNCP
        for (const filtro of filtros) {
            logs.push(`\n→ Processando filtro: "${filtro.nome_filtro}"`);

            // Construir parâmetros de busca para a API do PNCP
            const searchParams = new URLSearchParams();
            
            // Data: buscar editais dos últimos 7 dias
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - 7);
            searchParams.append('dataInicial', dataInicio.toISOString().split('T')[0]);
            searchParams.append('dataFinal', new Date().toISOString().split('T')[0]);
            
            // Estados
            if (filtro.estados_atuacao) {
                const estados = filtro.estados_atuacao.split(',').map(e => e.trim());
                estados.forEach(uf => searchParams.append('uf', uf));
            }
            
            // Modalidade
            if (filtro.modalidades) {
                const modalidades = filtro.modalidades.split(',').map(m => m.trim());
                if (modalidades.length > 0) {
                    searchParams.append('modalidadeId', '1'); // Pregão Eletrônico (exemplo)
                }
            }

            // Buscar editais na API do PNCP
            const pncpUrl = `https://pncp.gov.br/api/search?${searchParams.toString()}`;
            logs.push(`  Consultando PNCP: ${pncpUrl}`);

            try {
                const response = await fetch(pncpUrl, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    logs.push(`  ⚠ Erro ao consultar PNCP: ${response.status}`);
                    continue;
                }

                const editais = await response.json();
                const items = editais.items || editais.data || [];
                logs.push(`  ✓ Encontrados ${items.length} editais`);

                // 3. Processar cada edital encontrado
                for (const edital of items.slice(0, 5)) { // Limitar a 5 por filtro para não sobrecarregar
                    editaisAnalisados++;
                    
                    // Aplicar filtros de palavras-chave
                    const textoEdital = `${edital.objeto || ''} ${edital.descricao || ''}`.toLowerCase();
                    
                    // Verificar palavras negativas (descarte)
                    if (filtro.palavras_negativas) {
                        const palavrasNegativas = filtro.palavras_negativas.split(',').map(p => p.trim().toLowerCase());
                        const temPalavraNegativa = palavrasNegativas.some(p => textoEdital.includes(p));
                        if (temPalavraNegativa) {
                            logs.push(`  ⊗ Descartado por palavra negativa: ${edital.numero}`);
                            continue;
                        }
                    }

                    // Verificar palavras positivas (score)
                    let score = 50;
                    if (filtro.palavras_positivas) {
                        const palavrasPositivas = filtro.palavras_positivas.split(',').map(p => p.trim().toLowerCase());
                        const matchesPositivos = palavrasPositivas.filter(p => textoEdital.includes(p));
                        score = Math.min(100, 50 + (matchesPositivos.length * 15));
                    }

                    // Verificar faixa de valor
                    const valorEstimado = edital.valorEstimado || edital.valor || 0;
                    if (filtro.valor_minimo && valorEstimado < filtro.valor_minimo) continue;
                    if (filtro.valor_maximo && valorEstimado > filtro.valor_maximo) continue;

                    logs.push(`  → Analisando edital ${edital.numero} (Score inicial: ${score})`);

                    // 4. Invocar o Agente Analista de Editais
                    try {
                        // Preparar conteúdo do edital para o agente
                        const conteudoEdital = `
NÚMERO DO EDITAL: ${edital.numero || edital.numeroEdital || 'N/A'}
ÓRGÃO: ${edital.orgao || edital.orgaoEntidade || 'N/A'}
OBJETO: ${edital.objeto || 'N/A'}
MODALIDADE: ${edital.modalidade || 'N/A'}
VALOR ESTIMADO: R$ ${valorEstimado?.toLocaleString('pt-BR') || 'N/A'}
DATA DE ABERTURA: ${edital.dataAbertura || edital.dataHoraAbertura || 'N/A'}
UF: ${edital.uf || 'N/A'}
MUNICÍPIO: ${edital.municipio || 'N/A'}

DESCRIÇÃO/EXIGÊNCIAS:
${edital.descricao || edital.informacoesAdicionais || 'Sem descrição detalhada disponível'}
                        `.trim();

                        // Criar conversa com o agente
                        const conversation = await base44.asServiceRole.agents.createConversation({
                            agent_name: "analista-editais-eng",
                            metadata: {
                                name: `Análise: ${edital.numero}`,
                                edital_numero: edital.numero,
                                filtro_id: filtro.id
                            }
                        });

                        // Enviar edital para análise
                        await base44.asServiceRole.agents.addMessage(conversation, {
                            role: "user",
                            content: `Analise este edital e retorne o JSON estruturado conforme suas instruções:\n\n${conteudoEdital}`
                        });

                        // Aguardar resposta do agente (polling simples)
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        const conversaAtualizada = await base44.asServiceRole.agents.getConversation(conversation.id);
                        const respostaAgente = conversaAtualizada.messages[conversaAtualizada.messages.length - 1];

                        if (respostaAgente.role === 'assistant' && respostaAgente.content) {
                            // Tentar extrair JSON da resposta
                            let analiseJSON;
                            try {
                                // Remover markdown code blocks se existirem
                                let conteudo = respostaAgente.content.trim();
                                if (conteudo.includes('```json')) {
                                    conteudo = conteudo.split('```json')[1].split('```')[0].trim();
                                } else if (conteudo.includes('```')) {
                                    conteudo = conteudo.split('```')[1].split('```')[0].trim();
                                }
                                analiseJSON = JSON.parse(conteudo);
                            } catch (e) {
                                logs.push(`  ⚠ Erro ao parsear JSON do agente: ${e.message}`);
                                continue;
                            }

                            logs.push(`  ✓ Agente analisou: ${analiseJSON.decisao} (Score: ${analiseJSON.score_compatibilidade})`);

                            // 5. Se APROVADO, criar oportunidade
                            if (analiseJSON.decisao === 'APROVADO' || analiseJSON.score_compatibilidade >= 70) {
                                const novaOportunidade = {
                                    empresa_id: filtro.empresa_id || null,
                                    numero_edital: edital.numero || edital.numeroEdital,
                                    orgao_licitante: edital.orgao || edital.orgaoEntidade,
                                    objeto: edital.objeto || analiseJSON.resumo_objeto,
                                    modalidade: edital.modalidade || 'Pregão Eletrônico',
                                    valor_estimado: valorEstimado,
                                    data_abertura: edital.dataAbertura || edital.dataHoraAbertura,
                                    link_edital: edital.link || edital.linkSistemaOrigem,
                                    uf: edital.uf,
                                    municipio: edital.municipio,
                                    status: 'nova',
                                    score_compatibilidade: analiseJSON.score_compatibilidade,
                                    analise_ia: JSON.stringify(analiseJSON),
                                    observacoes: `Análise automática via Agente IA\n\nPontos Críticos:\n${analiseJSON.pontos_criticos?.join('\n') || 'Nenhum'}\n\nCertidões Pendentes:\n${analiseJSON.certidoes_pendentes?.join('\n') || 'Nenhuma'}`
                                };

                                await base44.asServiceRole.entities.Oportunidade.create(novaOportunidade);
                                oportunidadesCriadas++;
                                logs.push(`  ✅ Oportunidade criada: ${edital.numero}`);

                                // Notificar usuário (email)
                                await base44.asServiceRole.integrations.Core.SendEmail({
                                    to: user.email,
                                    subject: `🎯 Nova Oportunidade Aprovada: ${edital.objeto?.substring(0, 50)}`,
                                    body: `
Uma nova oportunidade foi identificada e aprovada pelo sistema de IA:

📋 Edital: ${edital.numero}
🏢 Órgão: ${edital.orgao}
💰 Valor: R$ ${valorEstimado?.toLocaleString('pt-BR')}
📊 Score de Compatibilidade: ${analiseJSON.score_compatibilidade}/100

🔗 Acesse o sistema para mais detalhes.
                                    `
                                });
                            }
                        }

                    } catch (agentError) {
                        logs.push(`  ⚠ Erro ao invocar agente: ${agentError.message}`);
                    }
                }

            } catch (fetchError) {
                logs.push(`  ⚠ Erro ao buscar editais: ${fetchError.message}`);
            }
        }

        return Response.json({
            success: true,
            message: `Busca concluída: ${editaisAnalisados} editais analisados, ${oportunidadesCriadas} oportunidades criadas`,
            oportunidadesCriadas,
            editaisAnalisados,
            logs
        });

    } catch (error) {
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});