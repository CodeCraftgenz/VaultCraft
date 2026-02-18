// ============================================================
// VaultCraft - Store de Configuracoes
// Gerencia preferencias e configuracoes do usuario
// ============================================================

import { create } from 'zustand';
import * as comandos from '@/infra/comandos';

interface ConfiguracoesState {
  /** Todas as configuracoes carregadas */
  configuracoes: Record<string, string>;
  /** Indicador de carregamento */
  carregando: boolean;
  /** Indicador de salvando */
  salvando: boolean;
  /** Mensagem de erro */
  erro: string | null;

  // Acoes
  carregarConfiguracoes: () => Promise<void>;
  salvarConfiguracao: (chave: string, valor: string) => Promise<void>;
  obterConfiguracao: (chave: string) => string | undefined;
}

export const useConfiguracoesStore = create<ConfiguracoesState>((set, get) => ({
  configuracoes: {},
  carregando: false,
  salvando: false,
  erro: null,

  carregarConfiguracoes: async () => {
    set({ carregando: true, erro: null });
    try {
      const lista = await comandos.obterTodasConfiguracoes();
      const configuracoes: Record<string, string> = {};
      for (const config of lista) {
        if (config.valor !== null) {
          configuracoes[config.chave] = config.valor;
        }
      }
      set({ configuracoes, carregando: false });
    } catch (erro) {
      set({
        erro: `Erro ao carregar configuracoes: ${erro}`,
        carregando: false,
      });
    }
  },

  salvarConfiguracao: async (chave, valor) => {
    set({ salvando: true, erro: null });
    try {
      await comandos.salvarConfiguracao(chave, valor);
      set((estado) => ({
        configuracoes: { ...estado.configuracoes, [chave]: valor },
        salvando: false,
      }));
    } catch (erro) {
      set({
        erro: `Erro ao salvar configuracao: ${erro}`,
        salvando: false,
      });
    }
  },

  obterConfiguracao: (chave) => get().configuracoes[chave],
}));
