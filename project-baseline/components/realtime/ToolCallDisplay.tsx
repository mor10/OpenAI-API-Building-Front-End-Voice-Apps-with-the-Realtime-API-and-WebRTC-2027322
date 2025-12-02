"use client";

import type { DisplayMessage } from "@/types/realtime";

const eventStyles = {
  tool_call:
    "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  function_call:
    "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  handoff:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  guardrail:
    "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300",
};

const eventIcon: Record<
  NonNullable<DisplayMessage["eventType"]>,
  string
> = {
  tool_call: "🔧",
  function_call: "⚡",
  handoff: "🔄",
  guardrail: "⚠️",
  message: "💬",
};

type ToolCallDisplayProps = Pick<DisplayMessage, "eventType" | "text">;

export function ToolCallDisplay({ eventType, text }: ToolCallDisplayProps) {
  if (!eventType || eventType === "message") return null;
  const style = eventStyles[eventType] ?? "border-border bg-muted text-foreground";
  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${style}`}
      >
        <span className="text-base">
          {eventIcon[eventType] ?? eventIcon.message}
        </span>
        <span>{text}</span>
      </div>
    </div>
  );
}
