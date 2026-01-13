use serde::Serialize;
use tauri::{command, State};

use crate::db::{Message, SearchResult};
use crate::llm::answer_question_prompt;
use crate::state::AppState;

#[derive(Debug, Serialize)]
pub struct QuestionAnswer {
    pub answer: String,
    pub source_messages: Vec<Message>,
}

#[command]
pub async fn natural_language_search(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<SearchResult>, String> {
    // First, generate SQL from natural language (async)
    let nl2sql = state.get_nl2sql_engine()?;
    let sql = nl2sql.generate_sql(&query).await?;

    // Then execute the SQL query synchronously
    let db = state.get_db()?;
    let messages = db.execute_search_query(&sql)?;

    // Get context for each message
    let mut results = Vec::new();
    for msg in messages {
        let context_before = db.get_context_before(msg.id, 2).map_err(|e| e.to_string())?;
        let context_after = db.get_context_after(msg.id, 2).map_err(|e| e.to_string())?;

        results.push(SearchResult {
            message: msg,
            context_before,
            context_after,
            relevance_score: 1.0,
        });
    }

    Ok(results)
}

#[command]
pub async fn simple_search(
    query: String,
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<Message>, String> {
    let db = state.get_db()?;
    db.search_messages(&query, limit.unwrap_or(50))
        .map_err(|e| e.to_string())
}

/// Extract meaningful keywords from a question for searching
fn extract_keywords(question: &str) -> Vec<String> {
    // Common stop words to filter out
    let stop_words: std::collections::HashSet<&str> = [
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "must", "shall", "can", "need", "dare",
        "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
        "from", "as", "into", "through", "during", "before", "after", "above",
        "below", "between", "under", "again", "further", "then", "once", "here",
        "there", "when", "where", "why", "how", "all", "each", "few", "more",
        "most", "other", "some", "such", "no", "nor", "not", "only", "own",
        "same", "so", "than", "too", "very", "just", "also", "now", "what",
        "which", "who", "whom", "this", "that", "these", "those", "am", "i",
        "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
        "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she",
        "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
        "theirs", "themselves", "about", "any", "because", "but", "if", "or",
        "set", "up", "out", "get", "got", "going", "go", "went",
    ]
    .into_iter()
    .collect();

    question
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|word| word.len() > 2 && !stop_words.contains(word))
        .map(String::from)
        .collect()
}

#[command]
pub async fn ask_question(
    question: String,
    state: State<'_, AppState>,
) -> Result<QuestionAnswer, String> {
    let db = state.get_db()?;

    // Extract keywords from the question
    let keywords = extract_keywords(&question);

    // Search for messages containing any of the keywords
    let mut all_messages: Vec<Message> = Vec::new();

    for keyword in &keywords {
        if let Ok(messages) = db.search_messages(keyword, 20) {
            for msg in messages {
                // Avoid duplicates
                if !all_messages.iter().any(|m| m.id == msg.id) {
                    all_messages.push(msg);
                }
            }
        }
    }

    // Sort by date descending and limit
    all_messages.sort_by(|a, b| b.date.cmp(&a.date));
    all_messages.truncate(30);

    // If no messages found, return early
    if all_messages.is_empty() {
        return Ok(QuestionAnswer {
            answer: "I couldn't find any messages related to your question in your chat history.".to_string(),
            source_messages: vec![],
        });
    }

    // Serialize messages to JSON for the LLM
    let messages_json = serde_json::to_string_pretty(&all_messages)
        .map_err(|e| format!("Failed to serialize messages: {}", e))?;

    // Get LLM client and generate answer
    let llm = state.get_llm_client()?;
    let prompt = answer_question_prompt(&question, &messages_json);
    let answer = llm.complete(&prompt, None).await?;

    Ok(QuestionAnswer {
        answer,
        source_messages: all_messages,
    })
}
