"use client";

import { hostedMcpTool } from "@openai/agents";
import {
  RealtimeAgent,
  RealtimeSession,
  tool,
  type RealtimeContextData,
  type RealtimeItem,
  type RealtimeOutputGuardrail,
  type RealtimeSessionEventTypes,
  type TransportEvent,
} from "@openai/agents/realtime";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { App } from "@/components/App";
import { CameraCapture } from "@/components/CameraCapture";
import { handleRefundRequest } from "./server/backendAgent.action";
import { getToken } from "./server/token.action";

const params = z.object({
  request: z.string(),
});

const refundBackchannel = tool<typeof params, RealtimeContextData>({
  name: "Refund Expert",
  description: "Evaluate a refund",
  parameters: params,
  execute: async ({ request }, details) => {
    const history: RealtimeItem[] = details?.context?.history ?? [];
    return handleRefundRequest(request, history);
  },
});

const weatherTool = tool({
  name: "weather",
  description: "Get the weather in a given location",
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    return `The weather in ${location} is sunny.`;
  },
});

const secretTool = tool({
  name: "secret",
  description: "A secret tool to tell the special number",
  parameters: z.object({
    question: z
      .string()
      .describe(
        "The question to ask the secret tool; mainly about the special number."
      ),
  }),
  execute: async ({ question }) => {
    return `The answer to ${question} is 42.`;
  },
  needsApproval: true,
});

const weatherExpert = new RealtimeAgent({
  name: "Weather Expert",
  instructions:
    "You are a weather expert. You are able to answer questions about the weather.",
  tools: [weatherTool],
});

const agent = new RealtimeAgent({
  name: "Greeter",
  instructions: "You are a greeter",
  tools: [
    refundBackchannel,
    secretTool,
    hostedMcpTool({
      serverLabel: "deepwiki",
    }),
    weatherTool,
  ],
  handoffs: [weatherExpert],
});

const guardrails: RealtimeOutputGuardrail[] = [
  {
    name: "No mention of Dom",
    execute: async ({ agentOutput }) => {
      const domInOutput = agentOutput.includes("Dom");
      return {
        tripwireTriggered: domInOutput,
        outputInfo: {
          domInOutput,
        },
      };
    },
  },
];

export default function Home() {
  const session = useRef<RealtimeSession<unknown> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  type SessionEvents = RealtimeSessionEventTypes<unknown>;
  type GuardrailResult = SessionEvents["guardrail_tripped"][2];

  const [outputGuardrailResult, setOutputGuardrailResult] =
    useState<GuardrailResult | null>(null);
  const [events, setEvents] = useState<TransportEvent[]>([]);
  const [history, setHistory] = useState<RealtimeItem[]>([]);
  const [mcpTools, setMcpTools] = useState<string[]>([]);

  useEffect(() => {
    const currentSession = new RealtimeSession(agent, {
      model: "gpt-realtime",
      outputGuardrails: guardrails,
      outputGuardrailSettings: {
        debounceTextLength: 200,
      },
      config: {
        audio: {
          output: {
            voice: "cedar",
          },
        },
      },
    });

    const handleTransport = (event: TransportEvent) => {
      setEvents((prev) => [...prev, event]);
    };

    const handleMcpTools = (tools: SessionEvents["mcp_tools_changed"][0]) => {
      setMcpTools(tools.map((tool) => tool.name));
    };

    const handleGuardrail = (
      _context: SessionEvents["guardrail_tripped"][0],
      _agent: SessionEvents["guardrail_tripped"][1],
      guardrailError: SessionEvents["guardrail_tripped"][2]
    ) => {
      setOutputGuardrailResult(guardrailError);
    };

    const handleHistory = (items: RealtimeItem[]) => {
      setHistory(items);
    };

    const handleToolApproval = (
      _context: SessionEvents["tool_approval_requested"][0],
      _agent: SessionEvents["tool_approval_requested"][1],
      approvalRequest: SessionEvents["tool_approval_requested"][2]
    ) => {
      const approved = window.confirm(
        `Approve tool call to ${
          approvalRequest.approvalItem.name
        } with parameters:\n ${approvalRequest.approvalItem.arguments ?? "{}"}?`
      );
      if (approved) {
        currentSession.approve(approvalRequest.approvalItem);
      } else {
        currentSession.reject(approvalRequest.approvalItem);
      }
    };

    currentSession.on("transport_event", handleTransport);
    currentSession.on("mcp_tools_changed", handleMcpTools);
    currentSession.on("guardrail_tripped", handleGuardrail);
    currentSession.on("history_updated", handleHistory);
    currentSession.on("tool_approval_requested", handleToolApproval);

    session.current = currentSession;

    return () => {
      currentSession.off("transport_event", handleTransport);
      currentSession.off("mcp_tools_changed", handleMcpTools);
      currentSession.off("guardrail_tripped", handleGuardrail);
      currentSession.off("history_updated", handleHistory);
      currentSession.off("tool_approval_requested", handleToolApproval);
      currentSession.close();
      session.current = null;
    };
  }, []);

  async function connect() {
    if (!session.current) return;
    if (isConnected) {
      await session.current.close();
      setIsConnected(false);
      setIsMuted(false);
      return;
    }

    const token = await getToken();
    try {
      await session.current.connect({
        apiKey: token,
      });
      setIsConnected(true);
      setIsMuted(Boolean(session.current.muted));
    } catch (error) {
      console.error("Error connecting to session", error);
    }
  }

  async function toggleMute() {
    if (!session.current) return;
    const nextMuted = !(session.current.muted ?? false);
    await session.current.mute(nextMuted);
    setIsMuted(nextMuted);
  }

  return (
    <div className="relative">
      <App
        isConnected={isConnected}
        isMuted={isMuted}
        toggleMute={toggleMute}
        connect={connect}
        history={history}
        outputGuardrailResult={outputGuardrailResult}
        events={events}
        mcpTools={mcpTools}
      />
      <div className="fixed bottom-4 right-4 z-50">
        <CameraCapture
          disabled={!isConnected}
          onCapture={(dataUrl) => {
            if (!session.current) return;
            session.current.addImage(dataUrl, { triggerResponse: false });
          }}
        />
      </div>
    </div>
  );
}
