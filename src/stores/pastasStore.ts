// ============================================================
// VaultCraft - Store de Pastas
// Gerencia arvore de pastas e pasta selecionada
// ============================================================

import { create } from 'zustand';
import type { Pasta } from '@/domain/modelos';
import * as comandos from '@/infra/comandos';

interface PastasState {
  /** Lista de pastas (arvore) */
  pastas: Pasta[];
  /** Pasta atualmente selecionada */
  pastaAtual: Pasta | null;
  /** Indicador de carregamento */
  carregando: boolean;
  /** Mensagem de erro */
  erro: string | null;
  /** IDs de pastas expandidas na arvore */
  pastasExpandidas: Set<string>;

  // Acoes
  carregarPastas: () => Promise<void>;
  selecionarPasta: (pasta: Pasta | null) => void;
  criarPasta: (nome: string, pastaPaiId: string | null) => Promise<Pasta | null>;
  renomearPasta: (id: string, novoNome: string) => Promise<void>;
  moverPasta: (id: string, novaPastaPaiId: string | null) => Promise<void>;
  excluirPasta: (id: string) => Promise<void>;
  alternarExpansao: (pastaId: string) => void;
}

export const usePastasStore = create<PastasState>((set, get) => ({
  pastas: [],
  pastaAtual: null,
  carregando: false,
  erro: null,
  pastasExpandidas: new Set<string>(),

  carregarPastas: async () => {
    set({ carregando: true, erro: null });
    try {
      const pastas = await comandos.listarPastas();
      set({ pastas, carregando: false });
    } catch (erro) {
      set({
        erro: `Erro ao carregar pastas: ${erro}`,
        carregando: false,
      });
    }
  },

  selecionarPasta: (pasta) => set({ pastaAtual: pasta }),

  criarPasta: async (nome, pastaPaiId) => {
    set({ erro: null });
    try {
      const novaPasta = await comandos.criarPasta(nome, pastaPaiId);
      await get().carregarPastas();
      return novaPasta;
    } catch (erro) {
      set({ erro: `Erro ao criar pasta: ${erro}` });
      return null;
    }
  },

  renomearPasta: async (id, novoNome) => {
    set({ erro: null });
    try {
      await comandos.renomearPasta(id, novoNome);
      await get().carregarPastas();
    } catch (erro) {
      set({ erro: `Erro ao renomear pasta: ${erro}` });
    }
  },

  moverPasta: async (id, novaPastaPaiId) => {
    set({ erro: null });
    try {
      await comandos.moverPasta(id, novaPastaPaiId);
      await get().carregarPastas();
    } catch (erro) {
      set({ erro: `Erro ao mover pasta: ${erro}` });
    }
  },

  excluirPasta: async (id) => {
    set({ erro: null });
    try {
      await comandos.excluirPasta(id);
      const { pastaAtual } = get();
      if (pastaAtual?.id === id) {
        set({ pastaAtual: null });
      }
      await get().carregarPastas();
    } catch (erro) {
      set({ erro: `Erro ao excluir pasta: ${erro}` });
    }
  },

  alternarExpansao: (pastaId) =>
    set((estado) => {
      const novasExpandidas = new Set(estado.pastasExpandidas);
      if (novasExpandidas.has(pastaId)) {
        novasExpandidas.delete(pastaId);
      } else {
        novasExpandidas.add(pastaId);
      }
      return { pastasExpandidas: novasExpandidas };
    }),
}));
