// ============================================================
// VaultCraft - Pagina de Backup (TELA-06)
// Criar e restaurar backups do cofre
// ============================================================

import React, { useState } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  Shield,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { open as abrirDialogoArquivo } from '@tauri-apps/plugin-dialog';
import { Botao } from '@/components/ui/Botao';
import { Progresso } from '@/components/ui/Progresso';
import { useToast } from '@/components/ui/Toast';
import * as comandos from '@/infra/comandos';

export const PaginaBackup: React.FC = () => {
  const toast = useToast();
  const [criandoBackup, setCriandoBackup] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [progressoBackup, setProgressoBackup] = useState(0);
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);
  const [resultadoBackup, setResultadoBackup] = useState<{
    sucesso: boolean;
    mensagem: string;
    caminho?: string;
  } | null>(null);

  const tratarCriarBackup = async () => {
    setCriandoBackup(true);
    setProgressoBackup(0);
    setResultadoBackup(null);

    try {
      // Simular progresso
      const intervalo = setInterval(() => {
        setProgressoBackup((anterior) => Math.min(anterior + 15, 85));
      }, 300);

      const destino = await abrirDialogoArquivo({
        directory: true,
        title: 'Selecionar pasta para salvar o backup',
      });
      if (!destino) {
        setCriandoBackup(false);
        clearInterval(intervalo);
        return;
      }
      const caminho = await comandos.criarBackup(destino as string);

      clearInterval(intervalo);
      setProgressoBackup(100);

      setResultadoBackup({
        sucesso: true,
        mensagem: 'Backup criado com sucesso!',
        caminho,
      });
      setUltimoBackup(new Date().toLocaleString('pt-BR'));
      toast.sucesso('Backup concluido', `Arquivo salvo em: ${caminho}`);
    } catch (erro) {
      setResultadoBackup({
        sucesso: false,
        mensagem: `Erro ao criar backup: ${erro}`,
      });
      toast.erro('Erro no backup', String(erro));
    } finally {
      setCriandoBackup(false);
    }
  };

  const tratarRestaurarBackup = async () => {
    try {
      const caminhoArquivo = await abrirDialogoArquivo({
        multiple: false,
        title: 'Selecionar arquivo de backup',
        filters: [
          { name: 'Backup VaultCraft', extensions: ['vaultbak', 'zip'] },
        ],
      });

      if (!caminhoArquivo) return;

      setRestaurando(true);
      setResultadoBackup(null);

      await comandos.restaurarBackup(caminhoArquivo as string);

      setResultadoBackup({
        sucesso: true,
        mensagem: 'Backup restaurado com sucesso! A aplicacao sera recarregada.',
      });
      toast.sucesso('Restauracao concluida', 'O cofre foi restaurado com sucesso.');
    } catch (erro) {
      setResultadoBackup({
        sucesso: false,
        mensagem: `Erro ao restaurar: ${erro}`,
      });
      toast.erro('Erro na restauracao', String(erro));
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Cabecalho */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HardDrive size={24} className="text-cofre-500" />
            Backup e Restauracao
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Proteja seus dados criando copias de seguranca do seu cofre
          </p>
        </div>

        {/* Mensagem de seguranca */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-cofre-50 dark:bg-cofre-950/30 border border-cofre-200 dark:border-cofre-800">
          <Shield size={20} className="text-cofre-600 dark:text-cofre-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-cofre-700 dark:text-cofre-300">
              Seus dados estao seguros
            </p>
            <p className="text-xs text-cofre-600 dark:text-cofre-400 mt-1">
              O backup inclui todos os seus itens, pastas, anexos e configuracoes.
              Se a criptografia estiver ativada, o backup tambem sera protegido.
            </p>
          </div>
        </div>

        {/* Criar Backup */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Fazer Backup
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Cria uma copia completa do seu cofre que pode ser restaurada a qualquer momento.
              </p>
              {ultimoBackup && (
                <p className="text-xs text-gray-400 mt-2">
                  Ultimo backup: {ultimoBackup}
                </p>
              )}

              {/* Barra de progresso */}
              {criandoBackup && (
                <div className="mt-4">
                  <Progresso
                    valor={progressoBackup}
                    cor="sucesso"
                    mostrarPorcentagem
                    tamanho="medio"
                  />
                </div>
              )}

              <div className="mt-4">
                <Botao
                  variante="primario"
                  tamanho="medio"
                  icone={<Download size={16} />}
                  onClick={tratarCriarBackup}
                  carregando={criandoBackup}
                  disabled={restaurando}
                >
                  {criandoBackup ? 'Criando backup...' : 'Criar backup agora'}
                </Botao>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurar Backup */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dourado-50 dark:bg-dourado-950/30 text-dourado-600 dark:text-dourado-400">
              <Upload size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Restaurar Backup
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Restaure o cofre a partir de um arquivo de backup anterior.
              </p>

              {/* Aviso */}
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-dourado-50 dark:bg-dourado-950/20 border border-dourado-200 dark:border-dourado-800">
                <AlertTriangle size={16} className="text-dourado-600 dark:text-dourado-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-dourado-700 dark:text-dourado-300">
                  A restauracao substituira todos os dados atuais do cofre. Esta acao nao pode ser desfeita.
                  Recomendamos criar um backup antes de restaurar.
                </p>
              </div>

              <div className="mt-4">
                <Botao
                  variante="secundario"
                  tamanho="medio"
                  icone={<FolderOpen size={16} />}
                  onClick={tratarRestaurarBackup}
                  carregando={restaurando}
                  disabled={criandoBackup}
                >
                  {restaurando ? 'Restaurando...' : 'Selecionar arquivo de backup'}
                </Botao>
              </div>
            </div>
          </div>
        </div>

        {/* Resultado da operacao */}
        {resultadoBackup && (
          <div
            className={`
              flex items-start gap-3 p-4 rounded-lg border
              ${
                resultadoBackup.sucesso
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
              }
            `}
          >
            {resultadoBackup.sucesso ? (
              <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  resultadoBackup.sucesso
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {resultadoBackup.mensagem}
              </p>
              {resultadoBackup.caminho && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {resultadoBackup.caminho}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
