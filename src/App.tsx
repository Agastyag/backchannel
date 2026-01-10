import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { AppShell } from "@/components/layout/AppShell";
import { OnboardingModal } from "@/components/settings/OnboardingModal";
import { Loader2 } from "lucide-react";

function App() {
  const { loadSettings, hasPermissions, apiKey, isLoading } = useSettingsStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    loadSettings().finally(() => setInitialized(true));
  }, [loadSettings]);

  if (!initialized || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!hasPermissions || !apiKey) {
    return <OnboardingModal hasPermissions={hasPermissions} hasApiKey={!!apiKey} />;
  }

  return <AppShell />;
}

export default App;
