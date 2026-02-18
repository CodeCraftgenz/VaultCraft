// =============================================================================
// VaultCraft — Serviço de Auditoria
// =============================================================================
// Responsável por registrar eventos no log de auditoria.
// Encapsula a chamada ao banco para facilitar uso nos commands.
//
// Por que um serviço separado para auditoria?
//   - Centraliza a lógica de logging em um único lugar
//   - Facilita adicionar lógica futura (ex: notificações, limites)
//   - Permite que os commands chamem uma função simples sem saber dos detalhes
// =============================================================================

use anyhow::Result;
use rusqlite::Connection;

use crate::db::queries;

/// Registra um evento no log de auditoria do cofre.
///
/// Parâmetros:
/// - conexao: referência ao banco de dados
/// - tipo_evento: tipo da ação ("criacao", "atualizacao", "exclusao", "backup", "restauracao", etc.)
/// - entidade_tipo: tipo da entidade afetada ("pasta", "item", "tag", "anexo", "tarefa", etc.)
/// - entidade_id: ID da entidade (opcional, pode ser None para eventos globais)
/// - detalhes: informações adicionais em formato livre (opcional, pode ser JSON)
///
/// Exemplo de uso:
/// ```
/// registrar(&conn, "criacao", "item", Some("uuid-123"), Some("{\"titulo\": \"Minha nota\"}"))?;
/// ```
pub fn registrar(
    conexao: &Connection,
    tipo_evento: &str,
    entidade_tipo: &str,
    entidade_id: Option<&str>,
    detalhes: Option<&str>,
) -> Result<()> {
    queries::registrar_evento_auditoria(conexao, tipo_evento, entidade_tipo, entidade_id, detalhes)
}
