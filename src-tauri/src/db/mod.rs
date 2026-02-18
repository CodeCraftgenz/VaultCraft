// =============================================================================
// VaultCraft — Módulo de Banco de Dados
// =============================================================================
// Agrupa todos os submódulos relacionados ao banco de dados SQLite:
// - connection: inicialização e configuração da conexão
// - migrations: sistema de migrações incrementais
// - models: estruturas de dados (DTOs e entidades)
// - queries: todas as operações CRUD no banco
// =============================================================================

pub mod connection;
pub mod migrations;
pub mod models;
pub mod queries;
