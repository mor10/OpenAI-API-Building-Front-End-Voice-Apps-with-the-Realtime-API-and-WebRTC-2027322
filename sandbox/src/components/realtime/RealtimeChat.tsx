"use client";

/**
 * LESSON TASK:
 *
 * Import useEffect and useRef from React
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionPanel } from "@/components/realtime/ConnectionPanel";

/**
 * LESSON TASK:
 *
 * Import REALTIME_DEFAULTS from the useRealtimeAgent hook
 */
import { useRealtimeAgent } from "@/lib/useRealtimeAgent";

export function RealtimeChat() {
  /**
   * LESSON TASK:
   *
   * Create a ref called hasGreetedRef to track if the greeting has been sent
   */

  /**
   * LESSON TASK:
   *
   * Import sendText from the useRealtimeAgent hook
   */
  const {
    connect,
    disconnect,
    toggleMute,
    interrupt,
    connectionState,
    isConnected,
    isConnecting,
    isMuted,
    error,
    config,
  } = useRealtimeAgent();

  /**
   * LESSON TASK:
   *
   * Use sendText from the useRealtimeAgent hook to send REALTIME_DEFAULTS.greeting to the API
   * when a connection is established. This will trigger a response in the form of a greeting.
   *
   * - Use useEffect to monitor isConnected state
   * - If isConnected is true and hasGreetedRef is false, send greeting message using sendText
   * - Set hasGreetedRef to true after sending greeting
   * - Reset hasGreetedRef to false when disconnected
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
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                No text chat yet - just audio.
              </div>
            </div>
            <div className="flex flex-col gap-3">
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
        </div>
      </div>
    </div>
  );
}
