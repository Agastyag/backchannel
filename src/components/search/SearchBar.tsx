import { useState, useCallback } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { useSearchStore } from "@/stores/searchStore";
import { debounce } from "@/lib/utils";

export function SearchBar() {
  const { query, setQuery, search, simpleSearch, isLoading } = useSearchStore();
  const [useNaturalLanguage, setUseNaturalLanguage] = useState(true);

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      if (q.trim()) {
        if (useNaturalLanguage) {
          search(q);
        } else {
          simpleSearch(q);
        }
      }
    }, 500),
    [useNaturalLanguage, search, simpleSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (useNaturalLanguage) {
        search(query);
      } else {
        simpleSearch(query);
      }
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleChange}
              placeholder={
                useNaturalLanguage
                  ? "Find messages about dinner plans with John..."
                  : "Search messages..."
              }
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300
                dark:border-gray-600 dark:bg-gray-800 dark:text-white
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder:text-gray-400"
            />
            {isLoading && (
              <Loader2
                className="absolute right-3 top-1/2 -translate-y-1/2
                h-5 w-5 text-blue-500 animate-spin"
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setUseNaturalLanguage(!useNaturalLanguage)}
            className={`p-3 rounded-lg border transition-colors ${
              useNaturalLanguage
                ? "bg-blue-100 border-blue-300 text-blue-600 dark:bg-blue-900/50 dark:border-blue-700"
                : "border-gray-300 dark:border-gray-600 text-gray-500"
            }`}
            title={useNaturalLanguage ? "Using AI search" : "Using simple search"}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </form>

      {useNaturalLanguage && (
        <p className="mt-2 text-sm text-gray-500">
          AI-powered search: Ask questions in plain English
        </p>
      )}
    </div>
  );
}
