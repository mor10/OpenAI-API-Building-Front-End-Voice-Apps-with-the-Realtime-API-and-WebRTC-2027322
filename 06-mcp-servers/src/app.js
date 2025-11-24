/**
 * OpenAI Realtime API via WebRTC with MCP Server Integration
 * ==========================================================
 *
 * Enhanced JavaScript implementation of OpenAI's Realtime API using WebRTC.
 * This version replaces the internal tool with calls to an external MCP Server
 * exposing tools and resources for weather data from Open-Meteo.
 *
 * The example MCP Server is provided in the `../mcp-server` directory.
 * Follow the instructions in `../mcp-server/README.md` to set up and run the server.
 *
 * NOTE: This demo authenticates API requests using an ephemeral key.
 * The key is obtained through a call to a custom auth server.
 * See `../auth-server/README.md` for details.
 */

import { CONFIG } from "./config.js";
import { createVisualizer } from "./visualizer.js";
import { getEphemeralKey } from "./auth-api.js";
import { ChatUI } from "./chat.js";
import { setDataChannel } from "./tools/utils.js";
import {
  mcp_servers,
  McpEventManager,
  requestMCPSummary,
} from "./tools/mcp-utils.js";

/**
 * RealtimeDemo Class
 * Manages voice, text, and function calling interactions with the Realtime API.
 */
class RealtimeDemo {
  constructor() {
    // Initialize state
    this.peerConnection = null;
    this.mediaStream = null;
    this.isConnected = false;
    this.dataChannel = null;
    this.hasWelcomed = false;
    this.audioElement = null;
    this.isTalking = true;
    this.micVisualizer = null;
    this.aiVisualizer = null;
    this.chatUI = null;
    this.currentTranscript = "";
    this.accumulatedTranscript = "";
    this.isCapturingVoice = false;
    this.lastSpeechTime = 0;
    this.speechTimeoutId = null;
    this.mcpManager = null;
    this.hasRequestedMCPSummary = false;
    this.lastUserPrompt = "";

    // Get DOM elements
    this.connectionButton = document.getElementById("connection-button");
    this.micButton = document.getElementById("mic-button");
    this.statusDiv = document.getElementById("status");

    // Bind event listeners
    this.connectionButton.addEventListener("click", () => this.toggleSession());
    this.micButton.addEventListener("click", () => this.toggleTalk());

    // Initialize chat UI with message handler
    this.chatUI = new ChatUI((message) => this.handleChatMessage(message));
    this.mcpManager = new McpEventManager(
      this.chatUI,
      (status) => this.updateStatus(status)
    );
  }

  /**
   * Update status message displayed to the user
   *
   * @param {string} message - The status message to display
   */
  updateStatus(message) {
    this.statusDiv.textContent = message;
  }

