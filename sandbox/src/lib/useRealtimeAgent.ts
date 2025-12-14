"use client";

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * React hooks and OpenAI Agents SDK components and types.
 *
 * @link https://openai.github.io/openai-agents-js/guides/voice-agents/
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  RealtimeAgent,
  RealtimeSession,
  type RealtimeItem,
  type TransportEvent,
  type RealtimeOutputGuardrail,
} from "@openai/agents/realtime";

/**
 * LESSON TASK:
 * Import hostedMcpTool from OpenAI Agents SDK
 */
import { unitConversionTool } from "@/tools/unitConversionTool";

/**
 * ============================================================================
 * TYPE DEFINITIONS
 * ============================================================================
 */

/**
 * Configuration object for the realtime agent session.
 * Controls behaviour, voice settings, auth, and guardrails.
 */
export type RealtimeConfig = {
  instructions: string;
  voice: string;
  model: string;
  authUrl: string;
  eventLogSize: number;
  greeting: string;
  bannedPhrases: string[];
};

/**
 * Connection states for the session.
 */
export type ConnectionState = "idle" | "connecting" | "connected";

/**
 * Return value from useRealtimeAgent hook.
 * Provides controls, state, and data for managing the realtime session.
 */
export type UseRealtimeAgentResult = {
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
  sessionRef: RefObject<RealtimeSession | null>;
  config: RealtimeConfig;
};

/**
 * ============================================================================
 * CONFIGURATION DEFAULTS
 * ============================================================================
 */

// Default url for the development auth server.
// Override with env var `NEXT_PUBLIC_AUTH_SERVER_URL`.
const DEFAULT_AUTH_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVER_URL ?? "http://localhost:3000/token";

/**
 * LESSON TASK:
 * Update the DEFAULT_INSTRUCTIONS to include a note about handing off weather-related queries to the Weather Agent.
 */
// Default instructions for the main agent. Instructions can be customized for each request.
const DEFAULT_INSTRUCTIONS =
  "You are a helpful voice assistant. If the user asks about unit conversions, use the provided tool to assist them.";

// Invisible message sent to the agent to trigger the first greeting.
const DEFAULT_GREETING = "Hello! I am connected.";

// Default model for the agent. Can be specified for each agent.
const DEFAULT_MODEL = "gpt-realtime";

// Output voice for the agent.
// Recommended voice options: cedar or marin.
// Other available options: alloy, ash, ballad, coral, echo, sage, shimmer, verse.
//
// NOTE: Voice is set once per session and cannot be changed during a session.
//       Locks in when the model responds with voice for the first time.
const DEFAULT_VOICE = "cedar";

// Default size of the event log to retain in state.
const DEFAULT_EVENT_LOG_SIZE = 40;

// Array of banned phrases to block in agent output through guardrails.
const DEFAULT_BANNED_PHRASES = [
  "chocolate-covered peanut butter",
  "moist",
  "Ni!",
];

/**
 * Exported default configuration object.
 * Can be overridden via hook parameters.
 */
export const REALTIME_DEFAULTS: RealtimeConfig = {
  instructions: DEFAULT_INSTRUCTIONS,
  greeting: DEFAULT_GREETING,
  model: DEFAULT_MODEL,
  voice: DEFAULT_VOICE,
  authUrl: DEFAULT_AUTH_URL,
  eventLogSize: DEFAULT_EVENT_LOG_SIZE,
  bannedPhrases: [...DEFAULT_BANNED_PHRASES],
};

/**
 * ============================================================================
 * SPECIALIST AGENTS
 * ============================================================================
 * Pre-configured agents for handling specific domains via handoff pattern.
 */

/**
 * LESSON TASK:
 * Create a const weatherAgent with a new RealtimeAgent.
 * weatherAgent uses hostedMcpTool to connect to the openmeteo-weather MCP server.
 *
 * NOTE: Set serverUrl to the generated URL of the MCP server deployed on GitHub Codespaces.
 *       The format is `https://[three]-[random]-[words]-[hashkey]-8000.app.github.dev/mcp`
 */

/**
 * ============================================================================
 * GUARDRAIL FACTORY
 * ============================================================================
 * Creates a guardrail that detects banned phrases in agent output.
 * When triggered, the response is interrupted and removed from history.
 *
 * @param bannedPhrases - Array of phrases to block (case-insensitive)
 * @returns Array of guardrail configurations
 * @link https://openai.github.io/openai-agents-js/guides/voice-agents/build/#guardrails
 */
const createDefaultGuardrails = (
  bannedPhrases: string[]
): RealtimeOutputGuardrail[] => {
  const normalized = bannedPhrases.map((phrase) => ({
    original: phrase,
    normalized: phrase.toLowerCase(),
  }));

  return [
    {
      name: "Banned phrase guardrail",
      async execute({ agentOutput }) {
        const lowerOutput = agentOutput.toLowerCase();
        const match = normalized.find((phrase) =>
          lowerOutput.includes(phrase.normalized)
        );
        return {
          tripwireTriggered: Boolean(match),
          outputInfo: {
            bannedPhraseDetected: match?.original ?? null,
          },
        };
      },
    },
  ];
};

