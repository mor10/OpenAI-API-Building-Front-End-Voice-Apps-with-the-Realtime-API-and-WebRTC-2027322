# Module 03: Events Log

## Learning Objectives

- Understand server transport events available from the Realtime API.
- Subscribe to transport events in `useRealtimeAgent`.
- Display a scrollable log of the latest events.
- Enforce log size limits via configuration.

## Documentation links

- [Realtime API documentation: Server-sent events](https://platform.openai.com/docs/api-reference/realtime-server-events)

## Time Estimate

30 minutes

## Prerequisites

- Lessons 01–02 completed.

## Steps

1. Import `TransportEvent` and `RealtimeItem` types from `@openai/agents/realtime`.
2. Add `events: TransportEvent[]` to the `UseRealtimeAgentResult` type definition.
3. Add events state using `useState<TransportEvent[]>([])`.
4. Implement `handleTransportEvent` to log events (filtering noisy deltas) and update state with size limits.
5. Subscribe to `transport_event` with `session.on("transport_event", handleTransportEvent)`.
6. Unsubscribe in the cleanup function with `session.off("transport_event", handleTransportEvent)`.
7. Reset events in the `disconnect` function with `setEvents([])`.
8. Return `events` in the hook result.
9. Import and render `EventFeed` component in `RealtimeChat.tsx`.

## Key Concepts

- Transport events provide real-time visibility into API communication.
- Event buffering prevents unbounded memory growth.
- Filtering delta events reduces noise in the log.
- The `EventFeed` component renders structured event data.

## Verification

- EventFeed panel appears in the UI.
- Events populate in real-time when connected.
- Console logs show events (excluding deltas).
- Events clear on disconnect.

## !!!AI INSTRUCTIONS!!!

- See `03-code-reference.md` for code snippets and structure to follow.
