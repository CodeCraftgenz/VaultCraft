// ============================================================
// VaultCraft - Store de Vencimentos
// Gerencia lista de itens com vencimento proximo/atrasado
// ============================================================

import { create } from 'zustand';
import type { Item, Vencimento } from '@/domain/modelos';
import * as comandos from '@/infra/comandos';

type PeriodoVencimento = 7 | 30 | 90;

/** Calcula status e dias restantes a partir de um Item */
function calcularVencimento(item: Item): Vencimento {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = item.data_vencimento ? new Date(item.data_vencimento) : hoje;
  dataVenc.setHours(0, 0, 0, 0);
  const diffMs = dataVenc.getTime() - hoje.getTime();
  const dias_restantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: Vencimento['status'];
  if (dias_restantes < 0) status = 'atrasado';
  else if (dias_restantes === 0) status = 'hoje';
  else status = 'proximo';

  return { item, dias_restantes, status };
}

interface VencimentosState {
  /** Lista de vencimentos computados */
  vencimentos: Vencimento[];
  /** Periodo selecionado em dias */
  periodoAtual: PeriodoVencimento;
  /** Indicador de carregamento */
  carregando: boolean;
  /** Mensagem de erro */
  erro: string | null;

  // Acoes
  carregarVencimentos: (periodo?: PeriodoVencimento) => Promise<void>;
  definirPeriodo: (periodo: PeriodoVencimento) => void;
}

export const useVencimentosStore = create<VencimentosState>((set, get) => ({
  vencimentos: [],
  periodoAtual: 30,
  carregando: false,
  erro: null,

  carregarVencimentos: async (periodo) => {
    const dias = periodo ?? get().periodoAtual;
    set({ carregando: true, erro: null, periodoAtual: dias });
    try {
      const itens = await comandos.listarVencimentos(dias);
      const vencimentos = itens.map(calcularVencimento);
      set({ vencimentos, carregando: false });
    } catch (erro) {
      set({
        erro: `Erro ao carregar vencimentos: ${erro}`,
        carregando: false,
      });
    }
  },

  definirPeriodo: (periodo) => set({ periodoAtual: periodo }),
}));
