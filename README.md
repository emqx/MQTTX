<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)

[![GitHub Downloads](https://img.shields.io/github/downloads/emqx/MQTTX/total?label=GitHub%20Downloads)](https://mqttx.app/downloads)
[![Docker Web Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-web?label=Docker%20Web%20Pulls)](https://hub.docker.com/r/emqx/mqttx-web)
[![Docker CLI Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-cli?label=Docker%20CLI%20Pulls)](https://hub.docker.com/r/emqx/mqttx-cli)  

[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/)
[![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter Follows](https://img.shields.io/twitter/follow/EMQTech?label=Twitter%20Follows)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app) is an open-source [MQTT 5.0](https://www.emqx.com/en/blog/introduction-to-mqtt-5) client from [EMQ](https://www.emqx.com/en), available as a [desktop app](https://mqttx.app/docs) for macOS, Linux, and Windows, a [command-line tool](https://mqttx.app/docs/cli) for scripting and benchmarks, and a [web client](https://mqttx.app/web-client) that runs in the browser. Its chat-style interface lets you work with multiple connections at once and quickly test publishing, subscribing, and other MQTT features over TCP, TLS, and WebSocket.

> [MQTT](https://www.emqx.com/en/blog/the-easiest-guide-to-getting-started-with-mqtt) (MQ Telemetry Transport) is a lightweight publish/subscribe messaging protocol designed for constrained devices and for low-bandwidth, high-latency, or unreliable networks.

## Features

Highlights of the desktop app:

- **Protocols**: MQTT 3.1, 3.1.1, and 5.0 over TCP, TLS, WebSocket, and secure WebSocket.
- **MQTT 5.0**: user properties on connect, publish, and subscribe; SCRAM enhanced authentication.
- **Payloads**: Plaintext, JSON, Base64, Hex, CBOR, and MsgPack, with Protobuf and Avro schema support.
- **Automation**: scripts that transform payloads on publish or receive, and timed messages.
- **Viewer**: Topic Tree, Traffic Monitor, and a Payload Inspector with a JSON tree and message diff.
- **Workflow**: message search, publish topic history, and connection groups.
- **Data**: import and export connections as JSON, CSV, Excel, XML, or YAML.
- **Personalization**: light, dark, and night themes; English, 简体中文, 日本語, Türkçe, Magyar, and 한국어.

## Preview

![mqttx-preview](./assets/mqttx-preview.png)

## Installation

The desktop app is available from the following sources.

### macOS App Store

[![Download on the Mac App Store](./assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

### Homebrew

On macOS, you can also install MQTTX with [Homebrew](https://formulae.brew.sh/cask/mqttx):

```shell
brew install --cask mqttx
```

### Linux

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

### Released Packages

Download the package for your platform from [GitHub Releases](https://github.com/emqx/MQTTX/releases) or the [EMQ download site](https://www.emqx.com/downloads/MQTTX/).

### MQTTX CLI

Install with Homebrew on macOS, or with npm on any platform:

```shell
brew install emqx/mqttx/mqttx-cli
npm install --global mqttx-cli
```

Standalone binaries and a Docker image are also available. See the [MQTTX CLI README](./cli/README.md) or the [MQTTX downloads page](https://mqttx.app/downloads).

### MQTTX Web

Open <https://mqttx.app/web-client> in your browser, or host your own copy with Docker:

```shell
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

See the [MQTTX Web README](./web/README.md) for details.

## AI Agent Support

### Install or update MQTTX CLI

[INSTALL.md](./INSTALL.md) provides installation and update instructions for agents, including environment detection, package selection, and version verification. Give your agent this prompt:

> Read https://raw.githubusercontent.com/emqx/MQTTX/main/INSTALL.md and follow its instructions to install or update MQTTX CLI for this environment. Verify the executable path and version.

### Use the MQTTX CLI skill

The [mqttx-cli skill](./skills/mqttx-cli/SKILL.md) helps agents use MQTTX CLI for connection checks, messaging, MQTT 5 features, TLS/authentication, payload codecs, benchmarks, data simulation, and troubleshooting.

Install it with the [Skills CLI](https://github.com/vercel-labs/skills):

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

To install from a local checkout, run `npx skills add . --skill mqttx-cli` from the repository root. You can also copy the entire `skills/mqttx-cli` directory (including `references`) into your agent's supported skills directory, or ask the agent to read its `SKILL.md` directly.

Once installed, try a task such as:

> Use the mqttx-cli skill to verify a publish/subscribe round trip against my local broker at 127.0.0.1:1883. Use a unique topic under mqttx-test/, finish within 15 seconds, and report the result.

## Usage

For the full guide, see the [documentation](https://mqttx.app/docs) or the [manual](./docs/manual.md).

1. Prepare an MQTT broker.

    - To get started without a local deployment, use the free [public MQTT 5.0 broker](https://www.emqx.com/en/mqtt/public-mqtt5-broker) provided by [EMQX Cloud](https://www.emqx.com/en/cloud):

        ```text
        Host: broker.emqx.io
        TCP port: 1883
        SSL/TLS port: 8883
        ```

    - To run a broker locally, we recommend [EMQX](https://www.emqx.com/en/products/emqx), an open-source, cloud-native, distributed MQTT broker for IoT.

2. Click the `+` button in the left sidebar and fill in the required fields.

3. Click `Connect` in the upper-right corner to connect to the broker.

4. Once connected, subscribe to topics and publish messages to test your setup.

![mqttx-gif](./assets/mqttx-gif.gif)

## Better Together with EMQX

MQTTX works with any MQTT broker and pairs especially well with EMQX. Connect to EMQX or EMQX Cloud in a few clicks to debug your applications and explore broker features.

- [Start a 14-day free trial of EMQX Cloud](https://www.emqx.com/en/try?product=cloud)
- [Download EMQX and run it locally](https://www.emqx.com/en/try?product=enterprise)

## Get Involved

- Ask questions and share ideas in [GitHub Discussions](https://github.com/emqx/MQTTX/discussions).
- Chat with the community on [Discord](https://discord.gg/xYGf3fQnES).
- Follow [@EMQTech on X](https://x.com/EMQTech).
- Subscribe to [EMQX on YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q).

## Develop

These steps are for the desktop app. For the other editions, see the [CLI README](./cli/README.md#develop) and the [Web README](./web/README.md#develop).

Use the Node.js version in [`.nvmrc`](./.nvmrc) (currently v22). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the repository root.

``` shell
# Clone the repository
git clone git@github.com:emqx/MQTTX.git

# Install dependencies
cd MQTTX
yarn install

# Run the app in development mode with hot reload
yarn run electron:serve

# Build installers for Windows, Linux, and macOS
yarn run electron:build
```

Installers are written to the `dist_electron` directory. To build for a single platform, run one of the following:

```shell
# For Windows
yarn run electron:build-win

# For Linux
yarn run electron:build-linux

# For macOS
yarn run electron:build-mac
```

## Contributing

Please read the [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md) before opening a pull request.

## Technology Stack

- [Electron](https://electronjs.org/)
- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [TypeORM](https://github.com/typeorm/typeorm)
- [SQLite](https://github.com/TryGhost/node-sqlite3)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## Resources

- [MQTT Programming](https://www.emqx.com/en/blog/category/mqtt-programming)

  A blog series on getting started with MQTT in PHP, Node.js, Python, Go, and other languages.

- [MQTT SDKs](https://www.emqx.com/en/mqtt-client-sdk)

  A curated list of popular MQTT client SDKs for many languages, with code examples.

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
