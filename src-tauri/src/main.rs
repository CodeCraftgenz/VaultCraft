// =============================================================================
// VaultCraft — Ponto de Entrada do Executável (main.rs)
// =============================================================================
// Este arquivo existe apenas para iniciar o aplicativo Tauri.
// Toda a lógica está em lib.rs para permitir reutilização e testes.
//
// O atributo windows_subsystem("windows") impede a abertura de uma
// janela de console no Windows quando o app é executado normalmente.
// =============================================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vaultcraft_lib::run();
}
