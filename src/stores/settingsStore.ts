import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ModelInfo } from "@/lib/types";

interface SettingsState {
  apiKey: string | null;
  selectedModel: string;
  availableModels: ModelInfo[];
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  setModel: (modelId: string) => void;
  checkPermissions: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: null,
  selectedModel: "anthropic/claude-3.5-sonnet",
  availableModels: [],
  hasPermissions: false,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const [apiKey, models, hasPermissions] = await Promise.all([
        invoke<string | null>("get_api_key"),
        invoke<ModelInfo[]>("get_available_models"),
        invoke<boolean>("check_permissions"),
      ]);

      set({
        apiKey,
        availableModels: models,
        hasPermissions,
        isLoading: false,
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  saveApiKey: async (apiKey: string) => {
    set({ isLoading: true, error: null });
    try {
      await invoke("save_api_key", { apiKey });
      set({ apiKey, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  setModel: (modelId: string) => {
    set({ selectedModel: modelId });
  },

  checkPermissions: async () => {
    const hasPermissions = await invoke<boolean>("check_permissions");
    set({ hasPermissions });
    return hasPermissions;
  },
}));
