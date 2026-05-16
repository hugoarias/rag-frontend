import { API_URL } from '../config';
import type { Source } from '../types/chat';

interface StreamCallbacks {
  onSources: (sources: Source[]) => void;
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
}

/**
 * Streams a response from the RAG API using Server-Sent Events.
 * The API sends: sources event → token events → done event.
 */
export async function queryStreaming(
  question: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ question }),
    });
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  if (!response.ok || !response.body) {
    callbacks.onError(new Error(`API error: ${response.status}`));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (currentEvent === 'sources') {
            callbacks.onSources(JSON.parse(data) as Source[]);
          } else if (currentEvent === 'token') {
            callbacks.onToken(data);
          } else if (currentEvent === 'done') {
            callbacks.onDone();
          }
          currentEvent = '';
        }
      }
    }
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Fetches a single (non-streamed) response from the RAG API.
 */
export async function queryOnce(question: string): Promise<QueryResponse> {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<QueryResponse>;
}
