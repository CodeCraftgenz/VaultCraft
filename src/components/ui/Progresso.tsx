// ============================================================
// VaultCraft - Componente Progresso
// Barra de progresso com animacao
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressoProps {
  /** Valor atual (0 a 100) */
  valor: number;
  /** Valor maximo */
  maximo?: number;
  /** Tamanho da barra */
  tamanho?: 'pequeno' | 'medio' | 'grande';
  /** Cor da barra */
  cor?: 'cofre' | 'sucesso' | 'aviso' | 'perigo';
  /** Exibir porcentagem */
  mostrarPorcentagem?: boolean;
  /** Rotulo da barra */
  rotulo?: string;
  /** Classe CSS adicional */
  className?: string;
}

const classesTamanho = {
  pequeno: 'h-1',
  medio: 'h-2',
  grande: 'h-3',
};

const classesCor = {
  cofre: 'bg-cofre-500',
  sucesso: 'bg-green-500',
  aviso: 'bg-dourado-500',
  perigo: 'bg-red-500',
};

export const Progresso: React.FC<ProgressoProps> = ({
  valor,
  maximo = 100,
  tamanho = 'medio',
  cor = 'cofre',
  mostrarPorcentagem = false,
  rotulo,
  className = '',
}) => {
  const porcentagem = Math.min(Math.max((valor / maximo) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {(rotulo || mostrarPorcentagem) && (
        <div className="flex items-center justify-between mb-1.5">
          {rotulo && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {rotulo}
            </span>
          )}
          {mostrarPorcentagem && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Math.round(porcentagem)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`
          w-full rounded-full overflow-hidden
          bg-gray-200 dark:bg-gray-800
          ${classesTamanho[tamanho]}
        `}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${porcentagem}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${classesCor[cor]}`}
        />
      </div>
    </div>
  );
};
