import type { RealtimeItem, TransportEvent } from "@openai/agents/realtime";

export type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
  rawItem?: RealtimeItem;
  eventType?: "message" | "tool_call" | "function_call" | "handoff" | "guardrail";
  metadata?: {
    toolName?: string;
    functionName?: string;
    agentName?: string;
    guardrailName?: string;
    guardrailDetails?: string;
  };
};

export type MessageListProps = {
  history: RealtimeItem[];
  events: TransportEvent[];
  isListening: boolean;
  greetingText: string;
};
