# Module 01: Basic Connection

## Learning Objectives

- Initialize `RealtimeAgent` and `RealtimeSession` from the OpenAI Agents SDK
- Implement `useRealtimeAgent` to fetch an ephemeral token and connect
- Wire up Connect / Disconnect UI interactions
- Use the correct SDK import path: `@openai/agents/realtime`

## Documentation links

- [Agents SDK Realtime quickstart](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/)
- [RealtimeAgent class](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/)
- [RealtimeSession class](https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimesession/)
- [Realtime API guide](https://platform.openai.com/docs/guides/realtime)
- [Realtime API API reference](https://platform.openai.com/docs/api-reference/realtime)

## Time Estimate

30–45 minutes

## Prerequisites

- Core setup from the main repo README completed

## Steps

1. Install `@openai/agents` and configure your auth endpoint.

   - The SDK is imported from `@openai/agents/realtime`.
   - Set `NEXT_PUBLIC_AUTH_SERVER_URL` in `.env.local` (defaults to `http://localhost:3000/token`).

   ```zsh
   echo "NEXT_PUBLIC_AUTH_SERVER_URL=http://localhost:3000/token" >> .env.local
   npm install @openai/agents
   ```

2. Implement `src/lib/useRealtimeAgent.ts` using `RealtimeAgent` and `RealtimeSession`.
   - Import React hooks: `useEffect`, `useRef`, `useState`, `useCallback`, and `type RefObject`.
   - Import SDK components: `RealtimeAgent` and `RealtimeSession` from `@openai/agents/realtime`.
   - Initialize the agent and session inside `useEffect` based on `config` and assign `sessionRef.current`.
   - Implement `connect` to fetch an ephemeral token via `fetchRealtimeToken(config.authUrl)` and call `sessionRef.current.connect({ apiKey })`.
   - Update the return object to include `connect`, `sessionRef`, and `config`.
3. Manually test by running `npm run dev` and clicking “Connect”.

## Key Concepts

- `RealtimeAgent` defines the assistant persona and optional tools/handoffs.
- `RealtimeSession` manages the transport lifecycle and audio config.
- Ephemeral tokens are required per session and are fetched from your auth server.
- Import paths use the Agents SDK: `@openai/agents/realtime`.

## Implementation Guide

Follow the steps in `01-code-reference.md`. Focus on:

- Build config with your app’s `RealtimeConfig`.
- Fetch an ephemeral API key via `fetchRealtimeToken(config.authUrl)`.
- Call `sessionRef.current.connect({ apiKey })` and manage `connectionState`, `isMuted`, and errors.

## Verification

- The connect button should toggle between “Connect” and “Disconnect”.
- `ConnectionStatus` should show your auth endpoint and mic status.
- No TypeScript errors in `src/lib/useRealtimeAgent.ts`.

## !!!AI INSTRUCTIONS!!!

- See `01-code-reference.md` for code snippets and structure to follow.
