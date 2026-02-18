/**
 * Testes unitários para o SearchService (busca FTS5).
 *
 * Por quê? A busca é um diferencial central do VaultCraft.
 * Precisamos garantir que funciona corretamente com o SQLite FTS5,
 * incluindo acentos, termos parciais e ordenação por relevância.
 */

#[cfg(test)]
mod testes_busca {
    use rusqlite::Connection;

    /// Cria um banco em memória com o schema mínimo para testes de busca
    fn criar_banco_teste() -> Connection {
        let conn = Connection::open_in_memory().unwrap();

        conn.execute_batch(
            "
            CREATE TABLE pastas (
                id TEXT PRIMARY KEY,
                pasta_pai_id TEXT,
                nome TEXT NOT NULL,
                caminho TEXT NOT NULL,
                criado_em TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            );

            CREATE TABLE itens (
                id TEXT PRIMARY KEY,
                pasta_id TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK(tipo IN ('nota', 'documento', 'checklist')),
                titulo TEXT NOT NULL,
                descricao TEXT,
                conteudo_nota TEXT,
                data_vencimento TEXT,
                criado_em TEXT NOT NULL,
                atualizado_em TEXT NOT NULL,
                FOREIGN KEY (pasta_id) REFERENCES pastas(id)
            );

            CREATE VIRTUAL TABLE itens_fts USING fts5(
                titulo,
                descricao,
                conteudo_nota,
                id UNINDEXED,
                tokenize='unicode61'
            );

            CREATE TRIGGER trg_itens_fts_insert
            AFTER INSERT ON itens
            BEGIN
                INSERT INTO itens_fts (titulo, descricao, conteudo_nota, id)
                VALUES (NEW.titulo, NEW.descricao, NEW.conteudo_nota, NEW.id);
            END;

            CREATE TRIGGER trg_itens_fts_update
            AFTER UPDATE ON itens
            BEGIN
                DELETE FROM itens_fts WHERE id = OLD.id;
                INSERT INTO itens_fts (titulo, descricao, conteudo_nota, id)
                VALUES (NEW.titulo, NEW.descricao, NEW.conteudo_nota, NEW.id);
            END;

            CREATE TRIGGER trg_itens_fts_delete
            AFTER DELETE ON itens
            BEGIN
                DELETE FROM itens_fts WHERE id = OLD.id;
            END;

            -- Pasta de teste
            INSERT INTO pastas (id, pasta_pai_id, nome, caminho, criado_em, atualizado_em)
            VALUES ('p1', NULL, 'Teste', '/Teste', '2026-01-01', '2026-01-01');
            ",
        )
        .unwrap();

        conn
    }

    /// Insere um item de teste no banco
    fn inserir_item(
        conn: &Connection,
        id: &str,
        titulo: &str,
        descricao: &str,
        conteudo: &str,
    ) {
        conn.execute(
            "INSERT INTO itens (id, pasta_id, tipo, titulo, descricao, conteudo_nota, criado_em, atualizado_em)
             VALUES (?1, 'p1', 'nota', ?2, ?3, ?4, '2026-01-01', '2026-01-01')",
            rusqlite::params![id, titulo, descricao, conteudo],
        )
        .unwrap();
    }

    /// Busca FTS e retorna os IDs encontrados
    fn buscar_fts(conn: &Connection, termo: &str) -> Vec<String> {
        let mut stmt = conn
            .prepare(
                "SELECT id FROM itens_fts WHERE itens_fts MATCH ?1 ORDER BY rank",
            )
            .unwrap();

        stmt.query_map(rusqlite::params![termo], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect()
    }

    #[test]
    fn busca_por_titulo_encontra_resultado() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Apólice do Seguro", "Seguro do carro", "");

        let resultados = buscar_fts(&conn, "apólice");
        assert_eq!(resultados.len(), 1);
        assert_eq!(resultados[0], "i1");
    }

    #[test]
    fn busca_por_descricao_encontra_resultado() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Documento", "Contrato de aluguel", "");

        let resultados = buscar_fts(&conn, "contrato");
        assert_eq!(resultados.len(), 1);
    }

    #[test]
    fn busca_por_conteudo_nota_encontra_resultado() {
        let conn = criar_banco_teste();
        inserir_item(
            &conn,
            "i1",
            "Receita",
            "",
            "Ingredientes: farinha, ovos, leite",
        );

        let resultados = buscar_fts(&conn, "farinha");
        assert_eq!(resultados.len(), 1);
    }

    #[test]
    fn busca_sem_resultados_retorna_vazio() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Nota simples", "Descrição", "Conteúdo");

        let resultados = buscar_fts(&conn, "inexistente");
        assert!(resultados.is_empty());
    }

    #[test]
    fn busca_multiplos_resultados() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Seguro do carro", "IPVA e seguro", "");
        inserir_item(&conn, "i2", "Seguro de saúde", "Plano de saúde", "");
        inserir_item(&conn, "i3", "Nota aleatória", "Sem relação", "");

        let resultados = buscar_fts(&conn, "seguro");
        assert_eq!(resultados.len(), 2);
    }

    #[test]
    fn trigger_insert_sincroniza_fts() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Documento novo", "Teste", "");

        // O trigger deve ter inserido na FTS automaticamente
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM itens_fts", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn trigger_update_atualiza_fts() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Título antigo", "Desc", "");

        // Atualiza o título
        conn.execute(
            "UPDATE itens SET titulo = 'Título novo', atualizado_em = '2026-01-02' WHERE id = 'i1'",
            [],
        )
        .unwrap();

        // Busca pelo título novo deve encontrar
        let resultados = buscar_fts(&conn, "novo");
        assert_eq!(resultados.len(), 1);

        // Busca pelo título antigo não deve encontrar
        let resultados = buscar_fts(&conn, "antigo");
        assert!(resultados.is_empty());
    }

    #[test]
    fn trigger_delete_remove_da_fts() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Item para deletar", "Desc", "");

        conn.execute("DELETE FROM itens WHERE id = 'i1'", []).unwrap();

        let resultados = buscar_fts(&conn, "deletar");
        assert!(resultados.is_empty());
    }

    #[test]
    fn busca_com_acentos_funciona() {
        let conn = criar_banco_teste();
        inserir_item(&conn, "i1", "Relatório financeiro", "", "Ações e fundos");

        // unicode61 tokenizer deve lidar com acentos corretamente
        let resultados = buscar_fts(&conn, "relatório");
        assert_eq!(resultados.len(), 1);
    }
}
