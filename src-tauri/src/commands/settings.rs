use keyring::Entry;
use std::process::Command;
use tauri::{command, State};

use crate::db::connection::ChatDb;
use crate::db::ModelInfo;
use crate::state::AppState;

const SERVICE_NAME: &str = "com.backchannel.app";
const API_KEY_NAME: &str = "openrouter_api_key";

#[command]
pub async fn save_api_key(api_key: String, state: State<'_, AppState>) -> Result<(), String> {
    // Save to system keychain
    let entry = Entry::new(SERVICE_NAME, API_KEY_NAME).map_err(|e| e.to_string())?;
    entry.set_password(&api_key).map_err(|e| e.to_string())?;

    // Update state
    state.update_api_key(api_key)?;

    Ok(())
}

#[command]
pub async fn get_api_key(state: State<'_, AppState>) -> Result<Option<String>, String> {
    // Try to get from keychain
    let entry = Entry::new(SERVICE_NAME, API_KEY_NAME).map_err(|e| e.to_string())?;

    match entry.get_password() {
        Ok(key) => {
            // Update state with the key
            state.update_api_key(key.clone())?;
            Ok(Some(key))
        }
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub async fn check_permissions() -> Result<bool, String> {
    let db_path = ChatDb::db_path();

    match std::fs::metadata(&db_path) {
        Ok(_) => {
            // Try to actually open the file to verify read access
            match std::fs::File::open(&db_path) {
                Ok(_) => Ok(true),
                Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => Ok(false),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            // Database doesn't exist - Messages app might not have been used
            Ok(false)
        }
        Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

#[command]
pub async fn open_privacy_settings() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles")
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn get_available_models() -> Result<Vec<ModelInfo>, String> {
    Ok(vec![
        ModelInfo {
            id: "anthropic/claude-3.5-sonnet".to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            description: "Best for complex analysis and summaries".to_string(),
        },
        ModelInfo {
            id: "openai/gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            description: "Fast and capable general purpose".to_string(),
        },
        ModelInfo {
            id: "anthropic/claude-3-haiku".to_string(),
            name: "Claude 3 Haiku".to_string(),
            description: "Fast and cost-effective for simple queries".to_string(),
        },
        ModelInfo {
            id: "google/gemini-pro-1.5".to_string(),
            name: "Gemini Pro 1.5".to_string(),
            description: "Good for long context conversations".to_string(),
        },
        ModelInfo {
            id: "meta-llama/llama-3.1-70b-instruct".to_string(),
            name: "Llama 3.1 70B".to_string(),
            description: "Open source, good general performance".to_string(),
        },
    ])
}
