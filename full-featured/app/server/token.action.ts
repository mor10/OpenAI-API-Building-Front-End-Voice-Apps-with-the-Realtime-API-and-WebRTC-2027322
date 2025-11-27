"use server";

export async function getToken() {

  const response = await fetch("http://localhost:3000/token", {
    
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errJson = await response.json();
      detail = JSON.stringify(errJson);
    } catch {
      detail = await response.text();
    }
    throw new Error(
      `Failed to create ephemeral client secret: ${response.status} ${
        response.statusText
      }${detail ? ` - ${detail}` : ""}`
    );
  }

  const clientSecret: {
    value: string;
    expires_at: number;
    session: Record<string, unknown>;
  } = await response.json();

  return clientSecret.value;
}
