// ============================================================
// VaultCraft - Pagina de Configuracoes (TELA-09)
// Preferencias do usuario e manutencao
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Lock,
  Shield,
  Database,
  BookOpen,
  Palette,
  Info,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useConfiguracoesStore } from '@/stores/configuracoesStore';
import { Botao } from '@/components/ui/Botao';
import { Campo } from '@/components/ui/Campo';
import { DialogoConfirmacao } from '@/components/ui/Dialogo';
import { useToast } from '@/components/ui/Toast';
import * as comandos from '@/infra/comandos';
import type { Tema } from '@/domain/modelos';

// ========================
// Secao de configuracao
// ========================

interface SecaoProps {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}

const Secao: React.FC<SecaoProps> = ({ icone, titulo, descricao, children }) => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="text-cofre-500 dark:text-cofre-400">{icone}</div>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {titulo}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {descricao}
        </p>
      </div>
    </div>
    <div className="ml-9">{children}</div>
  </div>
);

// ========================
// Pagina de Configuracoes
// ========================

export const PaginaConfiguracoes: React.FC = () => {
  const { tema, definirTema, definirMostrarOnboarding, navegarPara } = useAppStore();
  const { configuracoes, carregarConfiguracoes, salvarConfiguracao } = useConfiguracoesStore();
  const toast = useToast();

  const [pinAtual, setPinAtual] = useState('');
  const [novoPin, setNovoPin] = useState('');
  const [confirmarPin, setConfirmarPin] = useState('');
  const [criptografiaAtiva, setCriptografiaAtiva] = useState(false);
  const [compactando, setCompactando] = useState(false);
  const [confirmarCompactacao, setConfirmarCompactacao] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  useEffect(() => {
    setCriptografiaAtiva(configuracoes['criptografia_ativa'] === 'true');
  }, [configuracoes]);

  const tratarMudarTema = async (novoTema: Tema) => {
    definirTema(novoTema);
    await salvarConfiguracao('tema', novoTema);
    toast.sucesso('Tema atualizado', `Tema alterado para ${novoTema}.`);
  };

  const tratarSalvarPin = async () => {
    if (novoPin !== confirmarPin) {
      toast.erro('PIN nao confere', 'O novo PIN e a confirmacao nao sao iguais.');
      return;
    }
    if (novoPin.length < 4) {
      toast.aviso('PIN muito curto', 'O PIN deve ter pelo menos 4 digitos.');
      return;
    }

    try {
      await salvarConfiguracao('pin', novoPin);
      toast.sucesso('PIN salvo', 'Seu PIN de acesso foi atualizado.');
      setPinAtual('');
      setNovoPin('');
      setConfirmarPin('');
    } catch (erro) {
      toast.erro('Erro ao salvar PIN', String(erro));
    }
  };

  const tratarAlternarCriptografia = async () => {
    const novoValor = !criptografiaAtiva;
    setCriptografiaAtiva(novoValor);
    try {
      await salvarConfiguracao('criptografia_ativa', String(novoValor));
      toast.sucesso(
        novoValor ? 'Criptografia ativada' : 'Criptografia desativada',
        novoValor
          ? 'Seus dados serao criptografados a partir de agora.'
          : 'A criptografia foi desabilitada.'
      );
    } catch (erro) {
      setCriptografiaAtiva(!novoValor);
      toast.erro('Erro ao alterar criptografia', String(erro));
    }
  };

  const tratarCompactarBanco = async () => {
    setCompactando(true);
    setConfirmarCompactacao(false);
    try {
      await comandos.compactarBanco();
      toast.sucesso('Banco compactado', 'O banco de dados foi otimizado com sucesso.');
    } catch (erro) {
      toast.erro('Erro ao compactar', String(erro));
    } finally {
      setCompactando(false);
    }
  };

  const temas: { valor: Tema; rotulo: string; icone: React.ReactNode }[] = [
    { valor: 'claro', rotulo: 'Claro', icone: <Sun size={18} /> },
    { valor: 'escuro', rotulo: 'Escuro', icone: <Moon size={18} /> },
    { valor: 'sistema', rotulo: 'Sistema', icone: <Monitor size={18} /> },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Cabecalho */}
        <div className="mb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings size={24} className="text-cofre-500" />
            Configuracoes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Personalize e configure seu cofre
          </p>
        </div>

        {/* Tema */}
        <Secao
          icone={<Palette size={20} />}
          titulo="Aparencia"
          descricao="Escolha o tema visual da aplicacao"
        >
          <div className="flex gap-2">
            {temas.map((t) => (
              <button
                key={t.valor}
                onClick={() => tratarMudarTema(t.valor)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium
                  transition-all duration-150
                  ${
                    tema === t.valor
                      ? 'border-cofre-500 bg-cofre-50 text-cofre-700 dark:bg-cofre-950/50 dark:text-cofre-400 dark:border-cofre-600 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                {t.icone}
                {t.rotulo}
              </button>
            ))}
          </div>
        </Secao>

        {/* PIN de Acesso */}
        <Secao
          icone={<Lock size={20} />}
          titulo="PIN de Acesso"
          descricao="Defina um PIN para proteger o acesso ao cofre"
        >
          <div className="space-y-3 max-w-xs">
            <Campo
              rotulo="PIN atual"
              type="password"
              value={pinAtual}
              onChange={(e) => setPinAtual(e.target.value)}
              placeholder="Seu PIN atual"
              icone={<Lock size={16} />}
            />
            <Campo
              rotulo="Novo PIN"
              type="password"
              value={novoPin}
              onChange={(e) => setNovoPin(e.target.value)}
              placeholder="Novo PIN (min. 4 digitos)"
              icone={<Lock size={16} />}
            />
            <Campo
              rotulo="Confirmar PIN"
              type="password"
              value={confirmarPin}
              onChange={(e) => setConfirmarPin(e.target.value)}
              placeholder="Repita o novo PIN"
              icone={<Lock size={16} />}
            />
            <Botao
              variante="primario"
              tamanho="medio"
              onClick={tratarSalvarPin}
              disabled={!novoPin || !confirmarPin}
            >
              Salvar PIN
            </Botao>
          </div>
        </Secao>

        {/* Criptografia */}
        <Secao
          icone={<Shield size={20} />}
          titulo="Criptografia"
          descricao="Proteja seus dados com criptografia local"
        >
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Criptografia dos dados
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {criptografiaAtiva
                  ? 'Seus dados estao sendo criptografados'
                  : 'Seus dados nao estao criptografados'}
              </p>
            </div>
            <button
              onClick={tratarAlternarCriptografia}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cofre-500
                ${criptografiaAtiva ? 'bg-cofre-600' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 rounded-full bg-white transform transition-transform duration-200
                  ${criptografiaAtiva ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </Secao>

        {/* Manutencao do Banco */}
        <Secao
          icone={<Database size={20} />}
          titulo="Manutencao"
          descricao="Opcoes de manutencao do banco de dados"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compactar banco de dados
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Otimiza o espaco em disco e melhora a performance
                </p>
              </div>
              <Botao
                variante="secundario"
                tamanho="pequeno"
                onClick={() => setConfirmarCompactacao(true)}
                carregando={compactando}
              >
                Compactar
              </Botao>
            </div>
          </div>
        </Secao>

        {/* Tutorial */}
        <Secao
          icone={<BookOpen size={20} />}
          titulo="Tutorial"
          descricao="Reveja o tutorial de introducao"
        >
          <div className="flex items-center gap-3">
            <Botao
              variante="secundario"
              tamanho="medio"
              icone={<BookOpen size={16} />}
              onClick={() => definirMostrarOnboarding(true)}
            >
              Ver tutorial novamente
            </Botao>
            <Botao
              variante="fantasma"
              tamanho="medio"
              icone={<Info size={16} />}
              onClick={() => navegarPara('ajuda')}
            >
              Pagina de ajuda
            </Botao>
          </div>
        </Secao>

        {/* Versao */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            VaultCraft v0.1.0 - Seu cofre pessoal
          </p>
        </div>
      </div>

      {/* Dialogo de confirmacao de compactacao */}
      <DialogoConfirmacao
        aberto={confirmarCompactacao}
        aoFechar={() => setConfirmarCompactacao(false)}
        aoConfirmar={tratarCompactarBanco}
        titulo="Compactar banco de dados"
        mensagem="Esta operacao otimiza o banco de dados. Pode levar alguns instantes. Deseja continuar?"
        textoBotaoConfirmar="Compactar"
        variante="primario"
      />
    </div>
  );
};
