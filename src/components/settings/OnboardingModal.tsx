import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  Shield,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { LlmProvider } from "@/lib/types";

interface OnboardingModalProps {
  hasPermissions: boolean;
  provider: LlmProvider;
}

export function OnboardingModal({ hasPermissions }: OnboardingModalProps) {
  const { checkPermissions, isLoading } = useSettingsStore();
  const [isRestarting, setIsRestarting] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handleCheckPermissions = async () => {
    const hasAccess = await checkPermissions();
    if (hasAccess) {
      setPermissionGranted(true);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await invoke("open_privacy_settings");
    } catch (e) {
      console.error("Failed to open settings:", e);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await invoke("restart_app");
    } catch (e) {
      console.error("Failed to restart:", e);
      setIsRestarting(false);
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

        {!hasPermissions && !permissionGranted && (
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
                <li>Click "Open Settings" below</li>
                <li>Find and toggle on Backchannel</li>
                <li>Come back and click "Restart App"</li>
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

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 text-center mb-3">
                Already granted permission? Restart the app to apply:
              </p>
              <button
                onClick={handleRestart}
                disabled={isRestarting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {isRestarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Restart App
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {permissionGranted && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-200">
                    Permission Detected!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    macOS requires a restart for permissions to take effect.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              disabled={isRestarting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {isRestarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Restart App Now
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
