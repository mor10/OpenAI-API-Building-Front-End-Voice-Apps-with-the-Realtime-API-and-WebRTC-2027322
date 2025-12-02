# OpenAI API: Building Front-End Voice Apps with the Realtime API and WebRTC

This is the repository for the LinkedIn Learning course OpenAI API: Building Front-End Voice Apps with the Realtime API and WebRTC. The full course is available from [LinkedIn Learning][lil-course-url].

![lil-thumbnail-url]

## Course Description

With OpenAI’s Realtime API and Agents SDK, you can build custom real-time voice-to-voice AI chat into any front-end web app or other app through WebRTC. In this course, you’ll explore how to create advanced voice agents using the Realtime API through the Agents SDK.

Features covered:

- Create agents, sessions, and connections using a one-time ephemeral tokens
- Build voice apps with real-time text transcriptions in a chat
- Add guardrails for custom language moderation
- Use custom functions as tools
- Integrate MCP servers for external connections
- Activate the device camera to enable the agent to comment on visual input

## Instructions

This is a hands-on course and you'll get the best learning experience by following along step-by-step with these exercise files. The project is best used in GitHub Codespaces.

The exercise files are organized in two main folders:

- `/project-baseline/`: The starting point for the project. This is where you should begin working through the course.
- `/project-completed/`: The completed project files, which you can refer to at any time.

## Authenticating through a Development Auth Server

The project also contains a basic Node.js-based auth server to supply the front-end app with an ephemeral OpenAI API token for authentication. It is found in the `./auth-server/` folder. The Auth Server needs to run on a public URL for cross-device functionality so the recommendation is to run this entire project in GitHub Codespaces.

If you're running the exercise files in GitHub Codespaces, the dependencies for the auth server are automatically installed. If you're running the exercise files on your local computer, install the dependencies using `npm install`.

### Setting up the Auth Server

1. Visit the [platform.openai.com](https://platform.openai.com/api-keys) to create an API key for the project.
2. Make a copy of `/auth-server/.env-template` to create a new `.env` file in the `/auth-server/` directory with the following:

```json
OPENAI_API_KEY=your-api-key
```

3. Run the server from terminal by navigating to the `/auth-server/` directory and running

```bash
node server.js
```

4. In Codespaces, go to Ports and set port `3000` to **Public**.
5. Identify the live URL for the auth server, and it to `server-config.js`.
6. To stop the auth server, run `Ctrl+C` in the terminal.

## Setting up the MCP Server

The project comes with a simple Python-based MCP server to enable external connections for the voice agent. It is found in the `./mcp-server/` folder. The MCP server queries live weather data from any given location from Open Meteo's public API and returns the information to the MCP client (in this case the voice agent).

### Setting up the MCP Server

1. Navigate to the `/mcp-server/` directory in terminal
2. Install the dependencies using `uv sync`
3. Start the MCP server using `uv run mcp_open_meteo/server.py`
4. In Codespaces, go to Ports and set port `8000` to **Public**.
5. Identify the live URL for the MCP server, and it to `mcp-config.js`.
6. To stop the MCP server, run `Ctrl+C` in the terminal.

## Instructor

Morten Rand-Hendriksen

Senior Staff Instructor, Speaker, Web Designer, and Software Developer

Check out my other courses on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/morten-rand-hendriksen?u=104).

[0]: # "Replace these placeholder URLs with actual course URLs"
[lil-course-url]: https://www.linkedin.com/learning/openai-api-building-front-end-voice-apps-with-the-realtime-api-and-webrtc
[lil-thumbnail-url]: https://media.licdn.com/dms/image/v2/D4D0DAQEYzrFcR4U6rQ/learning-public-crop_675_1200/B4DZSV4dHoG8AY-/0/1737681392392?e=2147483647&v=beta&t=XE9cChS7_B8GHyW_Bsh0TfBIKc6D39Qlex5UXTmsPM4
