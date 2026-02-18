// ============================================================
// VaultCraft - Pagina de Pacotes (TELA-07)
// Exportar e importar pacotes do cofre
// ============================================================

import React, { useState } from 'react';
import {
  Package,
  Upload,
  Download,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { open as abrirDialogoArquivo } from '@tauri-apps/plugin-dialog';
import { usePastasStore } from '@/stores/pastasStore';
import { Botao } from '@/components/ui/Botao';
import { Progresso } from '@/components/ui/Progresso';
import { useToast } from '@/components/ui/Toast';
import * as comandos from '@/infra/comandos';

export const PaginaPacotes: React.FC = () => {
  const toast = useToast();
  const { pastas, pastaAtual } = usePastasStore();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [pastaExportacao, setPastaExportacao] = useState<string>(pastaAtual?.id ?? '');
  const [pastaDestino, setPastaDestino] = useState<string>('');
  const [progressoExportacao, setProgressoExportacao] = useState(0);

  const tratarExportar = async () => {
    if (!pastaExportacao) {
      toast.aviso('Selecione uma pasta', 'Escolha a pasta que deseja exportar.');
      return;
    }

    setExportando(true);
    setProgressoExportacao(0);

    try {
      const intervalo = setInterval(() => {
        setProgressoExportacao((anterior) => Math.min(anterior + 20, 85));
      }, 400);

      const destino = await abrirDialogoArquivo({
        directory: true,
        title: 'Selecionar pasta para salvar o pacote',
      });
      if (!destino) {
        setExportando(false);
        clearInterval(intervalo);
        return;
      }
      const caminho = await comandos.exportarPacote(pastaExportacao, destino as string);

      clearInterval(intervalo);
      setProgressoExportacao(100);

      toast.sucesso('Pacote exportado', `Salvo em: ${caminho}`);
    } catch (erro) {
      toast.erro('Erro ao exportar', String(erro));
    } finally {
      setExportando(false);
    }
  };

  const tratarImportar = async () => {
    try {
      const caminhoPacote = await abrirDialogoArquivo({
        multiple: false,
        title: 'Selecionar pacote VaultCraft',
        filters: [
          { name: 'Pacote VaultCraft', extensions: ['vaultpkg', 'zip'] },
        ],
      });

      if (!caminhoPacote) return;

      setImportando(true);

      await comandos.importarPacote(caminhoPacote as string);

      toast.sucesso('Pacote importado', 'Os itens foram adicionados ao cofre com sucesso.');
    } catch (erro) {
      toast.erro('Erro ao importar', String(erro));
    } finally {
      setImportando(false);
    }
  };

  // Achatar arvore de pastas para o select
  const achatarPastas = (
    listaPastas: typeof pastas,
    nivel = 0
  ): { id: string; nome: string; nivel: number }[] => {
    const resultado: { id: string; nome: string; nivel: number }[] = [];
    for (const pasta of listaPastas) {
      resultado.push({ id: pasta.id, nome: pasta.nome, nivel });
      if (pasta.filhas) {
        resultado.push(...achatarPastas(pasta.filhas, nivel + 1));
      }
    }
    return resultado;
  };

  const pastasAchatadas = achatarPastas(pastas);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Cabecalho */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package size={24} className="text-cofre-500" />
            Pacotes do Cofre
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Exporte e importe pastas como pacotes para compartilhar ou transferir
          </p>
        </div>

        {/* Exportar Pacote */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cofre-50 dark:bg-cofre-950/30 text-cofre-600 dark:text-cofre-400">
              <Upload size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Exportar Pacote
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Empacota uma pasta com todos os seus itens e anexos em um unico arquivo.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pasta para exportar
                  </label>
                  <select
                    value={pastaExportacao}
                    onChange={(e) => setPastaExportacao(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cofre-500"
                  >
                    <option value="">Selecione uma pasta...</option>
                    {pastasAchatadas.map((pasta) => (
                      <option key={pasta.id} value={pasta.id}>
                        {'  '.repeat(pasta.nivel)}{pasta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {exportando && (
                  <Progresso
                    valor={progressoExportacao}
                    cor="cofre"
                    mostrarPorcentagem
                    tamanho="medio"
                  />
                )}

                <Botao
                  variante="primario"
                  tamanho="medio"
                  icone={<Upload size={16} />}
                  onClick={tratarExportar}
                  carregando={exportando}
                  disabled={importando || !pastaExportacao}
                >
                  {exportando ? 'Exportando...' : 'Exportar pacote'}
                </Botao>
              </div>
            </div>
          </div>
        </div>

        {/* Importar Pacote */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dourado-50 dark:bg-dourado-950/30 text-dourado-600 dark:text-dourado-400">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Importar Pacote
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Importe um pacote VaultCraft para adicionar itens ao seu cofre.
              </p>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pasta de destino (opcional)
                  </label>
                  <select
                    value={pastaDestino}
                    onChange={(e) => setPastaDestino(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-cofre-500"
                  >
                    <option value="">Raiz do cofre</option>
                    {pastasAchatadas.map((pasta) => (
                      <option key={pasta.id} value={pasta.id}>
                        {'  '.repeat(pasta.nivel)}{pasta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fluxo visual */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <FolderOpen size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Selecionar arquivo
                  </span>
                  <ArrowRight size={14} className="text-gray-300" />
                  <CheckCircle2 size={16} className="text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Importar itens
                  </span>
                </div>

                {importando && (
                  <div className="flex items-center gap-2 text-sm text-cofre-600 dark:text-cofre-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-cofre-500 border-t-transparent" />
                    Importando pacote...
                  </div>
                )}

                <Botao
                  variante="secundario"
                  tamanho="medio"
                  icone={<FolderOpen size={16} />}
                  onClick={tratarImportar}
                  carregando={importando}
                  disabled={exportando}
                >
                  {importando ? 'Importando...' : 'Selecionar e importar pacote'}
                </Botao>
              </div>
            </div>
          </div>
        </div>

        {/* Nota sobre conflitos */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <AlertTriangle size={18} className="text-dourado-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Resolucao de conflitos
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Se um item com o mesmo identificador ja existir no cofre, a versao mais recente sera mantida.
              Itens novos serao adicionados normalmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
