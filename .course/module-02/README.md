# Module 02: Automatic Greeting

## Learning Objectives

- Make the assistant greet the user proactively after connecting.
- Implement `sendText()` function to send messages to the agent.
- Use React hooks to manage greeting state and prevent duplicate messages.

## Documentation links

- [RealtimeTransportLayer sendMessage() method](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendmessage)

## Time Estimate

20–30 minutes

## Prerequisites

- Lesson 01 completed.

## Steps

1. Add `sendText` to the `UseRealtimeAgentResult` type definition in `src/lib/useRealtimeAgent.ts`.
2. Implement `sendText()` function using `useCallback` to send text messages via `sessionRef.current.sendMessage()`.
3. Add `sendText` to the hook's return object.
4. In `src/components/realtime/RealtimeChat.tsx`, import `useEffect`, `useRef`, and `REALTIME_DEFAULTS`.
5. Create `hasGreetedRef` to track greeting state and destructure `sendText` from the hook.
6. Implement automatic greeting effect that triggers when connected and resets when disconnected.

## Key Concepts

- `sendText` uses the specific message structure required by the Realtime API.
- `useRef` prevents re-renders while tracking greeting state across connection cycles.
- The greeting fires once per connection and resets on disconnect for future connections.

## Verification

- Agent speaks a greeting immediately after connection.
- Greeting is sent only once per connection.
- Greeting resets on disconnect/reconnect.

## !!!AI INSTRUCTIONS!!!

- See `02-code-reference.md` for code snippets and structure to follow.
