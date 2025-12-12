# Module 02: Automatic Greeting

## Overview

Add an automatic greeting feature that makes the agent speak when a connection is established. You will implement a text message sending function and create a useEffect hook that triggers an automatic greeting when the session connects.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Add sendText to Type Definition

**Context:** Inside `UseRealtimeAgentResult` type definition.
**Action:** Add `sendText` function signature.
**Code:**

```typescript
export type UseRealtimeAgentResult = {
  // ... existing properties
  toggleMute: () => void;
  sendText: (message: string) => void;
  interrupt: () => void;
  // ... existing properties
};
```

**Why:** Defines the contract for sending text messages to the agent.

### 2. Implement sendText Function

**Context:** Inside the hook, after `toggleMute` and before `interrupt`.
**Action:** Create the `sendText` function using `useCallback`.
**Code:**

```typescript
const sendText = useCallback((message: string) => {
  if (!sessionRef.current || !message.trim()) return;
  setError(null);
  sessionRef.current.sendMessage({
    type: "message",
    role: "user",
    content: [{ type: "input_text", text: message.trim() }],
  });
}, []);
```

**Why:** Sends a user message to the model. Note the specific message structure required by the Realtime API.

### 3. Add sendText to Return Object

**Context:** In the return statement of the hook.
**Action:** Include `sendText`.
**Code:**

```typescript
return {
  // ...
  toggleMute,
  sendText,
  interrupt,
  // ...
};
```

**Why:** Exposes the function to consumers.

## File: `src/components/realtime/RealtimeChat.tsx`

### 4. Import React Hooks

**Context:** Top of file.
**Action:** Add `useEffect` and `useRef` to imports.
**Code:**

```typescript
import { useEffect, useRef } from "react";
```

### 5. Import REALTIME_DEFAULTS

**Context:** Import from `@/lib/useRealtimeAgent`.
**Action:** Add `REALTIME_DEFAULTS`.
**Code:**

```typescript
import { useRealtimeAgent, REALTIME_DEFAULTS } from "@/lib/useRealtimeAgent";
```

### 6. Create hasGreetedRef

**Context:** Inside `RealtimeChat` component, before the hook call.
**Action:** Initialize a ref to track if we've greeted.
**Code:**

```typescript
const hasGreetedRef = useRef(false);
```

**Why:** We use a ref instead of state to avoid re-renders and ensure the greeting only fires once per connection session.

### 7. Destructure sendText

**Context:** `useRealtimeAgent` hook call.
**Action:** Extract `sendText`.
**Code:**

```typescript
const {
  // ...
  toggleMute,
  sendText,
  interrupt,
  // ...
} = useRealtimeAgent();
```

### 8. Implement Automatic Greeting Effect

**Context:** After the hook call.
**Action:** Add a `useEffect` to send the greeting when connected.
**Code:**

```typescript
useEffect(() => {
  if (isConnected && !hasGreetedRef.current) {
    hasGreetedRef.current = true;
    sendText(REALTIME_DEFAULTS.greeting);
  }
  if (!isConnected) {
    hasGreetedRef.current = false;
  }
}, [isConnected, sendText]);
```

**Why:** Triggers the greeting message immediately upon connection, and resets the flag when disconnected so it can greet again next time.

## Verification

- [ ] Agent speaks a greeting immediately after connection.
- [ ] Greeting is sent only once per connection.
- [ ] Greeting resets on disconnect/reconnect.
