"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionPanel } from "@/components/realtime/ConnectionPanel";
import { EventFeed } from "@/components/realtime/EventFeed";

/**
 * LESSON TASK:
 *
 * Import the MessageInput and MessageTimeline components
 */
import { useRealtimeAgent, REALTIME_DEFAULTS } from "@/lib/useRealtimeAgent";

export function RealtimeChat() {
  /**
   * LESSON TASK:
   *
   * Add state for message and setMessage
   */

  const hasGreetedRef = useRef(false);

  /**
   * LESSON TASK:
   *
   * Import isListening and history from useRealtimeAgent
   */
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
    events,
    error,
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

  /**
   * LESSON TASK:
   *
   * Implement the handleSubmitMessage function to send text messages
   */

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
              {/**
               * LESSON TASK:
               *
               * Add conditional rendering to show MessageTimeline when history has messages.
               * - include history, events, isListening, and greetingText props
               */}
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Update this placeholder text once the MessageTimeline component
                is wired up!
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {/**
               * LESSON TASK:
               *
               * Add MessageInput component for sending text messages
               * - set value as message state
               * - set placeholder to "Type a text-only prompt here."
               * - disable if not connected or connecting
               * - onSubmit should call handleSubmitMessage
               */}
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
