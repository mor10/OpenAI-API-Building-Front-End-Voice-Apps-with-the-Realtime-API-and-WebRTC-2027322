# Module 01: Basic Connect

## Overview

Establish a basic connection to the OpenAI Realtime API. You will import necessary React hooks and OpenAI SDK components, initialize the RealtimeAgent and RealtimeSession, and implement the connect function to establish a WebSocket connection.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import React Hooks

**Context:** Top of the file, inside the `react` import.
**Action:** Add `useEffect`, `useRef`, `useState`, and `type RefObject` to the existing imports.
**Code:**

```typescript
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
```

**Why:** These hooks are essential for managing the component lifecycle, maintaining mutable state without re-renders (refs), and triggering updates (state).

### 2. Import OpenAI Realtime SDK Components

**Context:** Top of the file, after React imports.
**Action:** Import `RealtimeAgent` and `RealtimeSession`.
**Code:**

```typescript
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
```

**Why:** These are the core classes from the SDK needed to create and manage the realtime connection.

### 3. Update Return Type Definition

**Context:** Inside `UseRealtimeAgentResult` type definition.
**Action:** Add `sessionRef` and `config` properties.
**Code:**

```typescript
export type UseRealtimeAgentResult = {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  interrupt: () => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  error: string | null;
  sessionRef: RefObject<RealtimeSession | null>;
  config: RealtimeConfig;
};
```

**Why:** Exposing `sessionRef` allows other components to interact directly with the session if needed, and `config` allows them to see current settings.

### 4. Initialize RealtimeAgent and RealtimeSession

**Context:** Inside the `useEffect` hook that watches `[config]`.
**Action:** Initialize the agent and session at the start of the effect.
**Code:**

```typescript
const agent = new RealtimeAgent({
  name: "Assistant",
  instructions: config.instructions,
});

const session = new RealtimeSession(agent, {
  model: config.model,
  config: {
    audio: {
      output: { voice: config.voice },
    },
  },
});
```

**Why:** This creates the agent instance with instructions and the session with the correct model and voice configuration whenever the config changes.

### 5. Implement Connect Function

**Context:** Inside the `connect` function (currently commented out or empty).
**Action:** Implement the connection logic.
**Code:**

```typescript
const connect = useCallback(async () => {
  if (!sessionRef.current) return;
  if (connectionState === "connecting") return;

  if (connectionState === "connected") {
    disconnect();
    return;
  }

  setError(null);
  setConnectionState("connecting");
  try {
    const apiKey = await fetchRealtimeToken(config.authUrl);
    await sessionRef.current.connect({ apiKey });
    setConnectionState("connected");
    setIsMuted(Boolean(sessionRef.current.muted));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to connect to session";
    setError(message);
    setConnectionState("idle");
  }
}, [config.authUrl, connectionState, disconnect]);
```

**Why:** This handles the connection flow: checking state, fetching an ephemeral token, connecting the session, and handling errors.

### 6. Update Return Object

**Context:** At the bottom of the hook, in the return statement.
**Action:** Add `connect`, `sessionRef`, and `config` to the returned object.
**Code:**

```typescript
return {
  connect,
  disconnect,
  toggleMute,
  interrupt,
  connectionState,
  isConnected: connectionState === "connected",
  isConnecting: connectionState === "connecting",
  isMuted,
  error,
  sessionRef,
  config,
};
```

**Why:** This exposes the implemented functionality to the component using this hook.

## Verification

- [ ] `connect` button should appear in the UI.
- [ ] Clicking `connect` should change state to "connecting" then "connected".
- [ ] No TypeScript errors in `src/lib/useRealtimeAgent.ts`.
