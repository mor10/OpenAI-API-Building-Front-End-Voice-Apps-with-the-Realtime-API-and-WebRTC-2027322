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

## Verification

- [ ] Ask "Convert 10 meters to feet".
- [ ] Agent should call the tool (visible in timeline with badge).
- [ ] Agent should speak the correct result.
