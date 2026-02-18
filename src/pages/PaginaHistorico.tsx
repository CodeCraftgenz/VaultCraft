// ============================================================
// VaultCraft - Pagina de Historico (TELA-08)
// Log de auditoria com filtros
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  History,
  Filter,
  FolderPlus,
  FileEdit,
  Trash2,
  Download,
  Upload,
  Settings,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Botao } from '@/components/ui/Botao';
import { Badge } from '@/components/ui/Badge';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import * as comandos from '@/infra/comandos';
import type { LogAuditoria } from '@/domain/modelos';

// ========================
// Mapeamento de eventos
// ========================

interface ConfigEvento {
  rotulo: string;
  icone: React.ReactNode;
  cor: string;
}

const configEventos: Record<string, ConfigEvento> = {
  criar: { rotulo: 'Criacao', icone: <FolderPlus size={14} />, cor: '#22c55e' },
  atualizar: { rotulo: 'Atualizacao', icone: <FileEdit size={14} />, cor: '#3b82f6' },
  excluir: { rotulo: 'Exclusao', icone: <Trash2 size={14} />, cor: '#ef4444' },
  backup: { rotulo: 'Backup', icone: <Download size={14} />, cor: '#8b5cf6' },
  restaurar: { rotulo: 'Restauracao', icone: <Upload size={14} />, cor: '#f59e0b' },
  configuracao: { rotulo: 'Configuracao', icone: <Settings size={14} />, cor: '#6b7280' },
};

const obterConfigEvento = (tipoEvento: string): ConfigEvento => {
  // Tenta encontrar pelo prefixo
  for (const [chave, config] of Object.entries(configEventos)) {
    if (tipoEvento.toLowerCase().includes(chave)) {
      return config;
    }
  }
  return {
    rotulo: tipoEvento,
    icone: <History size={14} />,
    cor: '#6b7280',
  };
};

// ========================
// Componente de registro
// ========================

interface RegistroHistoricoProps {
  log: LogAuditoria;
}

const RegistroHistorico: React.FC<RegistroHistoricoProps> = ({ log }) => {
  const config = obterConfigEvento(log.tipo_evento);

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      {/* Icone do evento */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
        style={{ backgroundColor: `${config.cor}15`, color: config.cor }}
      >
        {config.icone}
      </div>

      {/* Detalhes */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variante="personalizado" cor={config.cor} tamanho="pequeno">
            {config.rotulo}
          </Badge>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {log.entidade_tipo}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {log.detalhes}
        </p>
      </div>

      {/* Data */}
      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap">
        {formatarData(log.criado_em)}
      </span>
    </div>
  );
};

// ========================
// Pagina de Historico
// ========================

export const PaginaHistorico: React.FC = () => {
  const [registros, setRegistros] = useState<LogAuditoria[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroEvento, setFiltroEvento] = useState<string>('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [pagina, setPagina] = useState(0);
  const limitePorPagina = 50;

  const carregarRegistros = useCallback(async (offset = 0) => {
    setCarregando(true);
    try {
      const dados = await comandos.listarHistorico({
        tipo_evento: filtroEvento || undefined,
        limite: limitePorPagina,
        offset,
      });
      if (offset === 0) {
        setRegistros(dados);
      } else {
        setRegistros((anteriores) => [...anteriores, ...dados]);
      }
    } catch (erro) {
      console.error('Erro ao carregar historico:', erro);
    } finally {
      setCarregando(false);
    }
  }, [filtroEvento]);

  useEffect(() => {
    setPagina(0);
    carregarRegistros(0);
  }, [carregarRegistros]);

  const carregarMais = () => {
    const novaPagina = pagina + 1;
    setPagina(novaPagina);
    carregarRegistros(novaPagina * limitePorPagina);
  };

  const tiposEvento = Object.entries(configEventos);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Cabecalho */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History size={24} className="text-cofre-500" />
              Historico de Atividades
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Registro de todas as acoes realizadas no cofre
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Botao
              variante="fantasma"
              tamanho="pequeno"
              icone={<RefreshCw size={14} />}
              onClick={() => {
                setPagina(0);
                carregarRegistros(0);
              }}
            >
              Atualizar
            </Botao>
            <Botao
              variante="secundario"
              tamanho="pequeno"
              icone={<Filter size={14} />}
              iconeDireita={<ChevronDown size={14} />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
            >
              Filtrar
            </Botao>
          </div>
        </div>

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Tipo de evento
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFiltroEvento('')}
                className={`
                  px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                  ${!filtroEvento
                    ? 'bg-cofre-100 text-cofre-700 dark:bg-cofre-900/50 dark:text-cofre-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
                `}
              >
                Todos
              </button>
              {tiposEvento.map(([chave, config]) => (
                <button
                  key={chave}
                  onClick={() => setFiltroEvento(chave)}
                  className={`
                    flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                    ${filtroEvento === chave
                      ? 'bg-cofre-100 text-cofre-700 dark:bg-cofre-900/50 dark:text-cofre-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}
                  `}
                >
                  {config.icone}
                  {config.rotulo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de registros */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {carregando && registros.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-cofre-500 border-t-transparent" />
            </div>
          ) : registros.length === 0 ? (
            <EstadoVazio
              icone={<History size={32} />}
              titulo="Sem registros"
              descricao="O historico de atividades aparecera aqui conforme voce utilizar o cofre."
            />
          ) : (
            <>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {registros.map((log) => (
                  <RegistroHistorico key={log.id} log={log} />
                ))}
              </div>

              {/* Carregar mais */}
              {registros.length >= (pagina + 1) * limitePorPagina && (
                <div className="p-4 text-center border-t border-gray-100 dark:border-gray-800">
                  <Botao
                    variante="fantasma"
                    tamanho="pequeno"
                    onClick={carregarMais}
                    carregando={carregando}
                  >
                    Carregar mais
                  </Botao>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
