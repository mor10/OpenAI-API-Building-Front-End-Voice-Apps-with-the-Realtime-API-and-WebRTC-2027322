"use client";

import { cn } from "@/lib/utils";

export type MessageBubbleProps = {
  text: string;
  isUser: boolean;
};

export function MessageBubble({ text, isUser }: MessageBubbleProps) {
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
