# Module 06: Tool Calls

## Learning Objectives

- Register custom tools with the Realtime Agent.
- Enable function calling capabilities for unit conversions.
- Update agent instructions to enable tool usage.
- Test tool call integration in conversation timeline.

## Documentation links

- [Agents SDK Realtime tools documentation](https://openai.github.io/openai-agents-js/guides/voice-agents/build/#tools)
- [Agents SDK tools documentation](https://openai.github.io/openai-agents-js/guides/tools/)
- Realtime API function call server events:
  - [response.function_call_arguments.delta](https://platform.openai.com/docs/api-reference/realtime-server-events/response/function_call_arguments/delta)
  - [response.function_call_arguments.done](https://platform.openai.com/docs/api-reference/realtime-server-events/response/function_call_arguments/done)

## Time Estimate

30 minutes

## Prerequisites

- Lessons 01–05 completed.

## Steps

1. Import `unitConversionTool` in `src/lib/useRealtimeAgent.ts`.
2. Update `DEFAULT_INSTRUCTIONS` to mention the tool capability.
3. Add the tool to the `RealtimeAgent` constructor's `tools` array.
4. Test tool calls by asking for unit conversions.

## Key Concepts

- Tools extend agent capabilities beyond text generation.
- Agent instructions guide when to use available tools.
- Tool calls appear automatically in the conversation timeline.
- The unit conversion tool handles various categories: length, weight, volume, temperature, time.

## Notes

- Forcing tool calls using `modelSettings.tool_choice` is **not possible** in Realtime sessions because all RealtimeAgents are handled by the same model within a `RealtimeSession`.
- The existing `unitConversionTool.ts` uses Zod schemas to validate parameters.

## Verification

- Ask "Convert 10 meters to feet".
- Agent should call the tool (visible in timeline with badge).
- Agent should speak the correct result.

## !!!AI INSTRUCTIONS!!!

- See `06-code-reference.md` for code snippets and structure to follow.
