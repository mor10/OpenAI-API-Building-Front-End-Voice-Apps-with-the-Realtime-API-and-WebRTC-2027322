"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConnectionState } from "@/lib/useRealtimeAgent";
import { Mic, MicOff } from "lucide-react";

export type ConnectionPanelProps = {
  connectionState: ConnectionState;
  isConnected: boolean;
  isMuted: boolean;
  isConnecting: boolean;
  error: string | null;
  authEndpoint: string;
  onConnectToggle: () => void;
  onRestart: () => void;
};

const statusCopy: Record<ConnectionState, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  connected: "Connected",
};

export function ConnectionPanel({
  connectionState,
  isConnected,
  isMuted,
  isConnecting,
  error,
  authEndpoint,
  onConnectToggle,
  onRestart,
}: ConnectionPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Session controls
        </CardTitle>
        <CardDescription>
          Ephemeral tokens fetched from:
          <br />
          <span className="ml-1 font-mono text-xs text-foreground/90">
            {authEndpoint}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm">
          <p className="text-muted-foreground">Connection</p>
          <p className="text-lg font-medium">{statusCopy[connectionState]}</p>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <MicrophoneIndicator isConnected={isConnected} isMuted={isMuted} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onConnectToggle}
            disabled={isConnecting}
            className="min-w-[150px]"
          >
            {isConnected ? "Disconnect session" : "Start session"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRestart}
            disabled={isConnecting}
          >
            Restart session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MicrophoneIndicator({
  isConnected,
  isMuted,
}: {
  isConnected: boolean;
  isMuted: boolean;
}) {
  const status = !isConnected ? "disconnected" : isMuted ? "muted" : "live";
  const colors = {
    disconnected: "border-border/70 bg-muted/40 text-muted-foreground",
    muted: "border-amber-500/50 bg-amber-500/10 text-amber-600",
    live: "border-emerald-500/60 bg-emerald-500/10 text-emerald-600",
  } as const;
  const Icon = !isConnected ? MicOff : isMuted ? MicOff : Mic;

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
