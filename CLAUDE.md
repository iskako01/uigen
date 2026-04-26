# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack on port 3000
npm run build        # Production build (wraps Next.js build with node-compat.cjs)
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests

# Database
npm run setup        # Install deps + Prisma generate + migrate dev (first-time setup)
npm run db:reset     # Reset database (destructive)
```

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe a component in a chat interface; Claude generates code using an agentic tool loop; the result renders live in a sandboxed iframe.

### AI/Chat Pipeline (`src/app/api/chat/route.ts`)

1. Client sends chat messages + serialized virtual filesystem to `/api/chat`
2. Route calls Vercel AI SDK `streamText()` with Anthropic Claude (or mock provider if no API key)
3. Claude runs an agentic loop (up to 40 steps) using two tools:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — view/create/str-replace files in the virtual FS
   - `file_manager` (`src/lib/tools/file-manager.ts`) — create/delete directories
4. Tool calls mutate the in-memory `VirtualFileSystem` and stream back to the client
5. Final file state + messages are persisted to SQLite via Prisma for authenticated users

Provider selection is in `src/lib/provider.ts`: returns a real Anthropic model when `ANTHROPIC_API_KEY` is set, otherwise a mock.

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is a pure in-memory tree (path → `FileNode`). No disk I/O — everything lives in this object, serialized as JSON for storage. The AI tools receive and mutate this object during generation.

### Code Preview Pipeline (`src/lib/transform/jsx-transformer.ts`)

Files from the virtual FS are Babel-transformed (JSX → JS) in the browser, then injected into a sandboxed iframe via an HTML import map that resolves React/libraries from `esm.sh` CDNs. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) owns the iframe lifecycle.

### Layout

`src/app/main-content.tsx` provides a resizable split-panel layout:
- **Left (35%)**: Chat interface (`src/components/chat/`)
- **Right (65%)**: Tabs between live preview (`PreviewFrame`) and code view (file tree + Monaco editor in `src/components/editor/`)

State is shared through two contexts:
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — virtual FS state
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — chat messages and the `useAIChat` hook

### Auth & Database (`src/actions/`, `prisma/`)

JWT sessions stored in `httpOnly` cookies (via `jose` + `bcrypt`). Server actions in `src/actions/` handle signUp/signIn/signOut and project CRUD. Prisma schema has two models: `User` (email/password) and `Project` (stores serialized messages + file system JSON, with optional `userId` to support anonymous users).

## Key Environment Variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Real Claude responses (falls back to mock if absent) |
| `JWT_SECRET` | Session signing (defaults to an insecure dev value) |

## Notes

- Path alias `@/*` → `src/*`
- `node-compat.cjs` patches Node globals required by Next.js on Windows/older runtimes — don't remove it
- The AI system prompt (in `src/lib/prompts/generation.tsx`) explicitly forbids hardcoded colors and inline styles; all styling must use Tailwind classes
- Tests use Vitest with jsdom; test files live in `__tests__` directories alongside source
