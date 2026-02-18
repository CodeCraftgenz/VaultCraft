// =============================================================================
// VaultCraft — Serviço de Armazenamento de Arquivos
// =============================================================================
// Gerencia os arquivos físicos (anexos) no disco local.
// Os anexos são armazenados em: {app_dir}/storage/anexos/{id}/{nome_original}
//
// Decisões de design:
// - Cada anexo fica em sua própria subpasta (pelo ID) para evitar colisões de nome
// - O hash SHA-256 é calculado na gravação para verificação posterior (backups)
// - O tipo MIME é detectado pela extensão do arquivo (simples e suficiente para MVP)
// - Nenhuma rede é usada — tudo é local e offline
// =============================================================================

use anyhow::{Context, Result};
use chrono::Utc;
use log::info;
use sha2::{Sha256, Digest};
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::db::models::Anexo;

/// Retorna o diretório raiz de armazenamento de anexos.
/// Cria o diretório se não existir.
pub fn obter_diretorio_armazenamento(diretorio_app: &Path) -> PathBuf {
    let dir = diretorio_app.join("storage").join("anexos");
    // Criar diretório se não existir (ignorar erro se já existe)
    let _ = fs::create_dir_all(&dir);
    dir
}

/// Salva um arquivo como anexo no armazenamento interno do cofre.
///
/// Processo:
/// 1. Gera um UUID único para o anexo
/// 2. Cria subpasta com o UUID: storage/anexos/{uuid}/
/// 3. Copia o arquivo para a subpasta mantendo o nome original
/// 4. Calcula o hash SHA-256 do conteúdo para integridade
/// 5. Detecta o tipo MIME pela extensão
/// 6. Retorna o struct Anexo pronto para inserção no banco
///
/// O registro no banco de dados NÃO é feito aqui — é responsabilidade
/// do chamador (command) inserir via queries::criar_anexo().
pub fn salvar_anexo(
    diretorio_app: &Path,
    arquivo_origem: &Path,
    item_id: Option<&str>,
    tarefa_id: Option<&str>,
) -> Result<Anexo> {
    let id = Uuid::new_v4().to_string();
    let agora = Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // Obter nome original do arquivo
    let nome_original = arquivo_origem
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("arquivo_desconhecido")
        .to_string();

    // Criar diretório do anexo: storage/anexos/{id}/
    let dir_armazenamento = obter_diretorio_armazenamento(diretorio_app);
    let dir_anexo = dir_armazenamento.join(&id);
    fs::create_dir_all(&dir_anexo)
        .with_context(|| format!("Falha ao criar diretório do anexo: {:?}", dir_anexo))?;

    // Caminho de destino: storage/anexos/{id}/{nome_original}
    let caminho_destino = dir_anexo.join(&nome_original);

    // Copiar arquivo para o armazenamento interno
    fs::copy(arquivo_origem, &caminho_destino)
        .with_context(|| format!(
            "Falha ao copiar arquivo {:?} para {:?}",
            arquivo_origem, caminho_destino
        ))?;

    // Calcular hash SHA-256 do arquivo copiado
    let hash = calcular_hash_arquivo(&caminho_destino)?;

    // Obter tamanho do arquivo
    let metadados = fs::metadata(&caminho_destino)
        .context("Falha ao obter metadados do arquivo copiado")?;
    let tamanho = metadados.len() as i64;

    // Detectar tipo MIME pela extensão
    let tipo_mime = detectar_tipo_mime(&nome_original);

    // Caminho interno relativo (para portabilidade entre sistemas)
    let caminho_interno = format!("{}/{}", id, nome_original);

    info!(
        "Anexo salvo: {} ({}) tamanho={} hash={}",
        nome_original, id, tamanho, &hash[..16]
    );

    Ok(Anexo {
        id,
        item_id: item_id.map(|s| s.to_string()),
        tarefa_id: tarefa_id.map(|s| s.to_string()),
        nome_original,
        caminho_interno,
        tamanho,
        tipo_mime,
        hash_sha256: Some(hash),
        criado_em: agora,
    })
}

