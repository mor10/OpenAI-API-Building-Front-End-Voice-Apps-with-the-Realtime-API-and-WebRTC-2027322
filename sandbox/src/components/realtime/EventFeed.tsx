"use client";

import type { TransportEvent } from "@openai/agents/realtime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type EventFeedProps = {
  events: TransportEvent[];
};

export function EventFeed({ events }: EventFeedProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Transport events
        </CardTitle>
        <CardDescription>
          Most recent server events from the Realtime transport.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full max-h-[320px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="space-y-3 text-xs">
            {events.map((event, index) => (
              <details
                key={`${event.type}-${index}`}
                className="rounded-md border border-border/60 bg-background/90 p-3"
              >
                <summary className="cursor-pointer text-foreground">
                  <span className="font-medium">{event.type}</span>
                  <span className="ml-2 text-muted-foreground">
                    (click to expand)
                  </span>
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-3 text-[11px] leading-tight">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
