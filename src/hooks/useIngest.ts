import { useState, useCallback } from 'react';
import { ingestFiles } from '../api/ingestClient';
import type { QueuedFile, IngestedFile } from '../types/ingest';

function newId(): string {
  return Math.random().toString(36).slice(2);
}

export function useIngest() {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [ingestedFiles, setIngestedFiles] = useState<IngestedFile[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  const addFiles = useCallback((files: File[]) => {
    const newEntries: QueuedFile[] = files.map((file) => ({
      id: newId(),
      file,
      status: 'queued',
    }));
    setQueuedFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const ingest = useCallback(async () => {
    const pending = queuedFiles.filter((f) => f.status === 'queued');
    if (pending.length === 0) return;

    setIsIngesting(true);

    // Mark all pending files as uploading
    const pendingIds = new Set(pending.map((f) => f.id));
    setQueuedFiles((prev) =>
      prev.map((f) => (pendingIds.has(f.id) ? { ...f, status: 'uploading' } : f)),
    );

    try {
      // Send all queued files in one multipart/form-data batch request
      const result = await ingestFiles(pending.map((qf) => qf.file));

      // Mark all as done
      setQueuedFiles((prev) =>
        prev.map((f) => (pendingIds.has(f.id) ? { ...f, status: 'done' } : f)),
      );

      // Add one history entry per processed file, distributing chunks evenly
      const chunksPerFile = Math.round(result.chunksIngested / pending.length);
      const now = new Date();
      setIngestedFiles((prev) => [
        ...result.filesProcessed.map((name) => ({
          id: newId(),
          name,
          chunksIngested: chunksPerFile,
          ingestedAt: now,
        })),
        ...prev,
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Mark all uploading files as errored
      setQueuedFiles((prev) =>
        prev.map((f) => (pendingIds.has(f.id) ? { ...f, status: 'error', error: message } : f)),
      );
    }

    setIsIngesting(false);

    // Remove successfully ingested files from the queue
    setQueuedFiles((prev) => prev.filter((f) => f.status !== 'done'));
  }, [queuedFiles]);

  const clearQueue = useCallback(() => {
    setQueuedFiles([]);
  }, []);

  const hasQueuedFiles = queuedFiles.some((f) => f.status === 'queued');

  return {
    queuedFiles,
    ingestedFiles,
    isIngesting,
    hasQueuedFiles,
    addFiles,
    removeFile,
    ingest,
    clearQueue,
  };
}
