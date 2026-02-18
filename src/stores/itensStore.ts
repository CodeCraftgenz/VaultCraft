// ============================================================
// VaultCraft - Store de Itens
// Gerencia itens da pasta atual e item selecionado
// ============================================================

import { create } from 'zustand';
import type { Item, CriarItemPayload, AtualizarItemPayload } from '@/domain/modelos';
import * as comandos from '@/infra/comandos';

interface ItensState {
  /** Lista de itens da pasta atual */
  itens: Item[];
  /** Item selecionado para visualizacao/edicao */
  itemSelecionado: Item | null;
  /** Indicador de carregamento */
  carregando: boolean;
  /** Indicador de salvando */
  salvando: boolean;
  /** Mensagem de erro */
  erro: string | null;
  /** Modo de edicao ativo */
  modoEdicao: boolean;

  // Acoes
  carregarItens: (pastaId: string) => Promise<void>;
  selecionarItem: (item: Item | null) => void;
  criarItem: (payload: CriarItemPayload) => Promise<Item | null>;
  atualizarItem: (payload: AtualizarItemPayload) => Promise<Item | null>;
  excluirItem: (id: string) => Promise<void>;
  obterItem: (id: string) => Promise<Item | null>;
  definirModoEdicao: (modo: boolean) => void;
  limparSelecao: () => void;
}

export const useItensStore = create<ItensState>((set, get) => ({
  itens: [],
  itemSelecionado: null,
  carregando: false,
  salvando: false,
  erro: null,
  modoEdicao: false,

  carregarItens: async (pastaId) => {
    set({ carregando: true, erro: null });
    try {
      const itens = await comandos.listarItens(pastaId);
      set({ itens, carregando: false });
    } catch (erro) {
      set({
        erro: `Erro ao carregar itens: ${erro}`,
        carregando: false,
      });
    }
  },

  selecionarItem: (item) => set({ itemSelecionado: item, modoEdicao: false }),

  criarItem: async (payload) => {
    set({ salvando: true, erro: null });
    try {
      const novoItem = await comandos.criarItem({
        pasta_id: payload.pasta_id,
        tipo: payload.tipo,
        titulo: payload.titulo,
        descricao: payload.descricao,
        conteudo_nota: payload.conteudo_nota,
        data_vencimento: payload.data_vencimento,
        tag_ids: payload.tags,
      });
      // Recarrega a lista de itens
      await get().carregarItens(payload.pasta_id);
      set({ salvando: false, itemSelecionado: novoItem });
      return novoItem;
    } catch (erro) {
      set({ erro: `Erro ao criar item: ${erro}`, salvando: false });
      return null;
    }
  },

  atualizarItem: async (payload) => {
    set({ salvando: true, erro: null });
    try {
      const { id, tags: tagIds, ...resto } = payload;
      const itemAtualizado = await comandos.atualizarItem(id, {
        ...resto,
        tag_ids: tagIds,
      });
      set((estado) => ({
        itens: estado.itens.map((i) => (i.id === id ? itemAtualizado : i)),
        itemSelecionado: estado.itemSelecionado?.id === id
          ? itemAtualizado
          : estado.itemSelecionado,
        salvando: false,
      }));
      return itemAtualizado;
    } catch (erro) {
      set({ erro: `Erro ao atualizar item: ${erro}`, salvando: false });
      return null;
    }
  },

  excluirItem: async (id) => {
    set({ erro: null });
    try {
      await comandos.excluirItem(id);
      set((estado) => ({
        itens: estado.itens.filter((i) => i.id !== id),
        itemSelecionado: estado.itemSelecionado?.id === id
          ? null
          : estado.itemSelecionado,
      }));
    } catch (erro) {
      set({ erro: `Erro ao excluir item: ${erro}` });
    }
  },

  obterItem: async (id) => {
    try {
      const item = await comandos.obterItem(id);
      return item;
    } catch (erro) {
      set({ erro: `Erro ao obter item: ${erro}` });
      return null;
    }
  },

  definirModoEdicao: (modo) => set({ modoEdicao: modo }),

  limparSelecao: () => set({ itemSelecionado: null, modoEdicao: false }),
}));
