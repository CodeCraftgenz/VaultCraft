// ============================================================
// VaultCraft - Pagina Inicial (TELA-01)
// Lista de itens da pasta selecionada com painel de detalhes
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  FileText,
  File,
  CheckSquare,
  Plus,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  Eye,
  FolderOpen,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useItensStore } from '@/stores/itensStore';
import { usePastasStore } from '@/stores/pastasStore';
import { Botao } from '@/components/ui/Botao';
import { Badge } from '@/components/ui/Badge';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import { DialogoConfirmacao } from '@/components/ui/Dialogo';
import type { Item, TipoItem } from '@/domain/modelos';

// ========================
// Icone por tipo de item
// ========================

const iconesTipo: Record<TipoItem, React.ReactNode> = {
  nota: <FileText size={18} className="text-cofre-500" />,
  documento: <File size={18} className="text-dourado-500" />,
  checklist: <CheckSquare size={18} className="text-green-500" />,
};

const rotulosTipo: Record<TipoItem, string> = {
  nota: 'Nota',
  documento: 'Documento',
  checklist: 'Checklist',
};

// ========================
// Componente de linha de item
// ========================

interface LinhaItemProps {
  item: Item;
  selecionado: boolean;
  aoSelecionar: (item: Item) => void;
  aoExcluir: (item: Item) => void;
  aoEditar: (item: Item) => void;
}

const LinhaItem: React.FC<LinhaItemProps> = ({
  item,
  selecionado,
  aoSelecionar,
  aoExcluir,
  aoEditar,
}) => {
  const [menuAberto, setMenuAberto] = useState(false);

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dataStr;
    }
  };

  const vencimentoProximo = item.data_vencimento
    ? new Date(item.data_vencimento) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  const vencimentoAtrasado = item.data_vencimento
    ? new Date(item.data_vencimento) < new Date()
    : false;

  return (
    <div
      onClick={() => aoSelecionar(item)}
      className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer
        border-b border-gray-100 dark:border-gray-800
        transition-colors duration-100
        ${
          selecionado
            ? 'bg-cofre-50 dark:bg-cofre-950/30 border-l-2 border-l-cofre-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-900/50 border-l-2 border-l-transparent'
        }
      `}
    >
      {/* Icone do tipo */}
      <div className="flex-shrink-0">{iconesTipo[item.tipo]}</div>

      {/* Conteudo principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {item.titulo}
          </h3>
          {item.tags.length > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variante="personalizado"
                  cor={tag.cor}
                  tamanho="pequeno"
                >
                  {tag.nome}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variante="padrao" tamanho="pequeno">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
        {item.descricao && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.descricao}
          </p>
        )}
      </div>

      {/* Vencimento */}
      {item.data_vencimento && (
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <Clock size={14} className={vencimentoAtrasado ? 'text-red-500' : vencimentoProximo ? 'text-dourado-500' : 'text-gray-400'} />
          <span
            className={`text-xs ${
              vencimentoAtrasado
                ? 'text-red-600 dark:text-red-400 font-medium'
                : vencimentoProximo
                ? 'text-dourado-600 dark:text-dourado-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {formatarData(item.data_vencimento)}
          </span>
        </div>
      )}

      {/* Data de criacao */}
      <span className="hidden lg:block text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
        {formatarData(item.criado_em)}
      </span>

      {/* Menu de acoes */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuAberto(!menuAberto);
          }}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <MoreVertical size={16} />
        </button>
        {menuAberto && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuAberto(false)}
            />
            <div className="absolute right-0 top-8 z-20 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(false);
                  aoSelecionar(item);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Eye size={14} />
                Visualizar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(false);
                  aoEditar(item);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Edit3 size={14} />
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(false);
                  aoExcluir(item);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ========================
// Painel de Detalhes Rapido
// ========================

interface PainelDetalhesProps {
  item: Item;
}

