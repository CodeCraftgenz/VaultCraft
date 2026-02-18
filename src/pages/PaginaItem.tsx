// ============================================================
// VaultCraft - Pagina de Item (TELA-02 + TELA-03)
// Visualizacao e edicao de itens (nota, documento, checklist)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Edit3,
  Trash2,
  FileText,
  File,
  CheckSquare,
  Plus,
  Paperclip,
  X,
  Calendar,
  GripVertical,
  Square,
  CheckSquare as CheckSquareFilled,
  Download,
} from 'lucide-react';
import { open as abrirDialogoArquivo } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '@/stores/appStore';
import { useItensStore } from '@/stores/itensStore';
import { usePastasStore } from '@/stores/pastasStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useToast } from '@/components/ui/Toast';
import { Botao } from '@/components/ui/Botao';
import { Campo, AreaTexto } from '@/components/ui/Campo';
import { Badge } from '@/components/ui/Badge';
import { DialogoConfirmacao } from '@/components/ui/Dialogo';
import * as comandos from '@/infra/comandos';
import type { TipoItem, TarefaChecklist } from '@/domain/modelos';

// ========================
// Icones por tipo
// ========================

const iconesTipo: Record<TipoItem, React.ReactNode> = {
  nota: <FileText size={20} className="text-cofre-500" />,
  documento: <File size={20} className="text-dourado-500" />,
  checklist: <CheckSquare size={20} className="text-green-500" />,
};

// ========================
// Editor de Checklist
// ========================

interface EditorChecklistProps {
  itemId: string;
  somenteLeitura: boolean;
}

const EditorChecklist: React.FC<EditorChecklistProps> = ({ itemId, somenteLeitura }) => {
  const [tarefas, setTarefas] = useState<TarefaChecklist[]>([]);
  const [novaTarefa, setNovaTarefa] = useState('');
  const [carregando, setCarregando] = useState(false);
  const toast = useToast();

  const carregarTarefas = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await comandos.listarTarefas(itemId);
      setTarefas(lista);
    } catch (erro) {
      toast.erro('Erro ao carregar tarefas', String(erro));
    } finally {
      setCarregando(false);
    }
  }, [itemId, toast]);

  useEffect(() => {
    carregarTarefas();
  }, [carregarTarefas]);

  const adicionarTarefa = async () => {
    if (!novaTarefa.trim()) return;
    try {
      await comandos.criarTarefa(itemId, novaTarefa.trim(), tarefas.length);
      setNovaTarefa('');
      await carregarTarefas();
    } catch (erro) {
      toast.erro('Erro ao criar tarefa', String(erro));
    }
  };

  const alternarConclusao = async (tarefa: TarefaChecklist) => {
    try {
      await comandos.marcarTarefa(tarefa.id, !tarefa.concluida);
      await carregarTarefas();
    } catch (erro) {
      toast.erro('Erro ao atualizar tarefa', String(erro));
    }
  };

  const excluirTarefa = async (id: string) => {
    try {
      await comandos.excluirTarefa(id);
      await carregarTarefas();
    } catch (erro) {
      toast.erro('Erro ao excluir tarefa', String(erro));
    }
  };

  const totalConcluidas = tarefas.filter((t) => t.concluida).length;
  const porcentagem = tarefas.length > 0 ? Math.round((totalConcluidas / tarefas.length) * 100) : 0;

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-cofre-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progresso */}
      {tarefas.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${porcentagem}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {totalConcluidas}/{tarefas.length} ({porcentagem}%)
          </span>
        </div>
      )}

      {/* Lista de tarefas */}
      <div className="space-y-1">
        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-lg group
              ${tarefa.concluida ? 'opacity-60' : ''}
              hover:bg-gray-50 dark:hover:bg-gray-800/50
            `}
          >
            {!somenteLeitura && (
              <GripVertical size={14} className="text-gray-300 dark:text-gray-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <button
              onClick={() => alternarConclusao(tarefa)}
              disabled={somenteLeitura}
              className="flex-shrink-0"
            >
              {tarefa.concluida ? (
                <CheckSquareFilled size={18} className="text-green-500" />
              ) : (
                <Square size={18} className="text-gray-400 dark:text-gray-500" />
              )}
            </button>
            <span
              className={`flex-1 text-sm ${
                tarefa.concluida
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {tarefa.titulo}
            </span>
            {!somenteLeitura && (
              <button
                onClick={() => excluirTarefa(tarefa.id)}
                className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar tarefa */}
      {!somenteLeitura && (
        <div className="flex items-center gap-2">
          <input
            value={novaTarefa}
            onChange={(e) => setNovaTarefa(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') adicionarTarefa();
            }}
            placeholder="Nova tarefa..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cofre-500"
          />
          <Botao
            variante="fantasma"
            tamanho="pequeno"
            icone={<Plus size={14} />}
            onClick={adicionarTarefa}
            disabled={!novaTarefa.trim()}
          >
            Adicionar
          </Botao>
        </div>
      )}
    </div>
  );
};

