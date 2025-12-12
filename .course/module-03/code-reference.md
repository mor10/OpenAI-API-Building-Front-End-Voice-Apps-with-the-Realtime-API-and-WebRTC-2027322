# Module 03: Events Log

## Overview

Implement an event logging system that captures and displays all transport events from the Realtime API. You will subscribe to transport events, manage event state, and integrate an EventFeed component to visualize the event stream.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import TransportEvent and RealtimeItem Types

**Context:** Imports from `@openai/agents/realtime`.
**Action:** Add `type TransportEvent` and `type RealtimeItem`.
**Code:**

```typescript
import {
  RealtimeAgent,
  RealtimeSession,
  type TransportEvent,
  type RealtimeItem,
} from "@openai/agents/realtime";
```

### 2. Add events to Return Type Definition

**Context:** `UseRealtimeAgentResult` type.
**Action:** Add `events: TransportEvent[]`.
**Code:**

```typescript
export type UseRealtimeAgentResult = {
  // ...
  error: string | null;
  events: TransportEvent[];
  sessionRef: RefObject<RealtimeSession | null>;
  // ...
};
```

### 3. Add events State

**Context:** Inside the hook, state declarations.
**Action:** Add state for events.
**Code:**

```typescript
const [events, setEvents] = useState<TransportEvent[]>([]);
```

### 4. Implement handleTransportEvent

**Context:** Inside `useEffect`, before `handleError`.
**Action:** Create the event handler.
**Code:**

```typescript
const handleTransportEvent = (event: TransportEvent) => {
  if (
    event.type !== "response.output_audio_transcript.delta" &&
    event.type !== "response.input_audio_transcription.delta"
  ) {
    console.log("Realtime Event:", event);
  }

  setEvents((prev) => {
    const next = [...prev, event];
    if (next.length > config.eventLogSize) {
      return next.slice(next.length - config.eventLogSize);
    }
    return next;
  });
};
```

**Why:** Logs events to console (filtering noisy deltas) and updates state, keeping a limited history size.

### 5. Attach transport_event Listener

**Context:** Inside `useEffect`, after session connection logic (where `session.on` calls are).
**Action:** Subscribe to `transport_event`.
**Code:**

```typescript
session.on("transport_event", handleTransportEvent);
session.on("error", handleError);
```

### 6. Detach transport_event Listener

**Context:** Inside `useEffect` cleanup function.
**Action:** Unsubscribe from `transport_event`.
**Code:**

```typescript
return () => {
  session.off("transport_event", handleTransportEvent);
  session.off("error", handleError);
  session.close();
  sessionRef.current = null;
};
```

### 7. Reset events on Disconnect

**Context:** Inside `disconnect` function.
**Action:** Clear events state.
**Code:**

```typescript
setEvents([]);
```

### 8. Return events in Hook Result

**Context:** Return statement.
**Action:** Include `events`.
**Code:**

```typescript
return {
  // ...
  events,
  // ...
};
```

## File: `src/components/realtime/RealtimeChat.tsx`

### 9. Import EventFeed Component

**Context:** Imports.
**Action:** Import `EventFeed`.
**Code:**

```typescript
import { EventFeed } from "@/components/realtime/EventFeed";
```

### 10. Destructure events

**Context:** `useRealtimeAgent` hook call.
**Action:** Extract `events`.
**Code:**

```typescript
const {
  // ...
  events,
  // ...
} = useRealtimeAgent();
```

### 11. Render EventFeed Component

**Context:** Inside the JSX, in the right column (usually under `ConnectionPanel`).
**Action:** Render `EventFeed`.
**Code:**

```tsx
<EventFeed events={events} />
```

## Verification

- [ ] EventFeed panel appears in the UI.
- [ ] Events populate in real-time when connected.
- [ ] Console logs show events (excluding deltas).
- [ ] Events clear on disconnect.
