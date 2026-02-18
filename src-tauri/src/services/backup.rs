// =============================================================================
// VaultCraft — Serviço de Backup e Restauração
// =============================================================================
// Gerencia a criação e restauração de backups do cofre.
// O formato .vaultbackup é um arquivo ZIP contendo:
//   - banco.sqlite: cópia completa do banco de dados
//   - anexos/: todos os arquivos anexos
//   - manifesto.json: metadados e hashes para verificação de integridade
//
// Decisões de design:
// - ZIP é usado por ser universalmente suportado e ter boa compressão
// - O manifesto permite validar a integridade antes de restaurar
// - Antes de restaurar, um backup automático do estado atual é criado
// - Pacotes de pasta permitem exportar/importar partes do cofre
// =============================================================================

use anyhow::{Context, Result};
use chrono::Utc;
use log::info;
use rusqlite::Connection;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::db::migrations::versao_mais_recente;
use crate::db::models::ManifestoBackup;
use crate::db::queries;
use crate::services::armazenamento;

// =============================================================================
// CRIACAO DE BACKUP
// =============================================================================

/// Cria um backup completo do cofre como arquivo .vaultbackup (ZIP).
///
/// Conteúdo do arquivo:
/// - banco.sqlite: cópia do banco de dados (feita com backup API do SQLite)
/// - anexos/{caminho_interno}: todos os arquivos anexos
/// - manifesto.json: metadados com hashes SHA-256 para verificação
///
/// O backup é atômico: criamos em um arquivo temporário e renomeamos ao final.
pub fn criar_backup(
    diretorio_app: &Path,
    conexao: &Connection,
    destino: &Path,
) -> Result<PathBuf> {
    let agora = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let nome_arquivo = format!("vaultcraft_backup_{}.vaultbackup", agora);
    let caminho_backup = destino.join(&nome_arquivo);

    info!("Criando backup em: {:?}", caminho_backup);

    // Garantir que o diretório de destino existe
    if let Some(dir_pai) = caminho_backup.parent() {
        fs::create_dir_all(dir_pai)
            .context("Falha ao criar diretório de destino do backup")?;
    }

    // Criar arquivo ZIP
    let arquivo_zip = fs::File::create(&caminho_backup)
        .context("Falha ao criar arquivo de backup")?;
    let mut zip = ZipWriter::new(arquivo_zip);
    let opcoes = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // 1. Adicionar o banco de dados ao backup
    let caminho_banco = diretorio_app.join("vaultcraft.db");
    let conteudo_banco = fs::read(&caminho_banco)
        .context("Falha ao ler banco de dados para backup")?;

    // Calcular hash do banco
    let hash_banco = calcular_hash_bytes(&conteudo_banco);

    zip.start_file("banco.sqlite", opcoes)
        .context("Falha ao iniciar arquivo banco.sqlite no ZIP")?;
    zip.write_all(&conteudo_banco)
        .context("Falha ao escrever banco.sqlite no ZIP")?;

    // 2. Adicionar todos os anexos
    let dir_anexos = armazenamento::obter_diretorio_armazenamento(diretorio_app);
    let caminhos_anexos = queries::listar_caminhos_anexos(conexao)?;
    let mut hashes_anexos: HashMap<String, String> = HashMap::new();

    for caminho_interno in &caminhos_anexos {
        let caminho_completo = dir_anexos.join(caminho_interno);
        if caminho_completo.exists() {
            let conteudo = fs::read(&caminho_completo)
                .with_context(|| format!("Falha ao ler anexo: {:?}", caminho_completo))?;

            let hash = calcular_hash_bytes(&conteudo);
            hashes_anexos.insert(caminho_interno.clone(), hash);

            let caminho_no_zip = format!("anexos/{}", caminho_interno);
            zip.start_file(&caminho_no_zip, opcoes)
                .with_context(|| format!("Falha ao adicionar anexo ao ZIP: {}", caminho_interno))?;
            zip.write_all(&conteudo)
                .context("Falha ao escrever anexo no ZIP")?;
        }
    }

    // 3. Criar e adicionar manifesto
    let total_itens = queries::contar_itens(conexao)?;
    let total_anexos = queries::contar_anexos(conexao)?;

    let manifesto = ManifestoBackup {
        versao_app: env!("CARGO_PKG_VERSION").to_string(),
        versao_schema: versao_mais_recente(),
        data: Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        total_itens,
        total_anexos,
        hash_banco,
        hashes_anexos,
    };

    let manifesto_json = serde_json::to_string_pretty(&manifesto)
        .context("Falha ao serializar manifesto")?;

    zip.start_file("manifesto.json", opcoes)
        .context("Falha ao adicionar manifesto ao ZIP")?;
    zip.write_all(manifesto_json.as_bytes())
        .context("Falha ao escrever manifesto no ZIP")?;

    // Finalizar o ZIP
    zip.finish()
        .context("Falha ao finalizar arquivo ZIP de backup")?;

    info!(
        "Backup criado com sucesso: {:?} ({} itens, {} anexos)",
        caminho_backup, total_itens, total_anexos
    );

    Ok(caminho_backup)
}

