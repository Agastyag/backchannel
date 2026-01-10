import { useEffect } from "react";
import { useConversationStore } from "@/stores/conversationStore";
import { ConversationList } from "./ConversationList";
import { ConversationDetail } from "./ConversationDetail";

export function ConversationsView() {
  const { selectedConversation, loadConversations } = useConversationStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="flex-1 flex overflow-hidden">
      <ConversationList />
      {selectedConversation ? (
        <ConversationDetail />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
          <p className="text-gray-500">Select a conversation to view</p>
        </div>
      )}
    </div>
  );
}
