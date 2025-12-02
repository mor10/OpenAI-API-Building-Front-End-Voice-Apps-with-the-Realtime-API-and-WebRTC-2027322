import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeItem,
  type TransportEvent,
} from "@openai/agents/realtime";
import {
  buildRealtimeConfig,
  type RealtimeAppConfig,
} from "@/config/realtime.config";
import {
  fetchRealtimeToken,
  resetRealtimeSession,
} from "@/lib/realtime/session-manager";
import {
  createRealtimeEventHandlers,
  type SessionEventHandler,
} from "@/lib/realtime/event-handlers";
import { defaultGuardrails } from "@/lib/realtime/guardrails";
import { useGuardrails } from "@/hooks/useGuardrails";
import { unitConversionTool } from "@/tools/unitConversionTool";
import { weatherAgent } from "@/agents/weatherAgent";

export type ConnectionState = "idle" | "connecting" | "connected";

export type UseRealtimeSessionOptions = Partial<
  Pick<
    RealtimeAppConfig,
    "instructions" | "voice" | "model" | "authUrl" | "eventLogSize"
  >
>;

export type UseRealtimeSessionResult = {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  sendText: (message: string) => void;
  interrupt: () => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isListening: boolean;
  error: string | null;
  history: RealtimeItem[];
  events: TransportEvent[];
  sessionRef: React.MutableRefObject<RealtimeSession | null>;
};

