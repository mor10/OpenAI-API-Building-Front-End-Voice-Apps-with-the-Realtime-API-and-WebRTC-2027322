export const mcp_servers = [
  {
    type: "mcp",
    server_label: "weather",
    // server_url: "http://127.0.0.1:8000/mcp",
    server_url: "https://orange-bassoon-wr574gx9j6cv5q9-8000.app.github.dev/mcp",
    require_approval: "never",
  },
];

class McpEventManager {
  constructor(chatUI = null, statusUpdater = null) {
    this.chatUI = chatUI;
    this.statusUpdater = statusUpdater;
    this.mcpCalls = new Map();
    this.mcpListTools = new Map();
  }

  setChatUI(chatUI) {
    this.chatUI = chatUI;
  }

  setStatusUpdater(statusUpdater) {
    this.statusUpdater = statusUpdater;
  }

  reset() {
    this.mcpCalls.clear();
    this.mcpListTools.clear();
  }

  handleMcpOutputItemAdded(realtimeEvent) {
    const { item, response_id, output_index } = realtimeEvent;
    if (!item) {
      return;
    }

    if (item.type === "mcp_call") {
      const callState = this.ensureMcpCall(item.id);
      callState.name = item.name ?? callState.name;
      callState.serverLabel = item.server_label ?? callState.serverLabel;
      callState.responseId = response_id ?? callState.responseId;
      callState.outputIndex =
        typeof output_index === "number"
          ? output_index
          : callState.outputIndex;
      callState.status = item.status ?? callState.status;

      if (!callState.announced) {
        this.notifyStatus(`Preparing ${this.buildMcpCallLabel(callState)}`);
        callState.announced = true;
      }

      console.log("MCP tool call added:", {
        itemId: callState.id,
        name: callState.name,
        server: callState.serverLabel,
        responseId: callState.responseId,
        outputIndex: callState.outputIndex,
      });
    } else if (item.type === "mcp_list_tools") {
      const listState = this.ensureMcpListItem(item.id);
      listState.serverLabel = item.server_label ?? listState.serverLabel;
      listState.status = item.status ?? listState.status;
      listState.responseId = response_id ?? listState.responseId;

      console.log("MCP list tools item added:", {
        itemId: listState.id,
        server: listState.serverLabel,
      });
    }
  }

  handleMcpCallArgumentsDelta(realtimeEvent) {
    const callState = this.ensureMcpCall(realtimeEvent.item_id);
    callState.responseId = realtimeEvent.response_id ?? callState.responseId;
    callState.outputIndex =
      typeof realtimeEvent.output_index === "number"
        ? realtimeEvent.output_index
        : callState.outputIndex;
    if (typeof realtimeEvent.delta === "string") {
      callState.argumentsBuffer =
        (callState.argumentsBuffer ?? "") + realtimeEvent.delta;
    }
    if (realtimeEvent.obfuscation) {
      callState.obfuscated = true;
    }
  }

  handleMcpCallArgumentsDone(realtimeEvent) {
    const callState = this.ensureMcpCall(realtimeEvent.item_id);
    callState.responseId = realtimeEvent.response_id ?? callState.responseId;
    callState.outputIndex =
      typeof realtimeEvent.output_index === "number"
        ? realtimeEvent.output_index
        : callState.outputIndex;
    callState.arguments = realtimeEvent.arguments;
    callState.argumentsJson = this.tryParseJson(realtimeEvent.arguments);
    callState.argumentsBuffer = "";

    const label = this.buildMcpCallLabel(callState);

    console.log("MCP call arguments finalized:", {
      itemId: callState.id,
      label,
      arguments: callState.argumentsJson ?? realtimeEvent.arguments,
      obfuscated: callState.obfuscated ?? false,
    });

    if (!callState.argumentsAnnounced) {
      const formatted = callState.argumentsJson
        ? JSON.stringify(callState.argumentsJson, null, 2)
        : realtimeEvent.arguments?.trim();
      if (formatted) {
        this.postAiMessage(`[MCP] ${label} arguments:\n${formatted}`);
        callState.argumentsAnnounced = true;
      }
    }
  }

  handleMcpCallStatusUpdate(realtimeEvent, status) {
    const callState = this.ensureMcpCall(realtimeEvent.item_id);
    callState.status = status;
    const label = this.buildMcpCallLabel(callState);

    if (status === "in_progress") {
      this.notifyStatus(`Running ${label}`);
    } else if (status === "completed") {
      this.notifyStatus(`${label} completed`);
    } else if (status === "failed") {
      this.notifyStatus(`${label} failed`);
      if (!callState.failureAnnounced) {
        this.postAiMessage(
          `[MCP] ${label} failed. Check console for details.`
        );
        callState.failureAnnounced = true;
      }
    }

    console.log("MCP call status update:", {
      itemId: callState.id,
      status,
      responseId: callState.responseId ?? null,
      outputIndex: callState.outputIndex ?? null,
    });
  }

  handleMcpListToolsStatus(realtimeEvent, status) {
    const listState = this.ensureMcpListItem(realtimeEvent.item_id);
    listState.status = status;
    const suffix = listState.serverLabel ? ` (${listState.serverLabel})` : "";

    if (status === "completed") {
      this.notifyStatus(`MCP tools ready${suffix}`);
    } else if (status === "failed" && !listState.failureAnnounced) {
      this.postAiMessage(`[MCP] Tool discovery${suffix} failed.`);
      listState.failureAnnounced = true;
    }

    console.log("MCP tool list status update:", {
      itemId: listState.id,
      status,
      server: listState.serverLabel,
    });
  }

