# Module 07: MCP Server Integration

## Overview

Integrate a Model Context Protocol (MCP) server to enable agent handoffs and access to external data sources. You will create a specialist weather agent that uses an MCP server to fetch real-time weather data.

## File: `src/lib/useRealtimeAgent.ts`

### 1. Import hostedMcpTool

**Context:** Imports.
**Action:** Import `hostedMcpTool`.
**Code:**

```typescript
import { hostedMcpTool } from "@openai/agents";
```

### 2. Update DEFAULT_INSTRUCTIONS for Handoff

**Context:** `DEFAULT_INSTRUCTIONS`.
**Action:** Add handoff instructions.
**Code:**

```typescript
const DEFAULT_INSTRUCTIONS =
  "You are a helpful voice assistant. If the user asks about unit conversions, use the provided tool to assist them. If they ask about weather, hand off to the Weather Agent and instruct it to use available tools to get weather data immediately.";
```

### 3. Create weatherAgent with MCP Tool

**Context:** Inside `useEffect`, before main agent creation.
**Action:** Define the specialist agent.
**Code:**

```typescript
const weatherAgent = new RealtimeAgent({
  name: "Weather Agent",
  handoffDescription: "Specialist agent for weather questions and forecasts",
  instructions:
    "You are a weather specialist. Use the openmeteo-weather MCP server to get current conditions and forecasts. Provide natural, conversational weather descriptions focusing on temperature, precipitation, and general conditions. Avoid overwhelming users with technical details like barometric pressure, wind speed in exact units, or humidity percentages unless specifically asked. Translate weather codes into plain language (e.g., 'sunny', 'partly cloudy', 'rainy'). Keep responses concise and helpful.",
  tools: [
    hostedMcpTool({
      serverLabel: "openmeteo-weather",
      serverUrl: "https://YOUR-CODESPACE-URL-8000.app.github.dev/mcp",
    }),
  ],
});
```

**Note:** Replace `YOUR-CODESPACE-URL` with your actual running MCP server URL.

### 4. Add weatherAgent to Handoffs

**Context:** Main agent initialization.
**Action:** Add `handoffs` array.
**Code:**

```typescript
const agent = new RealtimeAgent({
  name: "Assistant",
  instructions: config.instructions,
  tools: [unitConversionTool],
  handoffs: [weatherAgent],
});
```

## Verification

- [ ] Ask "What is the weather in London?".
- [ ] Handoff badge appears in timeline.
- [ ] Weather Agent fetches data via MCP and responds.
