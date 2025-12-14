# OpenAI Realtime API: Building Voice Agents with Realtime API and the Agents SDK

This is the repository for the LinkedIn Learning course _OpenAI Realtime API: Building Voice Agents with Realtime API and the Agents SDK_. The full course is available from [LinkedIn Learning][lil-course-url].

![lil-thumbnail-url]

## Course Description

Build voice-powered AI agents with OpenAI's Realtime API and the Agents SDK. Learn how to set up advanced features including guardrails, function calling, MCP servers, and live image input via device camera, and build secure apps with ephemeral tokens.

What's covered:

- How to build a Realtime voice agent using the Agents SDK
- Create a greeting message
- Add guardrails for custom language moderation
- Use custom functions as tools
- Integrate MCP servers for external connections
- Activate the device camera to enable the agent to comment on visual input

## Quick Start

The `main` branch contains the completed project. To go hands-on with the course:

1. Set up the development auth server as described below
2. Use `git checkout module-01` to swith to set the `/sandbox/` folder to the beginning state
3. Follow the course instructions

## Instructions

This is a hands-on course and you'll get the best learning experience by following along step-by-step with these exercise files. The project is best used in GitHub Codespaces.

The exercise files contain three separate software packages:

- `/sandbox/`: The main project workspace where you'll build the application step-by-step.
- `/auth-server/`: A basic Node.js-based development auth server to supply the front-end app with an ephemeral OpenAI API token for authentication. See `/auth-server/README.md` for more details.
- `/mcp-server/`: A simple Python-based MCP server obtaining real-time weather data from Open-Meteo's public API. See `/mcp-server/README.md` for more details.

### Preparation step: Authenticating through a Development Auth Server

The Realtime API requires token-based authentication. In this project you'll use an ephemeral token obtained through a development auth server. This removes the need for maintaining a long-lived API key in the front-end app.

If you're running the exercise files in GitHub Codespaces (recommended), the dependencies for the auth server are automatically installed. If you're running the exercise files on your local computer, install the dependencies using `npm install`.

#### Setting up the Auth Server

1. Visit the [platform.openai.com](https://platform.openai.com/api-keys) to create an API key for the project.
2. Make a copy of `/auth-server/.env-template` to create a new `.env` file in the `/auth-server/` directory with the following:

```json
OPENAI_API_KEY=your-api-key
```

3. In a dedicated terminal, start the server by navigating to the `/auth-server/` directory and running

```bash
node server.js
```

4. In Codespaces, go to Ports and set the visibility of port `3000` to **Public**.
5. Copy the live URL for `auth-server` (e.g., `https://<RANDOM-GENERATED-URI>-3000.app.github.dev`)
6. In `/sandbox/`, copy `.env.local.template` to `.env.local` and set `NEXT_PUBLIC_AUTH_SERVER_URL=` to the `auth-server` URL.

To stop the auth server, run `Ctrl+C` in the terminal.

## Setting up the MCP Server

Just like the development auth server, the MCP server needs to run in its own terminal with its port visibility set to **Public** in Codespaces.

1. In a dedicated terminal, navigate to the `/mcp-server/` directory
2. Install the dependencies using `uv sync`
3. Start the MCP server using `uv run mcp_open_meteo/server.py`
4. In Codespaces, go to Ports and set the visibility of port `8000` to **Public**.
5. In Module 07, follow the instructions to set the MCP server URL in the front-end app.

To stop the MCP server, run `Ctrl+C` in the terminal.

## Running the Front-End App

The front-end app is built with Next.js and uses the standard Next.js development server that allows for hot-reloading while you work.

The app also needs its own dedicated terminal meaning you'll have three terminals running at the same time.

1. Open the folder in terminal
2. Install the dependencies using `npm install`
3. Start the development server using `npm run dev`
4. Open the provided localhost URL in your browser

**TIP:** To test the app on other devices, in Codespaces go to Ports and set the visibility of port `9307` to **Public**.

## Instructor

Morten Rand-Hendriksen

Senior Staff Instructor, Speaker, Web Designer, and Software Developer

Check out my other courses on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/morten-rand-hendriksen?u=104).

[0]: # "Replace these placeholder URLs with actual course URLs"
[lil-course-url]: https://www.linkedin.com/learning/openai-api-building-front-end-voice-apps-with-the-realtime-api-and-webrtc
[lil-thumbnail-url]: https://media.licdn.com/dms/image/v2/D4D0DAQEYzrFcR4U6rQ/learning-public-crop_675_1200/B4DZSV4dHoG8AY-/0/1737681392392?e=2147483647&v=beta&t=XE9cChS7_B8GHyW_Bsh0TfBIKc6D39Qlex5UXTmsPM4
