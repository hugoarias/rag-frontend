import { useState, useCallback } from 'react';
import { queryStreaming, queryOnce } from '../api/ragClient';
import type { Message } from '../types/chat';

function newId(): string {
  return Math.random().toString(36).slice(2);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);

  const [streamingEnabled, setStreamingEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('rag-streaming');
    return stored === null ? true : stored === 'true';
  });

  const toggleStreaming = useCallback((enabled: boolean) => {
    setStreamingEnabled(enabled);
    localStorage.setItem('rag-streaming', String(enabled));
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      const userMsg: Message = {
        id: newId(),
        role: 'user',
        content: question,
        sources: [],
        streaming: false,
      };
      const assistantId = newId();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        sources: [],
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      const patchAssistant = (patch: Partial<Message>) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
        );

      try {
        if (streamingEnabled) {
          await queryStreaming(question, {
            onSources: (sources) => patchAssistant({ sources }),
            onToken: (token) =>
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + token }
                    : m,
                ),
              ),
            onDone: () => patchAssistant({ streaming: false }),
            onError: (error) =>
              patchAssistant({
                content: `Error: ${error.message}`,
                streaming: false,
              }),
          });
        } else {
          const result = await queryOnce(question);
          patchAssistant({
            content: result.answer,
            sources: result.sources,
            streaming: false,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        patchAssistant({ content: `Error: ${msg}`, streaming: false });
      }
    },
    [streamingEnabled],
  );

  const isLoading = messages.some((m) => m.streaming);

  return { messages, sendMessage, streamingEnabled, toggleStreaming, isLoading };
}
