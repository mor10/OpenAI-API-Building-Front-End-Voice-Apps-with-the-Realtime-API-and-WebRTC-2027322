# OpenAI Realtime API Agent using the Agents SDK

A lightweight Next.js application demonstrating the use of OpenAI’s Realtime API.

## Tech stack

- [OpenAI Agents SDK (JavaScript/TypeScript)](https://openai.github.io/openai-agents-js/)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [Next.js](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/)

## Features

- Real-time voice-to-voice with transcription
- Text input to drive spoken responses
- Ephemeral token authentication via a development auth server
- Event logging for server-side events
- Guardrails for content moderation
- Tool calls for local functions
- Tool calls for MCP servers
- Image input via device camera

## Local setup

### Step 1: Set up your OpenAI API key

1. Go to [https://platform.openai.com/account/api-keys](https://platform.openai.com/account/api-keys) to create and copy your API key.
2. In `auth-server/`, create a `.env` file and add `OPENAI_API_KEY=<YOUR-OPENAI-API-KEY>`.

### Step 2: Start the auth server

In terminal, start the auth server:

```bash
cd auth-server
node server.js
```

Ephemeral tokens can now be requested with an unauthenticated call to `<SERVER-URL>/token`.
When running locally, the server defaults to `http://localhost:3000`.

**IMPORTANT:**
In GitHub Codespaces, set port `3000` to `Public` in the Ports tab.

### Step 3: Configure and start the Next.js app

1. In GitHub Codespaces, create a `.env.local` file in the root directory and add `NEXT_PUBLIC_AUTH_SERVER_URL=https://<RANDOM-GENERATED-URI>-3000.app.github.dev/token`
2. Open a new terminal
3. Install dependencies with `npm install`
4. Start the Next.js app with `npm run dev`
