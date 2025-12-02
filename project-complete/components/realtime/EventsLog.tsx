"use client";

import type { TransportEvent } from "@openai/agents/realtime";
import { Activity } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type EventsLogProps = {
  events: TransportEvent[];
};

export function EventsLog({ events }: EventsLogProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity size={16} /> Transport events
        </CardTitle>
        <CardDescription>
          Most recent realtime events from the OpenAI transport.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full max-h-[320px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="space-y-3 text-xs">
            {events.map((event, index) => (
              <EventRow event={event} key={`${event.type}-${index}`} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type EventRowProps = {
  event: TransportEvent;
};

function EventRow({ event }: EventRowProps) {
  return (
    <details className="rounded-md border border-border/60 bg-background/90 p-3">
      <summary className="cursor-pointer text-foreground">
        <span className="font-medium">{event.type}</span>
        <span className="ml-2 text-muted-foreground">(click to expand)</span>
      </summary>
      <pre className="mt-2 overflow-x-auto rounded bg-muted/40 p-3 text-[11px] leading-tight">
        {JSON.stringify(event, null, 2)}
      </pre>
    </details>
  );
}
