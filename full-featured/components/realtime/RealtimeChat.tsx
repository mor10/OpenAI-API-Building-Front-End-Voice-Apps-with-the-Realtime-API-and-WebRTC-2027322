"use client";

import { useMemo, useState } from "react";
import type {
  RealtimeItem,
  RealtimeMessageItem,
  TransportEvent,
} from "@openai/agents/realtime";
import { Activity, ExternalLink, Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  type ConnectionState,
  useRealtimeSession,
} from "@/hooks/useRealtimeSession";
import { cn } from "@/lib/utils";

const AUTH_ENDPOINT =
  process.env.NEXT_PUBLIC_AUTH_SERVER_URL ?? "http://localhost:3000/token";

const PROMPT_PLACEHOLDER =
  "Type something you'd like the agent to say out loud. Sending text will also trigger a spoken reply.";

type DisplayMessage = {
  id: string;
  role: string;
  text: string;
  isUser: boolean;
};

const mapHistoryToDisplay = (history: RealtimeItem[]): DisplayMessage[] => {
  return history.map((item, index) => {
    const fallbackId =
      "itemId" in item && typeof item.itemId === "string"
        ? item.itemId
        : `${item.type}-${index}`;

    if (item.type === "message") {
      const message = item as RealtimeMessageItem;
      const text = message.content
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
            return (
              content.transcript ??
              (content.type === "input_audio"
                ? "🎙️ Voice input"
                : "🔊 Voice response")
            );
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");

      return {
        id: message.itemId ?? fallbackId,
        role: message.role,
        text: text || "…",
        isUser: message.role === "user",
      };
    }

    return {
      id: fallbackId,
      role: item.type,
      text: `${item.type} event received`,
      isUser: false,
    };
  });
};

const statusCopy: Record<ConnectionState, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  connected: "Connected",
};

export function RealtimeChat() {
  const [message, setMessage] = useState("");
  const {
    connect,
    disconnect,
    toggleMute,
    sendText,
    interrupt,
    connectionState,
    isConnected,
    isConnecting,
    isMuted,
    history,
    events,
    error,
  } = useRealtimeSession({
    voice: "marin",
    model: "gpt-realtime",
    eventLogSize: 40,
  });

  const displayMessages = useMemo(
    () => mapHistoryToDisplay(history),
    [history]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || !isConnected) return;
    sendText(trimmed);
    setMessage("");
  };

  const handleConnectClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      void connect();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.25fr)_minmax(0,1fr)]">
        <Card className="flex min-h-[560px] flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              Baseline Realtime Audio Chat
              <MicrophoneIndicator
                isConnected={isConnected}
                isMuted={isMuted}
              />
            </CardTitle>
            <CardDescription>
              Click connect to request an ephemeral key from the auth server,
              then speak naturally. You can also send text to drive a spoken
              response.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-4">
              {displayMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  No messages yet. Connect and start talking!
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayMessages.map((item) => (
                    <MessageBubble key={item.id} {...item} />
                  ))}
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Textarea
                placeholder={PROMPT_PLACEHOLDER}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={!isConnected || isConnecting}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={
                    !isConnected || isConnecting || message.trim().length === 0
                  }
                >
                  Send text response
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => toggleMute()}
                  disabled={!isConnected}
                >
                  {isMuted ? "Unmute microphone" : "Mute microphone"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => interrupt()}
                  disabled={!isConnected}
                >
                  Interrupt response
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Session controls</CardTitle>
              <CardDescription>
                Ephemeral tokens are fetched from:
                <span className="ml-1 font-mono text-xs text-foreground/90">
                  {AUTH_ENDPOINT}
                </span>
                <br />
                Mirrors the auth flow demonstrated in{" "}
                <code>01-02-agent-reference-example</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p className="text-muted-foreground">Connection</p>
                <p className="text-lg font-medium">
                  {statusCopy[connectionState]}{" "}
                  {isConnected && isMuted && (
                    <span className="text-sm text-muted-foreground">
                      · muted
                    </span>
                  )}
                </p>
                {error && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="min-w-[150px]"
                >
                  {isConnected ? "Disconnect session" : "Connect & listen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    disconnect();
                    void connect();
                  }}
                  disabled={isConnecting}
                >
                  Restart session
                </Button>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Setup checklist</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Run the auth server from <code>auth-server/</code> using{" "}
                    <code>npm start</code>.
                  </li>
                  <li>
                    Update <code>NEXT_PUBLIC_AUTH_SERVER_URL</code> if the port
                    or host changes.
                  </li>
                  <li>Allow microphone access when prompted in the browser.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <ExternalLink size={16} />
        <span>
          Need a different agent setup? Use{" "}
          <code>realtime-next-reference/</code> in this repo for advanced
          patterns.
        </span>
      </div>
    </div>
  );
}

type MicrophoneIndicatorProps = {
  isConnected: boolean;
  isMuted: boolean;
};

function MicrophoneIndicator({
  isConnected,
  isMuted,
}: MicrophoneIndicatorProps) {
  const status = !isConnected ? "disconnected" : isMuted ? "muted" : "live";
  const colors = {
    disconnected: "border-border/70 bg-muted/40 text-muted-foreground",
    muted: "border-amber-500/50 bg-amber-500/10 text-amber-600",
    live: "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  } as const;
  const Icon = !isConnected ? VolumeX : isMuted ? VolumeX : Volume2;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border px-3 py-1 text-xs font-medium",
        colors[status]
      )}
    >
      <Icon size={14} />
      {status === "live"
        ? "Mic live"
        : status === "muted"
        ? "Muted"
        : "Offline"}
    </div>
  );
}

type MessageBubbleProps = DisplayMessage;

function MessageBubble({ text, isUser }: MessageBubbleProps) {
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
