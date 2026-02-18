// ============================================================
// VaultCraft - Componente Badge
// Exibe tags, status e contadores
// ============================================================

import React from 'react';

type VarianteBadge = 'padrao' | 'sucesso' | 'aviso' | 'perigo' | 'info' | 'personalizado';
type TamanhoBadge = 'pequeno' | 'medio';

interface BadgeProps {
  /** Texto do badge */
  children: React.ReactNode;
  /** Variante visual */
  variante?: VarianteBadge;
  /** Tamanho */
  tamanho?: TamanhoBadge;
  /** Cor customizada (usado com variante 'personalizado') */
  cor?: string;
  /** Icone antes do texto */
  icone?: React.ReactNode;
  /** Se pode ser removido */
  removivel?: boolean;
  /** Callback ao remover */
  aoRemover?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

const classesVariante: Record<Exclude<VarianteBadge, 'personalizado'>, string> = {
  padrao:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sucesso:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  aviso:
    'bg-dourado-100 text-dourado-700 dark:bg-dourado-900/30 dark:text-dourado-400',
  perigo:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info:
    'bg-cofre-100 text-cofre-700 dark:bg-cofre-900/30 dark:text-cofre-400',
};

const classesTamanho: Record<TamanhoBadge, string> = {
  pequeno: 'px-1.5 py-0.5 text-[10px]',
  medio: 'px-2 py-0.5 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variante = 'padrao',
  tamanho = 'medio',
  cor,
  icone,
  removivel = false,
  aoRemover,
  className = '',
}) => {
  const estiloPersonalizado =
    variante === 'personalizado' && cor
      ? {
          backgroundColor: `${cor}20`,
          color: cor,
          borderColor: `${cor}40`,
        }
      : undefined;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variante !== 'personalizado' ? classesVariante[variante] : 'border'}
        ${classesTamanho[tamanho]}
        ${className}
      `}
      style={estiloPersonalizado}
    >
      {icone}
      {children}
      {removivel && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            aoRemover?.();
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label="Remover"
        >
          &times;
        </button>
      )}
    </span>
  );
};
