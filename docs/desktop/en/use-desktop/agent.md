# MQTTX Agent

MQTTX Agent is an assistant built into the MQTTX desktop client. You ask for something in plain language and it operates MQTTX for you through tools: it creates and connects connections, subscribes and publishes, reads messages, and calls your MCP tools. Every action runs through the same MQTTX code paths as a manual action, so the connection list, subscription list and message list update in real time.

![MQTTX Agent panel](/images/mqttx-agent.png)

## Enable and configure

1. Open **Settings → MQTTX Agent** and turn on **Enable MQTTX Agent**.
2. Fill in the **API Host**, **API Key** and **Model** of your provider. Common hosts:

| Provider | API Host |
| --- | --- |
| OpenAI | `https://api.openai.com/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Anthropic | `https://api.anthropic.com/v1` |
| xAI | `https://api.x.ai/v1` |
| Google | `https://generativelanguage.googleapis.com/v1beta` |
| SiliconFlow | `https://api.siliconflow.cn/v1` |
| Azure OpenAI | `https://<resourceName>.openai.azure.com` |

3. Open the panel with the star button in the left bar, the **MQTTX Agent** button at the top right of a connection page, or `Cmd/Ctrl + J`.

The panel has two modes: a **side panel** on the right, and **full screen**, which covers the main area and keeps the app running underneath. Use the expand button in the panel header to switch, and drag the panel's left edge to resize it.

## What it can do

- List and read connection configurations
- Create, update and delete connections
- Connect and disconnect
- Subscribe and unsubscribe topics
- Publish messages as Plaintext, JSON, Base64 or Hex
- Read stored messages and wait for new ones
- Call tools provided by your MCP servers

You can ask things like "connect to broker.emqx.io and subscribe to `testtopic/#`", "publish a JSON test message to `mqttx/test`", or "show my connections and their status".

## Permission modes

- **Ask before actions** (default): reading is automatic; creating, connecting, subscribing, publishing, deleting and all MCP tools wait for your approval. Each request shows a card where you can **Allow once**, **Always allow this tool in this chat**, or **Deny**.
- **Auto**: every action runs without asking.

Switch the mode from the pill in the composer (only for the current chat), or set the default in **Settings → MQTTX Agent → Default permission mode**. The first time you switch to Auto, MQTTX asks you to confirm the risk.

## Step limit

One reply can use up to **Max steps per reply** tool steps (default 50, range 10–200, configurable in Settings). When a reply reaches the limit it pauses and shows a **Continue** button; clicking it resumes the work.

## Conversations

The panel keeps a history of conversations. In full screen mode the list is on the left; in side panel mode open it from the history button in the header. You can rename a conversation (double-click its title in full screen, or use the `···` menu) and delete it together with its messages.

## MCP

Configure MCP servers in **Settings → MQTTX Agent**, under **MCP Server Configuration**. Both **Streamable HTTP** and **SSE** URLs are supported:

```json
{
  "mcpServers": {
    "weather": { "url": "http://127.0.0.1:8000/mcp" },
    "legacy": { "url": "http://127.0.0.1:8001/sse" }
  }
}
```

Every MCP tool call asks for approval in Ask mode.

## Known limitations

- Incoming messages are stored in MQTTX while a connection page is open. When the agent works on a connection it opens that page automatically, so the agent is not affected; other connections do not collect messages while their page is closed.

## Privacy

Your conversation and the results of tool calls are sent to the model provider you configure, so that it can reply. Passwords, certificates and private keys are never sent: connection tools mask them, and only a flag saying whether a value is set is returned.
