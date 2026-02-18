use serde::{Deserialize, Serialize};
use tauri::State;

use crate::license::{hardware, service, storage};
use super::EstadoApp;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseStatus {
    pub is_licensed: bool,
    pub email: String,
    pub hardware_id: String,
    pub message: String,
}

#[tauri::command]
pub async fn check_license(estado: State<'_, EstadoApp>) -> Result<LicenseStatus, String> {
    let app_data_dir = estado.diretorio_app.to_string_lossy().to_string();
    let hardware_id = hardware::get_hardware_id();

    let record = match storage::load(&app_data_dir) {
        Some(r) => r,
        None => {
            return Ok(LicenseStatus {
                is_licensed: false,
                email: String::new(),
                hardware_id,
                message: "Nenhuma licença encontrada.".into(),
            });
        }
    };

    let result = service::verify_license(&record.email, &hardware_id).await;

    if result.success {
        log::info!("Licença verificada com sucesso para {}", record.email);
        return Ok(LicenseStatus {
            is_licensed: true,
            email: record.email,
            hardware_id,
            message: "Licença ativa.".into(),
        });
    }

    if result.code == "TIMEOUT" || result.code == "NETWORK_ERROR" {
        if record.machine_fingerprint != hardware_id {
            log::warn!("Licença local não pertence a esta máquina (fingerprint mismatch)");
            storage::clear(&app_data_dir);
            return Ok(LicenseStatus {
                is_licensed: false,
                email: String::new(),
                hardware_id,
                message: "Licença inválida para este computador.".into(),
            });
        }

        log::warn!(
            "Verificação online falhou ({}), usando licença local",
            result.code
        );
        return Ok(LicenseStatus {
            is_licensed: true,
            email: record.email,
            hardware_id,
            message: "Licença ativa (modo offline).".into(),
        });
    }

    log::warn!("Licença inválida: {}", result.message);
    storage::clear(&app_data_dir);

    Ok(LicenseStatus {
        is_licensed: false,
        email: String::new(),
        hardware_id,
        message: result.message,
    })
}

#[tauri::command]
pub async fn activate_license(
    email: String,
    estado: State<'_, EstadoApp>,
) -> Result<LicenseStatus, String> {
    let app_data_dir = estado.diretorio_app.to_string_lossy().to_string();
    let hardware_id = hardware::get_hardware_id();

    if email.trim().is_empty() {
        return Ok(LicenseStatus {
            is_licensed: false,
            email: String::new(),
            hardware_id,
            message: "Informe seu e-mail de compra.".into(),
        });
    }

    let result = service::activate_license(&email, &hardware_id).await;

    if result.success {
        let record = storage::InstallationRecord {
            email: email.trim().to_lowercase(),
            license_key: result.code.clone(),
            machine_fingerprint: hardware_id.clone(),
            installed_at: chrono::Utc::now().to_rfc3339(),
        };

        storage::save(&app_data_dir, &record)
            .map_err(|e| format!("Licença ativada mas erro ao salvar: {}", e))?;

        log::info!("Licença ativada com sucesso para {}", email);

        return Ok(LicenseStatus {
            is_licensed: true,
            email: email.trim().to_lowercase(),
            hardware_id,
            message: result.message,
        });
    }

    Ok(LicenseStatus {
        is_licensed: false,
        email: String::new(),
        hardware_id,
        message: result.message,
    })
}

#[tauri::command]
pub fn get_hardware_id() -> String {
    hardware::get_hardware_id()
}

#[tauri::command]
pub fn logout_license(estado: State<'_, EstadoApp>) -> Result<(), String> {
    let app_data_dir = estado.diretorio_app.to_string_lossy().to_string();
    storage::clear(&app_data_dir);
    Ok(())
}
