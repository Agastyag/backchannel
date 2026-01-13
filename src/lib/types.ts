export interface Message {
  id: number;
  guid: string;
  text: string | null;
  handle_id: number;
  date: string;
  is_from_me: boolean;
  service: string;
  contact_name: string | null;
  contact_id: string | null;
}

export interface Handle {
  id: number;
  identifier: string;
  service: string;
  uncanonicalized_id: string | null;
}

export interface Chat {
  id: number;
  guid: string;
  display_name: string | null;
  is_group: boolean;
  participant_count: number;
}

export interface Conversation {
  chat: Chat;
  participants: Handle[];
  last_message: Message | null;
  message_count: number;
}

export interface SearchResult {
  message: Message;
  context_before: Message[];
  context_after: Message[];
  relevance_score: number;
}

export interface QuestionAnswer {
  answer: string;
  source_messages: Message[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export type LlmProvider = "ollama" | "openrouter";

export interface ProviderSettings {
  provider: LlmProvider;
  ollama_url: string;
  model: string;
}

export interface LlmConfig {
  provider: LlmProvider;
  api_key: string;
  model: string;
  ollama_url: string;
  temperature: number;
  max_tokens: number;
}
