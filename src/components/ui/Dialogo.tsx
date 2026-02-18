// ============================================================
// VaultCraft - Componente Dialogo (Modal)
// Modal com overlay, titulo, conteudo e acoes
// ============================================================

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DialogoProps {
  /** Se o dialogo esta aberto */
  aberto: boolean;
  /** Callback para fechar o dialogo */
  aoFechar: () => void;
  /** Titulo do dialogo */
  titulo?: string;
  /** Descricao do dialogo */
  descricao?: string;
  /** Conteudo do dialogo */
  children: React.ReactNode;
  /** Acoes do rodape */
  acoes?: React.ReactNode;
  /** Largura do dialogo */
  largura?: 'pequena' | 'media' | 'grande' | 'extra-grande';
  /** Se pode fechar clicando no overlay */
  fecharNoOverlay?: boolean;
}

const classesLargura = {
  pequena: 'max-w-sm',
  media: 'max-w-md',
  grande: 'max-w-lg',
  'extra-grande': 'max-w-2xl',
};

export const Dialogo: React.FC<DialogoProps> = ({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  acoes,
  largura = 'media',
  fecharNoOverlay = true,
}) => {
  const tratarEsc = useCallback(
    (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        aoFechar();
      }
    },
    [aoFechar]
  );

  useEffect(() => {
    if (aberto) {
      document.addEventListener('keydown', tratarEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', tratarEsc);
      document.body.style.overflow = '';
    };
  }, [aberto, tratarEsc]);

  return (
    <AnimatePresence>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={fecharNoOverlay ? aoFechar : undefined}
          />

          {/* Conteudo do dialogo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`
              relative z-10 w-full ${classesLargura[largura]}
              mx-4 bg-white dark:bg-gray-900
              rounded-xl shadow-2xl
              border border-gray-200 dark:border-gray-800
              max-h-[85vh] flex flex-col
            `}
          >
            {/* Cabecalho */}
            {(titulo || descricao) && (
              <div className="flex items-start justify-between px-6 pt-6 pb-2">
                <div>
                  {titulo && (
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {titulo}
                    </h2>
                  )}
                  {descricao && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {descricao}
                    </p>
                  )}
                </div>
                <button
                  onClick={aoFechar}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Corpo */}
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {children}
            </div>

            {/* Rodape com acoes */}
            {acoes && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                {acoes}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================
// Dialogo de Confirmacao
// ============================================================

interface DialogoConfirmacaoProps {
  aberto: boolean;
  aoFechar: () => void;
  aoConfirmar: () => void;
  titulo: string;
  mensagem: string;
  textoBotaoConfirmar?: string;
  textoBotaoCancelar?: string;
  variante?: 'perigo' | 'primario';
  carregando?: boolean;
}

export const DialogoConfirmacao: React.FC<DialogoConfirmacaoProps> = ({
  aberto,
  aoFechar,
  aoConfirmar,
  titulo,
  mensagem,
  textoBotaoConfirmar = 'Confirmar',
  textoBotaoCancelar = 'Cancelar',
  variante = 'primario',
  carregando = false,
}) => {
  const classeBotao =
    variante === 'perigo'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-cofre-600 hover:bg-cofre-700 text-white';

  return (
    <Dialogo aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="pequena">
      <p className="text-sm text-gray-600 dark:text-gray-400">{mensagem}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={aoFechar}
          disabled={carregando}
          className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {textoBotaoCancelar}
        </button>
        <button
          onClick={aoConfirmar}
          disabled={carregando}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${classeBotao}`}
        >
          {carregando ? 'Processando...' : textoBotaoConfirmar}
        </button>
      </div>
    </Dialogo>
  );
};
