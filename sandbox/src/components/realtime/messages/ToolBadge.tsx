"use client";

import {
  Wrench,
  Zap,
  GitBranch,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";

const styles = {
  tool_call:
    "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  function_call:
    "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  handoff:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  guardrail: "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300",
  message: "",
} as const;

const icons = {
  tool_call: Wrench,
  function_call: Zap,
  handoff: GitBranch,
  guardrail: ShieldAlert,
  message: MessageCircle,
} as const;

export type ToolBadgeProps = {
  eventType: keyof typeof styles;
  text: string;
};

export function ToolBadge({ eventType, text }: ToolBadgeProps) {
  if (!eventType || eventType === "message") return null;
  const Icon = icons[eventType];
  return (
    <div className="flex justify-center">
      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${styles[eventType]}`}
      >
        <Icon className="h-4 w-4" />
        <span>{text}</span>
      </div>
    </div>
  );
}
