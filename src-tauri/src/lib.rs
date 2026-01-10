mod commands;
mod db;
mod llm;
mod state;
mod utils;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let state = AppState::new();
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Search commands
            commands::search::natural_language_search,
            commands::search::simple_search,
            // Conversation commands
            commands::conversations::get_conversations,
            commands::conversations::get_conversation_messages,
            commands::conversations::summarize_conversation,
            commands::conversations::summarize_conversation_streaming,
            commands::conversations::analyze_conversation,
            // Settings commands
            commands::settings::save_api_key,
            commands::settings::get_api_key,
            commands::settings::check_permissions,
            commands::settings::open_privacy_settings,
            commands::settings::get_available_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
