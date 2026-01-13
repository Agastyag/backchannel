use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "lowercase")]
pub enum LlmProvider {
    #[default]
    Ollama,
    OpenRouter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: LlmProvider,
    pub api_key: String,
    pub model: String,
    pub ollama_url: String,
    pub temperature: f32,
    pub max_tokens: u32,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            provider: LlmProvider::Ollama,
            api_key: String::new(),
            model: "llama3.1:8b".to_string(),
            ollama_url: "http://localhost:11434".to_string(),
            temperature: 0.7,
            max_tokens: 4096,
        }
    }
}

#[derive(Debug, Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_tokens: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    stream: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ResponseMessage,
}

#[derive(Debug, Deserialize)]
struct ResponseMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct StreamChunk {
    choices: Vec<StreamChoice>,
}

#[derive(Debug, Deserialize)]
struct StreamChoice {
    delta: StreamDelta,
}

#[derive(Debug, Deserialize)]
struct StreamDelta {
    content: Option<String>,
}

pub struct LlmClient {
    client: Client,
    config: LlmConfig,
}

impl LlmClient {
    pub fn new(config: LlmConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    pub async fn complete(&self, prompt: &str, system: Option<&str>) -> Result<String, String> {
        let mut messages = Vec::new();

        if let Some(sys) = system {
            messages.push(ChatMessage {
                role: "system".to_string(),
                content: sys.to_string(),
            });
        }

        messages.push(ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        });

        let request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages,
            temperature: Some(self.config.temperature),
            max_tokens: Some(self.config.max_tokens),
            stream: Some(false),
        };

        let response = match self.config.provider {
            LlmProvider::Ollama => {
                self.client
                    .post(format!("{}/v1/chat/completions", self.config.ollama_url))
                    .json(&request)
                    .send()
                    .await
                    .map_err(|e| format!("Ollama connection error: {}. Is Ollama running?", e))?
            }
            LlmProvider::OpenRouter => {
                self.client
                    .post("https://openrouter.ai/api/v1/chat/completions")
                    .header("Authorization", format!("Bearer {}", self.config.api_key))
                    .header("HTTP-Referer", "https://backchannel.app")
                    .header("X-Title", "Backchannel")
                    .json(&request)
                    .send()
                    .await
                    .map_err(|e| e.to_string())?
            }
        };

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("API error ({}): {}", status, text));
        }

        let response: ChatCompletionResponse = response.json().await.map_err(|e| e.to_string())?;

        Ok(response
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .unwrap_or_default())
    }

    pub async fn stream_complete(
        &self,
        prompt: &str,
        system: Option<&str>,
        channel: Channel<String>,
    ) -> Result<(), String> {
        let mut messages = Vec::new();

        if let Some(sys) = system {
            messages.push(ChatMessage {
                role: "system".to_string(),
                content: sys.to_string(),
            });
        }

        messages.push(ChatMessage {
            role: "user".to_string(),
            content: prompt.to_string(),
        });

        let request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages,
            temperature: Some(self.config.temperature),
            max_tokens: Some(self.config.max_tokens),
            stream: Some(true),
        };

        let response = match self.config.provider {
            LlmProvider::Ollama => {
                self.client
                    .post(format!("{}/v1/chat/completions", self.config.ollama_url))
                    .json(&request)
                    .send()
                    .await
                    .map_err(|e| format!("Ollama connection error: {}. Is Ollama running?", e))?
            }
            LlmProvider::OpenRouter => {
                self.client
                    .post("https://openrouter.ai/api/v1/chat/completions")
                    .header("Authorization", format!("Bearer {}", self.config.api_key))
                    .header("HTTP-Referer", "https://backchannel.app")
                    .header("X-Title", "Backchannel")
                    .json(&request)
                    .send()
                    .await
                    .map_err(|e| e.to_string())?
            }
        };

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(format!("API error ({}): {}", status, text));
        }

        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            let text = String::from_utf8_lossy(&chunk);

            // Parse SSE format
            for line in text.lines() {
                if let Some(data) = line.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        break;
                    }

                    if let Ok(chunk) = serde_json::from_str::<StreamChunk>(data) {
                        if let Some(choice) = chunk.choices.first() {
                            if let Some(content) = &choice.delta.content {
                                let _ = channel.send(content.clone());
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
