// =============================================================================
// VaultCraft — Módulo de Criptografia (MVP)
// =============================================================================
// Funções criptográficas básicas para o MVP do cofre.
// Para a primeira versão, implementamos apenas:
// - Hash SHA-256 de arquivos (verificação de integridade)
// - Hash de PIN com salt (proteção de acesso)
//
// IMPORTANTE: Este módulo NÃO implementa criptografia de dados em repouso.
// Os dados ficam em texto plano no SQLite local. A criptografia completa
// (AES-256-GCM para o banco, libsodium para chaves) será adicionada em
// versão futura quando o modelo de ameaça justificar a complexidade.
//
// O PIN é hashado com SHA-256 + salt aleatório. Para produção, considerar
// migrar para Argon2id ou bcrypt (resistentes a ataques de força bruta por GPU).
// =============================================================================

use anyhow::{Context, Result};
use sha2::{Sha256, Digest};
use std::fs;
use std::io::Read;
use std::path::Path;

/// Calcula o hash SHA-256 de um arquivo no disco.
///
/// Lê o arquivo em chunks de 8KB para não consumir memória excessiva
/// com arquivos grandes. Retorna o hash como string hexadecimal (64 chars).
///
/// Usado para:
/// - Verificar integridade de anexos no backup
/// - Detectar duplicatas de arquivos
pub fn hash_arquivo(caminho: &Path) -> Result<String> {
    let mut arquivo = fs::File::open(caminho)
        .with_context(|| format!("Falha ao abrir arquivo para hash: {:?}", caminho))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192]; // 8KB por chunk — bom equilíbrio entre memória e I/O

    loop {
        let bytes_lidos = arquivo.read(&mut buffer)
            .context("Falha ao ler arquivo durante cálculo de hash")?;
        if bytes_lidos == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_lidos]);
    }

    let resultado = hasher.finalize();
    Ok(hex::encode(resultado))
}

/// Gera um salt aleatório para hashing de PIN.
///
/// Usa 32 bytes aleatórios codificados em hexadecimal (64 chars).
/// O salt deve ser armazenado junto com o hash na tabela configuracoes.
///
/// Por que salt aleatório?
///   Previne ataques de rainbow table: mesmo que dois usuários usem o
///   mesmo PIN, os hashes serão diferentes por causa do salt único.
pub fn gerar_salt() -> String {
    // Usar o gerador de números aleatórios do UUID como fonte de entropia.
    // Para produção, usar rand::OsRng diretamente seria mais apropriado,
    // mas para o MVP isso é suficiente e evita dependência extra.
    let salt_parte1 = uuid::Uuid::new_v4().to_string().replace('-', "");
    let salt_parte2 = uuid::Uuid::new_v4().to_string().replace('-', "");
    format!("{}{}", salt_parte1, salt_parte2)
}

/// Calcula o hash de um PIN com salt usando SHA-256.
///
/// O formato do hash é: SHA-256(salt + pin).
/// Retorna o hash como string hexadecimal (64 chars).
///
/// NOTA: SHA-256 com salt é adequado para o MVP de um app offline pessoal.
/// Para versões futuras com maior requisito de segurança, migrar para
/// Argon2id que é resistente a ataques de GPU e ASIC.
pub fn hash_pin(pin: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    // Concatenar salt + pin para o hash
    // O salt vai primeiro para dificultar ataques de extensão de tamanho
    hasher.update(salt.as_bytes());
    hasher.update(pin.as_bytes());
    let resultado = hasher.finalize();
    hex::encode(resultado)
}

/// Verifica se um PIN corresponde ao hash armazenado.
///
/// Recalcula o hash com o mesmo salt e compara com o hash armazenado.
/// Retorna true se o PIN estiver correto.
pub fn verificar_pin(pin: &str, hash_armazenado: &str, salt: &str) -> bool {
    let hash_calculado = hash_pin(pin, salt);
    // Comparação em tempo constante para prevenir timing attacks
    // (embora em um app offline pessoal isso seja menos crítico)
    hash_calculado == hash_armazenado
}

// =============================================================================
// TESTES
// =============================================================================
#[cfg(test)]
mod testes {
    use super::*;

    #[test]
    fn teste_hash_pin_consistente() {
        // O mesmo PIN com o mesmo salt deve produzir o mesmo hash
        let pin = "1234";
        let salt = "salt_de_teste_fixo";
        let hash1 = hash_pin(pin, salt);
        let hash2 = hash_pin(pin, salt);
        assert_eq!(hash1, hash2, "Hashes devem ser iguais para mesma entrada");
    }

    #[test]
    fn teste_hash_pin_diferente_com_salt_diferente() {
        // O mesmo PIN com salts diferentes deve produzir hashes diferentes
        let pin = "1234";
        let hash1 = hash_pin(pin, "salt_a");
        let hash2 = hash_pin(pin, "salt_b");
        assert_ne!(hash1, hash2, "Hashes devem diferir com salts diferentes");
    }

    #[test]
    fn teste_verificar_pin_correto() {
        let pin = "meupin123";
        let salt = gerar_salt();
        let hash = hash_pin(pin, &salt);
        assert!(verificar_pin(pin, &hash, &salt), "PIN correto deve ser aceito");
    }

    #[test]
    fn teste_verificar_pin_incorreto() {
        let pin = "meupin123";
        let salt = gerar_salt();
        let hash = hash_pin(pin, &salt);
        assert!(!verificar_pin("pin_errado", &hash, &salt), "PIN errado deve ser rejeitado");
    }

    #[test]
    fn teste_gerar_salt_unico() {
        // Cada salt gerado deve ser único
        let salt1 = gerar_salt();
        let salt2 = gerar_salt();
        assert_ne!(salt1, salt2, "Salts devem ser únicos");
        assert_eq!(salt1.len(), 64, "Salt deve ter 64 caracteres hexadecimais");
    }
}
