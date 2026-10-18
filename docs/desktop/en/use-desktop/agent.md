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

3. Open the Agent full screen with the star button in the left bar, or as a floating window with `Cmd/Ctrl + J` or the **MQTTX Agent** button at the top right of a connection or script page.

The Agent has two modes: **full screen**, which covers the main area and keeps the app running underneath, and a **floating window** that works on any page. Drag its title bar to move it, drag an edge or corner to resize it, and its position and size are remembered. Use the expand button in its title bar to switch to full screen. `Esc` closes the floating window, and in full screen it returns to the floating window. Choosing another page in the left bar leaves full screen.

## What it can do

- List and read connection configurations, including TLS certificates and groups
- Create, update and delete connections
- Connect and disconnect, subscribe and unsubscribe, publish messages as Plaintext, JSON, Base64 or Hex, and start or stop a timed publish
- Read stored messages and wait for new ones, and clear a connection's messages
- Inspect certificates and private keys locally (their contents are never shared)
- Write, test and apply transformation functions and schemas
- Build and read the Topic Tree
- Create dashboards and widgets
- Read the logs and change the app settings
- Call tools provided by your MCP servers

You can ask things like "connect to broker.emqx.io and subscribe to `testtopic/#`", "publish a JSON test message to `mqttx/test`", or "show my connections and their status". Type `/` in the composer to pick a Skill — client code, test data, schema, custom function, MQTT/EMQX knowledge, connection diagnostics or the MQTTX CLI — and the Agent will use it for your request. Generated code is saved as a downloadable zip: the chat shows a file card to download it or show it in its folder. The archives are stored under `agent-files` in the app data directory and are removed together with the conversation.

## Attachments

You can paste a screenshot, drop files onto the panel, or use the 📎 button. Images are sent to the model, text files are sent as text (the first 64 KB of larger files), and certificate or key files are referenced only by their path — their contents are never sent. The Agent can configure TLS with these files, for example: "connect to broker.example.com on port 8883 with `ca.crt` as the CA, `client.crt` as the client certificate and `client.key` as the key".

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

Your conversation and the results of tool calls are sent to the model provider you configure, so that it can reply. Saved passwords, certificates and private keys are masked when tools read a connection, but anything you type in the chat is sent as is, so avoid entering secrets there.
