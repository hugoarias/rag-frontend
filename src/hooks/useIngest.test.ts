import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIngest } from './useIngest';
import * as ingestClient from '../api/ingestClient';

vi.mock('../api/ingestClient');
const mockIngestFiles = vi.mocked(ingestClient.ingestFiles);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeFile(name: string, content = 'data'): File {
  return new File([content], name, { type: 'text/plain' });
}

describe('useIngest — initial state', () => {
  it('starts with empty queues', () => {
    const { result } = renderHook(() => useIngest());
    expect(result.current.queuedFiles).toEqual([]);
    expect(result.current.ingestedFiles).toEqual([]);
    expect(result.current.isIngesting).toBe(false);
    expect(result.current.hasQueuedFiles).toBe(false);
  });
});

describe('useIngest — addFiles / removeFile', () => {
  it('adds files to the queue with queued status', () => {
    const { result } = renderHook(() => useIngest());
    act(() => { result.current.addFiles([makeFile('a.md'), makeFile('b.md')]); });
    expect(result.current.queuedFiles).toHaveLength(2);
    expect(result.current.queuedFiles[0].status).toBe('queued');
    expect(result.current.hasQueuedFiles).toBe(true);
  });

  it('removes a file by id', () => {
    const { result } = renderHook(() => useIngest());
    act(() => { result.current.addFiles([makeFile('a.md')]); });
    const id = result.current.queuedFiles[0].id;
    act(() => { result.current.removeFile(id); });
    expect(result.current.queuedFiles).toHaveLength(0);
  });
});

describe('useIngest — ingest (success)', () => {
  it('sends all files in one batch call', async () => {
    mockIngestFiles.mockResolvedValue({ filesProcessed: ['a.md', 'b.md'], chunksIngested: 10 });
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('a.md'), makeFile('b.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(mockIngestFiles).toHaveBeenCalledOnce();
    const [calledFiles] = mockIngestFiles.mock.calls[0];
    expect((calledFiles as File[]).map((f) => f.name)).toEqual(['a.md', 'b.md']);
  });

  it('clears the queue and populates ingestedFiles from filesProcessed', async () => {
    mockIngestFiles.mockResolvedValue({
      filesProcessed: ['guide.md'],
      chunksIngested: 10,
    });
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('guide.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(result.current.queuedFiles).toHaveLength(0);
    expect(result.current.ingestedFiles).toHaveLength(1);
    expect(result.current.ingestedFiles[0].name).toBe('guide.md');
    expect(result.current.ingestedFiles[0].chunksIngested).toBe(10);
  });

  it('creates one history entry per file in filesProcessed', async () => {
    mockIngestFiles.mockResolvedValue({
      filesProcessed: ['a.md', 'b.md'],
      chunksIngested: 20,
    });
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('a.md'), makeFile('b.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(result.current.ingestedFiles).toHaveLength(2);
  });

  it('sets isIngesting to false after completion', async () => {
    mockIngestFiles.mockResolvedValue({ filesProcessed: ['a.md'], chunksIngested: 3 });
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('a.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(result.current.isIngesting).toBe(false);
  });
});

describe('useIngest — ingest (error)', () => {
  it('marks all files as errored when the batch call fails', async () => {
    mockIngestFiles.mockRejectedValue(new Error('Ingest error: 500'));
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('bad.md'), makeFile('also-bad.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(result.current.queuedFiles).toHaveLength(2);
    result.current.queuedFiles.forEach((f) => {
      expect(f.status).toBe('error');
      expect(f.error).toBe('Ingest error: 500');
    });
    expect(result.current.ingestedFiles).toHaveLength(0);
  });

  it('sets isIngesting to false after an error', async () => {
    mockIngestFiles.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useIngest());

    act(() => { result.current.addFiles([makeFile('bad.md')]); });
    await act(async () => { await result.current.ingest(); });

    expect(result.current.isIngesting).toBe(false);
  });
});
