"use client";

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * React hooks and OpenAI Agents SDK components and types.
 *
 * @link https://openai.github.io/openai-agents-js/guides/voice-agents/
 */

/**
 * LESSON TASK:
 *
 * Import useEffect, useRef, useState, and RefObject from React
 */
import { useCallback, useRef, useState } from "react";

/**
 * LESSON TASK:
 *
 * Import RealtimeAgent and RealtimeSession from @openai/agents/realtime
 */

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

/**
 * LESSON TASK:
 *
 * Add sessionRef and config to UseRealtimeAgentResult type
 */
export type UseRealtimeAgentResult = {
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  interrupt: () => void;
  connectionState: ConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  error: string | null;
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

// Default instructions for the main agent. Instructions can be customized for each request.
const DEFAULT_INSTRUCTIONS = "You are a helpful voice assistant.";

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
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("idle");
  const [isMuted, setIsMuted] = useState(false);

  /**
   * --------------------------------------------------------------------------
   * MAIN AGENT AND SESSION SETUP
   * --------------------------------------------------------------------------
   */

  useEffect(() => {
    /**
     * LESSON TASK:
     *
     * Initialize RealtimeAgent and RealtimeSession inside useEffect
     * - Create new RealtimeAgent with name "Assistant" and config.instructions
     * - Create new RealtimeSession with the agent, config.model, and audio output voice
     */

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

    // Store session reference and attach event listeners
    sessionRef.current = session;
    session.on("error", handleError);

    // Cleanup function: detach listeners, close session, clear refs
    return () => {
      session.off("error", handleError);
      session.close();
      sessionRef.current = null;
    };
  }, [config]);

  /**
   * --------------------------------------------------------------------------
   * CONTROL FUNCTIONS
   * --------------------------------------------------------------------------
   * Callbacks for user interactions with the agent.
   */

  /**
   * Disconnects the session and resets all state to initial values.
   */
  const disconnect = useCallback(() => {
    if (!sessionRef.current) return;
    resetRealtimeSession(sessionRef.current);
    setIsMuted(false);
    setError(null);
    setConnectionState("idle");
  }, []);

  /**
   * Initiates connection to the realtime API.
   * Fetches ephemeral token and establishes WebSocket connection.
   * If already connected, disconnects instead (toggle behavior).
   */

  /**
   * LESSON TASK:
   *
   * Uncomment and review the connect function below.
   *
   * The session connection is created on this line:
   * `await sessionRef.current.connect({ apiKey });`
   */
  // const connect = useCallback(async () => {
  //   if (!sessionRef.current) return;
  //   if (connectionState === "connecting") return;

  //   if (connectionState === "connected") {
  //     disconnect();
  //     return;
  //   }

  //   setError(null);
  //   setConnectionState("connecting");
  //   try {
  //     const apiKey = await fetchRealtimeToken(config.authUrl);
  //     await sessionRef.current.connect({ apiKey });
  //     setConnectionState("connected");
  //     setIsMuted(Boolean(sessionRef.current.muted));
  //   } catch (err) {
  //     const message =
  //       err instanceof Error ? err.message : "Unable to connect to session";
  //     setError(message);
  //     setConnectionState("idle");
  //   }
  // }, [config.authUrl, connectionState, disconnect]);

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

  /**
   * LESSON TASK:
   *
   * Add connect to the returned object
   */
  return {
    disconnect,
    toggleMute,
    interrupt,
    connectionState,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    isMuted,
    error,
    config,
  };
}