const PainelDetalhes: React.FC<PainelDetalhesProps> = ({ item }) => {
  const { navegarPara } = useAppStore();
  const { definirModoEdicao } = useItensStore();

  const formatarDataCompleta = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          {iconesTipo[item.tipo]}
          <Badge variante="info" tamanho="pequeno">
            {rotulosTipo[item.tipo]}
          </Badge>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {item.titulo}
        </h3>
        {item.descricao && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {item.descricao}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variante="personalizado"
                  cor={tag.cor}
                  tamanho="medio"
                >
                  {tag.nome}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vencimento */}
        {item.data_vencimento && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Vencimento
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {formatarDataCompleta(item.data_vencimento)}
            </p>
          </div>
        )}

        {/* Anexos */}
        {item.anexos.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Anexos ({item.anexos.length})
            </p>
            <div className="space-y-1">
              {item.anexos.map((anexo) => (
                <div
                  key={anexo.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded bg-white dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400"
                >
                  <File size={12} />
                  <span className="truncate">{anexo.nome_original}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Datas */}
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400">Criado em</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {formatarDataCompleta(item.criado_em)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Atualizado em</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {formatarDataCompleta(item.atualizado_em)}
            </p>
          </div>
        </div>
      </div>

      {/* Acoes */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Botao
          variante="primario"
          tamanho="medio"
          larguraTotal
          icone={<Eye size={16} />}
          onClick={() => navegarPara('item')}
        >
          Abrir item
        </Botao>
        <Botao
          variante="secundario"
          tamanho="medio"
          larguraTotal
          icone={<Edit3 size={16} />}
          onClick={() => {
            definirModoEdicao(true);
            navegarPara('item');
          }}
        >
          Editar
        </Botao>
      </div>
    </div>
  );
};

// ========================
// Pagina Inicial
// ========================

export const PaginaInicial: React.FC = () => {
  const { navegarPara } = useAppStore();
  const { pastaAtual } = usePastasStore();
  const {
    itens,
    itemSelecionado,
    carregando,
    carregarItens,
    selecionarItem,
    excluirItem,
    definirModoEdicao,
  } = useItensStore();

  const [itemParaExcluir, setItemParaExcluir] = useState<Item | null>(null);

  useEffect(() => {
    if (pastaAtual) {
      carregarItens(pastaAtual.id);
    }
  }, [pastaAtual, carregarItens]);

  const tratarExcluir = async () => {
    if (itemParaExcluir) {
      await excluirItem(itemParaExcluir.id);
      setItemParaExcluir(null);
    }
  };

  const tratarEditar = (item: Item) => {
    selecionarItem(item);
    definirModoEdicao(true);
    navegarPara('item');
  };

  // Sem pasta selecionada
  if (!pastaAtual) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EstadoVazio
          icone={<FolderOpen size={32} />}
          titulo="Selecione uma pasta"
          descricao="Escolha uma pasta no painel lateral para ver seus itens, ou crie uma nova pasta para comecar."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Lista de itens */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecalho */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {pastaAtual.nome}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {itens.length} {itens.length === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <Botao
            variante="primario"
            tamanho="medio"
            icone={<Plus size={16} />}
            onClick={() => {
              selecionarItem(null);
              definirModoEdicao(true);
              navegarPara('item');
            }}
          >
            Novo item
          </Botao>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cofre-500 border-t-transparent" />
            </div>
          ) : itens.length === 0 ? (
            <EstadoVazio
              icone={<FileText size={32} />}
              titulo="Pasta vazia"
              descricao="Esta pasta ainda nao tem nenhum item. Crie uma nota, documento ou checklist para comecar."
              textoAcao="Criar primeiro item"
              iconeAcao={<Plus size={16} />}
              aoClicar={() => {
                selecionarItem(null);
                definirModoEdicao(true);
                navegarPara('item');
              }}
            />
          ) : (
            itens.map((item) => (
              <LinhaItem
                key={item.id}
                item={item}
                selecionado={itemSelecionado?.id === item.id}
                aoSelecionar={selecionarItem}
                aoExcluir={setItemParaExcluir}
                aoEditar={tratarEditar}
              />
            ))
          )}
        </div>
      </div>

      {/* Painel de detalhes */}
      {itemSelecionado && (
        <div className="hidden lg:block">
          <PainelDetalhes item={itemSelecionado} />
        </div>
      )}

      {/* Dialogo de confirmacao de exclusao */}
      <DialogoConfirmacao
        aberto={!!itemParaExcluir}
        aoFechar={() => setItemParaExcluir(null)}
        aoConfirmar={tratarExcluir}
        titulo="Excluir item"
        mensagem={`Tem certeza que deseja excluir "${itemParaExcluir?.titulo}"? Esta acao nao pode ser desfeita.`}
        textoBotaoConfirmar="Excluir"
        variante="perigo"
      />
    </div>
  );
};
