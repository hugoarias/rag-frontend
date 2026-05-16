import { useState, useRef, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (question: string) => void;
  isLoading: boolean;
  streamingEnabled: boolean;
  onToggleStreaming: (enabled: boolean) => void;
}

export function ChatInput({
  onSend,
  isLoading,
  streamingEnabled,
  onToggleStreaming,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const question = value.trim();
    if (!question || isLoading) return;
    onSend(question);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900 px-4 py-3">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={isLoading}
          placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none rounded-xl bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50 max-h-40 overflow-y-auto"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-medium transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Thinking
            </span>
          ) : (
            'Send'
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-400">
          <input
            type="checkbox"
            checked={streamingEnabled}
            onChange={(e) => onToggleStreaming(e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500"
          />
          Stream response
        </label>
      </div>
    </div>
  );
}
