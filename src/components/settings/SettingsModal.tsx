import { useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  X,
  Key,
  Cpu,
  CheckCircle2,
  Loader2,
  Server,
  Cloud,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { LlmProvider } from "@/lib/types";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    provider,
    apiKey,
    ollamaUrl,
    selectedModel,
    availableModels,
    installedOllamaModels,
    ollamaStatus,
    saveApiKey,
    setProvider,
    setOllamaUrl,
    setModel,
    checkOllamaStatus,
    fetchInstalledOllamaModels,
    isLoading,
  } = useSettingsStore();

  const [apiKeyInput, setApiKeyInput] = useState(apiKey || "");
  const [ollamaUrlInput, setOllamaUrlInput] = useState(ollamaUrl);
  const [saved, setSaved] = useState(false);
  const [checkingOllama, setCheckingOllama] = useState(false);

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await saveApiKey(apiKeyInput.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleSaveOllamaUrl = async () => {
    if (ollamaUrlInput.trim()) {
      await setOllamaUrl(ollamaUrlInput.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCheckOllama = async () => {
    setCheckingOllama(true);
    await checkOllamaStatus();
    await fetchInstalledOllamaModels();
    setCheckingOllama(false);
  };

  const handleProviderChange = async (newProvider: LlmProvider) => {
    await setProvider(newProvider);
  };

  // Combine recommended and installed models for Ollama
  const ollamaModels =
    provider === "ollama"
      ? [
          ...availableModels,
          ...installedOllamaModels.filter(
            (m) => !availableModels.some((am) => am.id === m.id)
          ),
        ]
      : availableModels;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Provider Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Server className="h-4 w-4" />
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleProviderChange("ollama")}
                disabled={isLoading}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  provider === "ollama"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Ollama
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Local, private, free
                </p>
              </button>
              <button
                onClick={() => handleProviderChange("openrouter")}
                disabled={isLoading}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  provider === "openrouter"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    OpenRouter
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Cloud, API key</p>
              </button>
            </div>
          </div>

          {/* Ollama Configuration */}
          {provider === "ollama" && (
            <div className="space-y-4">
              {/* Ollama Status */}
              <div
                className={`p-3 rounded-lg flex items-center justify-between ${
                  ollamaStatus
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {ollamaStatus ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={
                      ollamaStatus
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300"
                    }
                  >
                    {ollamaStatus ? "Ollama is running" : "Ollama not detected"}
                  </span>
                </div>
                <button
                  onClick={handleCheckOllama}
                  disabled={checkingOllama}
                  className="p-1 hover:bg-black/10 rounded"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${checkingOllama ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {!ollamaStatus && (
                <p className="text-sm text-gray-500">
                  Install Ollama from{" "}
                  <a
                    href="https://ollama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    ollama.com
                  </a>{" "}
                  and run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ollama pull llama3.1:8b</code>
                </p>
              )}

              {/* Ollama URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ollama URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ollamaUrlInput}
                    onChange={(e) => setOllamaUrlInput(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveOllamaUrl}
                    disabled={isLoading || !ollamaUrlInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* OpenRouter API Key */}
          {provider === "openrouter" && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Key className="h-4 w-4" />
                OpenRouter API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-or-..."
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isLoading || !apiKeyInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Cpu className="h-4 w-4" />
              AI Model
            </label>
            <div className="space-y-2">
              {ollamaModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setModel(model.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    selectedModel === model.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {model.name}
                    </span>
                    {selectedModel === model.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {model.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
