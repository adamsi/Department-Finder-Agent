# Department Finder (client)

Next.js + Redux client for chat (WebSocket) and document upload against your Department Finder backend.

## Features

- Chat with streaming over the existing WebSocket/STOMP flow
- Upload documents via `/upload` (ingestion API)

## Setup

Set `NEXT_PUBLIC_API_URL` to your backend base URL (default `http://localhost:8080`).

The app sends a fixed user on every REST request via the `X-User-Id` header (see `utils/app/user.ts`). Adjust the header name in `utils/api.ts` if your API expects something else.

## Scripts

```bash
npm install
npm run dev
```
