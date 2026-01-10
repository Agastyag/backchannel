use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: i64,
    pub guid: String,
    pub text: Option<String>,
    pub handle_id: i64,
    pub date: DateTime<Utc>,
    pub is_from_me: bool,
    pub service: String,
    pub contact_name: Option<String>,
    pub contact_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Handle {
    pub id: i64,
    pub identifier: String,
    pub service: String,
    pub uncanonicalized_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub id: i64,
    pub guid: String,
    pub display_name: Option<String>,
    pub is_group: bool,
    pub participant_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub chat: Chat,
    pub participants: Vec<Handle>,
    pub last_message: Option<Message>,
    pub message_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub message: Message,
    pub context_before: Vec<Message>,
    pub context_after: Vec<Message>,
    pub relevance_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub description: String,
}
