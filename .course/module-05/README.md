# Module 05: Guardrails

## Learning Objectives

- Implement output guardrails for content moderation.
- Handle guardrail violations with interruption and suppression.
- Remove blocked content from conversation history.
- Communicate guardrail blocks to users.

## Documentation links

- [Agents SDK Realtime guardrails documentation](https://openai.github.io/openai-agents-js/guides/voice-agents/build/#guardrails)
- [Agents SDK guardrails documentation](https://openai.github.io/openai-agents-js/guides/guardrails/)
- [RealtimeOutputGuardrail interface](https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimeoutputguardrail/)

## Time Estimate

30–45 minutes

## Prerequisites

- Lessons 01–04 completed.
- Comfort with React refs and derived state.

## Steps

1. Import `RealtimeOutputGuardrail` type from `@openai/agents/realtime`.
2. Create `createDefaultGuardrails` factory function that takes banned phrases and returns guardrails.
3. Add `outputGuardrails` to the `RealtimeSession` constructor configuration.
4. Update `handleHistoryUpdated` to filter suppressed items properly.
5. Implement `handleGuardrailTripped` to interrupt, mute, and remove offending items.
6. Subscribe to and unsubscribe from `guardrail_tripped` events.

## Key Concepts

- Output guardrails examine agent responses for policy violations.
- Guardrail violations trigger interruption and content removal.
- Suppressed items are tracked in refs to prevent display.
- Session history must be updated to maintain consistency.

## Verification

- Triggering a banned phrase (e.g., "moist") interrupts the agent.
- "Response blocked by guardrails" error appears.
- Offending item is removed from history/timeline.

## Common Issues

- Not registering the `guardrail_tripped` handler leaves suppressed items visible.
- Forgetting to rebuild the `historyIndexRef` causes stale indices and potential UI mismatch.
- Omitting `setIsMuted(true)` allows continued audio playback after block.

## !!!AI INSTRUCTIONS!!!

- See `05-code-reference.md` for code snippets and structure to follow.
