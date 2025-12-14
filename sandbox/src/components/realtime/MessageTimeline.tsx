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

/**
 * LESSON TASK:
 * Extend the DisplayMessage type to include tool_call and function_call messages.
 */
export type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
  eventType?: "message" | "guardrail";
};

export function MessageTimeline({
  history,
  events,
  isListening,
  greetingText,
  bannedPhrases,
}: MessageTimelineProps) {
  const normalizedBanned = bannedPhrases.map((phrase) => phrase.toLowerCase());
  const guardrailTrips = events.filter(
    (event) => event.type === "guardrail_tripped"
  );

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
            (content.type === "input_audio" ||
              content.type === "output_audio") &&
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

    /**
     * LESSON TASK:
     * Add handling for function_call and tool_call events to display appropriate messages in the timeline.
     */

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

  if (guardrailTrips.length > 0) {
    const latest = guardrailTrips[guardrailTrips.length - 1];
    const name: string | undefined =
      ("guardrail" in latest &&
        (latest as { guardrail?: { name?: string } }).guardrail?.name) ||
      ("name" in latest && (latest as { name?: string }).name) ||
      undefined;
    const outputInfo =
      ("outputInfo" in latest &&
        (latest as { outputInfo?: unknown }).outputInfo) ||
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
        if (
          item.eventType &&
          item.eventType !== "message" &&
          item.text.length > 0
        ) {
          return (
            <ToolBadge
              key={item.id}
              eventType={item.eventType}
              text={item.text}
            />
          );
        }
        return (
          <MessageBubble key={item.id} text={item.text} isUser={item.isUser} />
        );
      })}
    </div>
  );
}
