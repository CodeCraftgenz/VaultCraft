/**
 * Modal de onboarding (primeira execução).
 *
 * Por quê separar em modal? O onboarding deve sobrepor todo o app
 * sem bloquear a renderização inicial. O modal é controlado pelo
 * store de configurações e pode ser reexibido depois.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FolderPlus,
  FileText,
  Paperclip,
  Search,
  Download,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from 'lucide-react';
import { roteiroOnboarding, textosOnboarding } from './roteiro';
import { useConfiguracoesStore } from '@/stores/configuracoesStore';
import { usePastasStore } from '@/stores/pastasStore';
import { useItensStore } from '@/stores/itensStore';

/** Mapeamento de nomes de ícone para componentes */
const icones: Record<string, React.ElementType> = {
  Shield,
  FolderPlus,
  FileText,
  Paperclip,
  Search,
  Download,
};

interface OnboardingModalProps {
  visivel: boolean;
  aoFechar: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visivel,
  aoFechar,
}) => {
  const [passoAtual, setPassoAtual] = useState(0);
  const [acaoRealizada, setAcaoRealizada] = useState<Record<string, boolean>>({});
  const { salvarConfiguracao } = useConfiguracoesStore();
  const { criarPasta } = usePastasStore();
  const { criarItem } = useItensStore();

  const passo = roteiroOnboarding[passoAtual];
  const totalPassos = roteiroOnboarding.length;
  const ehUltimoPasso = passoAtual === totalPassos - 1;
  const Icone = icones[passo.icone] || Shield;

  const avancar = useCallback(() => {
    if (ehUltimoPasso) {
      concluirOnboarding();
    } else {
      setPassoAtual((prev) => Math.min(prev + 1, totalPassos - 1));
    }
  }, [ehUltimoPasso, passoAtual]);

  const voltar = useCallback(() => {
    setPassoAtual((prev) => Math.max(prev - 1, 0));
  }, []);

  const concluirOnboarding = useCallback(async () => {
    try {
      await salvarConfiguracao('onboarding_concluido', 'true');
    } catch {
      // Mesmo se falhar, fechamos o onboarding para não bloquear o usuário
    }
    aoFechar();
  }, [salvarConfiguracao, aoFechar]);

  const executarAcao = useCallback(async () => {
    const idPasso = passo.id;

    try {
      switch (idPasso) {
        case 'criar-pasta':
          await criarPasta('Meus Documentos', null);
          break;
        case 'criar-nota':
          // Será implementado quando o store de itens estiver conectado
          break;
        case 'anexar-arquivo':
          // Será implementado com dialog de arquivo
          break;
        case 'usar-busca':
          // Abre o campo de busca
          break;
        case 'fazer-backup':
          // Será implementado com o serviço de backup
          break;
      }

      setAcaoRealizada((prev) => ({ ...prev, [idPasso]: true }));
    } catch (erro) {
      console.error(`Erro ao executar ação do onboarding: ${idPasso}`, erro);
    }
  }, [passo, criarPasta, criarItem]);

  if (!visivel) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Barra de progresso no topo */}
          <div className="h-1 bg-gray-200 dark:bg-gray-800">
            <motion.div
              className="h-full bg-cofre-600"
              initial={{ width: 0 }}
              animate={{
                width: `${((passoAtual + 1) / totalPassos) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Botão pular */}
          <button
            onClick={concluirOnboarding}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={textosOnboarding.botaoPular}
          >
            <X size={20} />
          </button>

          {/* Conteúdo do passo */}
          <div className="p-8 pt-6">
            {/* Indicador de passo */}
            <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Passo {passo.numero} de {totalPassos}
            </div>

            {/* Ícone */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-cofre-100 dark:bg-cofre-900/30 flex items-center justify-center">
                <Icone size={32} className="text-cofre-600 dark:text-cofre-400" />
              </div>
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
              {passo.titulo}
            </h2>

            {/* Descrição */}
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed whitespace-pre-line mb-6">
              {passo.descricao}
            </div>

            {/* Botão de ação */}
            {passo.textoBotaoAcao && (
              <button
                onClick={executarAcao}
                disabled={acaoRealizada[passo.id]}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all mb-4 ${
                  acaoRealizada[passo.id]
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                    : 'bg-cofre-600 hover:bg-cofre-700 text-white shadow-lg shadow-cofre-600/20'
                }`}
              >
                {acaoRealizada[passo.id] ? '✓ Feito!' : passo.textoBotaoAcao}
              </button>
            )}

            {/* Dica */}
            {passo.dica && (
              <div className="flex items-start gap-2 p-3 bg-dourado-50 dark:bg-dourado-900/10 rounded-xl text-xs text-dourado-800 dark:text-dourado-300">
                <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                <span>{passo.dica}</span>
              </div>
            )}
          </div>

          {/* Navegação inferior */}
          <div className="flex items-center justify-between px-8 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={voltar}
              disabled={passoAtual === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              {textosOnboarding.botaoAnterior}
            </button>

            {/* Indicadores de passo (bolinhas) */}
            <div className="flex gap-1.5">
              {roteiroOnboarding.map((_, indice) => (
                <div
                  key={indice}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    indice === passoAtual
                      ? 'bg-cofre-600'
                      : indice < passoAtual
                        ? 'bg-cofre-300 dark:bg-cofre-700'
                        : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={avancar}
              className="flex items-center gap-1 text-sm font-medium text-cofre-600 hover:text-cofre-700 dark:text-cofre-400 dark:hover:text-cofre-300 transition-colors"
            >
              {ehUltimoPasso
                ? textosOnboarding.botaoConcluir
                : textosOnboarding.botaoProximo}
              {!ehUltimoPasso && <ChevronRight size={16} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
