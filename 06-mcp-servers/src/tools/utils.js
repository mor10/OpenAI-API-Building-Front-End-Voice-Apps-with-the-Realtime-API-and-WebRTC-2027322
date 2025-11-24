/**
 * Functions to help get weather information from the weather MCP server
 *
 * setDataChannel(channel) - Set the data channel to send messages to the API
 * sendDataToAPI(type, data) - Send weather data to the API as a voice request
 * getBrowserLocation() - Get the browser's geolocation
 *
 * @link https://open-meteo.com/
 * @link https://open-meteo.com/en/docs/geocoding-api
 */
import { CONFIG } from "../config.js";
// Store the data channel reference
let dataChannel = null;

// Function to set the data channel
export function setDataChannel(channel) {
  dataChannel = channel;
}

/**
 * Send weather data to the API as a voice request
 *
 * @param {string} type - The type of data to send
 * @param {Object} data - The data to send
 */
export async function sendDataToAPI(type, data) {
  if (!dataChannel || dataChannel.readyState !== "open") {
    console.error("Data channel not ready");
    return;
  }

  let instructions = CONFIG.DEFAULTS.DEFAULT_INSTRUCTIONS;
  if (type === "weather") {
    instructions = CONFIG.DEFAULTS.WEATHER_INSTRUCTIONS;
  }

  // Create a user message with the weather data
  const messageEvent = {
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Here is the ${type} data: ${data}`,
        },
      ],
    },
  };
  dataChannel.send(JSON.stringify(messageEvent));

  // Request a voice and text response describing the weather
  const responseEvent = {
    type: "response.create",
    response: {
      modalities: ["audio", "text"],
      instructions: instructions,
    },
  };
  dataChannel.send(JSON.stringify(responseEvent));
}

/**
 * Get the browser's geolocation
 *
 * @returns {Promise<Object>} The geolocation data
 */
export async function getBrowserLocation() {
  console.log(`Function called: getBrowserLocation()`);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      return currentPosition;
    });
  } else {
    const errorMessage =
      "Could not access browser location. Please enable location sharing in your browser settings or provide a location name.";
    return errorMessage;
  }
}
