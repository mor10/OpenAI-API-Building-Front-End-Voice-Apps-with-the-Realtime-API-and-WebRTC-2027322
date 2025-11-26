import "./style.css";
import {
  connectButton,
  disconnectButton,
  log,
  muteButton,
  setButtonStates,
} from "./utils";

import { z } from "zod";
import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents-realtime";

const getWeather = tool({
  name: "getWeather",
  description: "Get the weather for a given city",
  parameters: z.object({
    city: z.string(),
  }),
  execute: async ({ city }) => {
    return `The weather in ${city} is sunny`;
  },
});

const weatherAgent = new RealtimeAgent({
  name: "Weather Agent",
  instructions: "You are a weather expert.",
  handoffDescription: "You can handoff to the weather agent if you need to.",
  tools: [getWeather],
});

const agent = new RealtimeAgent({
  name: "Greeter",
  instructions:
    'You are a greeter. Always greet the user with a "top of the morning"',
  handoffs: [weatherAgent],
});

weatherAgent.handoffs.push(agent);

const session = new RealtimeSession(agent);

session.on("transport_event", (event) => {
  // this logs the events coming directly from the Realtime API server
  log(event);
});

connectButton.addEventListener("click", async () => {
  try {
    const response = await fetch("http://localhost:3000/token");
    const data = await response.json();

    const apiKey = data.client_secret?.value || data.value;

    if (!apiKey) {
      // If the server returns an error, it might be in data.error
      console.error("Error fetching token:", data);
      alert(
        `Failed to get token: ${
          data.error?.message || "Unknown error"
        }. Check console for details.`
      );
      return;
    }

    await session.connect({
      apiKey,
    });
    setButtonStates("unmuted");
  } catch (error) {
    console.error("Error connecting:", error);
    alert("Failed to connect. Is the auth server running?");
  }
});

disconnectButton.addEventListener("click", () => {
  session.close();
  setButtonStates("disconnected");
});

muteButton.addEventListener("click", () => {
  const newMutedState = !session.muted;
  session.mute(newMutedState);
  setButtonStates(newMutedState ? "muted" : "unmuted");
});
