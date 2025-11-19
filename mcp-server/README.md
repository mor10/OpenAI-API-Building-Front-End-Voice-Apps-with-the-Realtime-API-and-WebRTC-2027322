# Weather MCP Server Powered by the Open-Meteo API

This MCP server interfaces with the [Open-Meteo API](https://open-meteo.com/en/docs) and offers tools to fetch current weather conditions and weather forecasts for any location worldwide.

## Requirements
This project requires [uv](https://docs.astral.sh/uv/getting-started/installation/)
  
#### MacOS / Linux:
Use curl to download the script and execute it with sh:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

#### Windows:
Use irm to download the script and execute it with iex:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | ie
```
  
## Development

### 1. Set up the uv environment

In terminal:
```bash
uv sync
```
### 2. Start the virtual environment

In terminal:
```bash
source .venv/bin/activate
```

NOTE: To stop the virtual environment:
```bash
deactivate
```

### 3. Set the VS Code python environment

1. Open the Command Palette Shift + CMD/CTRL + P
2. Select "Python: Set Project Environment
3. Choose `mcp-open-meteo` venv

### 4. Run MCP server

```bash
uv run mcp_open_meteo/server.py
```

This starts the server at localhost:8000 (or the equivalent GitHub Codespaces URL). Go to the __PORTS__ tab, right click on the `8000` port, and change __Port Visibility__ to __Public__.

### 5. Test the MCP server in the MCP Inspector using GitHub Codespaces

1. In GitHub Codespaces, go to PORTs and find the URL to the MCP server
2. Open a separate terminal
3. Run the following command, replacing `random-github-url` with the prefix of the MCP URL while leaving the port numbers `6274` and `6277` and `.app.github.dev` in place:
  ```bash
  ALLOWED_ORIGINS=https://random-github-uri-6274.app.github.dev,https://random-github-uri-6277.app.github.dev npx @modelcontextprotocol/inspector
  ```
  This spins up two new URLs on ports `6274` and `6277`. Go to the __PORTS__ tab, right click each new port, and change __Port Visibility__ to __Public__.
4. In MCP Inspector, set __Transport Type__ to __Streamable HTTP__ and paste the URL in the __URL__ field and suffix it with `/mcp`
5. Click __Configuration__ and paste the `https://random-github-uri-6277.app.github.dev` address into __Inspector Proxy Address__
6. In the terminal where you started the MCP Inspector, copy the __Session Token__
7. In the MCP Inspector, paste the __Session Token__ into the __Proxy Session Token__ field
8. Click __Connect__ to connect to the server

### 6. Test the MCP server in the MCP Inspector running locally

You can test the MCP server using a local instance of the MCP Inspector even when the server is running on GitHub Codespaces:

1. In Terminal, run `npx @modelcontextprotocol/inspector`
2. In GitHub Codespaces, copy the URL to the `8000` port where the MCP server is running
3. In MCP Inspector, set __Transport Type__ to __Streamable HTTP__ and paste the URL in the __URL__ field and suffix it with `/mcp`
4. Click __Connect__ to connect to the server

## Run MCP server in VS Code

1. Open the Command Palette Shift + CMD/CTRL + P

2. Select "MCP: Open User Configuration". This opens `mcp.json`

3. In `mcp.json`:

  ```json
  {
    "servers": {
      "weather-server": {
        "type": "stdio",
        "command": "uv",
        "args": [
          "run",
          "--directory",
          "/absolute/path/to/weather-server",
          "mcp-open-meteo"
        ]
      }
    },
    "inputs": []
  }
  ```

## Run MCP server in Claude Desktop

### Automatic install

In terminal:
```bash
uv run mcp install mcp_open_meteo/server.py
```

### Manual install

1. Open `claude_desktop_config.js` in an editor:
 
  File location:
  - MacOS / Linux `~/Library/Application/Support/Claude/claude_desktop_config.json`
  - Windows `AppData\Claude\claude_desktop_config.json`

2. Find the full path to `uv`:
  
  - MacOS / Linux:
  ```bash
  which uv
  ```
  - Windows:
  ```bash
  where uv
  ```

2. In `claude_desktop_config.js`

  ```json
  {
    "mcpServers": {
      "Open-Meteo Weather": {
        "command": "/opt/homebrew/bin/uv",
        "args": [
          "run",
          "--with",
          "mcp[cli]",
          "mcp",
          "run",
          "/absolute/path/to/weather-server/mcp_open_meteo/server.py"
        ]
      }
    }
   }
   ```

