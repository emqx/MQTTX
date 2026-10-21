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
[![Twitter Follows](https://img.shields.io/twitter/follow/EMQTech?label=Twitter%20Follows)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app) is an open-source, cross-platform [MQTT 5.0](https://www.emqx.com/en/blog/introduction-to-mqtt-5) client toolbox from [EMQ](https://www.emqx.com/en) for developing, testing, and troubleshooting IoT applications. [MQTTX Desktop](https://mqttx.app/docs) runs on macOS, Windows, and Linux, with a chat-style interface for managing multiple connections and subscriptions and a built-in MQTTX Agent that lets you create connections, exchange messages, and troubleshoot using natural language. [MQTTX CLI](https://mqttx.app/docs/cli) provides messaging, benchmarks, and data simulation for terminal use and automated workflows, while [MQTTX Web](https://mqttx.app/web-client) lets you debug MQTT services over WebSocket in the browser without installing a desktop application.

![mqttx-preview](./assets/mqttx-preview.png)

## Features

- Desktop and CLI support MQTT 3.1, 3.1.1, and 5.0 over TCP, TLS, and WebSocket.
- Organize desktop connections into groups, search messages, and import or export connection settings.
- Encode and decode desktop payloads with JSON, Base64, Hex, Protobuf/Avro schemas, and other codecs, and decompress GZIP messages.
- Test application logic with desktop scripts and timed messages, and analyze data with the Topic Tree, Dashboard, and Payload Inspector.
- Run benchmarks, simulate IoT data, and use stdin and pipes in shell scripts or CI workflows with CLI.
- Use MQTT 3.1.1 and 5.0 over WebSocket in the Web client, with optional Docker self-hosting.

## Quick Start

### MQTTX Desktop

Download an installer for your platform from [GitHub Releases](https://github.com/emqx/MQTTX/releases) or the [EMQ download site](https://www.emqx.com/downloads/MQTTX/). You can also install from the [Mac App Store](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12), [Snap](https://snapcraft.io/mqttx), or [Flathub](https://flathub.org/apps/details/com.emqx.MQTTX). On macOS, Homebrew is another option:

```shell
brew install --cask mqttx
```

1. Open MQTTX and click `+` in the left sidebar to create a connection.
2. Enter your broker address and click `Connect`. Use your own broker or the public test server `broker.emqx.io` (TCP port `1883`, TLS port `8883`).
3. Subscribe to a topic, then publish a JSON message to the same topic. The received message appears in the message list.

![mqttx-gif](./assets/mqttx-gif.gif)

### MQTTX CLI

Choose one installation method. Before using npm, check its Node.js requirement in the [installation guide](./INSTALL.md#npm). Standalone binaries are also available on the [downloads page](https://mqttx.app/downloads).

```shell
# macOS (Homebrew)
brew install emqx/mqttx/mqttx-cli

# Or use npm
npm install --global mqttx-cli
```

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

## AI Assistance

### MQTTX Agent in Desktop

Enable and configure a model in **Settings → MQTTX Agent**, then open it from the left sidebar or use `Cmd/Ctrl + J` for a floating window. See the [MQTTX Agent guide](./docs/desktop/en/use-desktop/agent.md) for Skills, MCP, action approval, and model configuration.

### External AI agents with the CLI skill

Install the [mqttx-cli skill](./skills/mqttx-cli/SKILL.md) for your AI agent so it can use MQTTX CLI for MQTT tests and troubleshooting:

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

Once installed, try a task such as:

> Use the mqttx-cli skill to verify a publish/subscribe round trip against my local broker at 127.0.0.1:1883. Use a unique topic under mqttx-test/, finish within 15 seconds, and report the result.

See [INSTALL.md](./INSTALL.md) to install or update CLI, and the [CLI README](./cli/README.md#ai-agent-support) for other skill installation methods.

## Documentation and Community

- Guides: [Desktop](https://mqttx.app/docs), [CLI](https://mqttx.app/docs/cli), [Web](https://mqttx.app/docs/web), and the [desktop manual](./docs/manual.md).
- Learning resources: [MQTT programming](https://www.emqx.com/en/blog/category/mqtt-programming) and [MQTT SDKs and code examples](https://www.emqx.com/en/mqtt-client-sdk).
- Brokers: [public MQTT test server](https://www.emqx.com/en/mqtt/public-mqtt5-broker), [run EMQX locally](https://www.emqx.com/en/try?product=enterprise), or [try EMQX Cloud](https://www.emqx.com/en/try?product=cloud).
- Ask questions and share ideas in [GitHub Discussions](https://github.com/emqx/MQTTX/discussions) or [Discord](https://discord.gg/xYGf3fQnES).
- Follow [EMQTech on X](https://x.com/EMQTech) and [EMQX on YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q).

## Development and Contributing

These steps are for the desktop app. Use the Node.js version in [`.nvmrc`](./.nvmrc) and run `nvm use` from the repository root before development:

```shell
git clone git@github.com:emqx/MQTTX.git
cd MQTTX
nvm use
yarn install
yarn run electron:serve
```

Build installers for all platforms with `yarn run electron:build`, or use the `electron:build-win`, `electron:build-linux`, or `electron:build-mac` Yarn script for one platform. Output is written to `dist_electron`.

For CLI and Web development, see the [CLI README](./cli/README.md#develop) and [Web README](./web/README.md#develop). Read the [Contributing Guide](./.github/CONTRIBUTING.md) before opening a pull request.

The desktop app is built with [Electron](https://electronjs.org/), [Vue](https://vuejs.org/) + [Element](https://element.eleme.io), [TypeScript](https://www.typescriptlang.org/), [TypeORM](https://github.com/typeorm/typeorm), [SQLite](https://github.com/TryGhost/node-sqlite3), and [MQTT.js](https://github.com/mqttjs/MQTT.js).

## License

Apache License 2.0, see [LICENSE](./LICENSE).
