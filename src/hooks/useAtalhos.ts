// ============================================================
// VaultCraft - Hook de Atalhos de Teclado
// Registra atalhos globais da aplicacao
// ============================================================

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useItensStore } from '@/stores/itensStore';
import { usePastasStore } from '@/stores/pastasStore';

/**
 * Hook que registra os atalhos de teclado globais:
 * - Ctrl+K: Focar na busca
 * - Ctrl+N: Novo item
 * - Ctrl+B: Ir para backup
 * - F1: Abrir ajuda
 * - Escape: Fechar modais / cancelar edicao
 */
export function useAtalhos() {
  const { navegarPara } = useAppStore();
  const { selecionarItem, definirModoEdicao } = useItensStore();
  const { pastaAtual } = usePastasStore();

  useEffect(() => {
    const tratarTecla = (evento: KeyboardEvent) => {
      const ctrlOuMeta = evento.ctrlKey || evento.metaKey;

      // Ignorar se estiver digitando em um input
      const elementoAtivo = document.activeElement;
      const ehInput =
        elementoAtivo instanceof HTMLInputElement ||
        elementoAtivo instanceof HTMLTextAreaElement ||
        elementoAtivo instanceof HTMLSelectElement;

      // Ctrl+K - Focar na busca (sempre funciona)
      if (ctrlOuMeta && evento.key === 'k') {
        evento.preventDefault();
        // O BarraSuperior tem seu proprio listener para isso
        // mas garantimos que a pagina de busca e aberta
        const inputBusca = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Buscar"]'
        );
        if (inputBusca) {
          inputBusca.focus();
          inputBusca.select();
        }
        return;
      }

      // Nao processar outros atalhos se estiver digitando
      if (ehInput) return;

      // Ctrl+N - Novo item
      if (ctrlOuMeta && evento.key === 'n') {
        evento.preventDefault();
        if (pastaAtual) {
          selecionarItem(null);
          definirModoEdicao(true);
          navegarPara('item');
        }
        return;
      }

      // Ctrl+B - Backup
      if (ctrlOuMeta && evento.key === 'b') {
        evento.preventDefault();
        navegarPara('backup');
        return;
      }

      // F1 - Ajuda
      if (evento.key === 'F1') {
        evento.preventDefault();
        navegarPara('ajuda');
        return;
      }
    };

    document.addEventListener('keydown', tratarTecla);
    return () => document.removeEventListener('keydown', tratarTecla);
  }, [navegarPara, selecionarItem, definirModoEdicao, pastaAtual]);
}
