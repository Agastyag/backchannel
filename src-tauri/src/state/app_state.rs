use std::sync::Mutex;

use crate::db::ChatDb;
use crate::llm::{LlmClient, LlmConfig, LlmProvider, Nl2SqlEngine};

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

        // Only require API key for OpenRouter
        if config.provider == LlmProvider::OpenRouter && config.api_key.is_empty() {
            return Err("OpenRouter API key not configured".to_string());
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

    pub fn update_provider(&self, provider: LlmProvider) -> Result<(), String> {
        let mut config = self.llm_config.lock().map_err(|e| e.to_string())?;
        config.provider = provider;
        Ok(())
    }

    pub fn update_ollama_url(&self, url: String) -> Result<(), String> {
        let mut config = self.llm_config.lock().map_err(|e| e.to_string())?;
        config.ollama_url = url;
        Ok(())
    }

    pub fn get_provider(&self) -> Result<LlmProvider, String> {
        let config = self.llm_config.lock().map_err(|e| e.to_string())?;
        Ok(config.provider.clone())
    }

    pub fn get_ollama_url(&self) -> Result<String, String> {
        let config = self.llm_config.lock().map_err(|e| e.to_string())?;
        Ok(config.ollama_url.clone())
    }

    pub fn get_model(&self) -> Result<String, String> {
        let config = self.llm_config.lock().map_err(|e| e.to_string())?;
        Ok(config.model.clone())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
