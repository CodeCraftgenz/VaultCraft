// ============================================================
// VaultCraft - Componente Botao
// Botao reutilizavel com variantes, tamanhos e estado de carregamento
// ============================================================

import React from 'react';
import { Loader2 } from 'lucide-react';

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'fantasma';
type TamanhoBotao = 'pequeno' | 'medio' | 'grande';

interface BotaoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual do botao */
  variante?: VarianteBotao;
  /** Tamanho do botao */
  tamanho?: TamanhoBotao;
  /** Indicador de carregamento */
  carregando?: boolean;
  /** Icone a ser exibido antes do texto */
  icone?: React.ReactNode;
  /** Icone a ser exibido depois do texto */
  iconeDireita?: React.ReactNode;
  /** Se o botao ocupa toda a largura */
  larguraTotal?: boolean;
}

const classesVariante: Record<VarianteBotao, string> = {
  primario:
    'bg-cofre-600 hover:bg-cofre-700 active:bg-cofre-800 text-white shadow-sm',
  secundario:
    'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:active:bg-gray-600 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
  perigo:
    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
  fantasma:
    'bg-transparent hover:bg-gray-100 active:bg-gray-200 text-gray-700 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:text-gray-300',
};

const classesTamanho: Record<TamanhoBotao, string> = {
  pequeno: 'px-2.5 py-1.5 text-xs gap-1.5',
  medio: 'px-4 py-2 text-sm gap-2',
  grande: 'px-6 py-3 text-base gap-2.5',
};

export const Botao = React.forwardRef<HTMLButtonElement, BotaoProps>(
  (
    {
      variante = 'primario',
      tamanho = 'medio',
      carregando = false,
      icone,
      iconeDireita,
      larguraTotal = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const desabilitado = disabled || carregando;

    return (
      <button
        ref={ref}
        disabled={desabilitado}
        className={`
          inline-flex items-center justify-center
          rounded-lg font-medium
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-cofre-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-950
          disabled:opacity-50 disabled:cursor-not-allowed
          ${classesVariante[variante]}
          ${classesTamanho[tamanho]}
          ${larguraTotal ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {carregando ? (
          <Loader2 className="animate-spin" size={tamanho === 'pequeno' ? 14 : 18} />
        ) : (
          icone
        )}
        {children}
        {!carregando && iconeDireita}
      </button>
    );
  }
);

Botao.displayName = 'Botao';
