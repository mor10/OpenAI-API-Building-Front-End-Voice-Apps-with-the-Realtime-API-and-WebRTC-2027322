# Module 06: Tool Calls

## Overview

Add function calling capabilities to the agent using a unit conversion tool. You will define tools, attach them to the agent, and update instructions to enable tool usage.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import unitConversionTool

**Context:** Imports.
**Action:** Import the tool definition.
**Code:**

```typescript
import { unitConversionTool } from "@/tools/unitConversionTool";
```

### 2. Update DEFAULT_INSTRUCTIONS

**Context:** `DEFAULT_INSTRUCTIONS` constant.
**Action:** Mention the tool in instructions.
**Code:**

```typescript
const DEFAULT_INSTRUCTIONS =
  "You are a helpful voice assistant. If the user asks about unit conversions, use the provided tool to assist them.";
```

### 3. Add tools to RealtimeAgent

**Context:** Inside `useEffect`, agent initialization.
**Action:** Add `tools` array.
**Code:**

```typescript
const agent = new RealtimeAgent({
  name: "Assistant",
  instructions: config.instructions,
  tools: [unitConversionTool],
});
```

## File: `src/components/realtime/MessageTimeline.tsx`

### 4. Add `tool_call` and `function_call` message types

**Context:** Inside `DisplayMessage` type.
**Action:** Include `tool_call` and `function_call`.
**Code:**

```typescript
export type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
  eventType?: "message" | "guardrail" | "tool_call" | "function_call";
};
```

### 5. Display tool badges in the timeline

**Context:** Inside `mapMessageItemToMessage` function.
**Action:** Detect when a message item represents a tool call by checking for the `function_call` type and update the `mapMessageItemToMessage` function to include the `tool_call` event type and function name for badge display:
**Code:**

```typescript
if (item.type === "function_call") {
  const fnName =
    ("name" in item && typeof item.name === "string" ? item.name : undefined) ||
    ("function_name" in item && typeof item.function_name === "string"
      ? item.function_name
      : undefined) ||
    "Tool";
  return {
    id: fallbackId,
    role: "system",
    text: `Using tool: ${fnName}`,
    isUser: false,
    eventType: "tool_call",
  };
}
```

## Verification

- [ ] Ask "Convert 10 meters to feet".
- [ ] Agent should call the tool (visible in timeline with badge).
- [ ] Agent should speak the correct result.
