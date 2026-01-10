import { create } from "zustand";
import { invoke, Channel } from "@tauri-apps/api/core";
import type { Conversation, Message } from "@/lib/types";

interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  summary: string;
  analysis: string;
  isLoading: boolean;
  isSummarizing: boolean;
  isAnalyzing: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  loadMessages: (chatId: number, limit?: number) => Promise<void>;
  summarize: (chatId: number) => Promise<void>;
  summarizeStreaming: (chatId: number) => Promise<void>;
  analyze: (chatId: number) => Promise<void>;
  clearSelection: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  summary: "",
  analysis: "",
  isLoading: false,
  isSummarizing: false,
  isAnalyzing: false,
  error: null,

  loadConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const conversations =
        await invoke<Conversation[]>("get_conversations");
      set({ conversations, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectConversation: async (conversation: Conversation) => {
    set({ selectedConversation: conversation, summary: "", analysis: "" });
    await get().loadMessages(conversation.chat.id);
  },

  loadMessages: async (chatId: number, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const messages = await invoke<Message[]>("get_conversation_messages", {
        chatId,
        limit,
      });
      set({ messages, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  summarize: async (chatId: number) => {
    set({ isSummarizing: true, summary: "", error: null });
    try {
      const summary = await invoke<string>("summarize_conversation", {
        chatId,
      });
      set({ summary, isSummarizing: false });
    } catch (error) {
      set({ error: String(error), isSummarizing: false });
    }
  },

  summarizeStreaming: async (chatId: number) => {
    set({ isSummarizing: true, summary: "", error: null });

    const channel = new Channel<string>();
    channel.onmessage = (chunk: string) => {
      set((state) => ({ summary: state.summary + chunk }));
    };

    try {
      await invoke("summarize_conversation_streaming", {
        chatId,
        messageLimit: 100,
        channel,
      });
      set({ isSummarizing: false });
    } catch (error) {
      set({ error: String(error), isSummarizing: false });
    }
  },

  analyze: async (chatId: number) => {
    set({ isAnalyzing: true, analysis: "", error: null });

    const channel = new Channel<string>();
    channel.onmessage = (chunk: string) => {
      set((state) => ({ analysis: state.analysis + chunk }));
    };

    try {
      await invoke("analyze_conversation", {
        chatId,
        messageLimit: 200,
        channel,
      });
      set({ isAnalyzing: false });
    } catch (error) {
      set({ error: String(error), isAnalyzing: false });
    }
  },

  clearSelection: () =>
    set({
      selectedConversation: null,
      messages: [],
      summary: "",
      analysis: "",
    }),
}));
