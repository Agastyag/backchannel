import { useConversationStore } from "@/stores/conversationStore";
import { formatDate, truncateText } from "@/lib/utils";
import { Users, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversationList() {
  const {
    conversations,
    selectedConversation,
    selectConversation,
    isLoading,
  } = useConversationStore();

  if (isLoading && conversations.length === 0) {
    return (
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Conversations
        </h2>
        <p className="text-sm text-gray-500">{conversations.length} total</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <button
            key={conv.chat.id}
            onClick={() => selectConversation(conv)}
            className={cn(
              "w-full p-4 text-left border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
              selectedConversation?.chat.id === conv.chat.id &&
                "bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  conv.chat.is_group
                    ? "bg-purple-100 dark:bg-purple-900/50"
                    : "bg-gray-100 dark:bg-gray-700"
                )}
              >
                {conv.chat.is_group ? (
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <User className="h-5 w-5 text-gray-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {conv.chat.display_name ||
                      conv.participants[0]?.identifier ||
                      "Unknown"}
                  </span>
                  {conv.last_message && (
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatDate(conv.last_message.date)}
                    </span>
                  )}
                </div>

                {conv.last_message?.text && (
                  <p className="text-sm text-gray-500 truncate">
                    {conv.last_message.is_from_me && "You: "}
                    {truncateText(conv.last_message.text, 50)}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  {conv.message_count} messages
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
