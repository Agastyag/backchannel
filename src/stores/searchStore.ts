import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SearchResult, Message } from "@/lib/types";

interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;

  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  simpleSearch: (query: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  results: [],
  isLoading: false,
  error: null,

  setQuery: (query: string) => set({ query }),

  search: async (query: string) => {
    set({ isLoading: true, error: null, query });
    try {
      const results = await invoke<SearchResult[]>("natural_language_search", {
        query,
      });
      set({ results, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  simpleSearch: async (query: string) => {
    set({ isLoading: true, error: null, query });
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

  clearResults: () => set({ results: [], query: "", error: null }),
}));
