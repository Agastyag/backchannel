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

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface LlmConfig {
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
}
