// ============================================================
// VaultCraft - Barra Superior (Top Bar)
// Busca, filtros rapidos e acoes do usuario
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  PanelLeftOpen,
  HardDrive,
  Settings,
  FileText,
  CheckSquare,
  File,
  X,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useBuscaStore } from '@/stores/buscaStore';
import { usePastasStore } from '@/stores/pastasStore';
import type { TipoItem } from '@/domain/modelos';

export const BarraSuperior: React.FC = () => {
  const { painelLateral, alternarPainelLateral, navegarPara } = useAppStore();
  const { filtros, definirFiltros, buscar, limparBusca } = useBuscaStore();
  const { pastaAtual } = usePastasStore();

  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const [termoBusca, setTermoBusca] = useState('');

  // Atalho Ctrl+K para focar na busca
  useEffect(() => {
    const tratarAtalho = (evento: KeyboardEvent) => {
      if ((evento.ctrlKey || evento.metaKey) && evento.key === 'k') {
        evento.preventDefault();
        inputBuscaRef.current?.focus();
      }
    };
    document.addEventListener('keydown', tratarAtalho);
    return () => document.removeEventListener('keydown', tratarAtalho);
  }, []);

  const tratarBusca = (evento: React.FormEvent) => {
    evento.preventDefault();
    if (termoBusca.trim()) {
      buscar({ termo: termoBusca.trim() });
      navegarPara('busca');
    }
  };

  const tratarLimparBusca = () => {
    setTermoBusca('');
    limparBusca();
  };

  const tratarFiltroTipo = (tipo: TipoItem | undefined) => {
    if (filtros.tipo === tipo) {
      definirFiltros({ tipo: undefined });
    } else {
      definirFiltros({ tipo });
    }
  };

  const filtrosTipo: { tipo: TipoItem; rotulo: string; icone: React.ReactNode }[] = [
    { tipo: 'nota', rotulo: 'Notas', icone: <FileText size={14} /> },
    { tipo: 'documento', rotulo: 'Documentos', icone: <File size={14} /> },
    { tipo: 'checklist', rotulo: 'Checklists', icone: <CheckSquare size={14} /> },
  ];

  return (
    <header className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Botao para abrir painel lateral */}
      {!painelLateral && (
        <button
          onClick={alternarPainelLateral}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          title="Abrir painel lateral"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Indicador de pasta atual */}
      {pastaAtual && (
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {pastaAtual.nome}
          </span>
        </div>
      )}

      {/* Barra de busca */}
      <form onSubmit={tratarBusca} className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputBuscaRef}
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar no cofre... (Ctrl+K)"
            className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cofre-500 focus:border-cofre-500 transition-colors"
          />
          {termoBusca && (
            <button
              type="button"
              onClick={tratarLimparBusca}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Filtros rapidos de tipo */}
      <div className="hidden md:flex items-center gap-1">
        {filtrosTipo.map((filtro) => (
          <button
            key={filtro.tipo}
            onClick={() => tratarFiltroTipo(filtro.tipo)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
              transition-colors duration-150
              ${
                filtros.tipo === filtro.tipo
                  ? 'bg-cofre-100 text-cofre-700 dark:bg-cofre-900/50 dark:text-cofre-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }
            `}
          >
            {filtro.icone}
            {filtro.rotulo}
          </button>
        ))}
      </div>

      {/* Acoes rapidas */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navegarPara('backup')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          title="Backup"
        >
          <HardDrive size={18} />
        </button>
        <button
          onClick={() => navegarPara('configuracoes')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          title="Configuracoes"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
