// ============================================================
// VaultCraft - Store de Busca
// Gerencia resultados de busca e filtros
// ============================================================

import { create } from 'zustand';
import type { ResultadoBusca, FiltrosBusca } from '@/domain/modelos';
import * as comandos from '@/infra/comandos';

interface BuscaState {
  /** Resultados da busca */
  resultados: ResultadoBusca[];
  /** Filtros ativos */
  filtros: FiltrosBusca;
  /** Indicador de busca em andamento */
  buscando: boolean;
  /** Mensagem de erro */
  erro: string | null;

  // Acoes
  buscar: (filtros?: Partial<FiltrosBusca>) => Promise<void>;
  limparBusca: () => void;
  definirFiltros: (filtros: Partial<FiltrosBusca>) => void;
}

const filtrosIniciais: FiltrosBusca = {
  termo: '',
  pasta_id: undefined,
  tipo: undefined,
  tags: undefined,
  vencimento: undefined,
  data_inicio: undefined,
  data_fim: undefined,
};

export const useBuscaStore = create<BuscaState>((set, get) => ({
  resultados: [],
  filtros: { ...filtrosIniciais },
  buscando: false,
  erro: null,

  buscar: async (novosFiltros) => {
    const filtrosAtuais = get().filtros;
    const filtrosCombinados = { ...filtrosAtuais, ...novosFiltros };

    if (!filtrosCombinados.termo.trim()) {
      set({ resultados: [], filtros: filtrosCombinados });
      return;
    }

    set({ buscando: true, erro: null, filtros: filtrosCombinados });
    try {
      const resultados = await comandos.buscarItens(filtrosCombinados.termo, {
        tipo: filtrosCombinados.tipo,
        pasta_id: filtrosCombinados.pasta_id,
        tag_ids: filtrosCombinados.tags,
        data_inicio: filtrosCombinados.data_inicio,
        data_fim: filtrosCombinados.data_fim,
      });
      set({ resultados, buscando: false });
    } catch (erro) {
      set({
        erro: `Erro na busca: ${erro}`,
        buscando: false,
      });
    }
  },

  limparBusca: () =>
    set({
      resultados: [],
      filtros: { ...filtrosIniciais },
      buscando: false,
      erro: null,
    }),

  definirFiltros: (novosFiltros) =>
    set((estado) => ({
      filtros: { ...estado.filtros, ...novosFiltros },
    })),
}));
