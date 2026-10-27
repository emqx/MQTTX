<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)

[![GitHub Downloads](https://img.shields.io/github/downloads/emqx/MQTTX/total?label=GitHub%20Downloads)](https://mqttx.app/downloads)
[![Docker Web Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-web?label=Docker%20Web%20Pulls)](https://hub.docker.com/r/emqx/mqttx-web)
[![Docker CLI Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-cli?label=Docker%20CLI%20Pulls)](https://hub.docker.com/r/emqx/mqttx-cli)  

[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/)
[![Discord](https://img.shields.io/badge/Discord-MQTTX-5865F2?logo=discord)](https://discord.gg/xYGf3fQnES)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![X](https://img.shields.io/badge/Follow-EMQTech-000000?logo=x&logoColor=white)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app) is an open-source, cross-platform MQTT client toolbox from EMQ for developing and troubleshooting IoT applications. MQTTX Desktop provides connection management and messaging on macOS, Windows, and Linux. Its built-in MQTTX Agent is an AI Agent for natural-language MQTTX operation, covering connections, messages, data processing, and troubleshooting. With a supplied device protocol, it also supports status queries, control commands, and inspection of device reports. Dashboard provides independent data visualization with live readings and trend charts. MQTTX CLI supports terminal workflows, benchmarks, and data simulation; MQTTX Web connects over WebSocket from your browser.

> [MQTT](https://www.emqx.com/en/blog/the-easiest-guide-to-getting-started-with-mqtt) (MQ Telemetry Transport) is a lightweight publish/subscribe messaging protocol designed for constrained devices and for low-bandwidth, high-latency, or unreliable networks.

![mqttx-preview](./assets/mqttx-preview.png)

## Features

- Desktop and CLI support MQTT 3.1, 3.1.1, and 5.0 over TCP, TLS, and WebSocket.
- Organize desktop connections into groups, search messages, and import or export connection settings.
- Encode and decode desktop payloads with JSON, Base64, Hex, Protobuf/Avro schemas, and other codecs, and decompress GZIP messages.
- Test application logic with desktop scripts and timed messages.
- MQTTX Agent supports connection management, messaging, data processing, and troubleshooting through natural language, including device-status queries and command interactions based on supplied MQTT protocols.
- Dashboard visualizes device readings and trends; the Topic Tree, Traffic Monitor, and Payload Inspector provide topic, traffic, and payload analysis.
- Run benchmarks, simulate IoT data, and use stdin and pipes in shell scripts or CI workflows with CLI.
- Use MQTT 3.1.1 and 5.0 over WebSocket in the Web client, with optional Docker self-hosting.

<details>
<summary>All features</summary>

### MQTTX Desktop

A graphical client for interactive debugging and message analysis on macOS, Windows, and Linux.

- Connect over TCP, TLS, WebSocket, or secure WebSocket using MQTT 3.1, 3.1.1, or 5.0.
- Set MQTT 5.0 user properties on connect, publish, and subscribe, authenticate with SCRAM, and view the broker's CONNACK Response Information.
- MQTTX Agent supports connection management, messaging, data processing, and troubleshooting through natural language, including device-status queries and command interactions based on supplied MQTT protocols.
- Encode and decode Plaintext, JSON, Base64, Hex, CBOR, and MsgPack payloads, use Protobuf and Avro schemas, and decompress incoming GZIP messages.
- Transform messages with scripts and publish messages on a timer.
- Dashboard visualizes device readings and trends; the Topic Tree, Traffic Monitor, and Payload Inspector provide topic, traffic, and payload analysis. The Payload Inspector includes JSON tree and diff views.
- Group connections, search messages, and keep a separate publish area and history for each connection.
- Import and export connections as JSON, CSV, Excel, XML, or YAML; JSON backups preserve connection groups.
- Choose Light, Dark, or Night themes and use English, Simplified Chinese, Japanese, Turkish, Hungarian, or Korean.

### MQTTX CLI

A command-line client for terminal debugging, shell scripts, CI automation, and performance testing.

- Connect, publish, and subscribe with `mqttx conn`, `mqttx pub`, and `mqttx sub`, with MQTT 3.1, 3.1.1, and 5.0 over TCP, TLS, and WebSocket.
- Run connection, publishing, and subscription benchmarks with `mqttx bench`, and generate IoT test data with `mqttx simulate`.
- Read messages from stdin, pipe received messages to other tools, and save or load connection options as JSON or YAML.
- Encode and decode JSON, Base64, Hex, CBOR, and MsgPack payloads, with Protobuf and Avro schema support.
- Use the [MQTTX CLI skill](./skills/mqttx-cli/SKILL.md) to let external AI agents run MQTT tests and diagnostics.

### MQTTX Web

A browser client for quick tests without installing a desktop app. Open the [online client](https://mqttx.app/web-client) to get started.

- Use MQTT 3.1.1 and 5.0 over WebSocket (`ws://` or `wss://`). HTTPS pages require `wss://`.
- Manage multiple connections and subscriptions, and view sent and received messages in a chat-style interface.
- [Deploy with Docker](./web/README.md#deploy-from-docker-image) to host the client yourself.

</details>

## Quick Start

### MQTTX Desktop

Download the package for your platform from [GitHub Releases](https://github.com/emqx/MQTTX/releases) or the [EMQ download site](https://www.emqx.com/downloads/MQTTX/).

[![Download on the Mac App Store](./assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)
[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

On macOS, you can also install MQTTX with [Homebrew](https://formulae.brew.sh/cask/mqttx):

```shell
brew install --cask mqttx
```

1. Open MQTTX, click `+` in the left sidebar, and fill in the required fields.
2. Enter your broker address and click `Connect`. Use your own broker or the free [public MQTT 5.0 broker](https://www.emqx.com/en/mqtt/public-mqtt5-broker) provided by [EMQX Cloud](https://www.emqx.com/en/cloud) at `broker.emqx.io` (TCP port `1883`, TLS port `8883`).
3. Subscribe to a topic, then publish a JSON message to the same topic. The received message appears in the message list.

![mqttx-gif](./assets/mqttx-gif.gif)

### MQTTX CLI

Install MQTTX CLI with the install script:

macOS / Linux:

```shell
curl -fsSL https://emqx.sh/mqttx | sh
```

Windows (PowerShell):

```powershell
irm https://emqx.sh/mqttx.ps1 | iex
```

Homebrew, npm, Docker and standalone binaries: see the [installation docs](https://mqttx.app/docs/cli/downloading-and-installation).

After installation, subscribe in one terminal and publish in another. The subscriber receives the JSON message:

```shell
# Terminal 1: subscribe
mqttx sub -h broker.emqx.io -t 'mqttx/quickstart'

# Terminal 2: publish
mqttx pub -h broker.emqx.io -t 'mqttx/quickstart' -m '{"temperature":23.5}'
```

See the [CLI documentation](https://mqttx.app/docs/cli) for more commands, benchmarks, and data simulation.

### MQTTX Web

Open the [online client](https://mqttx.app/web-client) in your browser and connect to a broker over `ws://` or `wss://`. HTTPS pages require `wss://`. To host the client yourself, use Docker:

```shell
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

See the [Web README](./web/README.md) for deployment and usage instructions.

## Dashboard

Dashboard visualizes MQTT message fields as numeric readings, gauges, and trend charts. Current values and ranges support device checks, while time-range queries reveal changes in messages stored locally by MQTTX.

Dashboards are configured directly in **Viewer → Dashboard**, independently of MQTTX Agent. Widgets bind to a connection, topic filter, and payload field and update as subscribed messages arrive. Drag-and-resize controls arrange measurements in one view.

The [Dashboard guide](./docs/desktop/en/use-desktop/dashboard.md) covers manual setup and data-source options.

## AI Agent Tools

### MQTTX Agent

MQTTX Agent is an AI Agent built into the desktop client for managing connections, exchanging messages, processing data, and troubleshooting through natural language. It carries out multi-step MQTT operations and analyzes connection details, messages, and logs, reducing repetitive configuration and manual checks. The Agent also generates client code, test data, and payload-processing logic for device integration. With the device's MQTT protocol supplied, it reads status, publishes commands that match user intent, and checks subsequent reports, reducing topic lookups, payload assembly, and manual message comparison.

For example:

> On Factory Demo, subscribe to `factory/+/telemetry`. Inspect the recent messages and explain which payload fields are present.

Configuration in **Settings → MQTTX Agent** includes the provider's API host, key, and model. The left sidebar opens the Agent, and `Cmd/Ctrl + J` opens its floating window. **Ask before actions** requires approval for changes and MCP tool calls. **Auto** skips these prompts; script tests always require approval.

Built-in Skills provide task guidance, and configured MCP servers extend the conversation with external tools. Conversations and tool results go to the configured model provider. The [MQTTX Agent guide](./docs/desktop/en/use-desktop/agent.md) covers setup, examples, permissions, and privacy.

### MQTTX CLI Skill

<details>
<summary>Install or update MQTTX CLI</summary>

[INSTALL.md](./INSTALL.md) provides installation and update instructions for agents, including environment detection, package selection, and version verification. Give your agent this prompt:

> Read https://raw.githubusercontent.com/emqx/MQTTX/main/INSTALL.md and follow its instructions to install or update MQTTX CLI for this environment. Verify the executable path and version.

</details>

The [mqttx-cli skill](./skills/mqttx-cli/SKILL.md) helps agents use MQTTX CLI for connection checks, messaging, MQTT 5 features, TLS/authentication, payload codecs, benchmarks, data simulation, and troubleshooting.

Install it with the [Skills CLI](https://github.com/vercel-labs/skills):

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

To install from a local checkout, run `npx skills add . --skill mqttx-cli` from the repository root. You can also copy the entire `skills/mqttx-cli` directory (including `references`) into your agent's supported skills directory, or ask the agent to read its `SKILL.md` directly.

Once installed, try a task such as:

> Use the mqttx-cli skill to verify a publish/subscribe round trip against my local broker at 127.0.0.1:1883. Use a unique topic under mqttx-test/, finish within 15 seconds, and report the result.

## EMQX

MQTTX works with any MQTT broker and pairs especially well with [EMQX](https://www.emqx.com/en/products/emqx). Connect to EMQX or EMQX Cloud in a few clicks to debug your applications and explore broker features.

- [Start a 14-day free trial of EMQX Cloud](https://www.emqx.com/en/try?product=cloud)
- [Download EMQX and run it locally](https://www.emqx.com/en/try?product=enterprise)

## Docs & Community

- Guides: [Desktop](https://mqttx.app/docs), [CLI](https://mqttx.app/docs/cli), [Web](https://mqttx.app/docs/web), and the [desktop manual](./docs/manual.md).
- [MQTT Programming](https://www.emqx.com/en/blog/category/mqtt-programming)

  A blog series on getting started with MQTT in PHP, Node.js, Python, Go, and other languages.

- [MQTT SDKs](https://www.emqx.com/en/mqtt-client-sdk)

  A curated list of popular MQTT client SDKs for many languages, with code examples.

- [Public MQTT test server](https://www.emqx.com/en/mqtt/public-mqtt5-broker).
- Ask questions and share ideas in [GitHub Discussions](https://github.com/emqx/MQTTX/discussions) or [Discord](https://discord.gg/xYGf3fQnES).
- Follow [EMQTech on X](https://x.com/EMQTech) and [EMQX on YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q).

## Development

These steps are for the desktop app.

Use the Node.js version in [`.nvmrc`](./.nvmrc) (currently v22). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repository root.

```shell
git clone git@github.com:emqx/MQTTX.git
cd MQTTX
nvm use
yarn install
yarn run electron:serve
```

Build installers for Windows, Linux, and macOS:

```shell
yarn run electron:build
```

Installers are written to `dist_electron`.

<details>
<summary>Platform builds</summary>

```shell
# For Windows
yarn run electron:build-win

# For Linux
yarn run electron:build-linux

# For macOS
yarn run electron:build-mac
```

</details>

For CLI and Web development, see the [CLI README](./cli/README.md#develop) and [Web README](./web/README.md#develop). Read the [Contributing Guide](./.github/CONTRIBUTING.md) before opening a pull request.

The desktop app is built with [Electron](https://electronjs.org/), [Vue](https://vuejs.org/) + [Element](https://element.eleme.io), [TypeScript](https://www.typescriptlang.org/), [TypeORM](https://github.com/typeorm/typeorm), [SQLite](https://github.com/TryGhost/node-sqlite3), and [MQTT.js](https://github.com/mqttjs/MQTT.js).

## License

Apache License 2.0, see [LICENSE](./LICENSE).
