"use client";

import type {
  DisplayMessage,
  MessageListProps,
} from "@/types/realtime";
import { ToolCallDisplay } from "@/components/realtime/ToolCallDisplay";
import { cn } from "@/lib/utils";

const BANNED_PHRASE = "chocolate-covered peanut butter";

const weatherEventDetected = (events: MessageListProps["events"]) => {
  return events.some((e) => {
    const hasWeatherInItemName =
      ("item" in e &&
        (e as unknown as { item?: { name?: string } }).item &&
        typeof (e as unknown as { item?: { name?: string } }).item?.name ===
          "string" &&
        ((e as unknown as { item?: { name?: string } }).item?.name as string)
          .toLowerCase()
          .includes("weather")) ||
      false;

    const hasWeatherInFunctionName =
      ("function_name" in e &&
        typeof (e as unknown as { function_name?: string }).function_name ===
          "string" &&
        ((e as unknown as { function_name?: string }).function_name as string)
          .toLowerCase()
          .includes("weather")) ||
      false;

    const hasWeatherInName =
      e.type === "response.function_call_arguments.done" &&
      "name" in e &&
      typeof (e as unknown as { name?: string }).name === "string" &&
      ((e as unknown as { name?: string }).name as string)
        .toLowerCase()
        .includes("weather");

    return hasWeatherInItemName || hasWeatherInFunctionName || hasWeatherInName;
  });
};

const mapHistoryToDisplay = (
  history: MessageListProps["history"]
): DisplayMessage[] => {
  return history.map((item, index) => {
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

      const containsBanned =
        item.role === "assistant" &&
        text.toLowerCase().includes(BANNED_PHRASE);

      if (containsBanned) {
        return {
          id: item.itemId ?? fallbackId,
          role: item.role,
          text: "",
          isUser: false,
          eventType: "message",
          rawItem: item,
        };
      }

      return {
        id: item.itemId ?? fallbackId,
        role: item.role,
        text: text || "…",
        isUser: item.role === "user",
        eventType: "message",
        rawItem: item,
      };
    }

    if (
      item.type === "function_call" ||
      item.type === "mcp_call" ||
      item.type === "mcp_tool_call"
    ) {
      const fnName =
        ("name" in item && typeof (item as { name?: string }).name === "string"
          ? (item as { name?: string }).name
          : undefined) ||
        ("function_name" in item &&
        typeof (item as { function_name?: string }).function_name === "string"
          ? (item as { function_name?: string }).function_name
          : undefined) ||
        "Tool";

      const isMcp = item.type === "mcp_call" || item.type === "mcp_tool_call";

      return {
        id: fallbackId,
        role: "system",
        text: isMcp ? `Calling MCP: ${fnName}...` : `Using tool: ${fnName}`,
        isUser: false,
        eventType: isMcp ? "function_call" : "tool_call",
        metadata: { functionName: fnName },
        rawItem: item,
      };
    }

    return {
      id: fallbackId,
      role: item.type,
      text: `${item.type} event received`,
      isUser: false,
      rawItem: item,
    };
  });
};

export function MessageList({
  history,
  events,
  isListening,
  greetingText,
}: MessageListProps) {
  let displayMessages = mapHistoryToDisplay(history);

  displayMessages = displayMessages.filter(
    (m) => !(m.isUser && m.text.trim() === greetingText)
  );

  if (weatherEventDetected(events) && displayMessages.length > 0) {
    const handoffNotification: DisplayMessage = {
      id: `handoff-${history.length}-${events.length}`,
      role: "system",
      text: "Handing off to Weather Agent...",
      isUser: false,
      eventType: "handoff",
      metadata: { agentName: "Weather Agent" },
    };

    const lastUserIndex = displayMessages.map((m) => m.isUser).lastIndexOf(true);
    if (lastUserIndex >= 0) {
      displayMessages.splice(lastUserIndex + 1, 0, handoffNotification);
    }
  }

  const guardrailTrips = events.filter((e) => e.type === "guardrail_tripped");
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
      ("reason" in latest && (latest as { reason?: unknown }).reason) ||
      undefined;
    const detailsStr =
      typeof outputInfo === "string"
        ? outputInfo
        : outputInfo && typeof outputInfo === "object"
        ? JSON.stringify(outputInfo)
        : undefined;

    const text = name
      ? `Response blocked by guardrails: ${name}`
      : "Response blocked by guardrails.";

    displayMessages.push({
      id: `guardrail-${history.length}-${events.length}`,
      role: "system",
      text,
      isUser: false,
      eventType: "guardrail",
      metadata: {
        guardrailName: name,
        guardrailDetails: detailsStr,
      },
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
            <ToolCallDisplay
              key={item.id}
              eventType={item.eventType}
              text={item.text}
            />
          );
        }

        return <MessageBubble key={item.id} text={item.text} isUser={item.isUser} />;
      })}
    </div>
  );
}

type MessageBubbleProps = {
  text: string;
  isUser: boolean;
};

function MessageBubble({ text, isUser }: MessageBubbleProps) {
  if (!text) return null;
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {text}
      </div>
    </div>
  );
}
