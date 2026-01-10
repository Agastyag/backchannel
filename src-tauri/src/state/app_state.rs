use std::sync::Mutex;

use crate::db::ChatDb;
use crate::llm::{LlmClient, LlmConfig, Nl2SqlEngine};

pub struct AppState {
    pub llm_config: Mutex<LlmConfig>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            llm_config: Mutex::new(LlmConfig::default()),
        }
    }

    pub fn get_db(&self) -> Result<ChatDb, String> {
        ChatDb::new().map_err(|e| e.to_string())
    }

    pub fn get_llm_client(&self) -> Result<LlmClient, String> {
        let config = self
            .llm_config
            .lock()
            .map_err(|e| e.to_string())?
            .clone();

        if config.api_key.is_empty() {
            return Err("API key not configured".to_string());
        }

        Ok(LlmClient::new(config))
    }

    pub fn get_nl2sql_engine(&self) -> Result<Nl2SqlEngine, String> {
        let llm = self.get_llm_client()?;
        Ok(Nl2SqlEngine::new(llm))
    }

    pub fn update_api_key(&self, api_key: String) -> Result<(), String> {
        let mut config = self.llm_config.lock().map_err(|e| e.to_string())?;
        config.api_key = api_key;
        Ok(())
    }

    pub fn update_model(&self, model: String) -> Result<(), String> {
        let mut config = self.llm_config.lock().map_err(|e| e.to_string())?;
        config.model = model;
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
