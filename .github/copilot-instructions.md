# Copilot Instructions

## Project Overview

A React + TypeScript chat application that connects to a RAG (Retrieval-Augmented Generation) API. Users ask questions; the app streams or fetches answers alongside source citations.

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:5173
npm run build        # type-check + production build
npm run lint         # lint
```

> There is no test suite yet. When one is added, run a single test with:
> `npm test -- --testPathPattern=<file>`

## Architecture

```
src/
├── config.ts              # API_URL from VITE_API_URL env var
├── types/chat.ts          # Message and Source types
├── api/ragClient.ts       # fetch-based SSE parser + plain JSON fallback
├── hooks/useChat.ts       # chat state machine; wires API client to messages
└── components/
    ├── ChatWindow.tsx     # scrollable message list, auto-scrolls to bottom
    ├── Message.tsx        # user/assistant bubble + SourceList
    ├── SourceList.tsx     # collapsible citations panel per assistant message
    └── ChatInput.tsx      # textarea, send button, streaming toggle checkbox
```

**Data flow:**
1. User submits a question via `ChatInput`
2. `useChat.sendMessage` appends a user message and an empty assistant message (`streaming: true`)
3. If streaming is on → `ragClient.queryStreaming` opens a POST fetch with `Accept: text/event-stream` and parses SSE events (`sources` → `token`... → `done`) updating the assistant message in place
4. If streaming is off → `ragClient.queryOnce` POSTs with `Accept: application/json` and awaits `{ answer, sources }`
5. `Message` renders a blinking cursor while `streaming === true`; `SourceList` shows sources collapsed by default

## API Contract

- **Endpoint:** `POST {API_URL}/query`
- **Headers:** `Content-Type: application/json`, `Accept: text/event-stream` (streaming) or `Accept: application/json` (non-streaming)
- **Request body:** `{ "question": "..." }`
- **Streaming response (SSE):**
  ```
  event: sources
  data: [{"file":"docs/guide.md","chunk":"..."}]

  event: token
  data: word

  event: done
  data: {}
  ```
- **Non-streaming response:** `{ "answer": "...", "sources": [{ "file": "...", "chunk": "..." }] }`

## Key Conventions

- **SSE via `fetch`** — `EventSource` is not used because it doesn't support POST. SSE lines are parsed manually from a `ReadableStream` in `ragClient.ts`.
- **Immutable message updates** — `useChat` never mutates messages directly; it uses `setMessages(prev => prev.map(...))` with a `patchAssistant` helper that targets messages by `id`.
- **Streaming toggle persisted** — The checkbox state is stored in `localStorage` under the key `rag-streaming` and rehydrated on mount.
- **Tailwind v4** — Uses `@tailwindcss/vite` plugin (not the PostCSS plugin). CSS entry point is `src/index.css` with `@import "tailwindcss"`. No `tailwind.config.js` needed.
- **Environment config** — API URL comes from `VITE_API_URL` in `.env`. Copy `.env.example` to `.env` to get started. Future plan: replace `src/config.ts` with a fetch call to a remote config endpoint.

## Environment Variables

```
VITE_API_URL=http://localhost:3000
```

