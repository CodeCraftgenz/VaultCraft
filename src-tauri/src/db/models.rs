// =============================================================================
// VaultCraft — Modelos de Dados
// =============================================================================
// Define todas as estruturas de dados usadas pelo aplicativo.
// Utiliza serde para serialização/deserialização JSON (comunicação com frontend).
// Todos os IDs são UUIDs v4 como String para compatibilidade com SQLite.
// Datas seguem o formato ISO 8601 (UTC) como String.
// =============================================================================

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

// =============================================================================
// TipoItem — Enum que define os três tipos de item suportados
// =============================================================================
// Nota: texto livre (Markdown), armazenado em conteudo_nota
// Documento: metadados + anexos (PDFs, imagens, etc.)
// Checklist: lista de tarefas com estado concluída/pendente
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TipoItem {
    Nota,
    Documento,
    Checklist,
}

impl fmt::Display for TipoItem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TipoItem::Nota => write!(f, "nota"),
            TipoItem::Documento => write!(f, "documento"),
            TipoItem::Checklist => write!(f, "checklist"),
        }
    }
}

impl TipoItem {
    /// Converte uma string do banco de dados para o enum correspondente.
    /// Retorna Nota como padrão se o valor não for reconhecido.
    pub fn de_str(valor: &str) -> Self {
        match valor {
            "nota" => TipoItem::Nota,
            "documento" => TipoItem::Documento,
            "checklist" => TipoItem::Checklist,
            _ => TipoItem::Nota,
        }
    }
}

// =============================================================================
// Pasta — Representa uma pasta no cofre (hierarquia com auto-referência)
// =============================================================================
// pasta_pai_id: None significa pasta raiz
// caminho: caminho completo na árvore (ex: "/Pessoal/Finanças")
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pasta {
    pub id: String,
    pub pasta_pai_id: Option<String>,
    pub nome: String,
    pub caminho: String,
    pub criado_em: String,
    pub atualizado_em: String,
}

// =============================================================================
// Item — Entidade central do cofre (nota, documento ou checklist)
// =============================================================================
// tags e anexos são carregados separadamente e anexados ao struct.
// conteudo_nota só é preenchido quando tipo == Nota.
// data_vencimento é opcional, usado para lembretes de prazos.
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Item {
    pub id: String,
    pub pasta_id: String,
    pub tipo: TipoItem,
    pub titulo: String,
    pub descricao: Option<String>,
    pub conteudo_nota: Option<String>,
    pub data_vencimento: Option<String>,
    pub criado_em: String,
    pub atualizado_em: String,
    /// Tags associadas ao item (carregadas via JOIN)
    #[serde(default)]
    pub tags: Vec<Tag>,
    /// Anexos do item (carregados separadamente)
    #[serde(default)]
    pub anexos: Vec<Anexo>,
}

// =============================================================================
// Tag — Rótulo colorido para categorização de itens
// =============================================================================
// cor: string hexadecimal (#RRGGBB), padrão é roxo (#6366f1)
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub nome: String,
    pub cor: String,
    pub criado_em: String,
}

// =============================================================================
// Anexo — Arquivo armazenado localmente no cofre
// =============================================================================
// Pode pertencer a um item (item_id) ou a uma tarefa (tarefa_id).
// caminho_interno: caminho relativo ao diretório de armazenamento.
// hash_sha256: hash para verificação de integridade do arquivo.
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Anexo {
    pub id: String,
    pub item_id: Option<String>,
    pub tarefa_id: Option<String>,
    pub nome_original: String,
    pub caminho_interno: String,
    pub tamanho: i64,
    pub tipo_mime: String,
    pub hash_sha256: Option<String>,
    pub criado_em: String,
}

// =============================================================================
// TarefaChecklist — Tarefa individual de uma checklist
// =============================================================================
// concluida: false = pendente, true = concluída
// ordem: inteiro para controlar posição na lista (drag-and-drop)
// anexos: tarefas individuais também podem ter anexos
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TarefaChecklist {
    pub id: String,
    pub item_id: String,
    pub titulo: String,
    pub concluida: bool,
    pub ordem: i32,
    pub criado_em: String,
    pub atualizado_em: String,
    /// Anexos específicos desta tarefa
    #[serde(default)]
    pub anexos: Vec<Anexo>,
}

