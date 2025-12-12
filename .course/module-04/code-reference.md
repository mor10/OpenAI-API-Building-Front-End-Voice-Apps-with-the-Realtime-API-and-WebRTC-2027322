# Module 04: Text Chat

## Overview

Implement a text chat interface with conversation history tracking. You will add message timeline display, text input functionality, and learn how to manage conversation history with `RealtimeItem` arrays.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import RealtimeItem Type

**Context:** Imports from `@openai/agents/realtime`.
**Action:** Ensure `RealtimeItem` is imported.
**Code:**

```typescript
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeItem,
  type TransportEvent,
} from "@openai/agents/realtime";
```

### 2. Update Return Type Definition

**Context:** `UseRealtimeAgentResult` type.
**Action:** Add `isListening` and `history`.
**Code:**

```typescript
export type UseRealtimeAgentResult = {
  // ...
  isListening: boolean;
  error: string | null;
  history: RealtimeItem[];
  // ...
};
```

### 3. Update resetRealtimeSession Helper

**Context:** `resetRealtimeSession` function.
**Action:** Clear session history before closing.
**Code:**

```typescript
function resetRealtimeSession(session: RealtimeSession | null) {
  if (!session) return;
  try {
    session.updateHistory([]);
  } catch {
    // ignore failures from partially open sessions
  }
  session.close();
}
```

### 4. Add State Variables

**Context:** Inside hook, state declarations.
**Action:** Add state for `history`, `isListening`, and refs for tracking items.
**Code:**

```typescript
const [history, setHistory] = useState<RealtimeItem[]>([]);
// ... existing events state ...
const [isListening, setIsListening] = useState(false);
const suppressedItemIdsRef = useRef<Set<string>>(new Set());
const historyIndexRef = useRef<Map<string, number>>(new Map());
```

### 5. Get Suppressed Items Reference

**Context:** Inside `useEffect`, top level.
**Action:** Capture ref value.
**Code:**

```typescript
const suppressedItems = suppressedItemIdsRef.current;
```

### 6. Implement handleHistoryUpdated

**Context:** Inside `useEffect`.
**Action:** Create handler to sync history state.
**Code:**

```typescript
const handleHistoryUpdated = (updatedHistory: RealtimeItem[]) => {
  const filtered = updatedHistory.filter((item) => {
    const id = (item as { itemId?: string }).itemId;
    return true; // OMITTED FOR LESSON TASK - should filter suppressedItems
  });
  setHistory(filtered);
  const idx = new Map<string, number>();
  filtered.forEach((item, index) => {
    const id = (item as { itemId?: string }).itemId;
    if (id) idx.set(id, index);
  });
  historyIndexRef.current = idx;
};
```

### 7. Update isListening in handleTransportEvent

**Context:** Inside `handleTransportEvent`.
**Action:** Track speech start/stop events.
**Code:**

```typescript
if (event.type === "input_audio_buffer.speech_started") {
  setIsListening(true);
}
if (event.type === "input_audio_buffer.speech_stopped") {
  setIsListening(false);
}
```

### 8. Handle conversation.item.created Event

**Context:** Inside `handleTransportEvent`.
**Action:** Optimistically append new items to history.
**Code:**

```typescript
if (event.type === "conversation.item.created" && event.item) {
  const item = event.item as RealtimeItem;
  const id = (item as { itemId?: string }).itemId;
  if (id && suppressedItems.has(id)) return;
  setHistory((prev) => [...prev, item]);
}
```

### 9. Attach history_updated Listener

**Context:** Inside `useEffect`, listener attachments.
**Action:** Subscribe to `history_updated`.
**Code:**

```typescript
session.on("history_updated", handleHistoryUpdated);
session.on("transport_event", handleTransportEvent);
```

### 10. Cleanup Listeners and Refs

**Context:** Inside `useEffect` cleanup.
**Action:** Detach listener and clear refs.
**Code:**

```typescript
return () => {
  session.off("history_updated", handleHistoryUpdated);
  // ...
  session.close();
  sessionRef.current = null;
  suppressedItems.clear();
  historyIndexRef.current.clear();
};
```

### 11. Reset States on Disconnect

**Context:** Inside `disconnect`.
**Action:** Reset history and listening state.
**Code:**

```typescript
setHistory([]);
setEvents([]);
setIsMuted(false);
setIsListening(false);
```

### 12. Return history and isListening

**Context:** Return statement.
**Action:** Include new properties.
**Code:**

```typescript
return {
  // ...
  isListening,
  history,
  // ...
};
```

## File: `src/components/realtime/RealtimeChat.tsx`

### 13. Import MessageInput and MessageTimeline

**Context:** Imports.
**Action:** Import components.
**Code:**

```typescript
import { MessageInput } from "@/components/realtime/MessageInput";
import { MessageTimeline } from "@/components/realtime/MessageTimeline";
```

### 14. Add message State

**Context:** Component state.
**Action:** Add state for text input.
**Code:**

```typescript
const [message, setMessage] = useState("");
```

### 15. Destructure isListening and history

**Context:** Hook call.
**Action:** Extract properties.
**Code:**

```typescript
const {
  // ...
  isListening,
  history,
  // ...
} = useRealtimeAgent();
```

### 16. Implement handleSubmitMessage

**Context:** Component body.
**Action:** Handle message submission.
**Code:**

```typescript
const handleSubmitMessage = (value: string) => {
  if (!value || !isConnected) return;
  sendText(value);
  setMessage("");
};
```

### 17. Render MessageTimeline

**Context:** JSX, main content area (left column).
**Action:** Render timeline or empty state.
**Code:**

```tsx
{
  history.length === 0 ? (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      No messages yet. Connect and start talking!
    </div>
  ) : (
    <MessageTimeline
      history={history}
      events={events}
      isListening={isListening}
      greetingText={REALTIME_DEFAULTS.greeting}
    />
  );
}
```

### 18. Render MessageInput

**Context:** JSX, below timeline.
**Action:** Render input component.
**Code:**

```tsx
<MessageInput
  value={message}
  placeholder="Type a text-only prompt here."
  disabled={!isConnected || isConnecting}
  onChange={(e) => setMessage(e.target.value)}
  onSubmit={() => handleSubmitMessage(message)}
/>
```

## Verification

- [ ] Chat interface appears with input field.
- [ ] Sending a message adds it to the timeline.
- [ ] Agent responses appear in the timeline.
- [ ] "Listening" indicator works when speaking.