/**
 * ============================================================================
 * AUTHENTICATION HELPER
 * ============================================================================
 * Fetches ephemeral tokens from the auth server for secure API access.
 *
 * @param authUrl - URL of the token endpoint
 * @returns API key string for establishing Realtime connection
 * @throws Error if auth server returns non-OK response or missing token
 * @link https://platform.openai.com/docs/guides/realtime-webrtc#connecting-using-an-ephemeral-token
 */
async function fetchRealtimeToken(authUrl: string) {
  const response = await fetch(authUrl);
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
}

/**
 * ============================================================================
 * SESSION MANAGEMENT HELPER
 * ============================================================================
 * Safely resets a realtime session by clearing history and closing connection.
 * Handles partially-open sessions gracefully.
 *
 * @param session - The session to reset, or null
 */
function resetRealtimeSession(session: RealtimeSession | null) {
  if (!session) return;
  try {
    session.updateHistory([]);
  } catch {
    // ignore failures from partially open sessions
  }
  session.close();
}

/**
 * ============================================================================
 * MAIN HOOK: useRealtimeAgent
 * ============================================================================
 * Primary React hook for managing a realtime voice agent session.
 *
 * This hook:
 * - Initializes RealtimeAgent and RealtimeSession with tools, handoffs, and guardrails
 * - Manages session state, history, events, and UI state
 * - Provides control functions for connecting, disconnecting, muting, sending text, and interrupting
 * - Handles session events and errors with state updates
 *
 * @returns Hook result with controls, state, and session data
 */
