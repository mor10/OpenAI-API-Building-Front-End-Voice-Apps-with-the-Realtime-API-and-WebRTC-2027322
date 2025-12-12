# Module 05: Guardrails

## Overview

Implement content moderation guardrails that detect and block inappropriate content in agent responses. You will create output guardrails, handle guardrail violations, and suppress blocked items from conversation history.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import RealtimeOutputGuardrail Type

**Context:** Imports.
**Action:** Add `type RealtimeOutputGuardrail`.
**Code:**

```typescript
import {
  // ...
  type RealtimeOutputGuardrail,
} from "@openai/agents/realtime";
```

### 2. Implement createDefaultGuardrails Factory

**Context:** Top level function, outside hook.
**Action:** Create factory function for guardrails.
**Code:**

```typescript
const createDefaultGuardrails = (
  bannedPhrases: string[]
): RealtimeOutputGuardrail[] => {
  const normalized = bannedPhrases.map((phrase) => ({
    original: phrase,
    normalized: phrase.toLowerCase(),
  }));

  return [
    {
      name: "Banned phrase guardrail",
      async execute({ agentOutput }) {
        const lowerOutput = agentOutput.toLowerCase();
        const match = normalized.find((phrase) =>
          lowerOutput.includes(phrase.normalized)
        );
        return {
          tripwireTriggered: Boolean(match),
          outputInfo: {
            bannedPhraseDetected: match?.original ?? null,
          },
        };
      },
    },
  ];
};
```

### 3. Add outputGuardrails to Session

**Context:** Inside `useEffect`, session initialization.
**Action:** Configure guardrails.
**Code:**

```typescript
const session = new RealtimeSession(agent, {
  // ...
  outputGuardrails: createDefaultGuardrails(config.bannedPhrases),
});
```

### 4. Filter Suppressed Items in handleHistoryUpdated

**Context:** `handleHistoryUpdated` function.
**Action:** Update filter logic to respect suppressed items.
**Code:**

```typescript
const handleHistoryUpdated = (updatedHistory: RealtimeItem[]) => {
  const filtered = updatedHistory.filter((item) => {
    const id = (item as { itemId?: string }).itemId;
    return !id || !suppressedItems.has(id);
  });
  // ...
};
```

### 5. Implement handleGuardrailTripped

**Context:** Inside `useEffect`.
**Action:** Handle violation events.
**Code:**

```typescript
const handleGuardrailTripped = (...args: unknown[]) => {
  try {
    session.interrupt();
    setIsMuted(true);
  } catch {
    // ignore
  }

  try {
    const details = args[3] as { itemId?: string } | undefined;
    const offendingId = details?.itemId;
    if (offendingId) {
      suppressedItems.add(offendingId);
      setHistory((prev) =>
        prev.filter((item) => {
          const id = (item as { itemId?: string }).itemId;
          return id !== offendingId;
        })
      );

      const cleanedHistory = (session.history ?? []).filter((item) => {
        const id = (item as { itemId?: string }).itemId;
        return id !== offendingId;
      });
      const idxMap = new Map<string, number>();
      cleanedHistory.forEach((item, index) => {
        const id = (item as { itemId?: string }).itemId;
        if (id) idxMap.set(id, index);
      });
      historyIndexRef.current = idxMap;
      session.updateHistory(cleanedHistory as RealtimeItem[]);
    }
  } catch (err) {
    console.warn("Failed to remove offending item after guardrail", err);
  }

  setError("Response blocked by guardrails.");
};
```

### 6. Attach guardrail_tripped Listener

**Context:** Inside `useEffect`, listener attachments.
**Action:** Subscribe to event.
**Code:**

```typescript
session.on("guardrail_tripped", handleGuardrailTripped);
```

### 7. Detach guardrail_tripped Listener

**Context:** Inside `useEffect` cleanup.
**Action:** Unsubscribe.
**Code:**

```typescript
session.off("guardrail_tripped", handleGuardrailTripped);
```

## Verification

- [ ] Triggering a banned phrase (e.g., "moist") interrupts the agent.
- [ ] "Response blocked by guardrails" error appears.
- [ ] Offending item is removed from history/timeline.
