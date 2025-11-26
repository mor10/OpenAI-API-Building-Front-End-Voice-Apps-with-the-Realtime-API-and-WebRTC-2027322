/*
 * Baseline auth server for generating ephemeral OpenAI API tokens.
 *
 * WARNING: DO NOT USE IN PRODUCTION!
 * This server is for development purposes only!
 *
 * Reasons:
 * 1. No Authentication: `/token` endpoint is public meaning anyone can
 *    generate ephemeral tokens and use your OpenAI API credits.
 * 2. No Rate Limiting: There are no controls to prevent abuse.
 *
 * For production, use proper authentication and authorization.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const app = express();

// Configure CORS to accept requests from any origin in development
// In production, you should configure this more strictly
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
    credentials: true,
  })
);

// Create a GET endpoint to generate an ephemeral session token
app.get("/token", async (req, res) => {
  const model = req.query.model || "gpt-realtime";
  const voice = req.query.voice || "marin";

  const sessionConfig = JSON.stringify({
    session: {
      type: "realtime",
      model: model,
      audio: {
        output: {
          voice: voice,
        },
      },
    },
  });

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: sessionConfig,
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at port ${port}`);
  console.log(`To close the server, press Ctrl+C`);
});
