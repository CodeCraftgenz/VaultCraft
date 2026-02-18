// ============================================================
// VaultCraft - Hook de Tema
// Aplica classe dark/light no documento e persiste preferencia
// ============================================================

import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useConfiguracoesStore } from '@/stores/configuracoesStore';
import type { Tema } from '@/domain/modelos';

/**
 * Hook que gerencia o tema da aplicacao:
 * - Aplica a classe 'dark' no elemento <html>
 * - Escuta mudancas na preferencia do sistema
 * - Carrega o tema salvo nas configuracoes
 */
export function useTema() {
  const { tema, definirTema } = useAppStore();
  const { salvarConfiguracao } = useConfiguracoesStore();

  // Carregar tema salvo nas configuracoes
  useEffect(() => {
    const carregarTemaSalvo = async () => {
      try {
        const { obterConfiguracao } = useConfiguracoesStore.getState();
        const temaSalvo = obterConfiguracao('tema') as Tema | undefined;
        if (temaSalvo && ['claro', 'escuro', 'sistema'].includes(temaSalvo)) {
          definirTema(temaSalvo);
        }
      } catch {
        // Usar tema padrao em caso de erro
      }
    };
    carregarTemaSalvo();
  }, [definirTema]);

  // Aplicar tema no documento
  useEffect(() => {
    const aplicarTema = (temaEfetivo: 'claro' | 'escuro') => {
      if (temaEfetivo === 'escuro') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (tema === 'sistema') {
      // Verificar preferencia do sistema
      const mediaPrefereEscuro = window.matchMedia('(prefers-color-scheme: dark)');
      aplicarTema(mediaPrefereEscuro.matches ? 'escuro' : 'claro');

      // Escutar mudancas na preferencia do sistema
      const tratarMudanca = (evento: MediaQueryListEvent) => {
        aplicarTema(evento.matches ? 'escuro' : 'claro');
      };

      mediaPrefereEscuro.addEventListener('change', tratarMudanca);
      return () => mediaPrefereEscuro.removeEventListener('change', tratarMudanca);
    } else {
      aplicarTema(tema);
    }
  }, [tema]);

  // Funcao para mudar o tema e persistir
  const mudarTema = async (novoTema: Tema) => {
    definirTema(novoTema);
    try {
      await salvarConfiguracao('tema', novoTema);
    } catch {
      // Falha silenciosa na persistencia
    }
  };

  return { tema, mudarTema };
}
