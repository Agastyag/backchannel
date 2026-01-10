import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settingsStore";
import { Shield, Key, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
  hasPermissions: boolean;
  hasApiKey: boolean;
}

export function OnboardingModal({ hasPermissions, hasApiKey }: OnboardingModalProps) {
  const { saveApiKey, checkPermissions, isLoading } = useSettingsStore();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [step, setStep] = useState<"permissions" | "apikey">(
    hasPermissions ? "apikey" : "permissions"
  );

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await saveApiKey(apiKeyInput.trim());
    }
  };

  const handleCheckPermissions = async () => {
    const hasAccess = await checkPermissions();
    if (hasAccess) {
      setStep("apikey");
    }
  };

  const handleOpenSettings = async () => {
    try {
      await invoke("open_privacy_settings");
    } catch (e) {
      console.error("Failed to open settings:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Backchannel
          </h1>
          <p className="text-gray-500 mt-2">
            Let's get you set up to search your iMessages
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <StepIndicator
            number={1}
            label="Permissions"
            isActive={step === "permissions"}
            isComplete={hasPermissions}
          />
          <div className="w-12 h-0.5 bg-gray-200 dark:bg-gray-700" />
          <StepIndicator
            number={2}
            label="API Key"
            isActive={step === "apikey"}
            isComplete={hasApiKey}
          />
        </div>

        {step === "permissions" && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 dark:text-amber-200">
                    Full Disk Access Required
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Backchannel needs Full Disk Access to read your iMessage database.
                    Your messages never leave your device.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                How to enable:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>Open System Settings</li>
                <li>Go to Privacy & Security → Full Disk Access</li>
                <li>Click the + button and add Backchannel</li>
                <li>Toggle it on</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOpenSettings}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open Settings
              </button>

              <button
                onClick={handleCheckPermissions}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check Access"
                )}
              </button>
            </div>
          </div>
        )}

        {step === "apikey" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-800 dark:text-blue-200">
                    OpenRouter API Key
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      openrouter.ai/keys
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Key
              </label>
              <input
                id="apiKey"
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-or-..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSaveApiKey}
              disabled={isLoading || !apiKeyInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  isActive,
  isComplete,
}: {
  number: number;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
          isComplete
            ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
            : isActive
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-500 dark:bg-gray-700"
        }`}
      >
        {isComplete ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <span
        className={`text-xs ${
          isActive || isComplete
            ? "text-gray-900 dark:text-white"
            : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