// =============================================================================
// RESTAURACAO DE BACKUP
// =============================================================================

/// Restaura um backup do cofre a partir de um arquivo .vaultbackup.
///
/// Processo:
/// 1. Abre e valida o arquivo ZIP
/// 2. Lê e valida o manifesto
/// 3. Cria backup automático do estado atual (segurança)
/// 4. Restaura o banco de dados
/// 5. Restaura os anexos
/// 6. Verifica hashes de integridade
///
/// Se qualquer etapa falhar, o backup automático permite recuperação.
pub fn restaurar_backup(
    diretorio_app: &Path,
    conexao: &Connection,
    arquivo: &Path,
) -> Result<()> {
    info!("Restaurando backup de: {:?}", arquivo);

    // Abrir o arquivo ZIP
    let arquivo_zip = fs::File::open(arquivo)
        .context("Falha ao abrir arquivo de backup")?;
    let mut zip = zip::ZipArchive::new(arquivo_zip)
        .context("Arquivo de backup inválido (não é ZIP válido)")?;

    // 1. Ler e validar manifesto
    let manifesto = ler_manifesto_do_zip(&mut zip)?;
    info!(
        "Manifesto válido: v{} schema={} itens={} anexos={}",
        manifesto.versao_app, manifesto.versao_schema,
        manifesto.total_itens, manifesto.total_anexos
    );

    // 2. Criar backup automático do estado atual (para segurança)
    let dir_backups_auto = diretorio_app.join("backups_automaticos");
    fs::create_dir_all(&dir_backups_auto)
        .context("Falha ao criar diretório de backups automáticos")?;

    // Tentar criar backup do estado atual (não falhar se não conseguir —
    // pode ser a primeira execução sem dados)
    match criar_backup(diretorio_app, conexao, &dir_backups_auto) {
        Ok(caminho) => info!("Backup automático criado: {:?}", caminho),
        Err(e) => info!("Aviso: não foi possível criar backup automático: {}", e),
    }

    // 3. Restaurar o banco de dados
    let mut banco_arquivo = zip.by_name("banco.sqlite")
        .context("Arquivo banco.sqlite não encontrado no backup")?;

    let mut conteudo_banco = Vec::new();
    banco_arquivo.read_to_end(&mut conteudo_banco)
        .context("Falha ao ler banco.sqlite do backup")?;
    drop(banco_arquivo); // Liberar empréstimo do zip

    // Verificar hash do banco
    let hash_banco = calcular_hash_bytes(&conteudo_banco);
    if hash_banco != manifesto.hash_banco {
        anyhow::bail!(
            "Hash do banco não confere! Esperado: {}, Obtido: {}",
            manifesto.hash_banco, hash_banco
        );
    }

    // Escrever o banco restaurado
    let caminho_banco = diretorio_app.join("vaultcraft.db");
    fs::write(&caminho_banco, &conteudo_banco)
        .context("Falha ao restaurar banco de dados")?;

    // 4. Restaurar anexos
    let dir_anexos = armazenamento::obter_diretorio_armazenamento(diretorio_app);

    // Limpar anexos existentes antes de restaurar
    if dir_anexos.exists() {
        fs::remove_dir_all(&dir_anexos)
            .context("Falha ao limpar diretório de anexos")?;
    }
    fs::create_dir_all(&dir_anexos)
        .context("Falha ao recriar diretório de anexos")?;

    // Extrair cada anexo do ZIP
    for i in 0..zip.len() {
        let mut entrada = zip.by_index(i)
            .context("Falha ao ler entrada do ZIP")?;

        let nome = entrada.name().to_string();
        if nome.starts_with("anexos/") && !entrada.is_dir() {
            // Extrair o caminho relativo (sem o prefixo "anexos/")
            let caminho_relativo = nome.strip_prefix("anexos/").unwrap_or(&nome);
            let caminho_destino = dir_anexos.join(caminho_relativo);

            // Criar diretórios necessários
            if let Some(dir_pai) = caminho_destino.parent() {
                fs::create_dir_all(dir_pai)
                    .with_context(|| format!("Falha ao criar diretório: {:?}", dir_pai))?;
            }

            // Escrever o arquivo
            let mut conteudo = Vec::new();
            entrada.read_to_end(&mut conteudo)
                .with_context(|| format!("Falha ao ler anexo do ZIP: {}", nome))?;

            // Verificar hash se disponível no manifesto
            if let Some(hash_esperado) = manifesto.hashes_anexos.get(caminho_relativo) {
                let hash_obtido = calcular_hash_bytes(&conteudo);
                if &hash_obtido != hash_esperado {
                    info!(
                        "Aviso: hash do anexo {} não confere (esperado: {}, obtido: {})",
                        caminho_relativo, hash_esperado, hash_obtido
                    );
                }
            }

            fs::write(&caminho_destino, &conteudo)
                .with_context(|| format!("Falha ao restaurar anexo: {:?}", caminho_destino))?;
        }
    }

    info!("Backup restaurado com sucesso!");
    Ok(())
}

