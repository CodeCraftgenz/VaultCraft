import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { useLicenseStore } from '@/stores/licenseStore';

export function LoginView() {
  const {
    isActivating,
    hardwareId,
    error,
    activateLicense,
  } = useLicenseStore();

  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = useCallback(async () => {
    if (!email.trim()) return;
    const result = await activateLicense(email.trim());
    if (result) {
      setSuccess(true);
    }
  }, [email, activateLicense]);

  const handleCopyHardwareId = useCallback(() => {
    if (hardwareId) {
      navigator.clipboard.writeText(hardwareId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [hardwareId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && email.trim() && !isActivating) {
        handleActivate();
      }
    },
    [email, isActivating, handleActivate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-cofre-50 dark:from-gray-950 dark:via-gray-900 dark:to-cofre-950 p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cofre-200/30 dark:bg-cofre-800/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-dourado-200/30 dark:bg-dourado-800/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-200/50 dark:border-gray-800 overflow-hidden">
          {/* Header with branding */}
          <div className="bg-gradient-to-br from-cofre-50 via-white to-dourado-50 dark:from-gray-800 dark:via-gray-850 dark:to-cofre-900/30 px-8 pt-8 pb-6 text-center border-b border-gray-200/50 dark:border-gray-700/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-3"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cofre-600 text-white">
                <Shield size={28} />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                VaultCraft
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 dark:text-gray-400 text-sm"
            >
              Cofre pessoal para documentos e notas
            </motion.p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <AnimatePresence mode="wait">
              {success ? (
                /* Success state */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-4"
                  >
                    <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Licenca ativada!
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Iniciando VaultCraft...
                  </p>
                </motion.div>
              ) : (
                /* Login form */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Ativar licenca
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Insira o e-mail usado na compra
                    </p>
                  </div>

                  {/* Email input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      E-mail
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="seu@email.com"
                        disabled={isActivating}
                        className="
                          w-full pl-10 pr-4 py-2.5 rounded-xl
                          bg-gray-50 dark:bg-gray-800
                          border border-gray-200 dark:border-gray-700
                          text-gray-900 dark:text-gray-100
                          placeholder:text-gray-400 dark:placeholder:text-gray-500
                          text-sm
                          focus:outline-none focus:ring-2 focus:ring-cofre-500/50 focus:border-cofre-500
                          disabled:opacity-50
                          transition-all duration-200
                        "
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
                      >
                        <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                          {error}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Activate button */}
                  <button
                    onClick={handleActivate}
                    disabled={!email.trim() || isActivating}
                    className="
                      w-full flex items-center justify-center gap-2
                      px-4 py-2.5 rounded-xl
                      bg-cofre-600 hover:bg-cofre-700
                      dark:bg-cofre-500 dark:hover:bg-cofre-600
                      text-white font-medium text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                      shadow-md shadow-cofre-500/20 hover:shadow-lg hover:shadow-cofre-500/30
                    "
                  >
                    {isActivating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        Ativar Licenca
                      </>
                    )}
                  </button>

                  {/* Hardware ID info */}
                  {hardwareId && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1">
                          <Cpu size={10} />
                          ID do computador
                        </span>
                        <button
                          onClick={handleCopyHardwareId}
                          className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check size={10} className="text-emerald-500" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy size={10} />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 font-mono break-all select-all bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5">
                        {hardwareId}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6">
            <div className="text-center">
              <p className="text-[11px] text-gray-400 dark:text-gray-600">
                VaultCraft v1.0.0 &middot; 100% offline &middot; Seus dados nunca saem do seu computador
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
