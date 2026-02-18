// ============================================================
// VaultCraft - Sistema de Toast (Notificacoes)
// Provider, hook useToast e componente visual
// ============================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type TipoToast = 'sucesso' | 'erro' | 'info' | 'aviso';

interface Toast {
  id: string;
  tipo: TipoToast;
  titulo: string;
  mensagem?: string;
  duracao?: number;
}

interface ToastContexto {
  toasts: Toast[];
  adicionarToast: (toast: Omit<Toast, 'id'>) => void;
  removerToast: (id: string) => void;
}

const ToastContext = createContext<ToastContexto | null>(null);

/** Hook para exibir notificacoes toast */
export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }

  const { adicionarToast } = contexto;

  return {
    sucesso: (titulo: string, mensagem?: string) =>
      adicionarToast({ tipo: 'sucesso', titulo, mensagem }),
    erro: (titulo: string, mensagem?: string) =>
      adicionarToast({ tipo: 'erro', titulo, mensagem }),
    info: (titulo: string, mensagem?: string) =>
      adicionarToast({ tipo: 'info', titulo, mensagem }),
    aviso: (titulo: string, mensagem?: string) =>
      adicionarToast({ tipo: 'aviso', titulo, mensagem }),
  };
}

// Icones por tipo
const iconesToast: Record<TipoToast, React.ReactNode> = {
  sucesso: <CheckCircle2 size={20} className="text-green-500" />,
  erro: <XCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-cofre-500" />,
  aviso: <AlertTriangle size={20} className="text-dourado-500" />,
};

const classesToast: Record<TipoToast, string> = {
  sucesso: 'border-green-200 dark:border-green-800',
  erro: 'border-red-200 dark:border-red-800',
  info: 'border-cofre-200 dark:border-cofre-800',
  aviso: 'border-dourado-200 dark:border-dourado-800',
};

/** Componente individual de toast */
const ToastItem: React.FC<{ toast: Toast; aoRemover: (id: string) => void }> = ({
  toast,
  aoRemover,
}) => {
  React.useEffect(() => {
    const duracao = toast.duracao ?? 4000;
    const timer = setTimeout(() => aoRemover(toast.id), duracao);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duracao, aoRemover]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        flex items-start gap-3 p-4 rounded-lg shadow-lg
        bg-white dark:bg-gray-900 border
        ${classesToast[toast.tipo]}
        max-w-sm w-full
      `}
    >
      <div className="flex-shrink-0 mt-0.5">{iconesToast[toast.tipo]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {toast.titulo}
        </p>
        {toast.mensagem && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {toast.mensagem}
          </p>
        )}
      </div>
      <button
        onClick={() => aoRemover(toast.id)}
        className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
};

/** Provider que envolve a aplicacao para habilitar toasts */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const adicionarToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((anteriores) => [...anteriores, { ...toast, id }]);
  }, []);

  const removerToast = useCallback((id: string) => {
    setToasts((anteriores) => anteriores.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, adicionarToast, removerToast }}>
      {children}
      {/* Container de toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} aoRemover={removerToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
