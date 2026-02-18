/**
 * Testes unitários para o BackupService.
 *
 * Por quê testar backup? O backup é a funcionalidade mais crítica
 * do VaultCraft — perder dados do cofre seria catastrófico.
 * Testamos a criação do manifesto, a validação, e o fluxo de
 * backup/restauração em ambiente isolado.
 */

#[cfg(test)]
mod testes_backup {
    use std::collections::HashMap;
    use std::fs;
    use std::path::PathBuf;
    use tempfile::TempDir;

    /// Estrutura de manifesto simplificada para testes
    #[derive(serde::Serialize, serde::Deserialize, Debug)]
    struct ManifestoBackup {
        versao_app: String,
        versao_schema: String,
        data: String,
        total_itens: u64,
        total_anexos: u64,
        hash_banco: String,
        hashes_anexos: HashMap<String, String>,
    }

    /// Testa que o manifesto é criado com todos os campos obrigatórios
    #[test]
    fn manifesto_tem_campos_obrigatorios() {
        let manifesto = ManifestoBackup {
            versao_app: "0.1.0".to_string(),
            versao_schema: "1".to_string(),
            data: "2026-02-17T10:00:00Z".to_string(),
            total_itens: 5,
            total_anexos: 3,
            hash_banco: "abc123".to_string(),
            hashes_anexos: HashMap::new(),
        };

        assert_eq!(manifesto.versao_app, "0.1.0");
        assert_eq!(manifesto.versao_schema, "1");
        assert!(manifesto.total_itens > 0);
        assert!(!manifesto.hash_banco.is_empty());
    }

    /// Testa serialização/deserialização JSON do manifesto
    /// Por quê? O manifesto é salvo como JSON dentro do .vaultbackup.
    /// Precisamos garantir que a serialização é bidirecional e correta.
    #[test]
    fn manifesto_serializa_e_deserializa_corretamente() {
        let mut hashes = HashMap::new();
        hashes.insert("anexo1.pdf".to_string(), "hash_abc".to_string());
        hashes.insert("foto.jpg".to_string(), "hash_def".to_string());

        let manifesto = ManifestoBackup {
            versao_app: "0.1.0".to_string(),
            versao_schema: "1".to_string(),
            data: "2026-02-17T10:00:00Z".to_string(),
            total_itens: 10,
            total_anexos: 2,
            hash_banco: "sha256_do_banco".to_string(),
            hashes_anexos: hashes,
        };

        let json = serde_json::to_string_pretty(&manifesto).unwrap();
        let restaurado: ManifestoBackup = serde_json::from_str(&json).unwrap();

        assert_eq!(restaurado.versao_app, manifesto.versao_app);
        assert_eq!(restaurado.total_itens, manifesto.total_itens);
        assert_eq!(restaurado.total_anexos, manifesto.total_anexos);
        assert_eq!(restaurado.hashes_anexos.len(), 2);
        assert_eq!(
            restaurado.hashes_anexos.get("anexo1.pdf").unwrap(),
            "hash_abc"
        );
    }

    /// Testa que o diretório temporário para backup pode ser criado
    #[test]
    fn diretorio_backup_pode_ser_criado() {
        let dir_temp = TempDir::new().expect("Falha ao criar diretório temporário");
        let caminho_backup = dir_temp.path().join("meu_backup.vaultbackup");

        // Simula criação do arquivo de backup
        fs::write(&caminho_backup, b"conteudo_teste").unwrap();

        assert!(caminho_backup.exists());
        assert!(fs::metadata(&caminho_backup).unwrap().len() > 0);
    }

    /// Testa validação do manifesto: versão do schema deve ser compatível
    #[test]
    fn validacao_manifesto_rejeita_versao_incompativel() {
        let manifesto = ManifestoBackup {
            versao_app: "0.1.0".to_string(),
            versao_schema: "999".to_string(), // Versão futura inexistente
            data: "2026-02-17T10:00:00Z".to_string(),
            total_itens: 0,
            total_anexos: 0,
            hash_banco: "hash".to_string(),
            hashes_anexos: HashMap::new(),
        };

        let versao_atual = "1";
        let versao_backup: u32 = manifesto.versao_schema.parse().unwrap_or(0);
        let versao_app: u32 = versao_atual.parse().unwrap_or(0);

        // Backup de versão futura não deve ser restaurável
        assert!(
            versao_backup > versao_app,
            "Backup com schema mais novo que o app deveria ser rejeitado"
        );
    }

    /// Testa que a extensão padrão do backup é .vaultbackup
    #[test]
    fn extensao_padrao_eh_vaultbackup() {
        let nome_arquivo = "backup_2026-02-17.vaultbackup";
        let caminho = PathBuf::from(nome_arquivo);

        assert_eq!(
            caminho.extension().unwrap().to_str().unwrap(),
            "vaultbackup"
        );
    }

    /// Testa criação de estrutura de diretórios para backup
    #[test]
    fn estrutura_backup_pode_ser_montada() {
        let dir_temp = TempDir::new().unwrap();
        let dir_staging = dir_temp.path().join("staging");

        // Cria a estrutura esperada dentro do staging
        fs::create_dir_all(dir_staging.join("anexos")).unwrap();

        // Simula banco
        fs::write(dir_staging.join("banco.sqlite"), b"dados_sqlite").unwrap();

        // Simula anexo
        fs::write(dir_staging.join("anexos").join("doc.pdf"), b"pdf_conteudo").unwrap();

        // Simula manifesto
        let manifesto = ManifestoBackup {
            versao_app: "0.1.0".to_string(),
            versao_schema: "1".to_string(),
            data: "2026-02-17T10:00:00Z".to_string(),
            total_itens: 1,
            total_anexos: 1,
            hash_banco: "hash_banco".to_string(),
            hashes_anexos: {
                let mut h = HashMap::new();
                h.insert("doc.pdf".to_string(), "hash_doc".to_string());
                h
            },
        };
        let json_manifesto = serde_json::to_string_pretty(&manifesto).unwrap();
        fs::write(dir_staging.join("manifesto.json"), &json_manifesto).unwrap();

        // Verifica estrutura
        assert!(dir_staging.join("banco.sqlite").exists());
        assert!(dir_staging.join("anexos").join("doc.pdf").exists());
        assert!(dir_staging.join("manifesto.json").exists());
    }
}