export function useRealtimeAgent(): UseRealtimeAgentResult {
  // Get default configuration values.
  const config = REALTIME_DEFAULTS;

  /**
   * --------------------------------------------------------------------------
   * STATE MANAGEMENT
   * --------------------------------------------------------------------------
   * Refs and state hooks for tracking session, history, events, and UI state.
   */
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

  /**
   * --------------------------------------------------------------------------
   * MAIN AGENT AND SESSION SETUP
   * --------------------------------------------------------------------------
   */

  /**
   * LESSON TASK:
   * Handoff to weatherAgent for weather-related queries.
   */
  useEffect(() => {
    const agent = new RealtimeAgent({
      name: "Assistant",
      instructions: config.instructions,
      tools: [unitConversionTool],
    });

    const session = new RealtimeSession(agent, {
      model: config.model,
      config: {
        audio: {
          output: { voice: config.voice },
        },
      },
      outputGuardrails: createDefaultGuardrails(config.bannedPhrases),
    });

    const suppressedItems = suppressedItemIdsRef.current;

    /**
     * Event handler: history_updated
     * Fires on every history change (user messages, agent responses, function calls).
     * Filters out items suppressed by guardrails and updates component state.
     * Maintains an index map for efficient item lookups by ID.
     */
    const handleHistoryUpdated = (updatedHistory: RealtimeItem[]) => {
      const filtered = updatedHistory.filter((item) => {
        const id = (item as { itemId?: string }).itemId;
        return !id || !suppressedItems.has(id);
      });
      setHistory(filtered);
      const idx = new Map<string, number>();
      filtered.forEach((item, index) => {
        const id = (item as { itemId?: string }).itemId;
        if (id) idx.set(id, index);
      });
      historyIndexRef.current = idx;
    };

    /**
     * Event handler: transport_event
     * Processes Realtime server events.
     * @link https://platform.openai.com/docs/api-reference/realtime-server-events
     *
     * - Updates the event log
     * - Updates the text transcript (chat history)
     * - Updates speech detection state
     * - Maintains conversation item lifecycle (created/updated/completed/deleted)
     */
    const handleTransportEvent = (event: TransportEvent) => {
      if (
        event.type !== "response.output_audio_transcript.delta" &&
        event.type !== "response.input_audio_transcription.delta"
      ) {
        console.log("Realtime Event:", event);
      }

      setEvents((prev) => {
        const next = [...prev, event];
        if (next.length > config.eventLogSize) {
          return next.slice(next.length - config.eventLogSize);
        }
        return next;
      });

      if (event.type === "input_audio_buffer.speech_started") {
        setIsListening(true);
      }
      if (event.type === "input_audio_buffer.speech_stopped") {
        setIsListening(false);
      }

      if (event.type === "conversation.item.created" && event.item) {
        const item = event.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (id && suppressedItems.has(id)) return;
        setHistory((prev) => [...prev, item]);
      }

      if (
        (event.type === "conversation.item.updated" ||
          event.type === "conversation.item.completed") &&
        event.item
      ) {
        const item = event.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (id && suppressedItems.has(id)) return;
        setHistory((prev) => {
          const idx = prev.findIndex(
            (i) => (i as { itemId?: string }).itemId === id
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = item;
            return next;
          }
          return [...prev, item];
        });
      }

      if (event.type === "conversation.item.deleted" && event.item) {
        const item = event.item as RealtimeItem;
        const id = (item as { itemId?: string }).itemId;
        if (!id) return;
        setHistory((prev) =>
          prev.filter((i) => (i as { itemId?: string }).itemId !== id)
        );
      }
    };

    /**
     * Event handler: error
     * Handles session errors with severity detection.
     * Fatal errors (connection/auth) trigger disconnection.
     * Tool/MCP errors are logged but don't terminate the session.
     */
    const handleError = (event: { error?: unknown }) => {
      const errorObj = event?.error;
      const message =
        (errorObj instanceof Error && errorObj.message) ||
        (typeof errorObj === "string" && errorObj) ||
        "Realtime session error";

      console.error("Realtime session error", { message, error: errorObj });

      const isFatal =
        message.includes("connection") ||
        message.includes("WebSocket") ||
        message.includes("network") ||
        message.includes("token") ||
        message.includes("auth");

      if (
        message.includes("tool") ||
        message.includes("function") ||
        message.includes("MCP") ||
        message.includes("execution")
      ) {
        console.warn("Tool/MCP error (non-fatal):", message);
        return;
      }

      setError(message);
      if (isFatal) {
        setConnectionState("idle");
      }
    };

    /**
     * Event handler: guardrail_tripped
     * Responds to guardrail violations by:
     * - Interrupting current response
     * - Muting the agent
     * - Removing offending item from history
     * - Displaying error to user
     */
    const handleGuardrailTripped = (...args: unknown[]) => {
      try {
        session.interrupt();
        setIsMuted(true);
      } catch {
        // ignore
      }

      try {
        const details = args[3] as { itemId?: string } | undefined;
        const offendingId = details?.itemId;
        if (offendingId) {
          suppressedItems.add(offendingId);
          setHistory((prev) =>
            prev.filter((item) => {
              const id = (item as { itemId?: string }).itemId;
              return id !== offendingId;
            })
          );

          const cleanedHistory = (session.history ?? []).filter((item) => {
            const id = (item as { itemId?: string }).itemId;
            return id !== offendingId;
          });
          const idxMap = new Map<string, number>();
          cleanedHistory.forEach((item, index) => {
            const id = (item as { itemId?: string }).itemId;
            if (id) idxMap.set(id, index);
          });
          historyIndexRef.current = idxMap;
          session.updateHistory(cleanedHistory as RealtimeItem[]);
        }
      } catch (err) {
        console.warn("Failed to remove offending item after guardrail", err);
      }

      setError("Response blocked by guardrails.");
    };

    // Store session reference and attach event listeners
    sessionRef.current = session;

    session.on("history_updated", handleHistoryUpdated);
    session.on("transport_event", handleTransportEvent);
    session.on("error", handleError);
    session.on("guardrail_tripped", handleGuardrailTripped);

    // Cleanup function: detach listeners, close session, clear refs
    return () => {
      session.off("history_updated", handleHistoryUpdated);
      session.off("transport_event", handleTransportEvent);
      session.off("error", handleError);
      session.off("guardrail_tripped", handleGuardrailTripped);
      session.close();
      sessionRef.current = null;
      suppressedItems.clear();
      historyIndexRef.current.clear();
    };
  }, [config]);

  /**
   * --------------------------------------------------------------------------
   * CONTROL FUNCTIONS
   * --------------------------------------------------------------------------
   * Memoized callbacks for user interactions with the agent.
   */

  /**
   * Disconnects the session and resets all state to initial values.
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
   * Initiates connection to the realtime API.
   * Fetches ephemeral token and establishes WebSocket connection.
   * If already connected, disconnects instead (toggle behavior).
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
      await sessionRef.current.connect({ apiKey });
      setConnectionState("connected");
      setIsMuted(Boolean(sessionRef.current.muted));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to connect to session";
      setError(message);
      setConnectionState("idle");
    }
  }, [config.authUrl, connectionState, disconnect]);

  /**
   * Toggles audio input mute state.
   * When muted, the agent won't listen to microphone input.
   */
  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;
    const newMuted = !(sessionRef.current.muted ?? false);
    sessionRef.current.mute(newMuted);
    setIsMuted(newMuted);
  }, []);

  /**
   * Sends a text message to the agent, which will respond with spoken audio.
   * Primary method for text-based interaction.
   */
  const sendText = useCallback((message: string) => {
    if (!sessionRef.current || !message.trim()) return;
    setError(null);
    sessionRef.current.sendMessage({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: message.trim() }],
    });
  }, []);

  /**
   * Interrupts the agent's current response.
   * Useful for stopping long responses or recovering from errors.
   */
  const interrupt = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current.interrupt();
  }, []);

  /**
   * --------------------------------------------------------------------------
   * RETURN VALUE
   * --------------------------------------------------------------------------
   * Exposes all controls, state, and session data to consuming components.
   */
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
    config,
  };
}
