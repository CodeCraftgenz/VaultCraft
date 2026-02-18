use chrono::{NaiveDateTime, Utc};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

const TRIAL_DURATION_DAYS: i64 = 14;
const LICENSE_SALT: &str = "VaultCraft-2025-License-Salt";

/// Valida uma chave de licenca offline.
/// Formato: VLTCR-XXXXX-XXXXX-XXXXX-CHECK
pub fn validate_key(key: &str) -> bool {
    let key = key.trim();

    if !key.starts_with("VLTCR-") {
        return false;
    }

    let parts: Vec<&str> = key.split('-').collect();
    if parts.len() != 5 {
        return false;
    }

    let check = parts[4];
    let payload = format!("{}-{}-{}-{}-{}", parts[0], parts[1], parts[2], parts[3], LICENSE_SALT);
    let expected_check = compute_hash_check(&payload);

    check == expected_check
}

pub fn is_trial_active(trial_started: &str) -> bool {
    if trial_started.is_empty() {
        return false;
    }

    match NaiveDateTime::parse_from_str(trial_started, "%Y-%m-%d %H:%M:%S") {
        Ok(start) => {
            let now = Utc::now().naive_utc();
            let elapsed = now.signed_duration_since(start);
            elapsed.num_days() < TRIAL_DURATION_DAYS
        }
        Err(_) => {
            log::warn!("Formato invalido de trial_started: '{}'", trial_started);
            false
        }
    }
}

pub fn trial_days_remaining(trial_started: &str) -> i64 {
    if trial_started.is_empty() {
        return 0;
    }

    match NaiveDateTime::parse_from_str(trial_started, "%Y-%m-%d %H:%M:%S") {
        Ok(start) => {
            let now = Utc::now().naive_utc();
            let elapsed = now.signed_duration_since(start);
            let remaining = TRIAL_DURATION_DAYS - elapsed.num_days();
            remaining.max(0)
        }
        Err(_) => 0,
    }
}

#[cfg(debug_assertions)]
pub fn generate_test_key(part1: &str, part2: &str, part3: &str) -> String {
    let payload = format!("VLTCR-{}-{}-{}-{}", part1, part2, part3, LICENSE_SALT);
    let check = compute_hash_check(&payload);
    format!("VLTCR-{}-{}-{}-{}", part1, part2, part3, check)
}

fn compute_hash_check(payload: &str) -> String {
    let mut hasher = DefaultHasher::new();
    payload.hash(&mut hasher);
    let hash = hasher.finish();

    let chars: Vec<char> = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".chars().collect();
    let base = chars.len() as u64;

    let mut result = String::with_capacity(5);
    let mut remaining = hash;
    for _ in 0..5 {
        let idx = (remaining % base) as usize;
        result.push(chars[idx]);
        remaining /= base;
    }

    result
}
