export interface QueuedFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface IngestedFile {
  id: string;
  name: string;
  chunksIngested: number;
  ingestedAt: Date;
}
