/**
 * Testes unitários para regras de vencimento.
 *
 * Por quê? Vencimentos são um diferencial do VaultCraft (RF-07).
 * Precisamos garantir que a lógica de "atrasado", "hoje" e
 * "próximo" funciona corretamente para diferentes cenários.
 */

#[cfg(test)]
mod testes_vencimentos {
    use chrono::{NaiveDate, Utc};
    use rusqlite::Connection;

    /// Status de vencimento de um item
    #[derive(Debug, PartialEq)]
    enum StatusVencimento {
        Atrasado,
        Hoje,
        Proximo,
        SemVencimento,
    }

    /// Calcula o status do vencimento com base na data atual
    fn calcular_status_vencimento(
        data_vencimento: Option<&str>,
        data_referencia: NaiveDate,
    ) -> StatusVencimento {
        match data_vencimento {
            None => StatusVencimento::SemVencimento,
            Some(data_str) => {
                let data = NaiveDate::parse_from_str(data_str, "%Y-%m-%d");
                match data {
                    Err(_) => StatusVencimento::SemVencimento,
                    Ok(data) => {
                        if data < data_referencia {
                            StatusVencimento::Atrasado
                        } else if data == data_referencia {
                            StatusVencimento::Hoje
                        } else {
                            StatusVencimento::Proximo
                        }
                    }
                }
            }
        }
    }

    /// Calcula os dias restantes até o vencimento (negativo = atrasado)
    fn calcular_dias_restantes(data_vencimento: &str, data_referencia: NaiveDate) -> i64 {
        let data = NaiveDate::parse_from_str(data_vencimento, "%Y-%m-%d").unwrap();
        (data - data_referencia).num_days()
    }

    #[test]
    fn item_sem_vencimento_retorna_sem_vencimento() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(None, hoje),
            StatusVencimento::SemVencimento
        );
    }

    #[test]
    fn item_vencido_ontem_esta_atrasado() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(Some("2026-02-16"), hoje),
            StatusVencimento::Atrasado
        );
    }

    #[test]
    fn item_vencendo_hoje_esta_no_dia() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(Some("2026-02-17"), hoje),
            StatusVencimento::Hoje
        );
    }

    #[test]
    fn item_vencendo_amanha_esta_proximo() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(Some("2026-02-18"), hoje),
            StatusVencimento::Proximo
        );
    }

    #[test]
    fn item_vencido_ha_30_dias_esta_atrasado() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(Some("2026-01-18"), hoje),
            StatusVencimento::Atrasado
        );
    }

    #[test]
    fn dias_restantes_positivo_para_futuro() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(calcular_dias_restantes("2026-02-24", hoje), 7);
    }

    #[test]
    fn dias_restantes_zero_para_hoje() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(calcular_dias_restantes("2026-02-17", hoje), 0);
    }

    #[test]
    fn dias_restantes_negativo_para_passado() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(calcular_dias_restantes("2026-02-10", hoje), -7);
    }

    #[test]
    fn data_invalida_retorna_sem_vencimento() {
        let hoje = NaiveDate::from_ymd_opt(2026, 2, 17).unwrap();
        assert_eq!(
            calcular_status_vencimento(Some("data-invalida"), hoje),
            StatusVencimento::SemVencimento
        );
    }

    /// Testa a consulta SQL para vencimentos próximos
    #[test]
    fn consulta_vencimentos_proximos_7_dias() {
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
            INSERT INTO pastas VALUES ('p1', NULL, 'Teste', '/Teste', '2026-01-01', '2026-01-01');

            CREATE TABLE itens (
                id TEXT PRIMARY KEY,
                pasta_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descricao TEXT,
                conteudo_nota TEXT,
                data_vencimento TEXT,
                criado_em TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            );
            ",
        )
        .unwrap();

        // Inserir itens com diferentes vencimentos
        let itens = vec![
            ("i1", "Seguro vence amanhã", "2026-02-18"),
            ("i2", "IPVA vence em 5 dias", "2026-02-22"),
            ("i3", "Contrato vence em 30 dias", "2026-03-19"),
            ("i4", "Revisão já venceu", "2026-02-10"),
        ];

        for (id, titulo, vencimento) in &itens {
            conn.execute(
                "INSERT INTO itens (id, pasta_id, tipo, titulo, data_vencimento, criado_em, atualizado_em)
                 VALUES (?1, 'p1', 'documento', ?2, ?3, '2026-01-01', '2026-01-01')",
                rusqlite::params![id, titulo, vencimento],
            )
            .unwrap();
        }

        // Buscar vencimentos nos próximos 7 dias (a partir de 2026-02-17)
        let data_hoje = "2026-02-17";
        let data_limite = "2026-02-24";

        let mut stmt = conn
            .prepare(
                "SELECT id, titulo, data_vencimento FROM itens
                 WHERE data_vencimento IS NOT NULL
                 AND data_vencimento >= ?1
                 AND data_vencimento <= ?2
                 ORDER BY data_vencimento ASC",
            )
            .unwrap();

        let resultados: Vec<(String, String, String)> = stmt
            .query_map(rusqlite::params![data_hoje, data_limite], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        // Deve encontrar 2 itens (amanhã e 5 dias)
        assert_eq!(resultados.len(), 2);
        assert_eq!(resultados[0].0, "i1"); // Mais próximo primeiro
        assert_eq!(resultados[1].0, "i2");
    }

    /// Testa consulta para itens atrasados
    #[test]
    fn consulta_vencimentos_atrasados() {
        let conn = Connection::open_in_memory().unwrap();

        conn.execute_batch(
            "
            CREATE TABLE itens (
                id TEXT PRIMARY KEY,
                pasta_id TEXT NOT NULL,
                tipo TEXT NOT NULL,
                titulo TEXT NOT NULL,
                descricao TEXT,
                conteudo_nota TEXT,
                data_vencimento TEXT,
                criado_em TEXT NOT NULL,
                atualizado_em TEXT NOT NULL
            );
            INSERT INTO itens VALUES ('i1', 'p1', 'nota', 'Atrasado', NULL, NULL, '2026-02-01', '2026-01-01', '2026-01-01');
            INSERT INTO itens VALUES ('i2', 'p1', 'nota', 'No prazo', NULL, NULL, '2026-03-01', '2026-01-01', '2026-01-01');
            INSERT INTO itens VALUES ('i3', 'p1', 'nota', 'Sem vencimento', NULL, NULL, NULL, '2026-01-01', '2026-01-01');
            ",
        )
        .unwrap();

        let data_hoje = "2026-02-17";

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM itens WHERE data_vencimento IS NOT NULL AND data_vencimento < ?1",
                rusqlite::params![data_hoje],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 1); // Apenas "Atrasado"
    }
}
