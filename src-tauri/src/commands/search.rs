use tauri::{command, State};

use crate::db::{Message, SearchResult};
use crate::state::AppState;

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
