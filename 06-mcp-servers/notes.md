### tool_choice

**Type:** string or object  
**Optional** — Defaults to `auto`  
How the model chooses tools. Provide one of the string modes or force a specific function/MCP tool.

#### Tool choice mode

**Type:** string  
Controls which (if any) tool is called by the model.

- `none` — the model will not call any tool and instead generates a message.
- `auto` — the model can pick between generating a message or calling one or more tools.
- `required` — the model must call one or more tools.

#### Function tool

**Type:** object  
Use this option to force the model to call a specific function.

- **name** (string, required): Name of the function to call.
- **type** (string, required): Always `function`.

#### MCP tool

**Type:** object  
Use this option to force the model to call a specific tool on a remote MCP server.

- **server_label** (string, required): Label of the MCP server to use.
- **type** (string, required): Always `mcp`.
- **name** (string, optional): Name of the tool to call on the server.

---

### tools

**Type:** array  
**Optional**  
Tools available to the model.

#### Function tool

**Type:** object

#### MCP tool

**Type:** object  
Give the model access to additional tools via remote MCP servers.

- **server_label** (string, required): A label used to identify the MCP server.
- **type** (string, required): Always `mcp`.

##### allowed_tools

**Type:** array or object  
Optional. List of allowed tool names or a filter object.

- **MCP allowed tools** (array): A string array of allowed tool names.
- **MCP tool filter** (object): Filter specifying which tools are allowed.
  - **read_only** (boolean, optional): Indicates whether a tool modifies data.
  - **tool_names** (array, optional): List of allowed tool names.

##### authorization

**Type:** string  
Optional. OAuth access token for the MCP server.

##### connector_id

**Type:** string  
Optional. Identifier for service connectors. One of `server_url` or `connector_id` must be provided.

Supported connector IDs include:

- `connector_dropbox`
- `connector_gmail`
- `connector_googlecalendar`
- `connector_googledrive`
- `connector_microsoftteams`
- `connector_outlookcalendar`
- `connector_outlookemail`
- `connector_sharepoint`

##### headers

**Type:** object  
Optional HTTP headers for the MCP server.

##### require_approval

**Type:** object or string  
Optional — Defaults to `always`  
Specify which of the server’s tools require approval.

- **MCP tool approval filter** (object):
  - May be `always`, `never`, or a filter object indicating tools needing approval.
  - **always** filter:
    - **read_only** (boolean, optional)
    - **tool_names** (array, optional)
  - **never** filter:
    - **read_only** (boolean, optional)
    - **tool_names** (array, optional)
- **MCP tool approval setting** (string): `always` or `never`.

##### server_description

**Type:** string  
Optional description of the MCP server.

##### server_url

**Type:** string  
Optional. URL of the MCP server. One of `server_url` or `connector_id` must be provided.
