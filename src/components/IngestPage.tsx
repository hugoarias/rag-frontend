import { useIngest } from '../hooks/useIngest';
import { DropZone } from './DropZone';
import type { QueuedFile, IngestedFile } from '../types/ingest';

function statusIcon(status: QueuedFile['status']) {
  switch (status) {
    case 'uploading':
      return (
        <svg className="w-4 h-4 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      );
    case 'done':
      return <span className="text-green-400 text-xs">✓</span>;
    case 'error':
      return <span className="text-red-400 text-xs">✗</span>;
    default:
      return <span className="w-4 h-4 rounded-full border border-gray-600 inline-block" />;
  }
}

function formatDate(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IngestPage() {
  const { queuedFiles, ingestedFiles, isIngesting, hasQueuedFiles, addFiles, removeFile, ingest } =
    useIngest();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl mx-auto w-full">
      <h2 className="text-lg font-semibold mb-1">Ingest Documents</h2>
      <p className="text-sm text-gray-400 mb-6">
        Add files to the RAG knowledge base.
      </p>

      <DropZone onFiles={addFiles} disabled={isIngesting} />

      {/* Queued files */}
      {queuedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Queued ({queuedFiles.length})
          </h3>
          <ul className="space-y-2">
            {queuedFiles.map((qf) => (
              <li
                key={qf.id}
                className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3"
              >
                <span className="shrink-0">{statusIcon(qf.status)}</span>
                <span className="flex-1 text-sm truncate">{qf.file.name}</span>
                <span className="text-xs text-gray-500 shrink-0">{formatBytes(qf.file.size)}</span>
                {qf.error && (
                  <span className="text-xs text-red-400 shrink-0 truncate max-w-[140px]" title={qf.error}>
                    {qf.error}
                  </span>
                )}
                {qf.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(qf.id)}
                    className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label={`Remove ${qf.file.name}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={ingest}
            disabled={!hasQueuedFiles || isIngesting}
            className="mt-4 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 text-sm font-medium transition-colors"
          >
            {isIngesting ? 'Ingesting…' : `Ingest ${queuedFiles.filter((f) => f.status === 'queued').length} file${queuedFiles.filter((f) => f.status === 'queued').length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {/* Ingested history */}
      {ingestedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Recently Ingested</h3>
          <ul className="space-y-2">
            {ingestedFiles.map((f: IngestedFile) => (
              <li
                key={f.id}
                className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3"
              >
                <svg className="w-4 h-4 text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="flex-1 text-sm truncate">{f.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{f.chunksIngested} chunks</span>
                <span className="text-xs text-gray-500 shrink-0">{formatDate(f.ingestedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
