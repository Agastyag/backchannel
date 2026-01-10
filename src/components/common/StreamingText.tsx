import ReactMarkdown from "react-markdown";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
}

export function StreamingText({ text, isStreaming }: StreamingTextProps) {
  if (!text && isStreaming) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse rounded" />
        <span>Thinking...</span>
      </div>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse rounded" />
      )}
    </div>
  );
}