export function useRealtimeSession(
  options?: UseRealtimeSessionOptions
): UseRealtimeSessionResult {
  const config = useMemo(
    () =>
      buildRealtimeConfig({
        instructions: options?.instructions,
        voice: options?.voice,
        model: options?.model,
        authUrl: options?.authUrl,
        eventLogSize: options?.eventLogSize,
      }),
    [
      options?.instructions,
      options?.voice,
      options?.model,
      options?.authUrl,
      options?.eventLogSize,
    ]
  );

  const sessionRef = useRef<RealtimeSession | null>(null);
  const [history, setHistory] = useState<RealtimeItem[]>([]);
  const [events, setEvents] = useState<TransportEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const suppressedItemIdsRef = useRef<Set<string>>(new Set());
  const historyIndexRef = useRef<Map<string, number>>(new Map());

  const { guardrails, handleGuardrailTripped } = useGuardrails({
    sessionRef,
    setHistory,
    setError,
    setIsMuted,
    suppressedItemIdsRef,
    historyIndexRef,
  });

  useEffect(() => {
    /**
     * LESSON ITEM:
     * Create the main realtime agent with tools and handoffs using the RealtimeAgent class.
     * @link: https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimeagent/
     *
     */
    const agent = new RealtimeAgent({
      name: "Assistant",
      instructions: config.instructions,
      tools: [unitConversionTool],
      handoffs: [weatherAgent],
    });

    /**
     * LESSON ITEM:
     * Create the realtime session using the RealtimeSession class and the agent created above.
     * @link: https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimesession/
     */
    const session = new RealtimeSession(agent, {
      model: config.model,
      config: {
        audio: {
          output: {
            voice: config.voice,
          },
        },
      },
      outputGuardrails: defaultGuardrails,
    });

    /**
     * Set up event handlers
     * @lib/realtime/event-handlers.ts
     */
    const { handleHistoryUpdated, handleTransportEvent } =
      createRealtimeEventHandlers({
        config,
        setHistory,
        setEvents,
        setIsListening,
        suppressedItemIdsRef,
        historyIndexRef,
      });

    /**
     * Handle errors and manage connection state
     * @lib/realtime/event-handlers.ts
     */
    const handleError: SessionEventHandler["error"] = (event) => {
      const errorObj = event?.error;
      const message =
        (errorObj instanceof Error && errorObj.message) ||
        (typeof errorObj === "string" && errorObj) ||
        "Realtime session error";

      // Always log errors to console with full context
      console.error("Realtime session error:", {
        message,
        error: errorObj,
        event,
        timestamp: new Date().toISOString(),
      });

      // Only disconnect on fatal connection errors, not tool/MCP errors
      const isFatalError =
        message.includes("connection") ||
        message.includes("WebSocket") ||
        message.includes("network") ||
        message.includes("token") ||
        message.includes("auth");

      // Don't show tool execution errors or MCP errors in the error banner
      // and don't disconnect the session
      if (
        message.includes("tool") ||
        message.includes("function") ||
        message.includes("MCP") ||
        message.includes("execution")
      ) {
        // Tool/MCP errors are transient - don't disconnect or show error
        console.warn("Tool/MCP error (non-fatal):", message);
        return;
      }

      setError(message);

      // Only disconnect on fatal errors
      if (isFatalError) {
        console.error("Fatal error - disconnecting session:", message);
        setConnectionState("idle");
      }
    };

    session.on("history_updated", handleHistoryUpdated);
    session.on("transport_event", handleTransportEvent);
    session.on("error", handleError);

    session.on("guardrail_tripped", handleGuardrailTripped);

    sessionRef.current = session;

    // Handoffs are managed by the agent within the same session.

    return () => {
      session.off("history_updated", handleHistoryUpdated);
      session.off("transport_event", handleTransportEvent);
      session.off("error", handleError);
      session.off("guardrail_tripped", handleGuardrailTripped);
      session.close();
      sessionRef.current = null;
    };
  }, [
    config,
    guardrails,
    handleGuardrailTripped,
    historyIndexRef,
    setEvents,
    setError,
    setHistory,
    setIsListening,
    setIsMuted,
    suppressedItemIdsRef,
  ]);

  /**
   * Disconnect the realtime session and reset state
   */
  const disconnect = useCallback(() => {
    if (!sessionRef.current) return;

    resetRealtimeSession(sessionRef.current);
    setHistory([]);
    setEvents([]);
    setIsMuted(false);
    setIsListening(false);
    setError(null);
    setConnectionState("idle");
  }, []);

  /**
   * LESSON ITEM:
   * Connect to the realtime session using session.connect method.
   * Pass in apiKey with the ephemeral token fetched from the external auth-server.
   * @link: https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimesession/#connect
   */
  const connect = useCallback(async () => {
    if (!sessionRef.current) return;
    if (connectionState === "connecting") return;

    if (connectionState === "connected") {
      disconnect();
      return;
    }

    setError(null);
    setConnectionState("connecting");
    try {
      const apiKey = await fetchRealtimeToken(config.authUrl);
      await sessionRef.current.connect({
        apiKey,
      });
      setConnectionState("connected");
      setIsMuted(Boolean(sessionRef.current.muted));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to connect to session";
      setError(message);
      setConnectionState("idle");
    }
  }, [connectionState, config.authUrl, disconnect]);

  /** Toggle the microphone mute state
   */
  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const newMutedState = !(sessionRef.current.muted ?? false);
    sessionRef.current.mute(newMutedState);
    setIsMuted(newMutedState);
  }, []);

  /**
   * LESSON ITEM:
   * Send a text message to the realtime session using session.sendMessage method.
   * @link: https://openai.github.io/openai-agents-js/openai/agents-realtime/interfaces/realtimetransportlayer/#sendmessage
   */
  const sendText = useCallback((message: string) => {
    if (!sessionRef.current || !message.trim()) return;
    // Clear any previous alert when user continues the conversation
    setError(null);
    sessionRef.current.sendMessage({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    });
  }, []);

  /**
   * Interrupt the current response generation
   * @link: https://openai.github.io/openai-agents-js/openai/agents-realtime/classes/realtimesession/#interrupt
   */
  const interrupt = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.interrupt();
  }, []);

  return {
    connect,
    disconnect,
    toggleMute,
    sendText,
    interrupt,
    connectionState,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    isMuted,
    isListening,
    error,
    history,
    events,
    sessionRef,
  };
}
