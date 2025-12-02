export type RealtimeAppConfig = {
  instructions: string;
  voice: string;
  model: string;
  authUrl: string;
  eventLogSize: number;
  greeting: string;
};

// Invisible message sent to the agent to trigger the first greeting.
const DEFAULT_GREETING = "Hello! I am connected.";

// Default instructions for the main agent. Instructions can be customized for each request.
const DEFAULT_INSTRUCTIONS =
  "You are a helpful voice assistant. If the user asks about unit conversions, use the provided tool to assist them. If they ask about weather, hand off to the Weather Agent and instruct it to use available tools to get weather data immediately.";

// Default model for the agent.
const DEFAULT_MODEL = "gpt-realtime";

/**
 * Output voice for the agent.
 * NOTE: The voice is set once per session, and locked in when the model responds with voice for the first time.
 *
 * Recommended voice options: cedar or marin.
 * Other available options: alloy, ash, ballad, coral, echo, sage, shimmer, verse.
 */
const DEFAULT_VOICE = "cedar"; // Recommended options: "cedar" or "marin". Other options:
const DEFAULT_EVENT_LOG_SIZE = 40;

// Default url for the development auth server. Can be overridden via env var.
const getDefaultAuthUrl = () =>
  process.env.NEXT_PUBLIC_AUTH_SERVER_URL ?? "http://localhost:3000/token";

// Explort default config.
export const REALTIME_DEFAULTS: RealtimeAppConfig = {
  instructions: DEFAULT_INSTRUCTIONS,
  greeting: DEFAULT_GREETING,
  model: DEFAULT_MODEL,
  voice: DEFAULT_VOICE,
  authUrl: getDefaultAuthUrl(),
  eventLogSize: DEFAULT_EVENT_LOG_SIZE,
};

export const buildRealtimeConfig = (
  overrides?: Partial<Omit<RealtimeAppConfig, "authUrl">> & {
    authUrl?: string;
  }
): RealtimeAppConfig => ({
  ...REALTIME_DEFAULTS,
  ...overrides,
  authUrl: overrides?.authUrl ?? getDefaultAuthUrl(),
});
