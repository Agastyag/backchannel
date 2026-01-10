use tauri::{command, ipc::Channel, State};

use crate::db::{Conversation, Message};
use crate::llm::{analyze_prompt, summarize_prompt};
use crate::state::AppState;

#[command]
pub async fn get_conversations(state: State<'_, AppState>) -> Result<Vec<Conversation>, String> {
    let db = state.get_db()?;
    db.get_conversations().map_err(|e| e.to_string())
}

#[command]
pub async fn get_conversation_messages(
    chat_id: i64,
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<Message>, String> {
    let db = state.get_db()?;
    db.get_messages_for_chat(chat_id, limit.unwrap_or(100))
        .map_err(|e| e.to_string())
}

#[command]
pub async fn summarize_conversation(
    chat_id: i64,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.get_db()?;
    let llm = state.get_llm_client()?;

    // Get messages
    let messages = db
        .get_messages_for_chat(chat_id, 100)
        .map_err(|e| e.to_string())?;

    if messages.is_empty() {
        return Err("No messages found in conversation".to_string());
    }

    // Get contact name from first participant
    let contact_name = messages
        .first()
        .and_then(|m| m.contact_id.clone())
        .unwrap_or_else(|| "Unknown".to_string());

    let messages_json = serde_json::to_string(&messages).map_err(|e| e.to_string())?;
    let prompt = summarize_prompt(&messages_json, &contact_name);

    llm.complete(&prompt, None).await
}

#[command]
pub async fn summarize_conversation_streaming(
    chat_id: i64,
    message_limit: Option<i64>,
    channel: Channel<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.get_db()?;
    let llm = state.get_llm_client()?;

    let messages = db
        .get_messages_for_chat(chat_id, message_limit.unwrap_or(100))
        .map_err(|e| e.to_string())?;

    if messages.is_empty() {
        return Err("No messages found in conversation".to_string());
    }

    let contact_name = messages
        .first()
        .and_then(|m| m.contact_id.clone())
        .unwrap_or_else(|| "Unknown".to_string());

    let messages_json = serde_json::to_string(&messages).map_err(|e| e.to_string())?;
    let prompt = summarize_prompt(&messages_json, &contact_name);

    llm.stream_complete(&prompt, None, channel).await
}

#[command]
pub async fn analyze_conversation(
    chat_id: i64,
    message_limit: Option<i64>,
    channel: Channel<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.get_db()?;
    let llm = state.get_llm_client()?;

    let messages = db
        .get_messages_for_chat(chat_id, message_limit.unwrap_or(200))
        .map_err(|e| e.to_string())?;

    if messages.is_empty() {
        return Err("No messages found in conversation".to_string());
    }

    let messages_json = serde_json::to_string(&messages).map_err(|e| e.to_string())?;
    let prompt = analyze_prompt(&messages_json);

    llm.stream_complete(&prompt, None, channel).await
}