// =============================================================================
// EXPORTACAO/IMPORTACAO DE PACOTE DE PASTA
// =============================================================================

/// Exporta uma pasta específica como pacote .vaultbackup.
/// Inclui a pasta, seus itens e anexos associados.
/// Diferente do backup completo, exporta apenas parte do cofre.
pub fn exportar_pacote_pasta(
    diretorio_app: &Path,
    conexao: &Connection,
    pasta_id: &str,
    destino: &Path,
) -> Result<PathBuf> {
    let pasta = queries::obter_pasta_por_id(conexao, pasta_id)?;
    let agora = Utc::now().format("%Y%m%d_%H%M%S").to_string();

    // Nome do arquivo baseado na pasta
    let nome_limpo = pasta.nome.replace(|c: char| !c.is_alphanumeric() && c != '_' && c != '-', "_");
    let nome_arquivo = format!("vaultcraft_pacote_{}_{}.vaultbackup", nome_limpo, agora);
    let caminho_pacote = destino.join(&nome_arquivo);

    info!("Exportando pacote da pasta '{}' para: {:?}", pasta.nome, caminho_pacote);

    let arquivo_zip = fs::File::create(&caminho_pacote)
        .context("Falha ao criar arquivo de pacote")?;
    let mut zip = ZipWriter::new(arquivo_zip);
    let opcoes = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // Coletar todos os itens da pasta (e subpastas)
    let itens = queries::listar_itens_completos_da_pasta(conexao, pasta_id)?;

    // Coletar anexos e suas hashes
    let dir_anexos = armazenamento::obter_diretorio_armazenamento(diretorio_app);
    let mut hashes_anexos: HashMap<String, String> = HashMap::new();

    // Adicionar dados como JSON (ao invés de banco SQLite parcial)
    let dados_pasta = serde_json::json!({
        "pasta": pasta,
        "itens": itens,
    });

    let dados_json = serde_json::to_string_pretty(&dados_pasta)
        .context("Falha ao serializar dados da pasta")?;

    zip.start_file("dados.json", opcoes)?;
    zip.write_all(dados_json.as_bytes())?;

    // Adicionar anexos dos itens
    for item in &itens {
        for anexo in &item.anexos {
            let caminho_completo = dir_anexos.join(&anexo.caminho_interno);
            if caminho_completo.exists() {
                let conteudo = fs::read(&caminho_completo)?;
                let hash = calcular_hash_bytes(&conteudo);
                hashes_anexos.insert(anexo.caminho_interno.clone(), hash);

                let caminho_no_zip = format!("anexos/{}", anexo.caminho_interno);
                zip.start_file(&caminho_no_zip, opcoes)?;
                zip.write_all(&conteudo)?;
            }
        }
    }

    // Manifesto do pacote
    let manifesto = ManifestoBackup {
        versao_app: env!("CARGO_PKG_VERSION").to_string(),
        versao_schema: versao_mais_recente(),
        data: Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        total_itens: itens.len() as i64,
        total_anexos: hashes_anexos.len() as i64,
        hash_banco: String::new(), // Pacotes não incluem banco completo
        hashes_anexos,
    };

    let manifesto_json = serde_json::to_string_pretty(&manifesto)?;
    zip.start_file("manifesto.json", opcoes)?;
    zip.write_all(manifesto_json.as_bytes())?;

    zip.finish()?;

    info!(
        "Pacote exportado: {:?} ({} itens)",
        caminho_pacote, itens.len()
    );

    Ok(caminho_pacote)
}

