import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SearchResult, Message, QuestionAnswer } from "@/lib/types";

interface SearchState {
  query: string;
  results: SearchResult[];
  aiAnswer: string | null;
  sourceMessages: Message[];
  showSources: boolean;
  isLoading: boolean;
  error: string | null;

  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  askQuestion: (question: string) => Promise<void>;
  simpleSearch: (query: string) => Promise<void>;
  toggleSources: () => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  aiAnswer: null,
  sourceMessages: [],
  showSources: false,
  isLoading: false,
  error: null,

  setQuery: (query: string) => set({ query }),

  search: async (query: string) => {
    // Use askQuestion as the default search now
    get().askQuestion(query);
  },

  askQuestion: async (question: string) => {
    set({
      isLoading: true,
      error: null,
      query: question,
      aiAnswer: null,
      sourceMessages: [],
      results: [],
    });
    try {
      const response = await invoke<QuestionAnswer>("ask_question", {
        question,
      });
      set({
        aiAnswer: response.answer,
        sourceMessages: response.source_messages,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  simpleSearch: async (query: string) => {
    set({ isLoading: true, error: null, query, aiAnswer: null });
    try {
      const messages = await invoke<Message[]>("simple_search", {
        query,
        limit: 50,
      });
      const results: SearchResult[] = messages.map((m) => ({
        message: m,
        context_before: [],
        context_after: [],
        relevance_score: 1.0,
      }));
      set({ results, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  toggleSources: () => set({ showSources: !get().showSources }),

  clearResults: () =>
    set({
      results: [],
      query: "",
      error: null,
      aiAnswer: null,
      sourceMessages: [],
      showSources: false,
    }),
}));
