import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import * as ragClient from '../api/ragClient';

vi.mock('../api/ragClient');

const mockQueryStreaming = vi.mocked(ragClient.queryStreaming);
const mockQueryOnce = vi.mocked(ragClient.queryOnce);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('useChat — initial state', () => {
  it('starts with no messages and streaming enabled', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages).toEqual([]);
    expect(result.current.streamingEnabled).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('reads streaming preference from localStorage', () => {
    localStorage.setItem('rag-streaming', 'false');
    const { result } = renderHook(() => useChat());
    expect(result.current.streamingEnabled).toBe(false);
  });
});

describe('useChat — toggleStreaming', () => {
  it('updates streamingEnabled and persists to localStorage', () => {
    const { result } = renderHook(() => useChat());
    act(() => { result.current.toggleStreaming(false); });
    expect(result.current.streamingEnabled).toBe(false);
    expect(localStorage.getItem('rag-streaming')).toBe('false');
  });
});

describe('useChat — sendMessage (streaming)', () => {
  it('appends user and assistant messages immediately', async () => {
    mockQueryStreaming.mockImplementation(async (_q, callbacks) => {
      callbacks.onDone();
    });

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('Hello'); });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ role: 'user', content: 'Hello' });
    expect(result.current.messages[1]).toMatchObject({ role: 'assistant', streaming: false });
  });

  it('accumulates tokens into the assistant message', async () => {
    mockQueryStreaming.mockImplementation(async (_q, callbacks) => {
      callbacks.onToken('Foo');
      callbacks.onToken(' bar');
      callbacks.onDone();
    });

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('q'); });

    expect(result.current.messages[1].content).toBe('Foo bar');
  });

  it('sets sources on the assistant message', async () => {
    const sources = [{ file: 'a.md', chunk: 'ctx' }];
    mockQueryStreaming.mockImplementation(async (_q, callbacks) => {
      callbacks.onSources(sources);
      callbacks.onDone();
    });

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('q'); });

    expect(result.current.messages[1].sources).toEqual(sources);
  });

  it('sets error content when onError is called', async () => {
    mockQueryStreaming.mockImplementation(async (_q, callbacks) => {
      callbacks.onError(new Error('stream failed'));
    });

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('q'); });

    expect(result.current.messages[1].content).toBe('Error: stream failed');
    expect(result.current.messages[1].streaming).toBe(false);
  });
});

describe('useChat — sendMessage (non-streaming)', () => {
  it('populates assistant message from queryOnce response', async () => {
    localStorage.setItem('rag-streaming', 'false');
    const payload = { answer: 'The answer', sources: [{ file: 'b.md', chunk: 'x' }] };
    mockQueryOnce.mockResolvedValue(payload);

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('q'); });

    expect(result.current.messages[1]).toMatchObject({
      content: 'The answer',
      sources: payload.sources,
      streaming: false,
    });
  });

  it('sets error content when queryOnce rejects', async () => {
    localStorage.setItem('rag-streaming', 'false');
    mockQueryOnce.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useChat());
    await act(async () => { await result.current.sendMessage('q'); });

    expect(result.current.messages[1].content).toBe('Error: network down');
  });
});

describe('useChat — isLoading', () => {
  it('is true while a message is streaming', async () => {
    let resolveStream!: () => void;
    mockQueryStreaming.mockImplementation(
      () => new Promise<void>((res) => { resolveStream = res; }),
    );

    const { result } = renderHook(() => useChat());
    act(() => { void result.current.sendMessage('q'); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveStream(); });
  });
});
