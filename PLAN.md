# Backchannel: iMessage LLM Query App

## Overview
A native Mac desktop app using Tauri 2.x + Rust backend with React TypeScript frontend. Queries iMessages via natural language using OpenRouter for flexible LLM model selection.

## Tech Stack
- **Framework**: Tauri 2.x
- **Backend**: Rust
- **Frontend**: React + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **LLM Provider**: OpenRouter API
- **Secure Storage**: tauri-plugin-stronghold (for API keys)

## Features
1. **Natural language search** - "find messages about dinner plans with John"
2. **Conversation summaries** - summarize threads with specific contacts
3. **Conversation analysis** - insights, topics, sentiment, action items

## Architecture

### Data Flow
```
User Query → Frontend → Tauri Command → LLM (NL→SQL) → SQLite Query → Results → LLM Ranking → Display
```

### Key Technical Details

**iMessage Database:**
- Location: `~/Library/Messages/chat.db` (SQLite)
- Requires Full Disk Access permission
- Key tables: `message`, `handle`, `chat`, `chat_message_join`
- Timestamps: nanoseconds since 2001-01-01 (Mac epoch)
- Rich text: `attributedBody` column (binary plist, needs decoding)

**OpenRouter Integration:**
- Streaming responses for real-time UI updates
- Model selector for flexibility (Claude, GPT-4, Gemini, etc.)

## Project Structure
```
backchannel/
├── src/                          # React TypeScript frontend
│   ├── components/
│   │   ├── layout/               # AppShell, Sidebar
│   │   ├── search/               # SearchBar, SearchResults, MessageCard
│   │   ├── conversations/        # ConversationList, ConversationDetail
│   │   ├── analysis/             # SummaryPanel, AnalysisView
│   │   └── settings/             # SettingsModal, ApiKeyConfig, ModelSelector
│   ├── stores/                   # Zustand stores (search, conversation, settings)
│   ├── lib/                      # Types, utilities, Tauri wrappers
│   └── App.tsx
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Entry point, command registration
│   │   ├── commands/             # Tauri commands (search, conversations, settings)
│   │   ├── db/                   # SQLite connection, models, queries, attributedBody parser
│   │   ├── llm/                  # OpenRouter client, prompts, NL→SQL engine
│   │   ├── state/                # App state management
│   │   └── utils/                # Date conversion, permissions
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

## Implementation Steps

### Phase 1: Project Setup
1. Create Tauri project: `npm create tauri-app@latest backchannel -- --template react-ts`
2. Install frontend deps: `zustand`, `@tanstack/react-query`, `tailwindcss`, `lucide-react`
3. Install Rust deps: `rusqlite`, `tokio`, `serde`, `reqwest`, `plist`, `regex`, `chrono`
4. Add `tauri-plugin-stronghold` for secure API key storage
5. Set up Tailwind CSS

### Phase 2: Database Layer (Rust)
1. Create `db/connection.rs` - SQLite connection to chat.db (read-only mode)
2. Create `db/models.rs` - Message, Handle, Chat, Conversation structs
3. Create `db/parser.rs` - Decode `attributedBody` binary plist
4. Create `utils/date.rs` - Mac epoch timestamp conversion
5. Create `db/queries.rs` - Query builders for conversations, messages, search

### Phase 3: LLM Integration (Rust)
1. Create `llm/client.rs` - OpenRouter HTTP client with streaming support
2. Create `llm/prompts.rs` - Prompt templates for NL→SQL, summarization, analysis
3. Create `llm/nl2sql.rs` - Convert natural language to SQL, validate queries
4. Create `state/app_state.rs` - Manage DB connections and LLM client

### Phase 4: Tauri Commands (Rust)
1. `commands/search.rs` - `natural_language_search`, `simple_search`
2. `commands/conversations.rs` - `get_conversations`, `get_conversation_messages`, `summarize_conversation`, `analyze_conversation`
3. `commands/settings.rs` - `save_api_key`, `get_api_key`, `check_permissions`, `get_available_models`
4. Register all commands in `lib.rs`

### Phase 5: Frontend (React/TypeScript)
1. Create Zustand stores: `searchStore.ts`, `conversationStore.ts`, `settingsStore.ts`
2. Build layout: `AppShell.tsx`, `Sidebar.tsx`
3. Build search UI: `SearchBar.tsx`, `SearchResults.tsx`, `MessageCard.tsx`
4. Build conversation browser: `ConversationList.tsx`, `ConversationDetail.tsx`
5. Build settings: `SettingsModal.tsx`, `ApiKeyConfig.tsx`, `ModelSelector.tsx`
6. Add onboarding flow for permissions + API key setup
7. Implement streaming text display for LLM responses

### Phase 6: Polish
1. Error handling and user-friendly messages
2. Loading states and animations
3. Dark mode support
4. Permission guidance (Full Disk Access instructions)

## Security Considerations
- **API Keys**: Stored encrypted via Stronghold (AES-256-GCM)
- **Database**: Read-only access to chat.db
- **SQL Injection**: Validate all LLM-generated SQL is SELECT-only
- **Privacy**: Message content sent to OpenRouter for analysis (user should be aware)

## Verification Plan
1. **Permissions**: Test app behavior with/without Full Disk Access
2. **Database**: Verify messages load correctly, attributedBody decodes properly
3. **Search**: Test natural language queries produce relevant SQL
4. **Streaming**: Verify LLM responses stream to UI in real-time
5. **Settings**: Confirm API key persists across app restarts
6. **Models**: Test switching between different OpenRouter models

## Key Dependencies (Rust)
```toml
tauri = { version = "2", features = ["macos-private-api"] }
tauri-plugin-stronghold = "2"
rusqlite = { version = "0.32", features = ["bundled"] }
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
reqwest = { version = "0.12", features = ["json", "stream"] }
plist = "1"
regex = "1"
chrono = "0.4"
```

## Key Dependencies (Frontend)
```json
{
  "zustand": "^4.x",
  "@tauri-apps/api": "^2.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x",
  "react-markdown": "^9.x"
}
```
