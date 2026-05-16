import { useState } from 'react';
import type { Source } from '../types/chat';

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 text-sm">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        {sources.length} source{sources.length > 1 ? 's' : ''}
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((source, i) => (
            <li
              key={i}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
            >
              <p className="font-mono text-indigo-300 text-xs mb-1 truncate">
                {source.file}
              </p>
              <p className="text-gray-400 text-xs line-clamp-3">{source.chunk}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
