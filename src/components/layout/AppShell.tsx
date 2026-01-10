import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { SearchView } from "@/components/search/SearchView";
import { ConversationsView } from "@/components/conversations/ConversationsView";
import { SettingsModal } from "@/components/settings/SettingsModal";

export type View = "search" | "conversations";

export function AppShell() {
  const [currentView, setCurrentView] = useState<View>("search");
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onSettingsClick={() => setShowSettings(true)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {currentView === "search" && <SearchView />}
        {currentView === "conversations" && <ConversationsView />}
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
