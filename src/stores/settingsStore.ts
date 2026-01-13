import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { LlmProvider, ModelInfo, ProviderSettings } from "@/lib/types";

interface SettingsState {
  provider: LlmProvider;
  apiKey: string | null;
  ollamaUrl: string;
  selectedModel: string;
  availableModels: ModelInfo[];
  installedOllamaModels: ModelInfo[];
  ollamaStatus: boolean;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  setProvider: (provider: LlmProvider) => Promise<void>;
  setOllamaUrl: (url: string) => Promise<void>;
  setModel: (modelId: string) => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  checkOllamaStatus: () => Promise<boolean>;
  fetchInstalledOllamaModels: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  provider: "ollama",
  apiKey: null,
  ollamaUrl: "http://localhost:11434",
  selectedModel: "llama3.1:8b",
  availableModels: [],
  installedOllamaModels: [],
  ollamaStatus: false,
  hasPermissions: false,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const [providerSettings, apiKey, hasPermissions] = await Promise.all([
        invoke<ProviderSettings>("get_provider_settings"),
        invoke<string | null>("get_api_key"),
        invoke<boolean>("check_permissions"),
      ]);

      set({
        provider: providerSettings.provider as LlmProvider,
        ollamaUrl: providerSettings.ollama_url,
        selectedModel: providerSettings.model,
        apiKey,
        hasPermissions,
        isLoading: false,
      });

      // Fetch models for current provider
      const models = await invoke<ModelInfo[]>("get_available_models");
      set({ availableModels: models });

      // Check Ollama status if using Ollama
      if (providerSettings.provider === "ollama") {
        const status = await invoke<boolean>("check_ollama_status", {
          ollamaUrl: providerSettings.ollama_url,
        });
        set({ ollamaStatus: status });

        if (status) {
          try {
            const installed = await invoke<ModelInfo[]>("fetch_ollama_models", {
              ollamaUrl: providerSettings.ollama_url,
            });
            set({ installedOllamaModels: installed });
          } catch {
            // Ignore errors fetching installed models
          }
        }
      }
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

  setProvider: async (provider: LlmProvider) => {
    const { ollamaUrl } = get();
    set({ isLoading: true, error: null });
    try {
      // Set default model for the provider
      const defaultModel =
        provider === "ollama" ? "llama3.1:8b" : "anthropic/claude-3.5-sonnet";

      await invoke("save_provider_settings", {
        provider,
        ollamaUrl,
        model: defaultModel,
      });

      set({ provider, selectedModel: defaultModel, isLoading: false });

      // Fetch models for new provider
      const models = await invoke<ModelInfo[]>("get_available_models");
      set({ availableModels: models });

      // Check Ollama status if switching to Ollama
      if (provider === "ollama") {
        const status = await invoke<boolean>("check_ollama_status", {
          ollamaUrl,
        });
        set({ ollamaStatus: status });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  setOllamaUrl: async (url: string) => {
    const { provider, selectedModel } = get();
    set({ isLoading: true, error: null });
    try {
      await invoke("save_provider_settings", {
        provider,
        ollamaUrl: url,
        model: selectedModel,
      });
      set({ ollamaUrl: url, isLoading: false });

      // Check status of new URL
      const status = await invoke<boolean>("check_ollama_status", {
        ollamaUrl: url,
      });
      set({ ollamaStatus: status });

      if (status) {
        const installed = await invoke<ModelInfo[]>("fetch_ollama_models", {
          ollamaUrl: url,
        });
        set({ installedOllamaModels: installed });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  setModel: async (modelId: string) => {
    const { provider, ollamaUrl } = get();
    try {
      await invoke("save_provider_settings", {
        provider,
        ollamaUrl,
        model: modelId,
      });
      set({ selectedModel: modelId });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  checkPermissions: async () => {
    const hasPermissions = await invoke<boolean>("check_permissions");
    set({ hasPermissions });
    return hasPermissions;
  },

  checkOllamaStatus: async () => {
    const { ollamaUrl } = get();
    const status = await invoke<boolean>("check_ollama_status", { ollamaUrl });
    set({ ollamaStatus: status });
    return status;
  },

  fetchInstalledOllamaModels: async () => {
    const { ollamaUrl } = get();
    try {
      const models = await invoke<ModelInfo[]>("fetch_ollama_models", {
        ollamaUrl,
      });
      set({ installedOllamaModels: models });
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
