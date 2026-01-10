import type { SearchResult } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { User, ArrowRight } from "lucide-react";

interface MessageCardProps {
  result: SearchResult;
}

export function MessageCard({ result }: MessageCardProps) {
  const { message, context_before, context_after } = result;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Context before */}
      {context_before.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          {context_before.map((msg) => (
            <ContextMessage key={msg.id} message={msg} />
          ))}
        </div>
      )}

      {/* Main message */}
      <div className="p-4">
        <div className="flex items-start gap-3">
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

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {message.is_from_me ? "You" : message.contact_id || "Unknown"}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(message.date)}
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {message.text || "(No text content)"}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                {message.service}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Context after */}
      {context_after.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {context_after.map((msg) => (
            <ContextMessage key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContextMessage({ message }: { message: SearchResult["message"] }) {
  return (
    <div className="py-1 text-sm text-gray-500">
      <span className="font-medium">
        {message.is_from_me ? "You" : message.contact_id || "Unknown"}:
      </span>{" "}
      {message.text || "(No text)"}
    </div>
  );
}
