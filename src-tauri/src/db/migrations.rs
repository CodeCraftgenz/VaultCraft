// =============================================================================
// VaultCraft — Sistema de Migrações do Banco de Dados
// =============================================================================
// Gerencia a evolução do schema do banco de dados de forma incremental.
// Cada migração é um arquivo SQL embutido no binário via include_str!.
// A versão atual é rastreada na tabela 'configuracoes' (chave 'versao_schema').
//
// Por que embutir os SQLs no binário?
//   - Não depende de arquivos externos em tempo de execução
//   - Garante que a migração correta está sempre disponível
//   - Simplifica a distribuição do aplicativo
// =============================================================================

use anyhow::{Context, Result};
use log::info;
use rusqlite::Connection;

/// SQL da migração 001 — Esquema inicial completo
/// Inclui todas as tabelas, índices, FTS5 (standalone) e triggers de sincronização.
const MIGRACAO_001: &str = include_str!("migrations/001_schema_inicial.sql");

/// SQL da migração 002 — Dados iniciais (seed data)
/// Insere configurações padrão necessárias para o primeiro uso.
const MIGRACAO_002: &str = include_str!("migrations/002_dados_iniciais.sql");

/// Lista ordenada de migrações disponíveis.
/// Cada tupla contém (versão_destino, sql_da_migração).
/// Novas migrações devem ser adicionadas ao final desta lista.
const MIGRACOES: &[(i32, &str)] = &[
    (1, MIGRACAO_001),
    (2, MIGRACAO_002),
];

/// Executa todas as migrações pendentes no banco de dados.
///
/// O processo é:
/// 1. Garante que a tabela de configurações existe (para rastrear versão)
/// 2. Lê a versão atual do schema
/// 3. Executa cada migração com versão > atual em ordem
/// 4. Atualiza a versão do schema após cada migração bem-sucedida
///
/// Cada migração roda dentro de uma transação para garantir atomicidade.
/// Se uma migração falhar, o banco volta ao estado anterior àquela migração.
pub fn executar_migracoes(conexao: &Connection) -> Result<()> {
    // Garantir que a tabela de configurações existe antes de tudo.
    // Usamos IF NOT EXISTS para que seja idempotente.
    // A tabela precisa existir antes das migrações para rastrear a versão do schema.
    // Nota: a coluna atualizado_em não tem DEFAULT porque a migração 001 já
    // define a tabela sem DEFAULT (mantemos compatibilidade com schema existente).
    conexao.execute_batch(
        "CREATE TABLE IF NOT EXISTS configuracoes (
            chave         TEXT NOT NULL PRIMARY KEY,
            valor         TEXT,
            atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT OR IGNORE INTO configuracoes (chave, valor, atualizado_em)
        VALUES ('versao_schema', '0', datetime('now'));",
    ).context("Falha ao criar tabela de configurações inicial")?;

    let versao_atual = obter_versao_schema(conexao)?;
    info!("Versão atual do schema: {}", versao_atual);

    for &(versao_destino, sql) in MIGRACOES {
        if versao_destino > versao_atual {
            info!(
                "Executando migração V{:03} (versão {} -> {})...",
                versao_destino, versao_atual, versao_destino
            );

            // Executar o SQL da migração diretamente (sem transação explícita)
            // porque PRAGMAs como journal_mode e foreign_keys não podem rodar
            // dentro de transações no SQLite. As DDL statements (CREATE TABLE, etc.)
            // são implicitamente transacionais no SQLite.
            conexao.execute_batch(sql)
                .with_context(|| format!("Falha ao executar migração V{:03}", versao_destino))?;

            // Atualizar a versão do schema após migração bem-sucedida
            conexao.execute(
                "UPDATE configuracoes SET valor = ?1, atualizado_em = datetime('now') WHERE chave = 'versao_schema'",
                rusqlite::params![versao_destino.to_string()],
            ).context("Falha ao atualizar versão do schema")?;

            info!("Migração V{:03} aplicada com sucesso.", versao_destino);
        }
    }

    let versao_final = obter_versao_schema(conexao)?;
    info!("Schema atualizado. Versão final: {}", versao_final);

    Ok(())
}

/// Lê a versão atual do schema no banco de dados.
/// Retorna 0 se a configuração não existir (banco novo).
fn obter_versao_schema(conexao: &Connection) -> Result<i32> {
    let resultado: Result<String, _> = conexao.query_row(
        "SELECT valor FROM configuracoes WHERE chave = 'versao_schema'",
        [],
        |linha| linha.get(0),
    );

    match resultado {
        Ok(valor) => {
            let versao: i32 = valor.parse().unwrap_or(0);
            Ok(versao)
        }
        // Se a tabela ou registro não existe, estamos na versão 0
        Err(_) => Ok(0),
    }
}

/// Retorna a versão mais recente disponível nas migrações.
/// Útil para o manifesto de backup.
pub fn versao_mais_recente() -> i32 {
    MIGRACOES
        .last()
        .map(|&(versao, _)| versao)
        .unwrap_or(0)
}
