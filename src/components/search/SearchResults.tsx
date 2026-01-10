import { useSearchStore } from "@/stores/searchStore";
import { MessageCard } from "./MessageCard";
import { Search } from "lucide-react";

export function SearchResults() {
  const { results, query, isLoading, error } = useSearchStore();

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
            Search your messages
          </h3>
          <p className="text-gray-500 mt-1 max-w-sm">
            Use natural language to find conversations, like "messages about the
            weekend trip"
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No results found
          </h3>
          <p className="text-gray-500 mt-1">
            No messages matching "{query}"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <p className="text-sm text-gray-500">
        Found {results.length} result{results.length === 1 ? "" : "s"}
      </p>

      {results.map((result) => (
        <MessageCard key={result.message.id} result={result} />
      ))}
    </div>
  );
}
