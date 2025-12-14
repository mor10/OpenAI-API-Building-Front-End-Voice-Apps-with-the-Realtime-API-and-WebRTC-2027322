"use client";

import type { RealtimeItem, TransportEvent } from "@openai/agents/realtime";

import { MessageBubble } from "@/components/realtime/messages/MessageBubble";
import { ToolBadge } from "@/components/realtime/messages/ToolBadge";

export type MessageTimelineProps = {
  history: RealtimeItem[];
  events: TransportEvent[];
  isListening: boolean;
  greetingText: string;
  bannedPhrases: string[];
};

export type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
  eventType?: "message" | "tool_call" | "function_call" | "handoff" | "guardrail";
};

const hasWeatherSignal = (event: TransportEvent) => {
  const lower = (value?: string) => value?.toLowerCase() ?? "";

  const fromItem =
    "item" in event &&
    event.item &&
    typeof (event.item as { name?: string }).name === "string"
      ? lower((event.item as { name?: string }).name)
      : "";

  const fromFunction =
    "function_name" in event &&
    typeof (event as { function_name?: string }).function_name === "string"
      ? lower((event as { function_name?: string }).function_name)
      : "";

  const fromName =
    event.type === "response.function_call_arguments.done" &&
    "name" in event &&
    typeof (event as { name?: string }).name === "string"
      ? lower((event as { name?: string }).name)
      : "";

  return [fromItem, fromFunction, fromName].some((value) => value.includes("weather"));
};

export function MessageTimeline({
  history,
  events,
  isListening,
  greetingText,
  bannedPhrases,
}: MessageTimelineProps) {
  const normalizedBanned = bannedPhrases.map((phrase) => phrase.toLowerCase());
  const weatherEventDetected = events.some(hasWeatherSignal);
  const guardrailTrips = events.filter((event) => event.type === "guardrail_tripped");

  let displayMessages: DisplayMessage[] = history.map((item, index) => {
    const fallbackId =
      "itemId" in item && typeof item.itemId === "string"
        ? item.itemId
        : `${item.type}-${index}`;

    if (item.type === "message") {
      const text = item.content
        .map((content) => {
          if (
            (content.type === "input_text" || content.type === "output_text") &&
            "text" in content
          ) {
            return content.text;
          }
          if (
            (content.type === "input_audio" || content.type === "output_audio") &&
            "transcript" in content
          ) {
            return content.transcript ?? "";
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      const lowerText = text.toLowerCase();
      const containsBanned =
        item.role === "assistant" &&
        normalizedBanned.some((phrase) => lowerText.includes(phrase));

      return {
        id: fallbackId,
        role: item.role,
        text: containsBanned ? "" : text || "…",
        isUser: item.role === "user",
        eventType: "message",
      };
    }

    if (
      item.type === "function_call" ||
      item.type === "mcp_call" ||
      item.type === "mcp_tool_call"
    ) {
      const fnName =
        ("name" in item && typeof item.name === "string" ? item.name : undefined) ||
        ("function_name" in item && typeof item.function_name === "string"
          ? item.function_name
          : undefined) ||
        "Tool";
      const isMcp = item.type === "mcp_call" || item.type === "mcp_tool_call";
      return {
        id: fallbackId,
        role: "system",
        text: isMcp ? `Calling MCP: ${fnName}...` : `Using tool: ${fnName}`,
        isUser: false,
        eventType: isMcp ? "function_call" : "tool_call",
      };
    }

    return {
      id: fallbackId,
      role: item.type,
      text: `${item.type} event received`,
      isUser: false,
    };
  });

  displayMessages = displayMessages.filter(
    (message) => !(message.isUser && message.text.trim() === greetingText)
  );

  if (weatherEventDetected && displayMessages.length > 0) {
    const lastUserIndex = displayMessages.map((m) => m.isUser).lastIndexOf(true);
    const handoffMessage: DisplayMessage = {
      id: `handoff-${history.length}-${events.length}`,
      role: "system",
      text: "Handing off to Weather Agent...",
      isUser: false,
      eventType: "handoff",
    };
    if (lastUserIndex >= 0) {
      displayMessages.splice(lastUserIndex + 1, 0, handoffMessage);
    } else {
      displayMessages.push(handoffMessage);
    }
  }

  if (guardrailTrips.length > 0) {
    const latest = guardrailTrips[guardrailTrips.length - 1];
    const name: string | undefined =
      ("guardrail" in latest &&
        (latest as { guardrail?: { name?: string } }).guardrail?.name) ||
      ("name" in latest && (latest as { name?: string }).name) ||
      undefined;
    const outputInfo =
      ("outputInfo" in latest && (latest as { outputInfo?: unknown }).outputInfo) ||
      ("details" in latest && (latest as { details?: unknown }).details) ||
      undefined;
    const detailText =
      typeof outputInfo === "string"
        ? outputInfo
        : outputInfo && typeof outputInfo === "object"
        ? JSON.stringify(outputInfo)
        : undefined;

    const detailsSuffix = detailText ? ` – ${detailText}` : "";

    displayMessages.push({
      id: `guardrail-${history.length}-${events.length}`,
      role: "system",
      text: name
        ? `Response blocked by guardrails: ${name}${detailsSuffix}`
        : "Response blocked by guardrails.",
      isUser: false,
      eventType: "guardrail",
    });
  }

  if (isListening) {
    displayMessages.push({
      id: `listening-${history.length}-${events.length}`,
      role: "user",
      text: "Listening…",
      isUser: true,
      eventType: "message",
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {displayMessages.map((item) => {
        if (item.eventType && item.eventType !== "message" && item.text.length > 0) {
          return <ToolBadge key={item.id} eventType={item.eventType} text={item.text} />;
        }
        return <MessageBubble key={item.id} text={item.text} isUser={item.isUser} />;
      })}
    </div>
  );
}
