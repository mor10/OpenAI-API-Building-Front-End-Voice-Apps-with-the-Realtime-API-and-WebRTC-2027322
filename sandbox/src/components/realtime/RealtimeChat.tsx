"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionPanel } from "@/components/realtime/ConnectionPanel";
import { EventFeed } from "@/components/realtime/EventFeed";
import { MessageInput } from "@/components/realtime/MessageInput";
import { MessageTimeline } from "@/components/realtime/MessageTimeline";
import { useRealtimeAgent, REALTIME_DEFAULTS } from "@/lib/useRealtimeAgent";

export function RealtimeChat() {
  const [message, setMessage] = useState("");

  const hasGreetedRef = useRef(false);

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
    isListening,
    history,
    events,
    error,
    sessionRef,
    config,
  } = useRealtimeAgent();

  useEffect(() => {
    if (isConnected && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      sendText(REALTIME_DEFAULTS.greeting);
    }
    if (!isConnected) {
      hasGreetedRef.current = false;
    }
  }, [isConnected, sendText]);

  const handleSubmitMessage = (value: string) => {
    if (!value || !isConnected) return;
    sendText(value);
    setMessage("");
  };

  const handleConnectToggle = () => {
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
            <CardTitle className="text-xl">Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-4">
              {history.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  No messages yet. Connect and start talking!
                </div>
              ) : (
                <MessageTimeline
                  history={history}
                  events={events}
                  isListening={isListening}
                  greetingText={REALTIME_DEFAULTS.greeting}
                />
              )}
            </div>
            <div className="flex flex-col gap-3">
              <MessageInput
                value={message}
                placeholder="Type a text-only prompt here."
                disabled={!isConnected || isConnecting}
                isSubmitting={isConnecting}
                onChange={setMessage}
                onSubmit={handleSubmitMessage}
              />
              <div className="flex flex-wrap gap-2">
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
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <ConnectionPanel
            connectionState={connectionState}
            isConnected={isConnected}
            isMuted={isMuted}
            isConnecting={isConnecting}
            error={error}
            authEndpoint={config.authUrl}
            onConnectToggle={handleConnectToggle}
            onRestart={() => {
              disconnect();
              void connect();
            }}
          />
          <EventFeed events={events} />
        </div>
      </div>
    </div>
  );
}
