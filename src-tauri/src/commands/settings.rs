use keyring::Entry;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::{command, AppHandle, State};

use crate::db::connection::ChatDb;
use crate::db::ModelInfo;
use crate::llm::LlmProvider;
use crate::state::AppState;

const SERVICE_NAME: &str = "com.backchannel.app";
const API_KEY_NAME: &str = "openrouter_api_key";

/// Config file for non-sensitive settings (no keychain prompts)
#[derive(Debug, Serialize, Deserialize, Default)]
struct AppConfig {
    provider: Option<String>,
    model: Option<String>,
    ollama_url: Option<String>,
}

fn get_config_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let config_dir = PathBuf::from(home)
        .join("Library")
        .join("Application Support")
        .join("com.backchannel.app");

    // Create directory if it doesn't exist
    let _ = fs::create_dir_all(&config_dir);

    config_dir.join("config.json")
}

fn load_config() -> AppConfig {
    let path = get_config_path();
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => AppConfig::default(),
    }
}

fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

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
pub async fn get_available_models(state: State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    let provider = state.get_provider()?;

    match provider {
        LlmProvider::Ollama => {
            // Return list of recommended Ollama models
            Ok(vec![
                ModelInfo {
                    id: "llama3.1:8b".to_string(),
                    name: "Llama 3.1 8B".to_string(),
                    description: "Best balance of quality and speed".to_string(),
                },
                ModelInfo {
                    id: "llama3.2:3b".to_string(),
                    name: "Llama 3.2 3B".to_string(),
                    description: "Fast and lightweight".to_string(),
                },
                ModelInfo {
                    id: "mistral:7b".to_string(),
                    name: "Mistral 7B".to_string(),
                    description: "Great for general tasks".to_string(),
                },
                ModelInfo {
                    id: "qwen2.5:7b".to_string(),
                    name: "Qwen 2.5 7B".to_string(),
                    description: "Strong reasoning capabilities".to_string(),
                },
                ModelInfo {
                    id: "gemma2:9b".to_string(),
                    name: "Gemma 2 9B".to_string(),
                    description: "Google's efficient model".to_string(),
                },
            ])
        }
        LlmProvider::OpenRouter => {
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
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProviderSettings {
    pub provider: String,
    pub ollama_url: String,
    pub model: String,
}

#[command]
pub async fn get_provider_settings(state: State<'_, AppState>) -> Result<ProviderSettings, String> {
    // Load from config file (no keychain prompts!)
    let config = load_config();

    let provider = config.provider.unwrap_or_else(|| "ollama".to_string());
    let ollama_url = config.ollama_url.unwrap_or_else(|| "http://localhost:11434".to_string());
    let model = config.model.unwrap_or_else(|| {
        if provider == "ollama" {
            "llama3.1:8b".to_string()
        } else {
            "anthropic/claude-3.5-sonnet".to_string()
        }
    });

    // Update state with loaded settings
    let llm_provider = if provider == "ollama" {
        LlmProvider::Ollama
    } else {
        LlmProvider::OpenRouter
    };
    state.update_provider(llm_provider)?;
    state.update_ollama_url(ollama_url.clone())?;
    state.update_model(model.clone())?;

    Ok(ProviderSettings {
        provider,
        ollama_url,
        model,
    })
}

#[command]
pub async fn save_provider_settings(
    provider: String,
    ollama_url: String,
    model: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Save to config file (no keychain prompts!)
    let config = AppConfig {
        provider: Some(provider.clone()),
        model: Some(model.clone()),
        ollama_url: Some(ollama_url.clone()),
    };
    save_config(&config)?;

    // Update state
    let llm_provider = if provider == "ollama" {
        LlmProvider::Ollama
    } else {
        LlmProvider::OpenRouter
    };
    state.update_provider(llm_provider)?;
    state.update_ollama_url(ollama_url)?;
    state.update_model(model)?;

    Ok(())
}

#[derive(Debug, Deserialize)]
struct OllamaModel {
    name: String,
}

#[derive(Debug, Deserialize)]
struct OllamaModelsResponse {
    models: Vec<OllamaModel>,
}

#[command]
pub async fn fetch_ollama_models(ollama_url: String) -> Result<Vec<ModelInfo>, String> {
    let client = Client::new();

    let response = client
        .get(format!("{}/api/tags", ollama_url))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama at {}: {}. Is Ollama running?", ollama_url, e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Ollama returned error: {}",
            response.status()
        ));
    }

    let models: OllamaModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(models
        .models
        .into_iter()
        .map(|m| ModelInfo {
            id: m.name.clone(),
            name: m.name.clone(),
            description: "Installed locally".to_string(),
        })
        .collect())
}

#[command]
pub async fn check_ollama_status(ollama_url: String) -> Result<bool, String> {
    let client = Client::new();

    match client.get(format!("{}/api/tags", ollama_url)).send().await {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[command]
#[allow(unreachable_code)]
pub async fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
    Ok(())
}
