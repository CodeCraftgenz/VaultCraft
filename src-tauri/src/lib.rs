// =============================================================================
// VaultCraft — Ponto de Entrada da Biblioteca (lib.rs)
// =============================================================================
// Cofre pessoal offline para documentos, notas e checklists.
// Construído com Tauri 2 + React + SQLite.
//
// Este é o ponto de entrada do backend Rust. Responsável por:
// 1. Declarar todos os módulos do projeto
// 2. Registrar todos os comandos Tauri (interface com o frontend)
// 3. Inicializar plugins (shell, dialog)
// 4. Configurar o banco de dados na inicialização
// 5. Gerenciar o estado global do aplicativo (EstadoApp)
//
// IMPORTANTE: Este aplicativo é 100% offline.
// Nenhuma chamada de rede é feita em nenhum momento.
// Todos os dados ficam no disco local do usuário.
// =============================================================================

// Módulos do projeto
pub mod db;         // Banco de dados (conexão, migrações, modelos, consultas)
pub mod services;   // Serviços (backup, armazenamento, exportação, auditoria)
pub mod commands;   // Comandos Tauri (interface frontend <-> backend)
pub mod storage;    // Utilitários de armazenamento (re-exportação)
pub mod crypto;     // Criptografia (hashes, PIN)
pub mod license;    // Sistema de licenciamento (hardware, serviço, armazenamento)

use commands::EstadoApp;
use std::sync::Mutex;
use tauri::Manager;

/// Ponto de entrada principal do aplicativo Tauri.
///
/// Configura e executa o aplicativo:
/// 1. Registra os plugins (shell para abrir arquivos, dialog para seletores)
/// 2. Inicializa o banco de dados SQLite no diretório de dados do app
/// 3. Cria o estado compartilhado (EstadoApp) com a conexão protegida por Mutex
/// 4. Registra todos os comandos que o frontend pode invocar
/// 5. Inicia o loop de eventos do Tauri
///
/// O banco é inicializado no callback setup() para ter acesso ao app_handle
/// e resolver o diretório de dados correto para cada sistema operacional.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Inicializar logger para debug (útil durante desenvolvimento)
    let _ = env_logger::try_init();

    tauri::Builder::default()
        // Plugin shell: permite abrir arquivos com o app padrão do SO
        .plugin(tauri_plugin_shell::init())
        // Plugin dialog: permite abrir diálogos de seleção de arquivos/pastas
        .plugin(tauri_plugin_dialog::init())
        // Setup: inicialização do banco de dados e estado global
        .setup(|app| {
            // Resolver o diretório de dados do aplicativo.
            // No Windows: %APPDATA%/com.vaultcraft.app/
            // No macOS: ~/Library/Application Support/com.vaultcraft.app/
            // No Linux: ~/.local/share/com.vaultcraft.app/
            let diretorio_app = app
                .path()
                .app_data_dir()
                .expect("Falha ao resolver diretório de dados do aplicativo");

            log::info!("Diretório de dados: {:?}", diretorio_app);

            // Inicializar o banco de dados SQLite.
            // Cria o arquivo se não existir, executa migrações pendentes.
            let conexao = db::connection::inicializar_banco(&diretorio_app)
                .expect("Falha crítica ao inicializar banco de dados");

            // Criar e registrar o estado global do aplicativo.
            // O Mutex garante acesso thread-safe à conexão do banco.
            let estado = EstadoApp {
                banco: Mutex::new(conexao),
                diretorio_app,
            };

            app.manage(estado);

            log::info!("VaultCraft inicializado com sucesso!");
            Ok(())
        })
        // Registrar TODOS os comandos que o frontend pode chamar.
        // Organizados por categoria para facilitar manutenção.
        .invoke_handler(tauri::generate_handler![
            // === Pastas ===
            commands::listar_pastas,
            commands::criar_pasta,
            commands::renomear_pasta,
            commands::mover_pasta,
            commands::excluir_pasta,

            // === Itens (Notas, Documentos, Checklists) ===
            commands::listar_itens,
            commands::obter_item,
            commands::criar_item,
            commands::atualizar_item,
            commands::excluir_item,

            // === Tags ===
            commands::listar_tags,
            commands::criar_tag,
            commands::atualizar_tag,
            commands::excluir_tag,

            // === Anexos ===
            commands::adicionar_anexo,
            commands::remover_anexo,
            commands::abrir_anexo,
            commands::listar_anexos,

            // === Tarefas Checklist ===
            commands::listar_tarefas,
            commands::criar_tarefa,
            commands::atualizar_tarefa,
            commands::excluir_tarefa,
            commands::reordenar_tarefas,
            commands::marcar_tarefa,

            // === Busca Full-Text ===
            commands::buscar_itens,

            // === Vencimentos ===
            commands::listar_vencimentos,

            // === Backup e Restauração ===
            commands::criar_backup,
            commands::restaurar_backup,
            commands::exportar_pacote,
            commands::importar_pacote,

            // === Exportação ===
            commands::exportar_item_pdf,
            commands::exportar_lista_csv,

            // === Auditoria ===
            commands::listar_historico,

            // === Configurações ===
            commands::obter_configuracao,
            commands::salvar_configuracao,
            commands::obter_todas_configuracoes,

            // === Utilitários ===
            commands::compactar_banco,

            // === Licença ===
            commands::license_commands::check_license,
            commands::license_commands::activate_license,
            commands::license_commands::get_hardware_id,
            commands::license_commands::logout_license,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar o VaultCraft");
}
