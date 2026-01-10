import { Search, MessageSquare, Settings } from "lucide-react";
import type { View } from "./AppShell";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onSettingsClick: () => void;
}

export function Sidebar({ currentView, onViewChange, onSettingsClick }: SidebarProps) {
  return (
    <div className="w-16 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
      <div className="flex-1 flex flex-col gap-2">
        <SidebarButton
          icon={<Search className="h-5 w-5" />}
          isActive={currentView === "search"}
          onClick={() => onViewChange("search")}
          label="Search"
        />
        <SidebarButton
          icon={<MessageSquare className="h-5 w-5" />}
          isActive={currentView === "conversations"}
          onClick={() => onViewChange("conversations")}
          label="Conversations"
        />
      </div>

      <SidebarButton
        icon={<Settings className="h-5 w-5" />}
        isActive={false}
        onClick={onSettingsClick}
        label="Settings"
      />
    </div>
  );
}

interface SidebarButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

function SidebarButton({ icon, isActive, onClick, label }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
        isActive
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
          : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {icon}
    </button>
  );
}
