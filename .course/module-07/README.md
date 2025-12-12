# Module 07: MCP Server Integration

## Learning Objectives

- Integrate Model Context Protocol (MCP) server for external data access.
- Create specialist agent with handoff capabilities.
- Configure hosted MCP tools for weather data.
- Test agent handoffs in conversation flow.

## Documentation links

- [Agents SDK MCP server documentation](https://openai.github.io/openai-agents-js/guides/mcp/)
- Realtime API MCP server events:
  - [response.mcp_call_arguments.delta](https://platform.openai.com/docs/api-reference/realtime-server-events/response/mcp_call_arguments/delta)
  - [response.mcp_call_arguments.done](https://platform.openai.com/docs/api-reference/realtime-server-events/response/mcp_call_arguments/done)
  - [response.mcp_call.completed](https://platform.openai.com/docs/api-reference/realtime-server-events/response/mcp_call/completed)

## Time Estimate

45 minutes

## Prerequisites

- Lessons 01–06 completed.
- Understanding of MCP hosted tool URLs.

## Steps

1. Import `hostedMcpTool` from `@openai/agents` in `src/lib/useRealtimeAgent.ts`.
2. Update `DEFAULT_INSTRUCTIONS` to include handoff instructions for weather queries.
3. Create `weatherAgent` with MCP server integration and specialized instructions.
4. Add `weatherAgent` to the main agent's `handoffs` array.
5. Test handoff by asking weather-related questions.

## Key Concepts

- MCP servers provide access to external data sources and APIs.
- Agent handoffs enable delegation to specialist agents for specific domains.
- Hosted MCP tools handle server communication automatically.
- Weather agent uses OpenMeteo MCP server for real-time weather data.

## Notes

- MCP servers can be hosted HTTP servers, streamable HTTP servers, or STDIO-based servers.
- Hosted tools push the entire round-trip into the model instead of your code calling the MCP server.
- Human-in-the-loop approval can be configured with `requireApproval` property.
- Replace `YOUR-CODESPACE-URL` with your actual running MCP server URL.

## Verification

- Ask "What is the weather in London?".
- Handoff badge appears in timeline.
- Weather Agent fetches data via MCP and responds.

## Common Issues

- MCP server is not running or not publicly accessible.
- MCP server URL is incorrect or missing `/mcp` suffix.
- Agent may need prompting twice for weather responses.

## !!!AI INSTRUCTIONS!!!

- See `07-code-reference.md` for code snippets and structure to follow.
