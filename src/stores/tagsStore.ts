// ============================================================
// VaultCraft - Store de Tags
// Gerencia tags disponiveis para categorizacao
// ============================================================

import { create } from 'zustand';
import type { Tag } from '@/domain/modelos';
import * as comandos from '@/infra/comandos';

interface TagsState {
  /** Lista de todas as tags */
  tags: Tag[];
  /** Indicador de carregamento */
  carregando: boolean;
  /** Mensagem de erro */
  erro: string | null;

  // Acoes
  carregarTags: () => Promise<void>;
  criarTag: (nome: string, cor: string) => Promise<Tag | null>;
  atualizarTag: (id: string, nome: string, cor: string) => Promise<void>;
  excluirTag: (id: string) => Promise<void>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  carregando: false,
  erro: null,

  carregarTags: async () => {
    set({ carregando: true, erro: null });
    try {
      const tags = await comandos.listarTags();
      set({ tags, carregando: false });
    } catch (erro) {
      set({
        erro: `Erro ao carregar tags: ${erro}`,
        carregando: false,
      });
    }
  },

  criarTag: async (nome, cor) => {
    set({ erro: null });
    try {
      const novaTag = await comandos.criarTag(nome, cor);
      await get().carregarTags();
      return novaTag;
    } catch (erro) {
      set({ erro: `Erro ao criar tag: ${erro}` });
      return null;
    }
  },

  atualizarTag: async (id, nome, cor) => {
    set({ erro: null });
    try {
      await comandos.atualizarTag(id, nome, cor);
      await get().carregarTags();
    } catch (erro) {
      set({ erro: `Erro ao atualizar tag: ${erro}` });
    }
  },

  excluirTag: async (id) => {
    set({ erro: null });
    try {
      await comandos.excluirTag(id);
      await get().carregarTags();
    } catch (erro) {
      set({ erro: `Erro ao excluir tag: ${erro}` });
    }
  },
}));
