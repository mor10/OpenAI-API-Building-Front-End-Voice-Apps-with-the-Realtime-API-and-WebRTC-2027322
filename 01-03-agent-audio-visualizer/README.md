## Realtime Audio Chat

This app is the baseline voice + text interface used in the workshop. It combines:

- the **OpenAI Realtime API** via `@openai/agents`
- a **local auth helper** (same as `01-02-agent-reference-example`) that mints short-lived client tokens
- a **Next.js App Router UI** with shadcn components, event logs, and text input

Use it to verify microphone access, inspect raw transport events, and iterate on prompts before layering in custom visuals.

## Prerequisites

1. `OPENAI_API_KEY` exported in `auth-server/.env` (see `/auth-server/README.md`).
2. Node 18+ and npm.
3. Two terminals (one for the auth server, one for the Next app).

## Local setup

```bash
# 1) start the auth helper (tokens + WebRTC config)
cd auth-server
npm install
npm start

# 2) start the Next.js UI on another port so it doesn't collide with :3000
cd ../01-03-agent-audio-visualizer
npm install
npm run dev -- --port 4000
```

The client defaults to `http://localhost:3000/token` for ephemeral secrets. If you change the auth helper host/port, create a `.env.local` file in this directory with:

```env
NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3333/token
```

Then restart `npm run dev`.

## Features

- Voice-first chat over WebRTC (mute/unmute + interrupt controls)
- Text handoff form that triggers spoken responses
- Real-time transport/event log for debugging
- Visual status indicators for mic state and connection lifecycle
- Step-by-step checklist that mirrors the `01-02-agent-reference-example` flow

For more advanced multi-agent patterns, see `../realtime-next-reference/` in this repository.
