import { useSearchStore } from "@/stores/searchStore";
import { Search, Sparkles, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

export function SearchResults() {
  const {
    query,
    aiAnswer,
    sourceMessages,
    showSources,
    isLoading,
    error,
    toggleSources,
  } = useSearchStore();

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 font-medium">Error: {error}</p>
          <p className="text-gray-500 mt-2">Please try a different search query</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Ask about your messages
          </h3>
          <p className="text-gray-500 mt-1 max-w-sm">
            Ask questions like "when is the dinner reservation?" or "what did
            John say about the project?"
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aiAnswer) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No results found
          </h3>
          <p className="text-gray-500 mt-1">
            Couldn't find relevant messages for "{query}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* AI Answer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {aiAnswer}
            </p>
          </div>
        </div>
      </div>

      {/* Sources Toggle */}
      {sourceMessages.length > 0 && (
        <div>
          <button
            onClick={toggleSources}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            {sourceMessages.length} source message
            {sourceMessages.length === 1 ? "" : "s"}
            {showSources ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Source Messages */}
          {showSources && (
            <div className="mt-3 space-y-2">
              {sourceMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {msg.is_from_me ? "You" : msg.contact_name || msg.contact_id || "Unknown"}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(msg.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{msg.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