  handleMcpCallItem(item) {
    const callState = this.ensureMcpCall(item.id);
    callState.name = item.name ?? callState.name;
    callState.serverLabel = item.server_label ?? callState.serverLabel;
    callState.status = item.status ?? callState.status;
    callState.error = item.error ?? callState.error;
    if (item.arguments && !callState.arguments) {
      callState.arguments = item.arguments;
      callState.argumentsJson =
        this.tryParseJson(item.arguments) ?? callState.argumentsJson;
    }
    if (item.output) {
      callState.output = item.output;
    }

    const label = this.buildMcpCallLabel(callState);

    if (
      callState.status === "failed" &&
      callState.error &&
      !callState.failureAnnounced
    ) {
      this.postAiMessage(`[MCP] ${label} failed: ${callState.error}`);
      callState.failureAnnounced = true;
    }

    if (
      callState.status === "completed" &&
      callState.output &&
      !callState.outputAnnounced
    ) {
      const formatted = this.formatOutputForDisplay(callState.output);
      if (formatted) {
        this.postAiMessage(`[MCP] ${label} returned:\n${formatted}`);
      }
      callState.outputAnnounced = true;
    }

    console.log("MCP call output item processed:", {
      itemId: callState.id,
      label,
      status: callState.status,
    });
  }

  handleMcpListToolsItem(item) {
    const listState = this.ensureMcpListItem(item.id);
    listState.serverLabel = item.server_label ?? listState.serverLabel;
    listState.status = item.status ?? listState.status;

    if (Array.isArray(item.tools) && item.tools.length && !listState.announced) {
      const suffix = listState.serverLabel ? ` (${listState.serverLabel})` : "";
      const toolNames = item.tools
        .map((tool) => tool?.name ?? tool?.id)
        .filter(Boolean);
      if (toolNames.length) {
        this.postAiMessage(
          `[MCP] Tools available${suffix}: ${toolNames.join(", ")}`
        );
        listState.announced = true;
      }
    }

    console.log("MCP list tools item processed:", {
      itemId: listState.id,
      server: listState.serverLabel,
      status: listState.status,
    });
  }

  ensureMcpCall(itemId) {
    if (!itemId) {
      return {
        id: undefined,
        name: null,
        serverLabel: null,
        responseId: null,
        outputIndex: null,
        status: "pending",
        arguments: null,
        argumentsJson: null,
        argumentsBuffer: "",
        argumentsAnnounced: false,
        output: null,
        outputAnnounced: false,
        failureAnnounced: false,
        obfuscated: false,
        error: null,
        announced: false,
      };
    }

    if (!this.mcpCalls.has(itemId)) {
      this.mcpCalls.set(itemId, {
        id: itemId,
        name: null,
        serverLabel: null,
        responseId: null,
        outputIndex: null,
        status: "pending",
        arguments: null,
        argumentsJson: null,
        argumentsBuffer: "",
        argumentsAnnounced: false,
        output: null,
        outputAnnounced: false,
        failureAnnounced: false,
        obfuscated: false,
        error: null,
        announced: false,
      });
    }

    return this.mcpCalls.get(itemId);
  }

  ensureMcpListItem(itemId) {
    if (!itemId) {
      return {
        id: undefined,
        serverLabel: null,
        status: "pending",
        responseId: null,
        announced: false,
        failureAnnounced: false,
      };
    }

    if (!this.mcpListTools.has(itemId)) {
      this.mcpListTools.set(itemId, {
        id: itemId,
        serverLabel: null,
        status: "pending",
        responseId: null,
        announced: false,
        failureAnnounced: false,
      });
    }

    return this.mcpListTools.get(itemId);
  }

  tryParseJson(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Failed to parse MCP JSON payload:", error);
      return null;
    }
  }

  formatOutputForDisplay(output) {
    if (output == null) {
      return "";
    }

    let textRepresentation = "";
    if (typeof output === "string") {
      textRepresentation = output;
    } else {
      try {
        textRepresentation = JSON.stringify(output, null, 2);
      } catch (error) {
        textRepresentation = String(output);
      }
    }

    if (textRepresentation.length > 800) {
      return `${textRepresentation.slice(0, 800)}…`;
    }

    return textRepresentation;
  }

  buildMcpCallLabel(callState) {
    const base = callState.name ?? callState.id ?? "MCP tool";
    return callState.serverLabel ? `${base} (${callState.serverLabel})` : base;
  }

  notifyStatus(message) {
    if (this.statusUpdater) {
      this.statusUpdater(message);
    }
  }

  postAiMessage(content) {
    if (this.chatUI) {
      this.chatUI.addMessage(content, "ai");
    }
  }
}

function requestMCPSummary(options = {}) {
  const {
    dataChannel,
    userPrompt,
    instructions,
    modalities = ["audio", "text"],
    summaryTemplate,
  } = options;

  if (!dataChannel || dataChannel.readyState !== "open") {
    console.warn("Data channel not ready for MCP summary request");
    return false;
  }

  const trimmedPrompt = userPrompt?.trim();
  if (!trimmedPrompt) {
    console.warn("Cannot request MCP summary without a user prompt");
    return false;
  }

  const promptText =
    typeof summaryTemplate === "function"
      ? summaryTemplate(trimmedPrompt)
      : summaryTemplate?.replaceAll("{prompt}", trimmedPrompt) ??
      `Please provide a concise spoken and written summary using the MCP tools for the user's request: "${trimmedPrompt}".`;

  const messageEvent = {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: promptText,
        },
      ],
    },
  };

  const responseEvent = {
    type: "response.create",
    response: {
      modalities,
      instructions,
    },
  };

  dataChannel.send(JSON.stringify(messageEvent));
  dataChannel.send(JSON.stringify(responseEvent));
  return true;
}

export { McpEventManager, requestMCPSummary };
