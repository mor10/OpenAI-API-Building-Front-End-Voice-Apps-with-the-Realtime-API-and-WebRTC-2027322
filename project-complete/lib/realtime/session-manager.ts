import { RealtimeSession } from "@openai/agents/realtime";

export async function fetchRealtimeToken(authUrl: string) {
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

export function resetRealtimeSession(session: RealtimeSession | null) {
  if (!session) return;
  try {
    session.updateHistory([]);
  } catch {
    // ignore failures when resetting history
  }
  session.close();
}
