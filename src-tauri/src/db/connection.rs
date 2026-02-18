// =============================================================================
// VaultCraft — Conexão com o Banco de Dados SQLite
// =============================================================================
// Gerencia a inicialização e configuração da conexão SQLite.
//
// Decisões técnicas:
// - WAL mode: permite leituras concorrentes sem bloquear escritas
// - Foreign keys: habilitado para garantir integridade referencial
// - Busy timeout: 5 segundos para evitar erros de "database is locked"
// - Synchronous NORMAL: bom equilíbrio entre performance e segurança
//   (com WAL, NORMAL é seguro contra corrupção em caso de crash)
// =============================================================================

use anyhow::{Context, Result};
use log::info;
use rusqlite::Connection;
use std::path::Path;

use super::migrations::executar_migracoes;

/// Inicializa o banco de dados SQLite no diretório do aplicativo.
///
/// Passos:
/// 1. Cria o diretório se não existir
/// 2. Abre/cria o arquivo do banco
/// 3. Configura pragmas de performance e segurança
/// 4. Executa migrações pendentes
/// 5. Retorna a conexão pronta para uso
///
/// O arquivo do banco é criado em `app_dir/vaultcraft.db`.
pub fn inicializar_banco(diretorio_app: &Path) -> Result<Connection> {
    // Garantir que o diretório existe
    std::fs::create_dir_all(diretorio_app)
        .with_context(|| format!("Falha ao criar diretório: {:?}", diretorio_app))?;

    let caminho_banco = diretorio_app.join("vaultcraft.db");
    info!("Inicializando banco de dados em: {:?}", caminho_banco);

    // Abrir conexão (cria o arquivo se não existir)
    let conexao = Connection::open(&caminho_banco)
        .with_context(|| format!("Falha ao abrir banco de dados: {:?}", caminho_banco))?;

    // Configurar pragmas para performance e integridade
    configurar_pragmas(&conexao)?;

    // Executar migrações pendentes
    executar_migracoes(&conexao)
        .context("Falha ao executar migrações do banco de dados")?;

    info!("Banco de dados inicializado com sucesso.");
    Ok(conexao)
}

/// Configura os pragmas do SQLite para otimizar performance e segurança.
///
/// WAL (Write-Ahead Logging):
///   Modo de journaling que permite leituras e escritas simultâneas.
///   Ideal para aplicações desktop onde apenas um processo acessa o banco.
///
/// Foreign Keys:
///   SQLite não habilita foreign keys por padrão (!). Precisamos ativar
///   explicitamente para que ON DELETE CASCADE funcione.
///
/// Busy Timeout:
///   Tempo de espera antes de retornar SQLITE_BUSY. 5 segundos é suficiente
///   para um app single-user.
///
/// Synchronous NORMAL:
///   Com WAL mode, NORMAL oferece durabilidade suficiente sem sacrificar
///   performance. FULL seria mais seguro mas significativamente mais lento.
fn configurar_pragmas(conexao: &Connection) -> Result<()> {
    conexao.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA foreign_keys = ON;
         PRAGMA busy_timeout = 5000;
         PRAGMA synchronous = NORMAL;
         PRAGMA cache_size = -8000;
         PRAGMA temp_store = MEMORY;",
    ).context("Falha ao configurar pragmas do SQLite")?;

    info!("Pragmas do SQLite configurados (WAL, FK, cache 8MB).");
    Ok(())
}
