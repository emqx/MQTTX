# Introduction

[MQTTX](https://mqttx.app) is an open-source, cross-platform MQTT 5.0 desktop client from [EMQ](https://www.emqx.com/) for macOS, Linux, and Windows. Its chat-style interface lets you work with multiple connections at once and quickly test connecting, publishing, subscribing, and other MQTT features over TCP, TLS, and WebSocket.

Check the [website](https://mqttx.app) or [GitHub](https://github.com/emqx/MQTTX) for the latest release before installing. You can also clone the [source code](https://github.com/emqx/MQTTX) and build MQTTX yourself. If you run into a problem or have an idea, open a [GitHub issue](https://github.com/emqx/MQTTX/issues), or fork the project and submit a pull request.

## Preview

![mqttx-gif](/images/mqttx-gif.gif)

## Main Features

- Chat-style interface for sending and receiving MQTT messages
- Runs on Windows, macOS, and Linux
- Fully compliant with MQTT 5.0, 3.1.1, and 3.1
- MQTT 5.0 user properties on connect, publish, and subscribe, plus SCRAM enhanced authentication
- One-way and two-way SSL/TLS authentication
- [MQTT over WebSockets](https://www.emqx.com/en/blog/connect-to-mqtt-broker-with-websocket)
- [MQTTX Agent](/docs/agent) for operating MQTTX in natural language: it creates connections, subscribes and publishes, and calls your MCP tools
- Payload formats: Plaintext, JSON, Base64, Hex, CBOR, and MsgPack, with Protobuf and Avro schemas
- Automatic GZIP decompression of received messages, before payload decoding
- Custom scripts and timed messages for MQTT pub/sub simulation
- Viewer tools: Topic Tree, Dashboard, Traffic Monitor, and Payload Inspector
- Customizable colors for subscriptions
- Data backup and recovery in JSON, CSV, Excel, XML, and YAML
- Comprehensive logging
- Light, Dark, and Night themes
- Available in English, Simplified Chinese, Japanese, Turkish, Hungarian, and Korean 🇺🇸 🇨🇳 🇯🇵 🇹🇷 🇭🇺 🇰🇷