/// Remove um anexo do armazenamento (arquivo físico e diretório).
/// O registro no banco deve ser removido separadamente pelo chamador.
pub fn remover_anexo(diretorio_app: &Path, caminho_interno: &str) -> Result<()> {
    let dir_armazenamento = obter_diretorio_armazenamento(diretorio_app);
    let caminho_completo = dir_armazenamento.join(caminho_interno);

    // Remover o arquivo
    if caminho_completo.exists() {
        fs::remove_file(&caminho_completo)
            .with_context(|| format!("Falha ao remover arquivo: {:?}", caminho_completo))?;
    }

    // Tentar remover o diretório pai (subpasta do UUID) se estiver vazio
    if let Some(dir_pai) = caminho_completo.parent() {
        let _ = fs::remove_dir(dir_pai); // Ignora erro se não estiver vazio
    }

    info!("Anexo removido do armazenamento: {}", caminho_interno);
    Ok(())
}

/// Abre um anexo com o aplicativo padrão do sistema operacional.
/// Usa o crate tauri-plugin-shell, mas aqui retornamos apenas o caminho
/// completo para que o command do Tauri faça a abertura via shell.
pub fn obter_caminho_completo_anexo(diretorio_app: &Path, caminho_interno: &str) -> Result<PathBuf> {
    let dir_armazenamento = obter_diretorio_armazenamento(diretorio_app);
    let caminho_completo = dir_armazenamento.join(caminho_interno);

    if !caminho_completo.exists() {
        anyhow::bail!("Arquivo não encontrado: {:?}", caminho_completo);
    }

    Ok(caminho_completo)
}

/// Calcula o hash SHA-256 de um arquivo.
/// Lê o arquivo em chunks de 8KB para não consumir muita memória.
fn calcular_hash_arquivo(caminho: &Path) -> Result<String> {
    let mut arquivo = fs::File::open(caminho)
        .with_context(|| format!("Falha ao abrir arquivo para hash: {:?}", caminho))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192]; // 8KB por chunk

    loop {
        let bytes_lidos = arquivo.read(&mut buffer)
            .context("Falha ao ler arquivo para hash")?;
        if bytes_lidos == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_lidos]);
    }

    let hash = hasher.finalize();
    Ok(hex::encode(hash))
}

/// Detecta o tipo MIME com base na extensão do arquivo.
/// Cobre os tipos mais comuns para um cofre pessoal.
/// Retorna "application/octet-stream" como fallback.
fn detectar_tipo_mime(nome_arquivo: &str) -> String {
    let extensao = nome_arquivo
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_lowercase();

    match extensao.as_str() {
        // Documentos
        "pdf" => "application/pdf",
        "doc" | "docx" => "application/msword",
        "xls" | "xlsx" => "application/vnd.ms-excel",
        "ppt" | "pptx" => "application/vnd.ms-powerpoint",
        "odt" => "application/vnd.oasis.opendocument.text",
        "ods" => "application/vnd.oasis.opendocument.spreadsheet",
        "txt" => "text/plain",
        "csv" => "text/csv",
        "html" | "htm" => "text/html",
        "md" => "text/markdown",
        "json" => "application/json",
        "xml" => "application/xml",

        // Imagens
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "ico" => "image/x-icon",

        // Áudio
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",

        // Vídeo
        "mp4" => "video/mp4",
        "avi" => "video/x-msvideo",
        "mkv" => "video/x-matroska",

        // Compactados
        "zip" => "application/zip",
        "rar" => "application/x-rar-compressed",
        "7z" => "application/x-7z-compressed",
        "gz" | "tar" => "application/gzip",

        // Fallback
        _ => "application/octet-stream",
    }
    .to_string()
}
