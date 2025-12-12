# Realtime Agents Classroom

A best-of-both-worlds Next.js starter that keeps the polished UI and feature set from `/REF/` while adopting the minimal, easy-to-explain flow from `/DOC/`. Students can enable one realtime capability at a time without hunting across folders.

## Simplification plan in action

1. **Single runtime file** – All realtime wiring (agent + session + handlers + guardrails + tools + handoffs) lives in [`src/lib/useRealtimeAgent.ts`](src/lib/useRealtimeAgent.ts). Feature callouts (`FEATURE 1`…`FEATURE 8`) match the tutorial steps so students can see where to work.
2. **Co-located UI** – The entire interface (connection panel, chat log, event feed, tool badges, message input) sits inside [`src/components/realtime/RealtimeChat.tsx`](src/components/realtime/RealtimeChat.tsx). Subcomponents are defined inline to avoid jumping between files while still keeping logic readable.
3. **Self-contained camera flow** – [`src/components/CameraCapture.tsx`](src/components/CameraCapture.tsx) owns both the hook and the UI, so activating image uploads is a copy-paste task.
4. **Modern Next.js layout** – Uses the `src/` convention, a single page at `src/app/page.tsx`, and shadcn-style UI primitives under `src/components/ui/` for reuse without extra abstraction.

## Feature checklist (matches REF tutorial)

| Feature | Where to look |
| --- | --- |
| **FEATURE 1 – Basic connect** | `useRealtimeAgent` (agent/session creation + `connect` helper) |
| **FEATURE 2 – Welcome message** | `RealtimeChat` (`hasGreetedRef` effect before/after connection) |
| **FEATURE 3 – Event log** | `useRealtimeAgent` (`setEvents`) + `EventFeed` panel |
| **FEATURE 4 – Text chat** | `sendText` in `useRealtimeAgent` + `MessageInput` |
| **FEATURE 5 – Guardrails** | `defaultGuardrails` + `handleGuardrailTripped` + guardrail badge in `MessageTimeline` |
| **FEATURE 6 – Unit conversion tool** | `unitConversionTool` in `useRealtimeAgent` |
| **FEATURE 7 – Weather handoff/MCP** | `weatherAgent` + handoff badge insertion in `MessageTimeline` |
| **FEATURE 8 – Camera input** | `CameraCapture` with `sessionRef.current.addImage` call |

Each feature can be toggled/commented independently without breaking the others, which matches the incremental exercises laid out in `/REF/README.md`.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure ephemeral token minting**
   - Run the provided `auth-server` from the original starter (or your own proxy) and expose `POST /token` that returns the OpenAI client secret.
   - Create `.env.local` and set:

     ```bash
     NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3000/token
     ```

     (Any HTTPS URL works—just make sure it responds with `{ "value": "<TOKEN>" }` or `{ "client_secret": { "value": "<TOKEN>" } }`.)

3. **Start the app**

   ```bash
   npm run dev
   ```

4. Open [http://localhost:9307](http://localhost:9307) and work through the checklist. The UI renders even if the auth server is offline, so students can read the code before connecting.

## Key files

- `src/app/page.tsx` – Hero text + `<RealtimeChat />`.
- `src/lib/useRealtimeAgent.ts` – Agents SDK integration, guardrails, tools, transport handlers, connection helpers.
- `src/components/realtime/RealtimeChat.tsx` – UI shell, message timeline, event feed, camera toggle, and welcome message logic.
- `src/components/CameraCapture.tsx` – Browser camera lifecycle with capture helper.
- `src/components/ui/*` – Minimal shadcn primitives (button, card, textarea).

## Notes for instructors

- The `useRealtimeAgent` hook exports `config`, so lessons can override instructions/voice/model/auth URL from a single location.
- `sessionRef` is exposed for advanced steps (adding custom tools, streaming images, etc.).
- There are no hidden helpers—every async call, handler, and UI reaction happens in one of the two files listed above, which keeps walkthroughs short and focused.
