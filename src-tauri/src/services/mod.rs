// =============================================================================
// VaultCraft — Módulo de Serviços
// =============================================================================
// Camada de serviço que encapsula a lógica de negócio do aplicativo.
// Os serviços coordenam entre o banco de dados, sistema de arquivos e crypto.
//
// - backup: criação e restauração de backups (.vaultbackup)
// - armazenamento: gestão de arquivos (anexos) no disco
// - exportacao: exportação de itens para HTML/CSV
// - auditoria: registro de eventos para rastreabilidade
// =============================================================================

pub mod backup;
pub mod armazenamento;
pub mod exportacao;
pub mod auditoria;
