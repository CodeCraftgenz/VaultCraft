// ============================================================
// VaultCraft - Pagina de Busca (TELA-04)
// Resultados de busca com filtros e destaque de termos
// ============================================================

import React, { useEffect } from 'react';
import {
  Search,
  FileText,
  File,
  CheckSquare,
  Clock,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBuscaStore } from '@/stores/buscaStore';
import { useItensStore } from '@/stores/itensStore';
import { useTagsStore } from '@/stores/tagsStore';
import { Badge } from '@/components/ui/Badge';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import type { TipoItem, Item, ResultadoBusca } from '@/domain/modelos';

// ========================
// Icones por tipo
// ========================

const iconesTipo: Record<TipoItem, React.ReactNode> = {
  nota: <FileText size={18} className="text-cofre-500" />,
  documento: <File size={18} className="text-dourado-500" />,
  checklist: <CheckSquare size={18} className="text-green-500" />,
};

// ========================
// Destaque de termo no texto
// ========================

const DestacarTermo: React.FC<{ texto: string; termo: string }> = ({
  texto,
  termo,
}) => {
  if (!termo.trim()) return <>{texto}</>;

  const partes = texto.split(new RegExp(`(${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {partes.map((parte, indice) =>
        parte.toLowerCase() === termo.toLowerCase() ? (
          <mark
            key={indice}
            className="bg-dourado-200 dark:bg-dourado-800 text-dourado-900 dark:text-dourado-100 rounded px-0.5"
          >
            {parte}
          </mark>
        ) : (
          <React.Fragment key={indice}>{parte}</React.Fragment>
        )
      )}
    </>
  );
};

// ========================
// Card de resultado
// ========================

interface CardResultadoProps {
  resultado: ResultadoBusca;
  termoBusca: string;
  aoClicar: (item: Item) => void;
}

const CardResultado: React.FC<CardResultadoProps> = ({
  resultado,
  termoBusca,
  aoClicar,
}) => {
  const { item, relevancia } = resultado;

  const formatarData = (dataStr: string) => {
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <button
      onClick={() => aoClicar(item)}
      className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-cofre-300 dark:hover:border-cofre-700 hover:shadow-sm bg-white dark:bg-gray-900 transition-all duration-150"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{iconesTipo[item.tipo]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              <DestacarTermo texto={item.titulo} termo={termoBusca} />
            </h3>
            <Badge variante="padrao" tamanho="pequeno">
              {Math.round(relevancia * 100)}%
            </Badge>
          </div>

          {item.descricao && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              <DestacarTermo texto={item.descricao} termo={termoBusca} />
            </p>
          )}

          <div className="flex items-center gap-3">
            {item.tags.length > 0 && (
              <div className="flex items-center gap-1">
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
              </div>
            )}
            {item.data_vencimento && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={12} />
                {formatarData(item.data_vencimento)}
              </div>
            )}
            <span className="text-xs text-gray-400">
              {formatarData(item.criado_em)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

// ========================
// Pagina de Busca
// ========================

export const PaginaBusca: React.FC = () => {
  const { navegarPara } = useAppStore();
  const { resultados, filtros, buscando, definirFiltros, buscar } = useBuscaStore();
  const { selecionarItem, definirModoEdicao } = useItensStore();
  const { tags, carregarTags } = useTagsStore();

  useEffect(() => {
    carregarTags();
  }, [carregarTags]);

  const tratarClicarItem = (item: Item) => {
    selecionarItem(item);
    definirModoEdicao(false);
    navegarPara('item');
  };

  const tratarFiltroTipo = (tipo: TipoItem | undefined) => {
    const novoTipo = filtros.tipo === tipo ? undefined : tipo;
    definirFiltros({ tipo: novoTipo });
    buscar({ tipo: novoTipo });
  };

  const tratarFiltroVencimento = (vencimento: 'proximo' | 'atrasado' | undefined) => {
    const novoVencimento = filtros.vencimento === vencimento ? undefined : vencimento;
    definirFiltros({ vencimento: novoVencimento });
    buscar({ vencimento: novoVencimento });
  };

  return (
    <div className="flex h-full">
      {/* Painel de filtros */}
      <aside className="hidden md:block w-56 border-r border-gray-200 dark:border-gray-800 p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <SlidersHorizontal size={12} />
            Filtros
          </h3>

          {/* Filtro por tipo */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tipo
            </p>
            {(['nota', 'documento', 'checklist'] as TipoItem[]).map((tipo) => (
              <button
                key={tipo}
                onClick={() => tratarFiltroTipo(tipo)}
                className={`
                  w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium
                  transition-colors
                  ${
                    filtros.tipo === tipo
                      ? 'bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                {iconesTipo[tipo]}
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro por vencimento */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Vencimento
          </p>
          <div className="space-y-1">
            <button
              onClick={() => tratarFiltroVencimento('proximo')}
              className={`
                w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                ${
                  filtros.vencimento === 'proximo'
                    ? 'bg-dourado-50 text-dourado-700 dark:bg-dourado-950/50 dark:text-dourado-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              Proximo do vencimento
            </button>
            <button
              onClick={() => tratarFiltroVencimento('atrasado')}
              className={`
                w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors
                ${
                  filtros.vencimento === 'atrasado'
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              Atrasado
            </button>
          </div>
        </div>

        {/* Filtro por tags */}
        {tags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => {
                const selecionada = filtros.tags?.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      const novasTags = selecionada
                        ? filtros.tags?.filter((id) => id !== tag.id)
                        : [...(filtros.tags ?? []), tag.id];
                      definirFiltros({ tags: novasTags });
                      buscar({ tags: novasTags });
                    }}
                    className={selecionada ? 'ring-2 ring-cofre-400 rounded-full' : 'opacity-60 hover:opacity-100'}
                  >
                    <Badge variante="personalizado" cor={tag.cor} tamanho="pequeno">
                      {tag.nome}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Cabecalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Resultados da busca
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {buscando
                ? 'Buscando...'
                : `${resultados.length} ${resultados.length === 1 ? 'resultado encontrado' : 'resultados encontrados'} para "${filtros.termo}"`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowUpDown size={14} />
              Relevancia
            </button>
          </div>
        </div>

        {/* Lista de resultados */}
        {buscando ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cofre-500 border-t-transparent" />
          </div>
        ) : resultados.length === 0 ? (
          <EstadoVazio
            icone={<Search size={32} />}
            titulo="Nenhum resultado encontrado"
            descricao={`Nao encontramos nada para "${filtros.termo}". Tente usar termos diferentes ou ajustar os filtros.`}
          />
        ) : (
          <div className="space-y-3">
            {resultados.map((resultado) => (
              <CardResultado
                key={resultado.item.id}
                resultado={resultado}
                termoBusca={filtros.termo}
                aoClicar={tratarClicarItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
