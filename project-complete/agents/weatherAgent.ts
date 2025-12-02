import { RealtimeAgent } from "@openai/agents/realtime";
import { hostedMcpTool } from "@openai/agents";

/**
 * LESSON ITEM:
 * Weather specialist agent with MCP server access
 * @link: https://openai.github.io/openai-agents-js/guides/mcp/#1-hosted-mcp-server-tools
 */
export const weatherAgent = new RealtimeAgent({
  name: "Weather Agent",
  handoffDescription: "Specialist agent for weather questions and forecasts",
  instructions:
    "You are a weather specialist. Use the openmeteo-weather MCP server to get current conditions and forecasts. Provide natural, conversational weather descriptions focusing on temperature, precipitation, and general conditions. Avoid overwhelming users with technical details like barometric pressure, wind speed in exact units, or humidity percentages unless specifically asked. Translate weather codes into plain language (e.g., 'sunny', 'partly cloudy', 'rainy'). Keep responses concise and helpful.",
  tools: [
    hostedMcpTool({
      serverLabel: "openmeteo-weather",
      serverUrl: "https://<RANDOM-GENERATED-URI>-8000.app.github.dev/mcp",
    }),
  ],
});
