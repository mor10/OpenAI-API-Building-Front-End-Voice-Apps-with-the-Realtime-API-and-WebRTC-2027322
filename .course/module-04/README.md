# Module 04: Text Chat

## Learning Objectives

- Implement text-based input alongside voice in a realtime session.
- Track conversation history using `RealtimeItem` arrays.
- Display conversation timeline with text messages and transcriptions.
- Handle listening states and speech events.

## Documentation links

- Realtime API server events reference:
  - [`conversation.item.input_audio_transcription.completed`](https://platform.openai.com/docs/api-reference/realtime-server-events/conversation/item/input_audio_transcription/completed)
  - [`conversation.item.create`](https://platform.openai.com/docs/api-reference/realtime-client-events/conversation/item/create)
  - [`input_audio_buffer.speech_started`](https://platform.openai.com/docs/api-reference/realtime-server-events/input_audio_buffer/speech_started)
  - [`input_audio_buffer.speech_stopped`](https://platform.openai.com/docs/api-reference/realtime-server-events/input_audio_buffer/speech_stopped)

## Time Estimate

45–60 minutes

## Prerequisites

- Lessons 01–03 completed.

## Steps

1. Add `isListening` and `history` to the `UseRealtimeAgentResult` type definition.
2. Update `resetRealtimeSession` to clear session history with `session.updateHistory([])`.
3. Add state variables for `history`, `isListening`, and tracking refs for suppressed items and history index.
4. Implement `handleHistoryUpdated` to sync history state and track item indices.
5. Track speech events in `handleTransportEvent` to update `isListening`.
6. Handle `conversation.item.create` events to optimistically append new items.
7. Subscribe to `history_updated` events and clean up listeners.
8. Reset states in `disconnect` and return new properties from the hook.
9. Import `MessageInput` and `MessageTimeline` components in `RealtimeChat.tsx`.
10. Add message state and implement `handleSubmitMessage` function.
11. Render `MessageTimeline` with history data and `MessageInput` for text entry.

## Key Concepts

- `RealtimeItem` arrays represent conversation history.
- Speech events track when the user is speaking.
- Optimistic updates improve UI responsiveness.
- Message timeline displays both text and voice interactions.

## Verification

- Chat interface appears with input field.
- Sending a message adds it to the timeline.
- Agent responses appear in the timeline.
- "Listening" indicator works when speaking.

## !!!AI INSTRUCTIONS!!!

- See `04-code-reference.md` for code snippets and structure to follow.
