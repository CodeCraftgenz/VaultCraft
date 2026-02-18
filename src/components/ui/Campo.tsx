// ============================================================
// VaultCraft - Componente Campo
// Campo de entrada de texto com rotulo, erro e icone
// ============================================================

import React from 'react';

interface CampoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Rotulo do campo */
  rotulo?: string;
  /** Mensagem de erro */
  erro?: string;
  /** Texto de ajuda */
  ajuda?: string;
  /** Icone a esquerda */
  icone?: React.ReactNode;
  /** Icone a direita */
  iconeDireita?: React.ReactNode;
  /** Se o campo ocupa toda a largura */
  larguraTotal?: boolean;
}

export const Campo = React.forwardRef<HTMLInputElement, CampoProps>(
  (
    {
      rotulo,
      erro,
      ajuda,
      icone,
      iconeDireita,
      larguraTotal = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const campoId = id || `campo-${rotulo?.toLowerCase().replace(/\s/g, '-')}`;

    return (
      <div className={`${larguraTotal ? 'w-full' : ''}`}>
        {rotulo && (
          <label
            htmlFor={campoId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {rotulo}
          </label>
        )}
        <div className="relative">
          {icone && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {icone}
            </div>
          )}
          <input
            ref={ref}
            id={campoId}
            className={`
              block rounded-lg border bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-cofre-500 focus:border-cofre-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${erro
                ? 'border-red-500 dark:border-red-400'
                : 'border-gray-300 dark:border-gray-700'
              }
              ${icone ? 'pl-10' : 'pl-3'}
              ${iconeDireita ? 'pr-10' : 'pr-3'}
              py-2 text-sm
              ${larguraTotal ? 'w-full' : ''}
              ${className}
            `}
            {...props}
          />
          {iconeDireita && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500">
              {iconeDireita}
            </div>
          )}
        </div>
        {erro && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{erro}</p>
        )}
        {ajuda && !erro && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ajuda}</p>
        )}
      </div>
    );
  }
);

Campo.displayName = 'Campo';

// ============================================================
// Area de Texto
// ============================================================

interface AreaTextoProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo?: string;
  erro?: string;
  ajuda?: string;
  larguraTotal?: boolean;
}

export const AreaTexto = React.forwardRef<HTMLTextAreaElement, AreaTextoProps>(
  ({ rotulo, erro, ajuda, larguraTotal = true, className = '', id, ...props }, ref) => {
    const campoId = id || `area-${rotulo?.toLowerCase().replace(/\s/g, '-')}`;

    return (
      <div className={`${larguraTotal ? 'w-full' : ''}`}>
        {rotulo && (
          <label
            htmlFor={campoId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {rotulo}
          </label>
        )}
        <textarea
          ref={ref}
          id={campoId}
          className={`
            block rounded-lg border bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-cofre-500 focus:border-cofre-500
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y min-h-[80px]
            px-3 py-2 text-sm
            ${erro
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-gray-700'
            }
            ${larguraTotal ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        />
        {erro && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{erro}</p>
        )}
        {ajuda && !erro && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{ajuda}</p>
        )}
      </div>
    );
  }
);

AreaTexto.displayName = 'AreaTexto';
