"use client";

import type { RealtimeItem, TransportEvent } from "@openai/agents/realtime";

import { MessageBubble } from "@/components/realtime/messages/MessageBubble";
import { ToolBadge } from "@/components/realtime/messages/ToolBadge";

export type MessageTimelineProps = {
  history: RealtimeItem[];
  events: TransportEvent[];
  isListening: boolean;
  greetingText: string;
};

export type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
  eventType?: "message";
};

export function MessageTimeline({
  history,
  events,
  isListening,
  greetingText,
}: MessageTimelineProps) {
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

      const containsBanned = false;

      return {
        id: fallbackId,
        role: item.role,
        text: containsBanned ? "" : text || "…",
        isUser: item.role === "user",
        eventType: "message",
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
