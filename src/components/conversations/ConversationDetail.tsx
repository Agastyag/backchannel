import { useConversationStore } from "@/stores/conversationStore";
import { formatDate } from "@/lib/utils";
import { FileText, BarChart3, Loader2, X, User, ArrowRight } from "lucide-react";
import { StreamingText } from "@/components/common/StreamingText";

export function ConversationDetail() {
  const {
    selectedConversation,
    messages,
    summary,
    analysis,
    isLoading,
    isSummarizing,
    isAnalyzing,
    summarizeStreaming,
    analyze,
    clearSelection,
  } = useConversationStore();

  if (!selectedConversation) return null;

  const chatId = selectedConversation.chat.id;
  const displayName =
    selectedConversation.chat.display_name ||
    selectedConversation.participants[0]?.identifier ||
    "Unknown";

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {displayName}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedConversation.message_count} messages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => summarizeStreaming(chatId)}
            disabled={isSummarizing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 disabled:opacity-50 dark:bg-blue-900/50 dark:text-blue-400"
          >
            {isSummarizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Summarize
          </button>

          <button
            onClick={() => analyze(chatId)}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 disabled:opacity-50 dark:bg-purple-900/50 dark:text-purple-400"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Analyze
          </button>

          <button
            onClick={clearSelection}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Summary/Analysis Panel */}
      {(summary || analysis || isSummarizing || isAnalyzing) && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {(summary || isSummarizing) && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Summary
              </h3>
              <StreamingText text={summary} isStreaming={isSummarizing} />
            </div>
          )}

          {(analysis || isAnalyzing) && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Analysis
              </h3>
              <StreamingText text={analysis} isStreaming={isAnalyzing} />
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.is_from_me ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.is_from_me
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
              >
                {message.is_from_me ? (
                  <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
              </div>

              <div
                className={`max-w-[70%] ${
                  message.is_from_me ? "text-right" : ""
                }`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-2xl ${
                    message.is_from_me
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {message.text || "(No text content)"}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(message.date)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
