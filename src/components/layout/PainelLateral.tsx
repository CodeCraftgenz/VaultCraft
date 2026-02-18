// ============================================================
// VaultCraft - Painel Lateral (Sidebar)
// Navegacao principal, arvore de pastas e acoes rapidas
// ============================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Home,
  Clock,
  History,
  HardDrive,
  Settings,
  HelpCircle,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  PanelLeftClose,
  Package,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { usePastasStore } from '@/stores/pastasStore';
import type { Pasta, Visao } from '@/domain/modelos';

// ========================
// Item de Navegacao
// ========================

interface ItemNavegacaoProps {
  icone: React.ReactNode;
  rotulo: string;
  visao: Visao;
  ativo: boolean;
  aoClicar: () => void;
}

const ItemNavegacao: React.FC<ItemNavegacaoProps> = ({
  icone,
  rotulo,
  visao: _visao,
  ativo,
  aoClicar,
}) => (
  <button
    onClick={aoClicar}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
      transition-colors duration-150
      ${
        ativo
          ? 'bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
      }
    `}
  >
    {icone}
    <span>{rotulo}</span>
  </button>
);

// ========================
// Item da Arvore de Pastas
// ========================

interface ItemPastaProps {
  pasta: Pasta;
  nivel: number;
  pastaAtualId: string | null;
  pastasExpandidas: Set<string>;
  aoSelecionar: (pasta: Pasta) => void;
  aoAlternarExpansao: (pastaId: string) => void;
}

const ItemPasta: React.FC<ItemPastaProps> = ({
  pasta,
  nivel,
  pastaAtualId,
  pastasExpandidas,
  aoSelecionar,
  aoAlternarExpansao,
}) => {
  const expandida = pastasExpandidas.has(pasta.id);
  const ativa = pastaAtualId === pasta.id;
  const temFilhas = pasta.filhas && pasta.filhas.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          aoSelecionar(pasta);
          if (temFilhas) {
            aoAlternarExpansao(pasta.id);
          }
        }}
        className={`
          w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm
          transition-colors duration-100
          ${
            ativa
              ? 'bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }
        `}
        style={{ paddingLeft: `${nivel * 16 + 8}px` }}
      >
        {temFilhas ? (
          expandida ? (
            <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-gray-400" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        {ativa || expandida ? (
          <FolderOpen size={16} className="flex-shrink-0 text-dourado-500" />
        ) : (
          <Folder size={16} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
        )}
        <span className="truncate">{pasta.nome}</span>
      </button>

      {/* Filhas */}
      <AnimatePresence>
        {expandida && temFilhas && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {pasta.filhas!.map((filha) => (
              <ItemPasta
                key={filha.id}
                pasta={filha}
                nivel={nivel + 1}
                pastaAtualId={pastaAtualId}
                pastasExpandidas={pastasExpandidas}
                aoSelecionar={aoSelecionar}
                aoAlternarExpansao={aoAlternarExpansao}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ========================
// Painel Lateral Principal
// ========================

export const PainelLateral: React.FC = () => {
  const { visaoAtual, navegarPara, painelLateral, alternarPainelLateral } = useAppStore();
  const {
    pastas,
    pastaAtual,
    pastasExpandidas,
    carregarPastas,
    selecionarPasta,
    alternarExpansao,
  } = usePastasStore();

  const [criandoPasta, setCriandoPasta] = useState(false);
  const [nomePastaInput, setNomePastaInput] = useState('');
  const { criarPasta } = usePastasStore();

  useEffect(() => {
    carregarPastas();
  }, [carregarPastas]);

  const tratarCriarPasta = async () => {
    if (nomePastaInput.trim()) {
      await criarPasta(nomePastaInput.trim(), pastaAtual?.id ?? null);
      setNomePastaInput('');
      setCriandoPasta(false);
    }
  };

  const tratarSelecionarPasta = (pasta: Pasta) => {
    selecionarPasta(pasta);
    navegarPara('inicio');
  };

  const itensNavegacao: { icone: React.ReactNode; rotulo: string; visao: Visao }[] = [
    { icone: <Home size={18} />, rotulo: 'Inicio', visao: 'inicio' },
    { icone: <Clock size={18} />, rotulo: 'Vencimentos', visao: 'vencimentos' },
    { icone: <History size={18} />, rotulo: 'Historico', visao: 'historico' },
    { icone: <HardDrive size={18} />, rotulo: 'Backup', visao: 'backup' },
    { icone: <Package size={18} />, rotulo: 'Pacotes', visao: 'pacotes' },
    { icone: <Settings size={18} />, rotulo: 'Configuracoes', visao: 'configuracoes' },
    { icone: <HelpCircle size={18} />, rotulo: 'Ajuda', visao: 'ajuda' },
  ];

  if (!painelLateral) {
    return null;
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-hidden"
      style={{ width: 260 }}
    >
      {/* Cabecalho com logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cofre-600 text-white">
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              VaultCraft
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Seu cofre pessoal
            </p>
          </div>
        </div>
        <button
          onClick={alternarPainelLateral}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          title="Recolher painel"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Navegacao principal */}
      <nav className="px-3 py-3 space-y-0.5">
        {itensNavegacao.map((item) => (
          <ItemNavegacao
            key={item.visao}
            icone={item.icone}
            rotulo={item.rotulo}
            visao={item.visao}
            ativo={visaoAtual === item.visao}
            aoClicar={() => navegarPara(item.visao)}
          />
        ))}
      </nav>

      {/* Separador */}
      <div className="mx-4 border-t border-gray-200 dark:border-gray-800" />

      {/* Arvore de Pastas */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Pastas
          </span>
          <button
            onClick={() => setCriandoPasta(true)}
            className="p-1 rounded text-gray-400 hover:text-cofre-600 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            title="Nova pasta"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Input para criar pasta */}
        <AnimatePresence>
          {criandoPasta && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 overflow-hidden"
            >
              <input
                autoFocus
                value={nomePastaInput}
                onChange={(e) => setNomePastaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') tratarCriarPasta();
                  if (e.key === 'Escape') {
                    setCriandoPasta(false);
                    setNomePastaInput('');
                  }
                }}
                onBlur={() => {
                  if (!nomePastaInput.trim()) {
                    setCriandoPasta(false);
                  }
                }}
                placeholder="Nome da pasta..."
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-cofre-300 dark:border-cofre-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cofre-500"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de pastas */}
        <div className="space-y-0.5">
          {pastas.map((pasta) => (
            <ItemPasta
              key={pasta.id}
              pasta={pasta}
              nivel={0}
              pastaAtualId={pastaAtual?.id ?? null}
              pastasExpandidas={pastasExpandidas}
              aoSelecionar={tratarSelecionarPasta}
              aoAlternarExpansao={alternarExpansao}
            />
          ))}
        </div>

        {pastas.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
            Nenhuma pasta criada.
            <br />
            Clique em + para comecar.
          </p>
        )}
      </div>
    </motion.aside>
  );
};