  /**
   * Cleanup
   * Properly closes all connections and frees resources:
   * - Stops media streams
   * - Closes WebRTC connection
   * - Removes audio elements
   * - Stops visualizers
   * - Resets UI state
   */
  closeConnection() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.audioElement) {
      this.audioElement.remove();
    }
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.aiVisualizer) {
      this.aiVisualizer.stop();
    }
    if (this.micVisualizer) {
      this.micVisualizer.stop();
    }
    if (this.chatUI) {
      this.chatUI.clearMessages();
    }
    if (this.mcpManager) {
      this.mcpManager.reset();
    }
    this.hasRequestedMCPSummary = false;
    this.lastUserPrompt = "";

    this.peerConnection = null;
    this.mediaStream = null;
    this.audioElement = null;
    this.dataChannel = null;
    this.micVisualizer = null;
    this.aiVisualizer = null;
    this.isConnected = false;
    this.isTalking = true;
    this.micButton.disabled = true;
    this.micButton.textContent = "Unmute Mic";
    this.connectionButton.textContent = "Create Session";
    this.updateStatus("Not connected");
  }

  /**
   * Text Chat Handler
   * Processes text messages and requests text-only responses with function calling.
   * Messages sent via text receive text-only responses.
   *
   * @param {string} message - The message to send to the API
   */
  handleChatMessage(message) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      console.error("Data channel not ready");
      return;
    }

    // Send the text message
    const messageEvent = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };
    this.dataChannel.send(JSON.stringify(messageEvent));
    this.lastUserPrompt = message;
    this.hasRequestedMCPSummary = false;

    // Request a text-only response using the same instructions as voice
    const textResponseEvent = {
      type: "response.create",
      response: {
        modalities: ["text"], // API returns only text
        instructions: CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS,
        tools: mcp_servers, // Access available MCP servers
      },
    };
    console.log("Requesting text-only response:", textResponseEvent);
    this.dataChannel.send(JSON.stringify(textResponseEvent));
  }

  /**
   * Incoming Audio Setup
   * Sets up the audio element to play remote audio from the API.
   * Also initializes the AI audio visualizer.
   *
   * @throws {Error} If audio element setup fails
   */
  async setupIncomingAudio() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Initialize visualizer
      this.micVisualizer = createVisualizer("micVisualizer");
      if (this.micVisualizer.init(null, this.mediaStream)) {
        console.log("User Visualizer started successfully");
      }

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = true;
      this.peerConnection.addTrack(audioTrack, this.mediaStream);
      console.log("Microphone setup complete");
    } catch (error) {
      this.updateStatus("Error accessing microphone: " + error.message);
      throw error;
    }
  }

  /**
   * Microphone Setup
   * Requests microphone access and adds the audio track to the WebRTC connection.
   * Also initializes the microphone visualizer.
   *
   * @throws {Error} If microphone access is denied or unavailable
   */
  async setupMicrophone() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Initialize visualizer
      this.micVisualizer = createVisualizer("micVisualizer");
      if (this.micVisualizer.init(null, this.mediaStream)) {
        console.log("User Visualizer started successfully");
      }

      const audioTrack = this.mediaStream.getAudioTracks()[0];
      audioTrack.enabled = true;
      this.peerConnection.addTrack(audioTrack, this.mediaStream);
      console.log("Microphone setup complete");
    } catch (error) {
      this.updateStatus("Error accessing microphone: " + error.message);
      throw error;
    }
  }

  /**
   * WebRTC Event Handlers
   * Monitor the data channel for events:
   * - onopen: Send initial greeting, set instructions for the voice assistant
   * - onclose: Update connection status
   * - onmessage: Process incoming messages from the API, including calls to MCP servers
   */
  setupDataChannelHandlers() {
    this.dataChannel.onopen = () => {
      console.log("Data channel opened");
      this.updateStatus("Connected to Realtime API");

      // Pass the data channel to the weather helper utilities
      setDataChannel(this.dataChannel);

      if (!this.hasWelcomed) {
        console.log("Sending welcome message");
        const welcomeEvent = {
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions: CONFIG.DEFAULTS.WELCOME_INSTRUCTIONS,
          },
        };
        this.dataChannel.send(JSON.stringify(welcomeEvent));
        this.hasWelcomed = true;
      }

      // Set instructions for the voice assistant
      const setIntructions = {
        type: "session.update",
        session: {
          instructions: CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS,
          turn_detection: CONFIG.API.TURN_DETECTION,
          input_audio_transcription: {
            model: "whisper-1",
          },
          max_output_tokens: CONFIG.API.MAX_OUTPUT_TOKENS,
          tools: mcp_servers, // Access available MCP servers
        },
      };
      this.dataChannel.send(JSON.stringify(setIntructions));
    };

    this.dataChannel.onclose = () => {
      console.log("Data channel closed");
      this.updateStatus("Disconnected from Realtime API");
    };

    this.dataChannel.onmessage = (event) => {
      const realtimeEvent = JSON.parse(event.data);
      console.log("Received event:", realtimeEvent);

      // Speech started
      if (realtimeEvent.type === "input_audio_buffer.speech_started") {
        this.chatUI.addMessage("Speaking...", "user");
        this.updateStatus("User speaking");
      }
      // Speech stopped
      else if (realtimeEvent.type === "input_audio_buffer.speech_stopped") {
        this.updateStatus("Speech stopped");
      }
      // Audio buffer committed
      else if (realtimeEvent.type === "input_audio_buffer.committed") {
        this.chatUI.updateLastMessage("Processing speech...", "user");
        this.updateStatus("Processing speech...");
      }
      // Partial transcription
      else if (
        realtimeEvent.type === "conversation.item.input_audio_transcription"
      ) {
        const partialText =
          realtimeEvent.transcript ??
          realtimeEvent.text ??
          "User is speaking...";
        this.chatUI.updateLastMessage(partialText, "user");
      }
      // Final transcription
      else if (
        realtimeEvent.type ===
        "conversation.item.input_audio_transcription.completed"
      ) {
        if (realtimeEvent.transcript) {
          // Replace the last "in progress" message with the final transcript
          this.chatUI.updateLastMessage(realtimeEvent.transcript, "user");
          this.updateStatus("Connected");
          this.lastUserPrompt = realtimeEvent.transcript;
          this.hasRequestedMCPSummary = false;
        }
      }
      // AI response transcript
      else if (realtimeEvent.type === "response.audio_transcript.done") {
        if (realtimeEvent.transcript) {
          this.chatUI.addMessage(realtimeEvent.transcript, "ai");
        }
      }
      else if (realtimeEvent.type === "response.output_item.added") {
        this.mcpManager?.handleMcpOutputItemAdded(realtimeEvent);
      }
      else if (realtimeEvent.type === "response.mcp_call_arguments.delta") {
        this.mcpManager?.handleMcpCallArgumentsDelta(realtimeEvent);
      }
      else if (realtimeEvent.type === "response.mcp_call_arguments.done") {
        this.mcpManager?.handleMcpCallArgumentsDone(realtimeEvent);
      }
      else if (realtimeEvent.type === "response.mcp_call.in_progress") {
        this.mcpManager?.handleMcpCallStatusUpdate(
          realtimeEvent,
          "in_progress"
        );
      }
      else if (realtimeEvent.type === "response.mcp_call.completed") {
        this.mcpManager?.handleMcpCallStatusUpdate(
          realtimeEvent,
          "completed"
        );
        if (!this.hasRequestedMCPSummary) {
          const instructions = CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS;
          const requested = requestMCPSummary({
            dataChannel: this.dataChannel,
            userPrompt: this.lastUserPrompt,
            instructions,
          });
          if (requested) {
            this.hasRequestedMCPSummary = true;
          }
        }
      }
      else if (realtimeEvent.type === "response.mcp_call.failed") {
        this.mcpManager?.handleMcpCallStatusUpdate(realtimeEvent, "failed");
      }
      else if (realtimeEvent.type === "mcp_list_tools.in_progress") {
        this.mcpManager?.handleMcpListToolsStatus(
          realtimeEvent,
          "in_progress"
        );
      }
      else if (realtimeEvent.type === "mcp_list_tools.completed") {
        this.mcpManager?.handleMcpListToolsStatus(
          realtimeEvent,
          "completed"
        );
      }
      else if (realtimeEvent.type === "mcp_list_tools.failed") {
        this.mcpManager?.handleMcpListToolsStatus(realtimeEvent, "failed");
      }
      // Handle text and function call responses
      else if (realtimeEvent.type === "response.done") {
        console.log("Text response object:", realtimeEvent.response);
        if (realtimeEvent.response?.output) {
          // Process each output item
          for (const item of realtimeEvent.response.output) {
            if (item.type === "message" && item.content?.[0]?.text) {
              // Handle text response
              this.chatUI.addMessage(item.content[0].text, "ai");
            } else if (item.type === "mcp_call") {
              this.mcpManager?.handleMcpCallItem(item);
            } else if (item.type === "mcp_list_tools") {
              this.mcpManager?.handleMcpListToolsItem(item);
            }
          }
        }
      }
    };
  }

  /**
   * WebRTC Setup
   * Create and configure the WebRTC peer connection with the API.
   * - Set up audio playback for the AI with visualization
   * - Create a data channel for control messages
   * - Establish a connection using SDP offer/answer
   *
   * @param {string} token - The ephemeral API key from getEphemeralKey()
   * @throws {Error} If WebRTC setup fails
   */
  async setupWebRTC(token) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Initialize visualizer
    const aiVisualizer = createVisualizer();

    // Set up audio playback
    this.audioElement = document.createElement("audio");
    this.audioElement.autoplay = true;
    document.body.appendChild(this.audioElement);

    // Handle remote audio track
    this.peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      this.audioElement.srcObject = event.streams[0];
      this.audioElement.addEventListener(
        "canplay",
        () => {
          console.log("Audio is ready to play");
          this.aiVisualizer = aiVisualizer;
          if (this.aiVisualizer.init(this.audioElement, event.streams[0])) {
            console.log("Visualizer started successfully");
          }
          this.audioElement
            .play()
            .catch((e) => console.error("Error playing audio:", e));
        },
        { once: true }
      );
    };

    // Set up data channel
    this.dataChannel = this.peerConnection.createDataChannel("oai-events");
    this.setupDataChannelHandlers();

    try {
      // Set up microphone with visualizer
      await this.setupMicrophone();

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await this.peerConnection.setLocalDescription(offer);

      const response = await fetch(
        `${CONFIG.API.BASE_URL}?model=${CONFIG.API.MODEL}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to connect: ${response.status} ${response.statusText}`
        );
      }

      const answer = {
        type: "answer",
        sdp: await response.text(),
      };
      await this.peerConnection.setRemoteDescription(answer);
      console.log("WebRTC connection established");
    } catch (error) {
      this.updateStatus("Error establishing connection: " + error.message);
      throw error;
    }
  }

  /**
   * The Connection Button
   * - "Create Session" state: Get ephemeral key, set up WebRTC, enable mic control.
   * - "Close Session" state: Clean up and reset all resources.
   */
  async toggleSession() {
    if (!this.isConnected) {
      try {
        this.updateStatus("Connecting...");
        const token = await getEphemeralKey();
        await this.setupWebRTC(token);
        this.isConnected = true;
        this.micButton.disabled = false;
        this.micButton.textContent = "Mute Mic";
        this.connectionButton.textContent = "Close Session";
        this.updateStatus("Connected");
      } catch (error) {
        this.updateStatus("Connection failed: " + error.message);
        console.error("Connection error:", error);
      }
    } else {
      this.closeConnection();
    }
  }

  /**
   * Mute/Unmute Button
   * Enables/disables the microphone input stream
   */
  toggleTalk() {
    if (this.mediaStream) {
      this.isTalking = !this.isTalking;
      const audioTrack = this.mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = this.isTalking;
        this.micButton.textContent = this.isTalking ? "Mute Mic" : "Unmute Mic";
        this.updateStatus(
          this.isTalking ? "Microphone active" : "Microphone muted"
        );
      }
    }
  }

}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new RealtimeDemo();
});