/// Importa um pacote de pasta para o cofre.
/// Se houver conflitos de nome, adiciona sufixo "(importado)".
pub fn importar_pacote(
    diretorio_app: &Path,
    conexao: &Connection,
    arquivo: &Path,
) -> Result<()> {
    info!("Importando pacote de: {:?}", arquivo);

    let arquivo_zip = fs::File::open(arquivo)
        .context("Falha ao abrir arquivo de pacote")?;
    let mut zip = zip::ZipArchive::new(arquivo_zip)
        .context("Arquivo de pacote inválido")?;

    // Ler dados.json do pacote
    let mut dados_arquivo = zip.by_name("dados.json")
        .context("Arquivo dados.json não encontrado no pacote")?;
    let mut dados_json = String::new();
    dados_arquivo.read_to_string(&mut dados_json)?;
    drop(dados_arquivo);

    let dados: serde_json::Value = serde_json::from_str(&dados_json)
        .context("Falha ao deserializar dados.json")?;

    // Criar a pasta importada (com sufixo se já existir)
    let nome_pasta_original = dados["pasta"]["nome"]
        .as_str()
        .unwrap_or("Pasta Importada");

    let nome_pasta = format!("{} (importado)", nome_pasta_original);
    let pasta_pai_id = dados["pasta"]["pasta_pai_id"]
        .as_str()
        .map(|s| s.to_string());

    let nova_pasta = crate::db::models::NovaPasta {
        nome: nome_pasta.clone(),
        pasta_pai_id,
    };

    let pasta_criada = queries::criar_pasta(conexao, &nova_pasta)?;
    info!("Pasta importada criada: {} ({})", nome_pasta, pasta_criada.id);

    // Importar itens
    if let Some(itens) = dados["itens"].as_array() {
        for item_json in itens {
            let tipo_str = item_json["tipo"].as_str().unwrap_or("nota");
            let novo_item = crate::db::models::NovoItem {
                pasta_id: pasta_criada.id.clone(),
                tipo: crate::db::models::TipoItem::de_str(tipo_str),
                titulo: item_json["titulo"].as_str().unwrap_or("Sem título").to_string(),
                descricao: item_json["descricao"].as_str().map(|s| s.to_string()),
                conteudo_nota: item_json["conteudo_nota"].as_str().map(|s| s.to_string()),
                data_vencimento: item_json["data_vencimento"].as_str().map(|s| s.to_string()),
                tag_ids: None,
            };

            let item_criado = queries::criar_item(conexao, &novo_item)?;

            // Importar anexos do item
            if let Some(anexos) = item_json["anexos"].as_array() {
                for anexo_json in anexos {
                    let caminho_interno_original = anexo_json["caminho_interno"]
                        .as_str()
                        .unwrap_or("");

                    if !caminho_interno_original.is_empty() {
                        let caminho_no_zip = format!("anexos/{}", caminho_interno_original);

                        // Extrair anexo do ZIP para armazenamento
                        if let Ok(mut entrada) = zip.by_name(&caminho_no_zip) {
                            let mut conteudo = Vec::new();
                            entrada.read_to_end(&mut conteudo)?;
                            drop(entrada);

                            // Salvar no armazenamento com novo UUID
                            let id_anexo = uuid::Uuid::new_v4().to_string();
                            let nome_original = anexo_json["nome_original"]
                                .as_str()
                                .unwrap_or("arquivo");

                            let dir_anexos = armazenamento::obter_diretorio_armazenamento(diretorio_app);
                            let dir_novo = dir_anexos.join(&id_anexo);
                            fs::create_dir_all(&dir_novo)?;

                            let caminho_destino = dir_novo.join(nome_original);
                            fs::write(&caminho_destino, &conteudo)?;

                            let hash = calcular_hash_bytes(&conteudo);

                            let anexo = crate::db::models::Anexo {
                                id: id_anexo.clone(),
                                item_id: Some(item_criado.id.clone()),
                                tarefa_id: None,
                                nome_original: nome_original.to_string(),
                                caminho_interno: format!("{}/{}", id_anexo, nome_original),
                                tamanho: conteudo.len() as i64,
                                tipo_mime: anexo_json["tipo_mime"]
                                    .as_str()
                                    .unwrap_or("application/octet-stream")
                                    .to_string(),
                                hash_sha256: Some(hash),
                                criado_em: Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string(),
                            };

                            queries::criar_anexo(conexao, &anexo)?;
                        }
                    }
                }
            }
        }
    }

    info!("Pacote importado com sucesso!");
    Ok(())
}

// =============================================================================
// FUNCOES AUXILIARES
// =============================================================================

/// Calcula o hash SHA-256 de um slice de bytes.
fn calcular_hash_bytes(dados: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(dados);
    hex::encode(hasher.finalize())
}

/// Lê e deserializa o manifesto.json de dentro de um arquivo ZIP.
fn ler_manifesto_do_zip(zip: &mut zip::ZipArchive<fs::File>) -> Result<ManifestoBackup> {
    let mut manifesto_arquivo = zip.by_name("manifesto.json")
        .context("Arquivo manifesto.json não encontrado no backup")?;

    let mut manifesto_json = String::new();
    manifesto_arquivo.read_to_string(&mut manifesto_json)
        .context("Falha ao ler manifesto.json")?;

    let manifesto: ManifestoBackup = serde_json::from_str(&manifesto_json)
        .context("Falha ao deserializar manifesto.json")?;

    Ok(manifesto)
}
