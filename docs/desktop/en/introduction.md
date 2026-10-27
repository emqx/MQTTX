# Introduction

[MQTTX Desktop](https://mqttx.app) is an open-source MQTT client for macOS, Windows, and Linux, supporting broker connections, messaging, and device communication diagnostics. Its built-in MQTTX Agent is an AI Agent for natural-language MQTTX operation, covering connections, messages, data processing, and troubleshooting, as well as device-status queries and commands based on supplied MQTT protocols. Dashboard provides independent visualization of received message fields as live readings and trends.

Download the latest release from the [website](https://mqttx.app) or [GitHub](https://github.com/emqx/MQTTX), or build it from [source](https://github.com/emqx/MQTTX). Report problems and suggestions in [GitHub issues](https://github.com/emqx/MQTTX/issues); fork the project and submit a pull request to contribute.

## Choose a client

- [MQTTX Desktop](https://mqttx.app/docs): a graphical client for interactive debugging, message analysis, and the built-in MQTTX Agent. This guide covers the desktop app.
- [MQTTX CLI](https://mqttx.app/docs/cli): a command-line client for publishing and subscribing, shell pipelines, automated tests, benchmarks, and IoT data simulation.
- [MQTTX Web](https://mqttx.app/docs/web): a browser client that connects over WebSocket. Use the [online client](https://mqttx.app/web-client) or host it yourself with Docker.

## Preview

![mqttx-gif](/images/mqttx-gif.gif)

## Desktop Features

- Chat-style interface for sending and receiving MQTT messages
- Runs on Windows, macOS, and Linux
- Fully compliant with MQTT 5.0, 3.1.1, and 3.1
- MQTT 5.0 user properties on connect, publish, and subscribe, plus SCRAM enhanced authentication
- One-way and two-way SSL/TLS authentication
- [MQTT over WebSockets](https://www.emqx.com/en/blog/connect-to-mqtt-broker-with-websocket)
- [**MQTTX Agent**](./use-desktop/agent.md): natural-language MQTTX operation and analysis, including protocol-based device queries and command interactions, with Skills for task guidance and configured MCP tools for external systems.
- Payload formats: Plaintext, JSON, Base64, Hex, CBOR, and MsgPack, with Protobuf and Avro schemas
- Automatic GZIP decompression of received messages, before payload decoding
- Custom scripts and timed messages for MQTT pub/sub simulation
- [**Dashboard**](./use-desktop/dashboard.md): current readings, trend charts, configurable layouts, and local message-history review.
- **Viewer tools**: topic, traffic, and payload inspection through the Topic Tree, Traffic Monitor, and Payload Inspector.
- Customizable colors for subscriptions
- Data backup and recovery in JSON, CSV, Excel, XML, and YAML
- Comprehensive logging
- Light, Dark, and Night themes
- Available in English, Simplified Chinese, Japanese, Turkish, Hungarian, and Korean 🇺🇸 🇨🇳 🇯🇵 🇹🇷 🇭🇺 🇰🇷
