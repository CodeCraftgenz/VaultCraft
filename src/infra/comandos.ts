/**
 * Camada de infraestrutura — chamadas aos commands Tauri.
 *
 * IMPORTANTE: os nomes das chaves do objeto passado a invoke()
 * devem corresponder EXATAMENTE aos nomes dos parâmetros no Rust
 * (snake_case), pois o Tauri usa serde para desserializar.
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Pasta,
  Item,
  Tag,
  Anexo,
  TarefaChecklist,
  LogAuditoria,
  ResultadoBusca,
} from '@/domain/modelos';

// ========================
// Pastas
// ========================

export async function listarPastas(): Promise<Pasta[]> {
  return invoke<Pasta[]>('listar_pastas');
}

export async function criarPasta(nome: string, pasta_pai_id: string | null): Promise<Pasta> {
  return invoke<Pasta>('criar_pasta', { nome, pasta_pai_id });
}

export async function renomearPasta(id: string, novo_nome: string): Promise<Pasta> {
  return invoke<Pasta>('renomear_pasta', { id, novo_nome });
}

export async function moverPasta(id: string, novo_pai_id: string | null): Promise<Pasta> {
  return invoke<Pasta>('mover_pasta', { id, novo_pai_id });
}

export async function excluirPasta(id: string): Promise<void> {
  return invoke<void>('excluir_pasta', { id });
}

// ========================
// Itens
// ========================

export async function listarItens(pasta_id: string): Promise<Item[]> {
  return invoke<Item[]>('listar_itens', { pasta_id });
}

export async function obterItem(id: string): Promise<Item> {
  return invoke<Item>('obter_item', { id });
}

/** O DTO deve corresponder ao NovoItem do Rust */
export interface DadosNovoItem {
  pasta_id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  conteudo_nota?: string | null;
  data_vencimento?: string | null;
  tag_ids?: string[];
}

export async function criarItem(dados: DadosNovoItem): Promise<Item> {
  return invoke<Item>('criar_item', { dados });
}

/** O DTO deve corresponder ao AtualizacaoItem do Rust */
export interface DadosAtualizacaoItem {
  titulo?: string;
  descricao?: string | null;
  conteudo_nota?: string | null;
  data_vencimento?: string | null;
  pasta_id?: string;
  tag_ids?: string[];
}

export async function atualizarItem(id: string, dados: DadosAtualizacaoItem): Promise<Item> {
  return invoke<Item>('atualizar_item', { id, dados });
}

export async function excluirItem(id: string): Promise<void> {
  return invoke<void>('excluir_item', { id });
}

// ========================
// Tags
// ========================

export async function listarTags(): Promise<Tag[]> {
  return invoke<Tag[]>('listar_tags');
}

export async function criarTag(nome: string, cor?: string | null): Promise<Tag> {
  return invoke<Tag>('criar_tag', { nome, cor });
}

export async function atualizarTag(id: string, nome: string, cor?: string | null): Promise<Tag> {
  return invoke<Tag>('atualizar_tag', { id, nome, cor });
}

export async function excluirTag(id: string): Promise<void> {
  return invoke<void>('excluir_tag', { id });
}

// ========================
// Anexos
// ========================

export async function adicionarAnexo(caminho_arquivo: string, item_id: string): Promise<Anexo> {
  return invoke<Anexo>('adicionar_anexo', { caminho_arquivo, item_id });
}

export async function removerAnexo(id: string): Promise<void> {
  return invoke<void>('remover_anexo', { id });
}

export async function abrirAnexo(id: string): Promise<string> {
  return invoke<string>('abrir_anexo', { id });
}

export async function listarAnexos(item_id: string): Promise<Anexo[]> {
  return invoke<Anexo[]>('listar_anexos', { item_id });
}

// ========================
// Tarefas (Checklist)
// ========================

export async function listarTarefas(item_id: string): Promise<TarefaChecklist[]> {
  return invoke<TarefaChecklist[]>('listar_tarefas', { item_id });
}

export async function criarTarefa(item_id: string, titulo: string, ordem?: number): Promise<TarefaChecklist> {
  return invoke<TarefaChecklist>('criar_tarefa', { item_id, titulo, ordem });
}

export interface DadosAtualizacaoTarefa {
  titulo?: string;
  concluida?: boolean;
  ordem?: number;
}

export async function atualizarTarefa(id: string, dados: DadosAtualizacaoTarefa): Promise<TarefaChecklist> {
  return invoke<TarefaChecklist>('atualizar_tarefa', { id, dados });
}

export async function excluirTarefa(id: string): Promise<void> {
  return invoke<void>('excluir_tarefa', { id });
}

export async function reordenarTarefas(ordens: [string, number][]): Promise<void> {
  return invoke<void>('reordenar_tarefas', { ordens });
}

export async function marcarTarefa(id: string, concluida: boolean): Promise<TarefaChecklist> {
  return invoke<TarefaChecklist>('marcar_tarefa', { id, concluida });
}

// ========================
// Busca
// ========================

export interface FiltrosBuscaInvoke {
  tipo?: string;
  pasta_id?: string;
  tag_ids?: string[];
  data_inicio?: string;
  data_fim?: string;
}

export async function buscarItens(termo: string, filtros?: FiltrosBuscaInvoke): Promise<ResultadoBusca[]> {
  return invoke<ResultadoBusca[]>('buscar_itens', { termo, filtros });
}

// ========================
// Vencimentos
// ========================

export async function listarVencimentos(periodo?: number): Promise<Item[]> {
  return invoke<Item[]>('listar_vencimentos', { periodo });
}

// ========================
// Backup e Pacotes
// ========================

export async function criarBackup(destino: string): Promise<string> {
  return invoke<string>('criar_backup', { destino });
}

export async function restaurarBackup(arquivo: string): Promise<void> {
  return invoke<void>('restaurar_backup', { arquivo });
}

export async function exportarPacote(pasta_id: string, destino: string): Promise<string> {
  return invoke<string>('exportar_pacote', { pasta_id, destino });
}

export async function importarPacote(arquivo: string): Promise<void> {
  return invoke<void>('importar_pacote', { arquivo });
}

// ========================
// Exportação
// ========================

export async function exportarItemPdf(item_id: string, destino: string): Promise<string> {
  return invoke<string>('exportar_item_pdf', { item_id, destino });
}

export async function exportarListaCsv(pasta_id: string, destino: string): Promise<string> {
  return invoke<string>('exportar_lista_csv', { pasta_id, destino });
}

// ========================
// Auditoria
// ========================

export interface FiltrosAuditoriaInvoke {
  tipo_evento?: string;
  entidade_tipo?: string;
  entidade_id?: string;
  limite?: number;
  offset?: number;
}

export async function listarHistorico(filtros?: FiltrosAuditoriaInvoke): Promise<LogAuditoria[]> {
  return invoke<LogAuditoria[]>('listar_historico', { filtros });
}

// ========================
// Configurações
// ========================

export interface Configuracao {
  chave: string;
  valor: string | null;
  atualizado_em: string;
}

export async function obterConfiguracao(chave: string): Promise<Configuracao | null> {
  return invoke<Configuracao | null>('obter_configuracao', { chave });
}

export async function salvarConfiguracao(chave: string, valor: string): Promise<Configuracao> {
  return invoke<Configuracao>('salvar_configuracao', { chave, valor });
}

export async function obterTodasConfiguracoes(): Promise<Configuracao[]> {
  return invoke<Configuracao[]>('obter_todas_configuracoes');
}

// ========================
// Manutenção
// ========================

export async function compactarBanco(): Promise<void> {
  return invoke<void>('compactar_banco');
}
