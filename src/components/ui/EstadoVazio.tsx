// ============================================================
// VaultCraft - Componente Estado Vazio
// Exibido quando uma lista esta vazia
// ============================================================

import React from 'react';
import { Botao } from '@/components/ui/Botao';

interface EstadoVazioProps {
  /** Icone ilustrativo */
  icone: React.ReactNode;
  /** Titulo principal */
  titulo: string;
  /** Descricao complementar */
  descricao?: string;
  /** Texto do botao de acao */
  textoAcao?: string;
  /** Icone do botao de acao */
  iconeAcao?: React.ReactNode;
  /** Callback da acao */
  aoClicar?: () => void;
}

export const EstadoVazio: React.FC<EstadoVazioProps> = ({
  icone,
  titulo,
  descricao,
  textoAcao,
  iconeAcao,
  aoClicar,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cofre-50 dark:bg-cofre-950/50 text-cofre-500 dark:text-cofre-400 mb-4">
        {icone}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {titulo}
      </h3>
      {descricao && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          {descricao}
        </p>
      )}
      {textoAcao && aoClicar && (
        <Botao
          variante="primario"
          tamanho="medio"
          icone={iconeAcao}
          onClick={aoClicar}
        >
          {textoAcao}
        </Botao>
      )}
    </div>
  );
};
