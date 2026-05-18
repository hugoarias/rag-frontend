import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryStreaming, queryOnce } from './ragClient';

function makeReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
}

function mockFetchOk(chunks: string[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: makeReadableStream(chunks),
    }),
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// queryStreaming
// ---------------------------------------------------------------------------
describe('queryStreaming', () => {
  it('calls onSources, onToken, and onDone for a complete SSE stream', async () => {
    const sse = [
      'event: sources\ndata: [{"file":"a.md","chunk":"hello"}]\n\n',
      'event: token\ndata: Foo\n\n',
      'event: token\ndata:  bar\n\n',
      'event: done\ndata: {}\n\n',
    ];
    mockFetchOk(sse);

    const onSources = vi.fn();
    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await queryStreaming('test question', { onSources, onToken, onDone, onError });

    expect(onSources).toHaveBeenCalledOnce();
    expect(onSources).toHaveBeenCalledWith([{ file: 'a.md', chunk: 'hello' }]);
    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenNthCalledWith(1, 'Foo');
    expect(onToken).toHaveBeenNthCalledWith(2, ' bar');
    expect(onDone).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
  });

  it('sends the correct POST request with SSE headers', async () => {
    mockFetchOk(['event: done\ndata: {}\n\n']);
    const fetchSpy = vi.mocked(fetch);

    await queryStreaming('my question', {
      onSources: vi.fn(),
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError: vi.fn(),
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/query'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Accept: 'text/event-stream' }),
        body: JSON.stringify({ question: 'my question' }),
      }),
    );
  });

  it('calls onError when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    const onError = vi.fn();

    await queryStreaming('q', {
      onSources: vi.fn(),
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Network failure' }));
  });

  it('calls onError when the response status is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, body: null }),
    );
    const onError = vi.fn();

    await queryStreaming('q', {
      onSources: vi.fn(),
      onToken: vi.fn(),
      onDone: vi.fn(),
      onError,
    });

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'API error: 500' }));
  });

  it('preserves leading spaces in token data (word separation)', async () => {
    // Backend sends tokens with a leading space to separate words.
    // "data: hello" → "hello", "data:  world" → " world" (space is content)
    mockFetchOk([
      'event: token\ndata: hello\n\nevent: token\ndata:  world\n\nevent: done\ndata: {}\n\n',
    ]);

    const onToken = vi.fn();
    await queryStreaming('q', { onSources: vi.fn(), onToken, onDone: vi.fn(), onError: vi.fn() });

    expect(onToken).toHaveBeenNthCalledWith(1, 'hello');
    expect(onToken).toHaveBeenNthCalledWith(2, ' world');
  });

  it('handles SSE chunks split across multiple reads', async () => {
    // Split a single SSE event across two chunks
    mockFetchOk([
      'event: token\ndat',
      'a: hello\n\nevent: done\ndata: {}\n\n',
    ]);

    const onToken = vi.fn();
    const onDone = vi.fn();

    await queryStreaming('q', {
      onSources: vi.fn(),
      onToken,
      onDone,
      onError: vi.fn(),
    });

    expect(onToken).toHaveBeenCalledWith('hello');
    expect(onDone).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// queryOnce
// ---------------------------------------------------------------------------
describe('queryOnce', () => {
  it('returns parsed answer and sources on success', async () => {
    const payload = { answer: 'The answer', sources: [{ file: 'a.md', chunk: 'ctx' }] };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(payload),
      }),
    );

    const result = await queryOnce('what is x?');
    expect(result).toEqual(payload);
  });

  it('sends the correct POST request with JSON Accept header', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ answer: '', sources: [] }) }),
    );
    const fetchSpy = vi.mocked(fetch);

    await queryOnce('hello');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/query'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    );
  });

  it('throws when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    await expect(queryOnce('q')).rejects.toThrow('API error: 404');
  });
});
