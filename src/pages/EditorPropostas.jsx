import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Download, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BlocoTexto from "@/components/editor/BlocoTexto";
import BlocoAnexo from "@/components/editor/BlocoAnexo";
import ModalSelecionarAnexo from "@/components/editor/ModalSelecionarAnexo";

export default function EditorPropostas() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const oportunidadeId = urlParams.get("oportunidade_id");
  const propostaId = urlParams.get("proposta_id");

  const [titulo, setTitulo] = useState("");
  const [blocos, setBlocos] = useState([]);
  const [showModalAnexo, setShowModalAnexo] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const tipoProposta = urlParams.get("tipo") || "tecnica";

  // Fetch oportunidade
  const { data: oportunidade } = useQuery({
    queryKey: ["oportunidade", oportunidadeId],
    queryFn: () =>
      oportunidadeId
        ? base44.entities.Oportunidade.list().then((list) =>
            list.find((o) => o.id === oportunidadeId)
          )
        : null,
  });

  // Fetch proposta existente
  const { data: propostaExistente } = useQuery({
    queryKey: ["proposta", propostaId],
    queryFn: () =>
      propostaId
        ? base44.entities.PropostasDoc.list().then((list) =>
            list.find((p) => p.id === propostaId)
          )
        : null,
  });

  // Fetch itens da proposta
  const { data: itens = [] } = useQuery({
    queryKey: ["proposta-itens", propostaId],
    queryFn: () =>
      propostaId
        ? base44.entities.PropostasItens.filter({ proposta_id: propostaId }, "ordem")
        : [],
  });

  // Fetch documentos da biblioteca
  const { data: documentosBiblioteca = {} } = useQuery({
    queryKey: ["biblioteca-compliance"],
    queryFn: async () => {
      const docs = await base44.entities.BibliotecaCompliance.list();
      const map = {};
      if (Array.isArray(docs)) {
        docs.forEach((doc) => {
          map[doc.id] = doc;
        });
      }
      return map;
    },
  });

  // Títulos padrão por tipo
  const getTituloDefault = () => {
    const tipos = {
      habilitacao: "Documentos de Habilitação Técnica",
      tecnica: "Proposta Técnica",
      preco: "Proposta de Preço"
    };
    return tipos[tipoProposta] || tipos.tecnica;
  };

  // Pré-carregar blocos baseado no tipo de proposta
  useEffect(() => {
    if (!propostaExistente && blocos.length === 0 && oportunidade) {
      // Sugerir blocos iniciais baseado no checklist da oportunidade
      const blocosIniciais = [];
      
      if (tipoProposta === "habilitacao" && oportunidade.checklist_proposta) {
        // Para habilitação, sugerir um bloco introdutório
        blocosIniciais.push({
          tipo_bloco: "Texto",
          conteudo_html: "<h2>Documentos de Habilitação Técnica</h2><p>{{CLIENTE}}</p>",
          titulo_bloco: "Introdução - Habilitação",
        });
      } else if (tipoProposta === "tecnica" && oportunidade.checklist_proposta) {
        blocosIniciais.push({
          tipo_bloco: "Texto",
          conteudo_html: "<h2>Proposta Técnica</h2><p>Órgão: {{CLIENTE}}</p><p>Objeto: {{OBJETO}}</p>",
          titulo_bloco: "Capa - Proposta Técnica",
        });
      } else if (tipoProposta === "preco") {
        blocosIniciais.push({
          tipo_bloco: "Texto",
          conteudo_html: "<h2>Proposta de Preço</h2><p>{{CLIENTE}}</p><p>Data: {{DATA}}</p>",
          titulo_bloco: "Capa - Proposta de Preço",
        });
      }
      
      if (blocosIniciais.length > 0) {
        setBlocos(blocosIniciais);
      }
    }
  }, [oportunidade, tipoProposta, propostaExistente, blocos.length]);

  // Inicializar dados existentes
  useEffect(() => {
    if (propostaExistente) {
      setTitulo(propostaExistente.titulo);
    } else if (!titulo) {
      setTitulo(getTituloDefault());
    }
    if (itens.length > 0) {
      setBlocos(itens);
    }
  }, [propostaExistente, itens]);

  // Mutations
  const saveProposta = useMutation({
    mutationFn: async () => {
      let propostaDocId = propostaId;

      if (!propostaId) {
        const novaPropostadoc = await base44.entities.PropostasDoc.create({
          oportunidade_id: oportunidadeId,
          titulo: titulo || "Proposta sem título",
          tipo: tipoProposta,
          status: "rascunho",
        });
        propostaDocId = novaPropostadoc.id;
      } else {
        await base44.entities.PropostasDoc.update(propostaId, {
          titulo,
        });
      }

      // Salvar itens
      for (let i = 0; i < blocos.length; i++) {
        const bloco = blocos[i];
        if (bloco.id) {
          await base44.entities.PropostasItens.update(bloco.id, {
            ordem: i + 1,
          });
        } else {
          await base44.entities.PropostasItens.create({
            proposta_id: propostaDocId,
            ordem: i + 1,
            tipo_bloco: bloco.tipo_bloco,
            conteudo_html: bloco.conteudo_html || null,
            biblioteca_compliance_id: bloco.biblioteca_compliance_id || null,
            titulo_bloco: bloco.titulo_bloco,
          });
        }
      }

      return propostaDocId;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ["proposta", propostaId] });
      queryClient.invalidateQueries({ queryKey: ["proposta-itens", propostaId] });
      toast.success("Proposta salva com sucesso!");

      if (!propostaId) {
        window.location.href = createPageUrl("EditorPropostas") + `?oportunidade_id=${oportunidadeId}&proposta_id=${newId}`;
      }
    },
  });

  const gerarPDF = useMutation({
    mutationFn: async () => {
      setIsGeneratingPDF(true);
      const response = await base44.functions.invoke("gerarPDFProposta", {
        proposta_id: propostaId,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("PDF gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["proposta", propostaId] });
    },
    onError: (error) => {
      toast.error("Erro ao gerar PDF");
      console.error(error);
    },
    onSettled: () => {
      setIsGeneratingPDF(false);
    },
  });

  const addBlocoTexto = () => {
    setBlocos([
      ...blocos,
      {
        tipo_bloco: "Texto",
        conteudo_html: "",
        titulo_bloco: "Novo bloco de texto",
      },
    ]);
  };

  const addBlocoAnexo = (documento) => {
    setBlocos([
      ...blocos,
      {
        tipo_bloco: "Anexo",
        biblioteca_compliance_id: documento.id,
        titulo_bloco: documento.nome_documento,
      },
    ]);
    setShowModalAnexo(false);
  };

  const updateBloco = (index, novoBloco) => {
    const novosBlocos = [...blocos];
    novosBlocos[index] = novoBloco;
    setBlocos(novosBlocos);
  };

  const deleteBloco = (index) => {
    setBlocos(blocos.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Editor de Propostas</h1>
            {oportunidade && (
              <p className="text-slate-500 mt-1">
                {oportunidade.objeto} - {oportunidade.orgao_licitante}
              </p>
            )}
          </div>
        </div>

        {/* Metadados */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Metadados da Proposta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título da Proposta</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Proposta Técnica - Tomada de Preço 04/2026"
              />
            </div>
            {oportunidade && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Cliente</p>
                  <p className="font-medium">{oportunidade.orgao_licitante}</p>
                </div>
                <div>
                  <p className="text-slate-600">Objeto</p>
                  <p className="font-medium">{oportunidade.objeto}</p>
                </div>
                <div>
                  <p className="text-slate-600">Data</p>
                  <p className="font-medium">{new Date().toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tipo de Proposta */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Tipo de Proposta</p>
              <p className="text-lg font-semibold text-blue-900">
                {tipoProposta === "habilitacao" && "Documentos de Habilitação Técnica"}
                {tipoProposta === "tecnica" && "Proposta Técnica"}
                {tipoProposta === "preco" && "Proposta de Preço"}
              </p>
            </div>
            <Badge className="bg-blue-600">{tipoProposta}</Badge>
          </div>
        </div>

        {/* Esteira de Montagem */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Esteira de Montagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blocos.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                Nenhum bloco adicionado. Comece adicionando um bloco de texto ou anexo.
              </p>
            ) : (
              <div className="space-y-3">
                {blocos.map((bloco, index) => (
                  <div key={index}>
                    {bloco.tipo_bloco === "Texto" ? (
                      <BlocoTexto
                        bloco={bloco}
                        onUpdate={(updated) => updateBloco(index, updated)}
                        onDelete={() => deleteBloco(index)}
                      />
                    ) : (
                      <BlocoAnexo
                        bloco={bloco}
                        documento={documentosBiblioteca[bloco.biblioteca_compliance_id]}
                        onDelete={() => deleteBloco(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={addBlocoTexto} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Texto
              </Button>
              <Button
                onClick={() => setShowModalAnexo(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Inserir Arquivo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => saveProposta.mutate()}
            disabled={saveProposta.isPending}
            className="gap-2"
          >
            {saveProposta.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Rascunho
              </>
            )}
          </Button>
          {propostaId && (
            <Button
              onClick={() => gerarPDF.mutate()}
              disabled={isGeneratingPDF}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Gerar PDF Final
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <ModalSelecionarAnexo
        open={showModalAnexo}
        onClose={() => setShowModalAnexo(false)}
        onSelect={addBlocoAnexo}
        empresaId={oportunidade?.empresa_id}
      />
    </div>
  );
}