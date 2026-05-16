# RAG Chat

[![CI](https://github.com/hugoarias/rag-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/hugoarias/rag-frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hugoarias/rag-frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/hugoarias/rag-frontend)

A React chat application that connects to a RAG (Retrieval-Augmented Generation) API. Supports streaming responses via Server-Sent Events and displays retrieved source citations alongside each answer.

## Prerequisites

- **Node.js** v18 or later
- A running RAG API (see [API Configuration](#api-configuration))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
```

Open `.env` and set `VITE_API_URL` to the base URL of your RAG API:

```
VITE_API_URL=http://localhost:3000
```

## Running

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## API Configuration

The app reads the API base URL from the `VITE_API_URL` environment variable, defined in `.env`. This is centralised in `src/config.ts` and will later be replaceable with a remote config fetch at startup.

The app communicates with a single endpoint:

```
POST {VITE_API_URL}/query
Content-Type: application/json

{ "question": "..." }
```

## Streaming

A **"Stream response"** checkbox in the chat input toggles between two modes (preference is saved across sessions):

| Mode | Behaviour |
|---|---|
| **On** (default) | Sends `Accept: text/event-stream`; tokens stream in word-by-word as the API replies |
| **Off** | Sends `Accept: application/json`; waits for the full `{ answer, sources }` response |

## Project Structure

```
src/
├── config.ts              # API_URL from VITE_API_URL env var
├── types/chat.ts          # Message and Source TypeScript types
├── api/ragClient.ts       # SSE streaming client + plain JSON fallback
├── hooks/useChat.ts       # Chat state and sendMessage logic
└── components/
    ├── ChatWindow.tsx     # Scrollable message history
    ├── Message.tsx        # User / assistant chat bubbles
    ├── SourceList.tsx     # Collapsible citations panel
    └── ChatInput.tsx      # Textarea, send button, streaming toggle
```

