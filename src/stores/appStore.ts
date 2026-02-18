// ============================================================
// VaultCraft - Store Principal da Aplicacao
// Gerencia estado global: navegacao, tema, carregamento
// ============================================================

import { create } from 'zustand';
import type { Visao, Tema } from '@/domain/modelos';

interface AppState {
  /** Visao/pagina atual */
  visaoAtual: Visao;
  /** Painel lateral aberto ou fechado */
  painelLateral: boolean;
  /** Tema da aplicacao */
  tema: Tema;
  /** Indicador de carregamento global */
  carregando: boolean;
  /** Se eh a primeira execucao (onboarding) */
  primeiraExecucao: boolean;
  /** Modal de onboarding visivel */
  mostrarOnboarding: boolean;
  /** Mensagem de erro global */
  erroGlobal: string | null;

  // Acoes
  navegarPara: (visao: Visao) => void;
  alternarPainelLateral: () => void;
  definirPainelLateral: (aberto: boolean) => void;
  definirTema: (tema: Tema) => void;
  definirCarregando: (carregando: boolean) => void;
  definirPrimeiraExecucao: (primeira: boolean) => void;
  definirMostrarOnboarding: (mostrar: boolean) => void;
  definirErroGlobal: (erro: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  visaoAtual: 'inicio',
  painelLateral: true,
  tema: 'sistema',
  carregando: false,
  primeiraExecucao: false,
  mostrarOnboarding: false,
  erroGlobal: null,

  navegarPara: (visao) => set({ visaoAtual: visao }),

  alternarPainelLateral: () =>
    set((estado) => ({ painelLateral: !estado.painelLateral })),

  definirPainelLateral: (aberto) => set({ painelLateral: aberto }),

  definirTema: (tema) => set({ tema }),

  definirCarregando: (carregando) => set({ carregando }),

  definirPrimeiraExecucao: (primeira) => set({ primeiraExecucao: primeira }),

  definirMostrarOnboarding: (mostrar) => set({ mostrarOnboarding: mostrar }),

  definirErroGlobal: (erro) => set({ erroGlobal: erro }),
}));
