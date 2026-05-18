import { API_URL } from '../config';

export interface IngestResponse {
  filesProcessed: string[];
  chunksIngested: number;
}

/**
 * Uploads one or more files to the RAG ingestion API using multipart/form-data.
 * Each file is appended under the "files" field, matching:
 *   curl -X POST .../ingest -F "files=@file1.md" -F "files=@file2.md"
 */
export async function ingestFiles(files: File[]): Promise<IngestResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch(`${API_URL}/ingest`, {
    method: 'POST',
    body: formData,
    // Note: do NOT set Content-Type manually — the browser sets it with the
    // correct multipart boundary automatically when using FormData.
  });

  if (!response.ok) {
    throw new Error(`Ingest error: ${response.status}`);
  }

  return response.json() as Promise<IngestResponse>;
}