// ========================
// Pagina de Item
// ========================

export const PaginaItem: React.FC = () => {
  const { navegarPara } = useAppStore();
  const { pastaAtual } = usePastasStore();
  const {
    itemSelecionado,
    modoEdicao,
    salvando,
    criarItem,
    atualizarItem,
    excluirItem,
    definirModoEdicao,
    selecionarItem,
  } = useItensStore();
  const { tags, carregarTags } = useTagsStore();
  const toast = useToast();

  // Estado do formulario
  const [tipo, setTipo] = useState<TipoItem>('nota');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [conteudoNota, setConteudoNota] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const ehNovo = !itemSelecionado;

  // Carregar tags ao montar
  useEffect(() => {
    carregarTags();
  }, [carregarTags]);

  // Preencher formulario com dados do item
  useEffect(() => {
    if (itemSelecionado) {
      setTipo(itemSelecionado.tipo);
      setTitulo(itemSelecionado.titulo);
      setDescricao(itemSelecionado.descricao);
      setConteudoNota(itemSelecionado.conteudo_nota ?? '');
      setDataVencimento(itemSelecionado.data_vencimento ?? '');
      setTagsSelecionadas(itemSelecionado.tags.map((t) => t.id));
    } else {
      // Novo item
      setTipo('nota');
      setTitulo('');
      setDescricao('');
      setConteudoNota('');
      setDataVencimento('');
      setTagsSelecionadas([]);
    }
  }, [itemSelecionado]);

  const tratarSalvar = async () => {
    if (!titulo.trim()) {
      toast.aviso('Titulo obrigatorio', 'Informe um titulo para o item.');
      return;
    }

    if (ehNovo) {
      if (!pastaAtual) {
        toast.erro('Erro', 'Selecione uma pasta primeiro.');
        return;
      }
      const novoItem = await criarItem({
        pasta_id: pastaAtual.id,
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        conteudo_nota: tipo === 'nota' ? conteudoNota : undefined,
        data_vencimento: dataVencimento || undefined,
        tags: tagsSelecionadas,
      });
      if (novoItem) {
        toast.sucesso('Item criado', `"${novoItem.titulo}" foi criado com sucesso.`);
        definirModoEdicao(false);
      }
    } else {
      const itemAtualizado = await atualizarItem({
        id: itemSelecionado!.id,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        conteudo_nota: tipo === 'nota' ? conteudoNota : undefined,
        data_vencimento: dataVencimento || null,
        tags: tagsSelecionadas,
      });
      if (itemAtualizado) {
        toast.sucesso('Item salvo', 'Alteracoes salvas com sucesso.');
        definirModoEdicao(false);
      }
    }
  };

  const tratarExcluir = async () => {
    if (itemSelecionado) {
      await excluirItem(itemSelecionado.id);
      toast.sucesso('Item excluido', `"${itemSelecionado.titulo}" foi removido.`);
      selecionarItem(null);
      navegarPara('inicio');
    }
    setConfirmarExclusao(false);
  };

  const tratarAdicionarAnexo = async () => {
    if (!itemSelecionado) return;
    try {
      const caminhoArquivo = await abrirDialogoArquivo({
        multiple: false,
        title: 'Selecionar arquivo',
      });
      if (caminhoArquivo) {
        await comandos.adicionarAnexo(caminhoArquivo as string, itemSelecionado.id);
        toast.sucesso('Anexo adicionado', 'Arquivo anexado com sucesso.');
      }
    } catch (erro) {
      toast.erro('Erro ao anexar', String(erro));
    }
  };

  const tratarExportarPdf = async () => {
    if (!itemSelecionado) return;
    try {
      const destino = await abrirDialogoArquivo({
        directory: true,
        title: 'Selecionar pasta para salvar o PDF',
      });
      if (!destino) return;
      const caminho = await comandos.exportarItemPdf(itemSelecionado.id, destino as string);
      toast.sucesso('PDF exportado', `Salvo em: ${caminho}`);
    } catch (erro) {
      toast.erro('Erro ao exportar', String(erro));
    }
  };

  const alternarTag = (tagId: string) => {
    setTagsSelecionadas((anteriores) =>
      anteriores.includes(tagId)
        ? anteriores.filter((id) => id !== tagId)
        : [...anteriores, tagId]
    );
  };

  const somenteLeitura = !modoEdicao;

  return (
    <div className="flex flex-col h-full">
      {/* Barra de acoes */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navegarPara('inicio')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {iconesTipo[tipo]}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {ehNovo ? 'Novo item' : somenteLeitura ? 'Visualizando' : 'Editando'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!ehNovo && somenteLeitura && (
            <>
              <Botao
                variante="fantasma"
                tamanho="pequeno"
                icone={<Download size={16} />}
                onClick={tratarExportarPdf}
              >
                Exportar PDF
              </Botao>
              <Botao
                variante="fantasma"
                tamanho="pequeno"
                icone={<Paperclip size={16} />}
                onClick={tratarAdicionarAnexo}
              >
                Anexar
              </Botao>
              <Botao
                variante="secundario"
                tamanho="pequeno"
                icone={<Edit3 size={16} />}
                onClick={() => definirModoEdicao(true)}
              >
                Editar
              </Botao>
              <Botao
                variante="perigo"
                tamanho="pequeno"
                icone={<Trash2 size={16} />}
                onClick={() => setConfirmarExclusao(true)}
              >
                Excluir
              </Botao>
            </>
          )}
          {modoEdicao && (
            <>
              <Botao
                variante="fantasma"
                tamanho="pequeno"
                onClick={() => {
                  if (ehNovo) {
                    navegarPara('inicio');
                  } else {
                    definirModoEdicao(false);
                  }
                }}
              >
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="pequeno"
                icone={<Save size={16} />}
                onClick={tratarSalvar}
                carregando={salvando}
              >
                {ehNovo ? 'Criar' : 'Salvar'}
              </Botao>
            </>
          )}
        </div>
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {/* Seletor de tipo (somente para novo item) */}
          {ehNovo && modoEdicao && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo do item
              </label>
              <div className="flex gap-2">
                {(['nota', 'documento', 'checklist'] as TipoItem[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipo(t)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium
                      transition-colors duration-150
                      ${
                        tipo === t
                          ? 'border-cofre-500 bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400 dark:border-cofre-600'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {iconesTipo[t]}
                    {t === 'nota' ? 'Nota' : t === 'documento' ? 'Documento' : 'Checklist'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Titulo */}
          {modoEdicao ? (
            <Campo
              rotulo="Titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Digite o titulo do item..."
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {titulo}
            </h1>
          )}

          {/* Descricao */}
          {modoEdicao ? (
            <Campo
              rotulo="Descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descricao (opcional)..."
            />
          ) : descricao ? (
            <p className="text-gray-600 dark:text-gray-400">{descricao}</p>
          ) : null}

          {/* Data de vencimento */}
          {modoEdicao ? (
            <Campo
              rotulo="Data de vencimento"
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              icone={<Calendar size={16} />}
            />
          ) : dataVencimento ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>
                Vence em:{' '}
                {new Date(dataVencimento).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          ) : null}

          {/* Tags */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selecionada = tagsSelecionadas.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => modoEdicao && alternarTag(tag.id)}
                    disabled={!modoEdicao}
                    className={`
                      transition-all duration-150
                      ${modoEdicao ? 'cursor-pointer' : 'cursor-default'}
                      ${selecionada ? 'ring-2 ring-cofre-400 ring-offset-1 dark:ring-offset-gray-950' : 'opacity-50'}
                    `}
                  >
                    <Badge variante="personalizado" cor={tag.cor} tamanho="medio">
                      {tag.nome}
                    </Badge>
                  </button>
                );
              })}
              {tags.length === 0 && (
                <p className="text-xs text-gray-400">Nenhuma tag disponivel.</p>
              )}
            </div>
          </div>

          {/* Conteudo especifico por tipo */}
          {tipo === 'nota' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conteudo
              </label>
              {modoEdicao ? (
                <AreaTexto
                  value={conteudoNota}
                  onChange={(e) => setConteudoNota(e.target.value)}
                  placeholder="Escreva sua nota aqui... (suporta Markdown)"
                  className="min-h-[300px] font-mono text-sm"
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[200px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                    {conteudoNota || 'Sem conteudo.'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tipo === 'checklist' && itemSelecionado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarefas
              </label>
              <EditorChecklist
                itemId={itemSelecionado.id}
                somenteLeitura={somenteLeitura}
              />
            </div>
          )}

          {tipo === 'checklist' && ehNovo && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                As tarefas do checklist podem ser adicionadas apos criar o item.
              </p>
            </div>
          )}

          {/* Anexos */}
          {itemSelecionado && itemSelecionado.anexos.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Anexos ({itemSelecionado.anexos.length})
              </p>
              <div className="space-y-2">
                {itemSelecionado.anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                  >
                    <Paperclip size={16} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {anexo.nome_original}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(anexo.tamanho / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => comandos.abrirAnexo(anexo.id)}
                      className="text-xs text-cofre-600 hover:text-cofre-700 dark:text-cofre-400 dark:hover:text-cofre-300 font-medium"
                    >
                      Abrir
                    </button>
                    {modoEdicao && (
                      <button
                        onClick={() => comandos.removerAnexo(anexo.id)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogo de confirmacao de exclusao */}
      <DialogoConfirmacao
        aberto={confirmarExclusao}
        aoFechar={() => setConfirmarExclusao(false)}
        aoConfirmar={tratarExcluir}
        titulo="Excluir item"
        mensagem={`Tem certeza que deseja excluir "${itemSelecionado?.titulo}"? Esta acao nao pode ser desfeita.`}
        textoBotaoConfirmar="Excluir"
        variante="perigo"
      />
    </div>
  );
};
