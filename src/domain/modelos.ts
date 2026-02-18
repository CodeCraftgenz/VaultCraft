// ============================================================
// VaultCraft - Modelos de Dominio
// Todas as interfaces e tipos do sistema
// ============================================================

/** Tipos possiveis de item no cofre */
export type TipoItem = 'nota' | 'documento' | 'checklist';

/** Representacao de uma pasta no cofre */
export interface Pasta {
  id: string;
  pasta_pai_id: string | null;
  nome: string;
  caminho: string;
  criado_em: string;
  atualizado_em: string;
  filhas?: Pasta[];
}

/** Representacao de um item (nota, documento ou checklist) */
export interface Item {
  id: string;
  pasta_id: string;
  tipo: TipoItem;
  titulo: string;
  descricao: string;
  conteudo_nota: string | null;
  data_vencimento: string | null;
  criado_em: string;
  atualizado_em: string;
  tags: Tag[];
  anexos: Anexo[];
}

/** Tag para categorizacao de itens */
export interface Tag {
  id: string;
  nome: string;
  cor: string;
  criado_em: string;
}

/** Arquivo anexado a um item ou tarefa */
export interface Anexo {
  id: string;
  item_id: string | null;
  tarefa_id: string | null;
  nome_original: string;
  caminho_interno: string;
  tamanho: number;
  tipo_mime: string;
  hash_sha256: string;
  criado_em: string;
}

/** Tarefa de um checklist */
export interface TarefaChecklist {
  id: string;
  item_id: string;
  titulo: string;
  concluida: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
  anexos: Anexo[];
}

/** Registro de auditoria */
export interface LogAuditoria {
  id: string;
  tipo_evento: string;
  entidade_tipo: string;
  entidade_id: string;
  detalhes: string;
  criado_em: string;
}

/** Resultado de busca com relevancia */
export interface ResultadoBusca {
  item: Item;
  relevancia: number;
}

/** Filtros para busca avancada */
export interface FiltrosBusca {
  termo: string;
  pasta_id?: string;
  tipo?: TipoItem;
  tags?: string[];
  vencimento?: 'proximo' | 'atrasado';
  data_inicio?: string;
  data_fim?: string;
}

/** Representacao de um vencimento proximo ou atrasado */
export interface Vencimento {
  item: Item;
  dias_restantes: number;
  status: 'atrasado' | 'hoje' | 'proximo';
}

/** Dados para criacao de uma pasta */
export interface CriarPastaPayload {
  nome: string;
  pasta_pai_id: string | null;
}

/** Dados para criacao de um item */
export interface CriarItemPayload {
  pasta_id: string;
  tipo: TipoItem;
  titulo: string;
  descricao?: string;
  conteudo_nota?: string;
  data_vencimento?: string;
  tags?: string[];
}

/** Dados para atualizacao de um item */
export interface AtualizarItemPayload {
  id: string;
  titulo?: string;
  descricao?: string;
  conteudo_nota?: string;
  data_vencimento?: string | null;
  tags?: string[];
}

/** Dados para criacao de uma tarefa */
export interface CriarTarefaPayload {
  item_id: string;
  titulo: string;
  ordem: number;
}

/** Dados para atualizacao de uma tarefa */
export interface AtualizarTarefaPayload {
  id: string;
  titulo?: string;
  concluida?: boolean;
  ordem?: number;
}

/** Visoes disponiveis na aplicacao */
export type Visao =
  | 'inicio'
  | 'item'
  | 'busca'
  | 'vencimentos'
  | 'backup'
  | 'pacotes'
  | 'historico'
  | 'configuracoes'
  | 'ajuda';

/** Temas da aplicacao */
export type Tema = 'claro' | 'escuro' | 'sistema';
