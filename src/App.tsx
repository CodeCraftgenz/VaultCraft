// ============================================================
// VaultCraft - Componente Principal da Aplicacao
// Gerencia layout, navegacao por visao e onboarding
// ============================================================

import React, { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { useConfiguracoesStore } from '@/stores/configuracoesStore';
import { usePastasStore } from '@/stores/pastasStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useLicenseStore } from '@/stores/licenseStore';
import { useAtalhos } from '@/hooks/useAtalhos';
import { useTema } from '@/hooks/useTema';
import { ToastProvider } from '@/components/ui/Toast';
import { LayoutPrincipal } from '@/components/layout/LayoutPrincipal';
import { LoginView } from '@/components/license/LoginView';
import { Dialogo } from '@/components/ui/Dialogo';
import { Botao } from '@/components/ui/Botao';

// Paginas
import { PaginaInicial } from '@/pages/PaginaInicial';
import { PaginaItem } from '@/pages/PaginaItem';
import { PaginaBusca } from '@/pages/PaginaBusca';
import { PaginaVencimentos } from '@/pages/PaginaVencimentos';
import { PaginaBackup } from '@/pages/PaginaBackup';
import { PaginaPacotes } from '@/pages/PaginaPacotes';
import { PaginaHistorico } from '@/pages/PaginaHistorico';
import { PaginaConfiguracoes } from '@/pages/PaginaConfiguracoes';
import { PaginaAjuda } from '@/pages/PaginaAjuda';

import {
  Shield,
  FolderOpen,
  FileText,
  Lock,
  HardDrive,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

import type { Visao } from '@/domain/modelos';

// ========================
// Roteador de Visoes
// ========================

const RoteadorVisao: React.FC<{ visao: Visao }> = ({ visao }) => {
  switch (visao) {
    case 'inicio':
      return <PaginaInicial />;
    case 'item':
      return <PaginaItem />;
    case 'busca':
      return <PaginaBusca />;
    case 'vencimentos':
      return <PaginaVencimentos />;
    case 'backup':
      return <PaginaBackup />;
    case 'pacotes':
      return <PaginaPacotes />;
    case 'historico':
      return <PaginaHistorico />;
    case 'configuracoes':
      return <PaginaConfiguracoes />;
    case 'ajuda':
      return <PaginaAjuda />;
    default:
      return <PaginaInicial />;
  }
};

// ========================
// Modal de Onboarding
// ========================

const passosOnboarding = [
  {
    icone: <Shield size={40} className="text-cofre-500" />,
    titulo: 'Bem-vindo ao VaultCraft',
    descricao:
      'Seu cofre pessoal para organizar documentos, notas e checklists. Tudo armazenado localmente com seguranca.',
  },
  {
    icone: <FolderOpen size={40} className="text-dourado-500" />,
    titulo: 'Organize em pastas',
    descricao:
      'Crie pastas e subpastas para manter seus itens organizados. Use tags coloridas para categorizar.',
  },
  {
    icone: <FileText size={40} className="text-cofre-500" />,
    titulo: 'Tres tipos de itens',
    descricao:
      'Crie notas de texto livre, organize documentos com anexos, ou use checklists para listas de tarefas.',
  },
  {
    icone: <Lock size={40} className="text-cofre-600" />,
    titulo: 'Seguranca local',
    descricao:
      'Proteja com PIN, ative criptografia. Seus dados nunca saem do seu computador.',
  },
  {
    icone: <HardDrive size={40} className="text-green-500" />,
    titulo: 'Backup automatico',
    descricao:
      'Faca backup do cofre inteiro ou exporte pastas como pacotes. Restaure quando precisar.',
  },
];

const ModalOnboarding: React.FC<{ aoFinalizar: () => void }> = ({ aoFinalizar }) => {
  const [passoAtual, setPassoAtual] = React.useState(0);
  const passo = passosOnboarding[passoAtual];
  const ehUltimo = passoAtual === passosOnboarding.length - 1;

  return (
    <div className="text-center">
      {/* Indicador de passos */}
      <div className="flex items-center justify-center gap-1.5 mb-8">
        {passosOnboarding.map((_, indice) => (
          <div
            key={indice}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${
                indice === passoAtual
                  ? 'w-8 bg-cofre-500'
                  : indice < passoAtual
                  ? 'w-3 bg-cofre-300 dark:bg-cofre-700'
                  : 'w-3 bg-gray-200 dark:bg-gray-700'
              }
            `}
          />
        ))}
      </div>

      {/* Conteudo do passo */}
      <div className="flex flex-col items-center px-4">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-800 mb-6">
          {passo.icone}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {passo.titulo}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
          {passo.descricao}
        </p>
      </div>

      {/* Navegacao */}
      <div className="flex items-center justify-between mt-8 pt-4">
        <button
          onClick={() => setPassoAtual(Math.max(0, passoAtual - 1))}
          disabled={passoAtual === 0}
          className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {ehUltimo ? (
          <Botao
            variante="primario"
            tamanho="medio"
            icone={<ArrowRight size={16} />}
            onClick={aoFinalizar}
          >
            Comecar a usar
          </Botao>
        ) : (
          <Botao
            variante="primario"
            tamanho="medio"
            iconeDireita={<ChevronRight size={16} />}
            onClick={() => setPassoAtual(passoAtual + 1)}
          >
            Proximo
          </Botao>
        )}
      </div>

      {/* Pular */}
      {!ehUltimo && (
        <button
          onClick={aoFinalizar}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Pular introducao
        </button>
      )}
    </div>
  );
};

// ========================
// Indicador de Carregamento Global
// ========================

const IndicadorCarregamento: React.FC = () => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cofre-600 text-white animate-pulse-suave">
        <Shield size={32} />
      </div>
      <div className="flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cofre-500 border-t-transparent" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Carregando VaultCraft...
        </span>
      </div>
    </div>
  </div>
);

// ========================
// Componente App
// ========================

export const App: React.FC = () => {
  const {
    visaoAtual,
    carregando,
    mostrarOnboarding,
    definirMostrarOnboarding,
    definirCarregando,
    definirPrimeiraExecucao,
  } = useAppStore();

  const { isLicensed, isChecking, checkLicense } = useLicenseStore();
  const { carregarConfiguracoes } = useConfiguracoesStore();
  const { carregarPastas } = usePastasStore();
  const { carregarTags } = useTagsStore();

  // Inicializar tema
  useTema();

  // Registrar atalhos de teclado
  useAtalhos();

  // Verificar licenca ao iniciar
  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  // Inicializar a aplicacao somente apos licenca validada
  useEffect(() => {
    if (!isLicensed) return;

    const inicializar = async () => {
      definirCarregando(true);
      try {
        // Carregar dados iniciais em paralelo
        await Promise.all([
          carregarConfiguracoes(),
          carregarPastas(),
          carregarTags(),
        ]);

        // Verificar se eh primeira execucao
        const { obterConfiguracao } = useConfiguracoesStore.getState();
        const jaUsou = obterConfiguracao('onboarding_completo');
        if (!jaUsou) {
          definirPrimeiraExecucao(true);
          definirMostrarOnboarding(true);
        }
      } catch (erro) {
        console.error('Erro ao inicializar VaultCraft:', erro);
      } finally {
        definirCarregando(false);
      }
    };

    inicializar();
  }, [
    isLicensed,
    carregarConfiguracoes,
    carregarPastas,
    carregarTags,
    definirCarregando,
    definirPrimeiraExecucao,
    definirMostrarOnboarding,
  ]);

  const finalizarOnboarding = async () => {
    definirMostrarOnboarding(false);
    definirPrimeiraExecucao(false);
    try {
      const { salvarConfiguracao } = useConfiguracoesStore.getState();
      await salvarConfiguracao('onboarding_completo', 'true');
    } catch {
      // Falha silenciosa
    }
  };

  // Tela de carregamento enquanto verifica licenca
  if (isChecking) {
    return <IndicadorCarregamento />;
  }

  // Tela de login se nao licenciado
  if (!isLicensed) {
    return <LoginView />;
  }

  return (
    <ToastProvider>
      {/* Indicador de carregamento global */}
      {carregando && <IndicadorCarregamento />}

      {/* Layout principal */}
      <LayoutPrincipal>
        <RoteadorVisao visao={visaoAtual} />
      </LayoutPrincipal>

      {/* Modal de onboarding */}
      <Dialogo
        aberto={mostrarOnboarding}
        aoFechar={finalizarOnboarding}
        largura="media"
        fecharNoOverlay={false}
      >
        <ModalOnboarding aoFinalizar={finalizarOnboarding} />
      </Dialogo>
    </ToastProvider>
  );
};
