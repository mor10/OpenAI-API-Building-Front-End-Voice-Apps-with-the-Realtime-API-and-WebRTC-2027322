import type { RealtimeOutputGuardrail } from "@openai/agents/realtime";

export const defaultGuardrails: RealtimeOutputGuardrail[] = [
  {
    name: "Ban chocolate-covered peanut butter",
    async execute({ agentOutput }) {
      const banned = agentOutput
        .toLowerCase()
        .includes("chocolate-covered peanut butter");
      return {
        tripwireTriggered: banned,
        outputInfo: { bannedPhraseDetected: banned },
      };
    },
  },
];
