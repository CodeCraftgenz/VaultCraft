// ============================================================
// VaultCraft - Layout Principal
// Estrutura principal: Painel Lateral + Barra Superior + Conteudo
// ============================================================

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { PainelLateral } from '@/components/layout/PainelLateral';
import { BarraSuperior } from '@/components/layout/BarraSuperior';
import { useAppStore } from '@/stores/appStore';

interface LayoutPrincipalProps {
  children: React.ReactNode;
}

export const LayoutPrincipal: React.FC<LayoutPrincipalProps> = ({ children }) => {
  const { painelLateral } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Painel lateral */}
      <AnimatePresence>
        {painelLateral && <PainelLateral />}
      </AnimatePresence>

      {/* Area principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Barra superior */}
        <BarraSuperior />

        {/* Conteudo */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
