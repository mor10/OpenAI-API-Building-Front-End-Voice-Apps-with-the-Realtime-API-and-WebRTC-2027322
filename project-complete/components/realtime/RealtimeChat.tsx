"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

import { CameraCapture } from "@/components/CameraCapture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeSession } from "@/hooks/useRealtimeSession";
import { REALTIME_DEFAULTS } from "@/config/realtime.config";
import { ConnectionStatus } from "@/components/realtime/ConnectionStatus";
import { EventsLog } from "@/components/realtime/EventsLog";
import { MessageList } from "@/components/realtime/MessageList";
import { MessageInput } from "@/components/realtime/MessageInput";

const AUTH_ENDPOINT = REALTIME_DEFAULTS.authUrl;

export function RealtimeChat() {
  const [message, setMessage] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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
  } = useRealtimeSession({
    voice: REALTIME_DEFAULTS.voice,
    model: REALTIME_DEFAULTS.model,
    eventLogSize: REALTIME_DEFAULTS.eventLogSize,
    instructions: REALTIME_DEFAULTS.instructions,
    authUrl: REALTIME_DEFAULTS.authUrl,
  });

  // Send a one-time greeting when the session connects
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (isConnected && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      // Friendly spoken greeting to confirm audio works
      sendText(REALTIME_DEFAULTS.greeting);
    }
    if (!isConnected) {
      // Reset flag on disconnect to allow greeting next connection
      hasGreetedRef.current = false;
    }
  }, [isConnected, sendText]);

  const handleMessageSubmit = (value: string) => {
    if (!value || !isConnected) return;
    sendText(value);
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
            <CardTitle className="text-xl">Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <div className="flex-1 overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-4">
              {history.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                  No messages yet. Connect and start talking!
                </div>
              ) : (
                <MessageList
                  history={history}
                  events={events}
                  isListening={isListening}
                  greetingText={REALTIME_DEFAULTS.greeting}
                />
              )}
            </div>
            <div className="flex flex-col gap-3">
              {isCameraOpen && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <CameraCapture
                    disabled={!isConnected}
                    onCapture={(dataUrl) => {
                      if (!sessionRef.current) return;
                      sessionRef.current.addImage(dataUrl, {
                        triggerResponse: false,
                      });
                    }}
                    className=""
                  />
                </div>
              )}
              {
                <MessageInput
                  value={message}
                  placeholder="Type something you'd like the agent to say out loud. Sending text will also trigger a spoken reply."
                  disabled={!isConnected || isConnecting}
                  isSubmitting={isConnecting}
                  onChange={setMessage}
                  onSubmit={handleMessageSubmit}
                />
              }
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCameraOpen(!isCameraOpen)}
                  disabled={!isConnected}
                  className="gap-2"
                >
                  <Camera size={16} />
                  {isCameraOpen ? "Hide camera" : "Camera"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <ConnectionStatus
            connectionState={connectionState}
            isConnected={isConnected}
            isMuted={isMuted}
            isConnecting={isConnecting}
            error={error}
            authEndpoint={AUTH_ENDPOINT}
            onConnectToggle={handleConnectClick}
            onRestart={() => {
              disconnect();
              void connect();
            }}
            onToggleMute={() => toggleMute()}
          />

          <EventsLog events={events} />
        </div>
      </div>
    </div>
  );
}
