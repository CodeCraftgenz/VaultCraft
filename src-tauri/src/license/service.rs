use serde::{Deserialize, Serialize};
use std::time::Duration;

/// VaultCraft app_id registrado no backend codecraftgenz.
const APP_ID: u32 = 14;

const VERIFY_ENDPOINT: &str =
    "https://codecraftgenz-monorepo.onrender.com/api/verify-license";
const ACTIVATE_ENDPOINT: &str =
    "https://codecraftgenz-monorepo.onrender.com/api/public/license/activate-device";
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);

/// Resultado de uma chamada da API de licenca.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseCheckResult {
    pub success: bool,
    pub message: String,
    pub code: String,
}

/// Verifica uma licenca existente com a API remota.
pub async fn verify_license(email: &str, hardware_id: &str) -> LicenseCheckResult {
    if email.trim().is_empty() {
        return LicenseCheckResult {
            success: false,
            message: "E-mail não informado.".into(),
            code: "INVALID_EMAIL".into(),
        };
    }

    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .expect("Falha ao criar cliente HTTP");

    let payload = serde_json::json!({
        "app_id": APP_ID,
        "email": email.trim().to_lowercase(),
        "hardware_id": hardware_id.trim()
    });

    let response = match client.post(VERIFY_ENDPOINT).json(&payload).send().await {
        Ok(resp) => resp,
        Err(e) => {
            if e.is_timeout() {
                return LicenseCheckResult {
                    success: false,
                    message: "Tempo esgotado ao verificar licença.".into(),
                    code: "TIMEOUT".into(),
                };
            }
            return LicenseCheckResult {
                success: false,
                message: format!("Erro de conexão: {}", e),
                code: "NETWORK_ERROR".into(),
            };
        }
    };

    let status = response.status();
    let text = match response.text().await {
        Ok(t) => t,
        Err(_) => {
            return LicenseCheckResult {
                success: false,
                message: "Resposta inválida do servidor.".into(),
                code: "INVALID_RESPONSE".into(),
            };
        }
    };

    parse_verify_response(&text, status.as_u16())
}

/// Ativa uma licenca para este dispositivo.
pub async fn activate_license(email: &str, hardware_id: &str) -> LicenseCheckResult {
    if email.trim().is_empty() {
        return LicenseCheckResult {
            success: false,
            message: "E-mail não informado.".into(),
            code: "INVALID_EMAIL".into(),
        };
    }

    let client = reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .expect("Falha ao criar cliente HTTP");

    let payload = serde_json::json!({
        "app_id": APP_ID,
        "email": email.trim().to_lowercase(),
        "hardware_id": hardware_id.trim()
    });

    let response = match client.post(ACTIVATE_ENDPOINT).json(&payload).send().await {
        Ok(resp) => resp,
        Err(e) => {
            if e.is_timeout() {
                return LicenseCheckResult {
                    success: false,
                    message: "Tempo esgotado ao ativar licença.".into(),
                    code: "TIMEOUT".into(),
                };
            }
            return LicenseCheckResult {
                success: false,
                message: format!("Erro de conexão: {}", e),
                code: "NETWORK_ERROR".into(),
            };
        }
    };

    let text = match response.text().await {
        Ok(t) => t,
        Err(_) => {
            return LicenseCheckResult {
                success: false,
                message: "Resposta inválida do servidor.".into(),
                code: "INVALID_RESPONSE".into(),
            };
        }
    };

    parse_activate_response(&text)
}

fn parse_verify_response(text: &str, status_code: u16) -> LicenseCheckResult {
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(text);

    match parsed {
        Ok(json) => {
            if let Some(data) = json.get("data").and_then(|d| d.as_object()) {
                if let Some(valid) = data.get("valid").and_then(|v| v.as_bool()) {
                    let msg = data
                        .get("message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("")
                        .to_string();
                    return LicenseCheckResult {
                        success: valid,
                        message: msg,
                        code: if valid { "VALID".into() } else { "INVALID".into() },
                    };
                }
            }

            if let Some(valid) = json.get("valid").and_then(|v| v.as_bool()) {
                let msg = json
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("")
                    .to_string();
                return LicenseCheckResult {
                    success: valid,
                    message: msg,
                    code: if valid { "VALID".into() } else { "INVALID".into() },
                };
            }

            if let Some(err) = json.get("error").and_then(|e| e.as_object()) {
                let code = err
                    .get("code")
                    .and_then(|c| c.as_str())
                    .unwrap_or("ERROR")
                    .to_string();
                let msg = err
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Falha na verificação")
                    .to_string();
                return LicenseCheckResult {
                    success: false,
                    message: msg,
                    code,
                };
            }

            if let Some(success) = json.get("success").and_then(|s| s.as_bool()) {
                if !success {
                    let msg = json
                        .get("message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("Falha na verificação")
                        .to_string();
                    return LicenseCheckResult {
                        success: false,
                        message: msg,
                        code: "FAILED".into(),
                    };
                }
            }

            LicenseCheckResult {
                success: false,
                message: "Resposta inesperada do servidor.".into(),
                code: "UNEXPECTED_RESPONSE".into(),
            }
        }
        Err(_) => {
            if status_code >= 400 {
                LicenseCheckResult {
                    success: false,
                    message: format!("Servidor retornou erro HTTP {}.", status_code),
                    code: "HTTP_ERROR".into(),
                }
            } else {
                LicenseCheckResult {
                    success: false,
                    message: "Não foi possível interpretar a resposta do servidor.".into(),
                    code: "PARSE_ERROR".into(),
                }
            }
        }
    }
}

fn parse_activate_response(text: &str) -> LicenseCheckResult {
    let parsed: Result<serde_json::Value, _> = serde_json::from_str(text);

    match parsed {
        Ok(json) => {
            if let Some(success) = json.get("success").and_then(|s| s.as_bool()) {
                if success {
                    let data = json.get("data");
                    let license_key = data
                        .and_then(|d| d.get("license_key"))
                        .and_then(|k| k.as_str())
                        .unwrap_or("")
                        .to_string();
                    let message = data
                        .and_then(|d| d.get("message"))
                        .and_then(|m| m.as_str())
                        .unwrap_or("Licença ativada com sucesso!")
                        .to_string();
                    return LicenseCheckResult {
                        success: true,
                        message,
                        code: license_key,
                    };
                }
            }

            if let Some(err) = json.get("error").and_then(|e| e.as_object()) {
                let code = err
                    .get("code")
                    .and_then(|c| c.as_str())
                    .unwrap_or("ERROR")
                    .to_string();
                let msg = err
                    .get("message")
                    .and_then(|m| m.as_str())
                    .unwrap_or("Falha na ativação")
                    .to_string();
                return LicenseCheckResult {
                    success: false,
                    message: msg,
                    code,
                };
            }

            let msg = json
                .get("message")
                .and_then(|m| m.as_str())
                .unwrap_or("Você não possui licença para este app. Realize a compra primeiro.")
                .to_string();

            LicenseCheckResult {
                success: false,
                message: msg,
                code: "NO_LICENSE".into(),
            }
        }
        Err(_) => LicenseCheckResult {
            success: false,
            message: "Resposta inválida do servidor.".into(),
            code: "PARSE_ERROR".into(),
        },
    }
}
