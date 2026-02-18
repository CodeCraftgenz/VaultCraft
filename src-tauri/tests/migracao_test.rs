/**
 * Testes unitários para o sistema de migrações.
 *
 * Por quê? Migrações corrompidas podem destruir o banco de dados.
 * Testamos que as migrações rodam na ordem correta, são idempotentes,
 * e deixam o schema no estado esperado.
 */

#[cfg(test)]
mod testes_migracao {
    use rusqlite::Connection;

    /// SQL das migrações (embarcado como nos serviços reais)
    const MIGRATION_001: &str = include_str!("../src/db/migrations/001_schema_inicial.sql");
    const MIGRATION_002: &str = include_str!("../src/db/migrations/002_dados_iniciais.sql");

    /// Aplica todas as migrações em um banco em memória
    fn aplicar_migracoes() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(MIGRATION_001).unwrap();
        conn.execute_batch(MIGRATION_002).unwrap();
        conn
    }

    #[test]
    fn migracoes_aplicam_sem_erro() {
        // Se esta função não entrar em pânico, as migrações são válidas
        let _conn = aplicar_migracoes();
    }

    #[test]
    fn tabela_pastas_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='pastas'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_itens_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='itens'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_fts_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='itens_fts'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_tags_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='tags'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_anexos_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='anexos'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_tarefas_checklist_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='tarefas_checklist'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_log_auditoria_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='log_auditoria'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn tabela_configuracoes_existe() {
        let conn = aplicar_migracoes();
        let existe: bool = conn
            .query_row(
                "SELECT COUNT(*) > 0 FROM sqlite_master WHERE type='table' AND name='configuracoes'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(existe);
    }

    #[test]
    fn configuracoes_padrao_foram_inseridas() {
        let conn = aplicar_migracoes();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM configuracoes",
                [],
                |row| row.get(0),
            )
            .unwrap();

        // Deve ter pelo menos 5 configurações padrão
        assert!(count >= 5, "Esperadas pelo menos 5 configurações, encontradas: {}", count);
    }

    #[test]
    fn configuracao_tema_padrao_eh_claro() {
        let conn = aplicar_migracoes();

        let valor: String = conn
            .query_row(
                "SELECT valor FROM configuracoes WHERE chave = 'tema'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(valor, "claro");
    }

    #[test]
    fn configuracao_onboarding_padrao_nao_concluido() {
        let conn = aplicar_migracoes();

        let valor: String = conn
            .query_row(
                "SELECT valor FROM configuracoes WHERE chave = 'onboarding_concluido'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(valor, "false");
    }

    #[test]
    fn versao_schema_padrao_eh_1() {
        let conn = aplicar_migracoes();

        let valor: String = conn
            .query_row(
                "SELECT valor FROM configuracoes WHERE chave = 'versao_schema'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(valor, "1");
    }

    /// Testa que as migrações são idempotentes (rodar duas vezes não causa erro)
    /// Por quê? Se o app reiniciar e tentar rodar migrações novamente,
    /// o "IF NOT EXISTS" deve prevenir erros.
    #[test]
    fn migracoes_sao_idempotentes() {
        let conn = Connection::open_in_memory().unwrap();

        // Primeira execução
        conn.execute_batch(MIGRATION_001).unwrap();
        conn.execute_batch(MIGRATION_002).unwrap();

        // Segunda execução (não deve falhar)
        conn.execute_batch(MIGRATION_001).unwrap();
        conn.execute_batch(MIGRATION_002).unwrap();

        // Verifica que não duplicou configurações
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM configuracoes WHERE chave = 'tema'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 1, "Configuração 'tema' deveria existir apenas uma vez");
    }

    /// Testa que os triggers FTS foram criados
    #[test]
    fn triggers_fts_existem() {
        let conn = aplicar_migracoes();

        let triggers: Vec<String> = {
            let mut stmt = conn
                .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'trg_itens_fts_%'")
                .unwrap();
            stmt.query_map([], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect()
        };

        assert_eq!(triggers.len(), 3, "Devem existir 3 triggers FTS (insert, update, delete)");
    }

    /// Testa que os índices foram criados
    #[test]
    fn indices_foram_criados() {
        let conn = aplicar_migracoes();

        let indices: Vec<String> = {
            let mut stmt = conn
                .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
                .unwrap();
            stmt.query_map([], |row| row.get(0))
                .unwrap()
                .filter_map(|r| r.ok())
                .collect()
        };

        // Devem existir pelo menos 11 índices customizados
        assert!(
            indices.len() >= 11,
            "Esperados pelo menos 11 índices, encontrados: {} ({:?})",
            indices.len(),
            indices
        );
    }

    /// Testa integridade referencial (FK) entre itens e pastas
    #[test]
    fn fk_itens_pastas_funciona() {
        let conn = aplicar_migracoes();

        // Habilita FK (necessário em cada conexão)
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();

        // Inserir pasta
        conn.execute(
            "INSERT INTO pastas (id, pasta_pai_id, nome, caminho, criado_em, atualizado_em)
             VALUES ('p1', NULL, 'Teste', '/Teste', '2026-01-01', '2026-01-01')",
            [],
        )
        .unwrap();

        // Inserir item com pasta válida deve funcionar
        let resultado = conn.execute(
            "INSERT INTO itens (id, pasta_id, tipo, titulo, criado_em, atualizado_em)
             VALUES ('i1', 'p1', 'nota', 'Nota teste', '2026-01-01', '2026-01-01')",
            [],
        );
        assert!(resultado.is_ok());

        // Inserir item com pasta inexistente deve falhar
        let resultado = conn.execute(
            "INSERT INTO itens (id, pasta_id, tipo, titulo, criado_em, atualizado_em)
             VALUES ('i2', 'pasta_inexistente', 'nota', 'Nota teste', '2026-01-01', '2026-01-01')",
            [],
        );
        assert!(resultado.is_err(), "FK deve rejeitar pasta inexistente");
    }
}
