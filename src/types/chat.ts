export interface Source {
  file: string;
  chunk: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Source[];
  streaming: boolean;
}
