// ============================================================
// VaultCraft - Pagina de Vencimentos (TELA-05)
// Exibicao de itens com vencimento proximo ou atrasado
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CalendarDays,
  FileText,
  File,
  CheckSquare,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useVencimentosStore } from '@/stores/vencimentosStore';
import { useItensStore } from '@/stores/itensStore';
import { Badge } from '@/components/ui/Badge';
import { EstadoVazio } from '@/components/ui/EstadoVazio';
import type { Vencimento, TipoItem } from '@/domain/modelos';

// ========================
// Icones por tipo
// ========================

const iconesTipo: Record<TipoItem, React.ReactNode> = {
  nota: <FileText size={16} className="text-cofre-500" />,
  documento: <File size={16} className="text-dourado-500" />,
  checklist: <CheckSquare size={16} className="text-green-500" />,
};

// ========================
// Abas de periodo
// ========================

type AbaVencimento = 'atrasados' | '7dias' | '30dias' | '90dias';

interface AbaConfig {
  id: AbaVencimento;
  rotulo: string;
  icone: React.ReactNode;
}

const abas: AbaConfig[] = [
  { id: 'atrasados', rotulo: 'Atrasados', icone: <AlertTriangle size={16} /> },
  { id: '7dias', rotulo: 'Proximos 7 dias', icone: <Clock size={16} /> },
  { id: '30dias', rotulo: 'Proximos 30 dias', icone: <CalendarDays size={16} /> },
  { id: '90dias', rotulo: 'Proximos 90 dias', icone: <CalendarDays size={16} /> },
];

// ========================
// Card de Vencimento
// ========================

interface CardVencimentoProps {
  vencimento: Vencimento;
  aoClicar: () => void;
}

const CardVencimento: React.FC<CardVencimentoProps> = ({ vencimento, aoClicar }) => {
  const { item, dias_restantes, status } = vencimento;

  const rotuloStatus = () => {
    if (status === 'atrasado') return `${Math.abs(dias_restantes)} dias atrasado`;
    if (status === 'hoje') return 'Vence hoje';
    return `${dias_restantes} dias restantes`;
  };

  const varianteBadge = () => {
    if (status === 'atrasado') return 'perigo' as const;
    if (status === 'hoje') return 'aviso' as const;
    if (dias_restantes <= 7) return 'aviso' as const;
    return 'padrao' as const;
  };

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '';
    try {
      return new Date(dataStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dataStr;
    }
  };

  return (
    <div
      onClick={aoClicar}
      className={`
        flex items-center gap-4 p-4 rounded-lg border cursor-pointer
        transition-all duration-150
        hover:shadow-sm
        ${
          status === 'atrasado'
            ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'
            : status === 'hoje'
            ? 'border-dourado-200 dark:border-dourado-900 bg-dourado-50/50 dark:bg-dourado-950/20'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
        }
      `}
    >
      <div className="flex-shrink-0">{iconesTipo[item.tipo]}</div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {item.titulo}
        </h3>
        {item.descricao && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {item.descricao}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <Badge variante={varianteBadge()} tamanho="pequeno">
            {rotuloStatus()}
          </Badge>
          <p className="text-[10px] text-gray-400 mt-1">
            {formatarData(item.data_vencimento)}
          </p>
        </div>
        <button className="p-1.5 rounded text-gray-400 hover:text-cofre-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
};

// ========================
// Pagina de Vencimentos
// ========================

export const PaginaVencimentos: React.FC = () => {
  const { navegarPara } = useAppStore();
  const { vencimentos, carregando, carregarVencimentos } = useVencimentosStore();
  const { selecionarItem, definirModoEdicao } = useItensStore();
  const [abaAtiva, setAbaAtiva] = useState<AbaVencimento>('atrasados');

  useEffect(() => {
    carregarVencimentos(90);
  }, [carregarVencimentos]);

  const vencimentosFiltrados = vencimentos.filter((v) => {
    switch (abaAtiva) {
      case 'atrasados':
        return v.status === 'atrasado';
      case '7dias':
        return v.status !== 'atrasado' && v.dias_restantes <= 7;
      case '30dias':
        return v.status !== 'atrasado' && v.dias_restantes <= 30;
      case '90dias':
        return v.status !== 'atrasado' && v.dias_restantes <= 90;
      default:
        return true;
    }
  });

  const contadorAbas: Record<AbaVencimento, number> = {
    atrasados: vencimentos.filter((v) => v.status === 'atrasado').length,
    '7dias': vencimentos.filter((v) => v.status !== 'atrasado' && v.dias_restantes <= 7).length,
    '30dias': vencimentos.filter((v) => v.status !== 'atrasado' && v.dias_restantes <= 30).length,
    '90dias': vencimentos.filter((v) => v.status !== 'atrasado' && v.dias_restantes <= 90).length,
  };

  const tratarClicar = (vencimento: Vencimento) => {
    selecionarItem(vencimento.item);
    definirModoEdicao(false);
    navegarPara('item');
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* Cabecalho */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock size={24} className="text-dourado-500" />
            Vencimentos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Acompanhe os prazos dos seus itens
          </p>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-150
                ${
                  abaAtiva === aba.id
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }
              `}
            >
              {aba.icone}
              {aba.rotulo}
              {contadorAbas[aba.id] > 0 && (
                <span className={`
                  text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${aba.id === 'atrasados' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}
                `}>
                  {contadorAbas[aba.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista de vencimentos */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-cofre-500 border-t-transparent" />
          </div>
        ) : vencimentosFiltrados.length === 0 ? (
          <EstadoVazio
            icone={<CalendarDays size={32} />}
            titulo={abaAtiva === 'atrasados' ? 'Nenhum item atrasado' : 'Nenhum vencimento neste periodo'}
            descricao={abaAtiva === 'atrasados'
              ? 'Otimo! Todos os seus itens estao em dia.'
              : 'Nao ha itens com vencimento para este periodo.'}
          />
        ) : (
          <div className="space-y-2">
            {vencimentosFiltrados.map((vencimento) => (
              <CardVencimento
                key={vencimento.item.id}
                vencimento={vencimento}
                aoClicar={() => tratarClicar(vencimento)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