// =============================================================================
// LogAuditoria — Registro de evento no log de auditoria
// =============================================================================
// Nunca é deletado. Serve para rastreabilidade de ações do usuário.
// tipo_evento: "criacao", "atualizacao", "exclusao", "backup", etc.
// entidade_tipo: "pasta", "item", "tag", "anexo", "tarefa", etc.
// detalhes: JSON livre com informações adicionais sobre o evento.
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogAuditoria {
    pub id: String,
    pub tipo_evento: String,
    pub entidade_tipo: String,
    pub entidade_id: Option<String>,
    pub detalhes: Option<String>,
    pub criado_em: String,
}

// =============================================================================
// Configuracao — Par chave/valor para preferências do aplicativo
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Configuracao {
    pub chave: String,
    pub valor: Option<String>,
    pub atualizado_em: String,
}

// =============================================================================
// ResultadoBusca — Item retornado pela busca full-text (FTS)
// =============================================================================
// relevancia: score do FTS5 (quanto menor, mais relevante —
// invertemos para que maior = melhor no frontend)
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResultadoBusca {
    pub item: Item,
    pub relevancia: f64,
}

// =============================================================================
// ManifestoBackup — Metadados do backup para validação na restauração
// =============================================================================
// Incluído como manifesto.json dentro do arquivo .vaultbackup (ZIP).
// Permite verificar integridade e compatibilidade antes de restaurar.
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManifestoBackup {
    pub versao_app: String,
    pub versao_schema: i32,
    pub data: String,
    pub total_itens: i64,
    pub total_anexos: i64,
    pub hash_banco: String,
    /// Mapa de caminho_interno -> hash SHA-256 de cada anexo
    pub hashes_anexos: HashMap<String, String>,
}

// =============================================================================
// Structs auxiliares para criação/atualização (DTOs do frontend)
// =============================================================================
// Separamos os DTOs dos modelos completos porque na criação
// não temos id, criado_em, etc. — são gerados pelo backend.
// =============================================================================

/// DTO para criação de uma nova pasta
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovaPasta {
    pub nome: String,
    pub pasta_pai_id: Option<String>,
}

/// DTO para criação de um novo item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovoItem {
    pub pasta_id: String,
    pub tipo: TipoItem,
    pub titulo: String,
    pub descricao: Option<String>,
    pub conteudo_nota: Option<String>,
    pub data_vencimento: Option<String>,
    pub tag_ids: Option<Vec<String>>,
}

/// DTO para atualização de um item existente
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtualizacaoItem {
    pub titulo: Option<String>,
    pub descricao: Option<String>,
    pub conteudo_nota: Option<String>,
    pub data_vencimento: Option<String>,
    pub pasta_id: Option<String>,
    pub tag_ids: Option<Vec<String>>,
}

/// DTO para criação/atualização de tag
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovaTag {
    pub nome: String,
    pub cor: Option<String>,
}

/// DTO para criação de tarefa de checklist
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NovaTarefa {
    pub item_id: String,
    pub titulo: String,
    pub ordem: Option<i32>,
}

/// DTO para atualização de tarefa
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtualizacaoTarefa {
    pub titulo: Option<String>,
    pub concluida: Option<bool>,
    pub ordem: Option<i32>,
}

/// Filtros para busca full-text
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FiltrosBusca {
    pub tipo: Option<TipoItem>,
    pub pasta_id: Option<String>,
    pub tag_ids: Option<Vec<String>>,
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
}

/// Filtros para listagem de eventos de auditoria
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FiltrosAuditoria {
    pub tipo_evento: Option<String>,
    pub entidade_tipo: Option<String>,
    pub entidade_id: Option<String>,
    pub limite: Option<i64>,
    pub offset: Option<i64>,
}
