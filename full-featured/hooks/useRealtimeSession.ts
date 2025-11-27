import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeItem,
  type RealtimeSessionEventTypes,
  type TransportEvent,
} from "@openai/agents/realtime";

const DEFAULT_INSTRUCTIONS =
  "You are a concise multimodal assistant. Keep spoken responses under 25 words and be proactive about asking clarifying questions.";
const DEFAULT_MODEL = "gpt-realtime";
const DEFAULT_VOICE = "marin";
const DEFAULT_EVENT_LOG_SIZE = 30;

export type ConnectionState = "idle" | "connecting" | "connected";

export type UseRealtimeSessionOptions = {
  instructions?: string;
  voice?: string;
  model?: string;
  authUrl?: string;
  eventLogSize?: number;
};

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
  error: string | null;
  history: RealtimeItem[];
  events: TransportEvent[];
};

type SessionEventHandler = {
  [K in keyof RealtimeSessionEventTypes]: (
    ...args: RealtimeSessionEventTypes[K]
  ) => void;
};

const getDefaultAuthUrl = () =>
  process.env.NEXT_PUBLIC_AUTH_SERVER_URL ?? "http://localhost:3000/token";

export function useRealtimeSession(
  options?: UseRealtimeSessionOptions
): UseRealtimeSessionResult {
  const config = useMemo(
    () => ({
      instructions: options?.instructions ?? DEFAULT_INSTRUCTIONS,
      voice: options?.voice ?? DEFAULT_VOICE,
      model: options?.model ?? DEFAULT_MODEL,
      authUrl: options?.authUrl ?? getDefaultAuthUrl(),
      eventLogSize: options?.eventLogSize ?? DEFAULT_EVENT_LOG_SIZE,
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

  useEffect(() => {
    const agent = new RealtimeAgent({
      name: "Baseline Voice Assistant",
      instructions: config.instructions,
    });

    const session = new RealtimeSession(agent, {
      model: config.model,
      config: {
        audio: {
          input: {
            transcription: {
              model: "gpt-4o-mini-transcribe",
            },
          },
          output: {
            voice: config.voice,
          },
        },
      },
    });

    const handleHistoryUpdated: SessionEventHandler["history_updated"] = (
      updatedHistory
    ) => {
      setHistory(updatedHistory);
    };

    const handleTransportEvent: SessionEventHandler["transport_event"] = (
      event
    ) => {
      setEvents((prev) => {
        const next = [...prev, event];
        if (next.length > config.eventLogSize) {
          return next.slice(next.length - config.eventLogSize);
        }
        return next;
      });
    };

    const handleError: SessionEventHandler["error"] = (event) => {
      const message =
        (event?.error instanceof Error && event.error.message) ||
        (typeof event?.error === "string" && event.error) ||
        "Realtime session error";

      setError(message);
      setConnectionState("idle");
    };

    const handleAudioInterrupted: SessionEventHandler["audio_interrupted"] =
      () => {
        // When the agent is interrupted we surface that audio is paused.
        setIsMuted(true);
      };

    const handleAudioStart: SessionEventHandler["audio_start"] = () => {
      setIsMuted(false);
    };

    session.on("history_updated", handleHistoryUpdated);
    session.on("transport_event", handleTransportEvent);
    session.on("error", handleError);
    session.on("audio_interrupted", handleAudioInterrupted);
    session.on("audio_start", handleAudioStart);

    sessionRef.current = session;

    return () => {
      session.off("history_updated", handleHistoryUpdated);
      session.off("transport_event", handleTransportEvent);
      session.off("error", handleError);
      session.off("audio_interrupted", handleAudioInterrupted);
      session.off("audio_start", handleAudioStart);
      session.close();
      sessionRef.current = null;
    };
  }, [config]);

  const fetchToken = useCallback(async () => {
    const response = await fetch(config.authUrl);
    if (!response.ok) {
      throw new Error(
        `Auth server error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    const apiKey = data?.client_secret?.value ?? data?.value;
    if (!apiKey) {
      throw new Error("Auth server response did not include a token");
    }
    return apiKey as string;
  }, [config.authUrl]);

  const disconnect = useCallback(() => {
    if (!sessionRef.current) return;

    try {
      sessionRef.current.updateHistory([]);
    } catch (err) {
      console.warn("Failed to reset realtime session history", err);
    }

    sessionRef.current.close();
    setHistory([]);
    setEvents([]);
    setIsMuted(false);
    setConnectionState("idle");
  }, []);

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
      const apiKey = await fetchToken();
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
  }, [connectionState, disconnect, fetchToken]);

  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const newMutedState = !(sessionRef.current.muted ?? false);
    sessionRef.current.mute(newMutedState);
    setIsMuted(newMutedState);
  }, []);

  const sendText = useCallback((message: string) => {
    if (!sessionRef.current || !message.trim()) return;
    sessionRef.current.sendMessage({
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: message,
        },
      ],
    });
  }, []);

  const interrupt = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.interrupt();
    setIsMuted(true);
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
    error,
    history,
    events,
  };
}
