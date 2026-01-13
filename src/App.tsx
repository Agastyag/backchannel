import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingModal } from "@/components/settings/OnboardingModal";
import { Loader2 } from "lucide-react";

function App() {
  const { loadSettings, hasPermissions, provider, checkPermissions, isLoading } =
    useSettingsStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadSettings().finally(() => setInitialized(true));
  }, [loadSettings]);

  // Re-check permissions when app gains focus (user might have granted them)
  useEffect(() => {
    const handleFocus = () => {
      if (!hasPermissions) {
        checkPermissions();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [hasPermissions, checkPermissions]);

  if (!initialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Only require permissions - Ollama doesn't need an API key
  if (!hasPermissions) {
    return <OnboardingModal hasPermissions={hasPermissions} provider={provider} />;
  }

  return <AppShell />;
}

export default App;
