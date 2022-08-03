<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![Community](https://img.shields.io/badge/Community-MQTT%20X-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)

English | [简体中文](./README-CN.md) | [日本語](./README-JP.md)

---

[MQTT X](https://mqttx.app) is a cross-platform MQTT 5.0 client tool open sourced by [EMQ](https://www.emqx.com/en), which can run on macOS, Linux and Windows, and supports formatting MQTT payload.

[MQTT X](https://mqttx.app) simplifies test operation with the help of a familiar, chat-like interface. It’s easy and quick to create multiple, simultaneous online MQTT client connections, and can test the connection, publishing, and subscription functions of MQTT/TCP, MQTT/TLS, MQTT/WebSocket as well as other MQTT protocol features.

> [MQTT](http://mqtt.org/faq) stands for MQ Telemetry Transport. It is a publish/subscribe, extremely simple and lightweight messaging protocol, designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

## Preview

![mqttx-preview](./assets/mqttx-preview.png)

## Installation

Currently available for download from these app stores

### macOS App Store

[![Download on the Mac App Store](./assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

### Homebrew

The macOS users can install MQTT X using [brew cask](https://formulae.brew.sh/cask/mqttx)

```shell
brew install --cask mqttx
```

### Linux

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

### Released Packages

Download from [GitHub Releases](https://github.com/emqx/MQTTX/releases) and install it.

Alternative, you can download [here](https://www.emqx.io/downloads/MQTTX/).

## Usage

See our [blog](https://www.emqx.io/blog/mqtt-x-guideline) or [manual](./docs/manual.md) for details.

1. Get MQTT Broker Ready.

    - If you do not need to deploy the MQTT Broker locally, you can use the public MQTT 5.0 Broker provided by [EMQX Cloud](https://www.emqx.com/en/cloud) for testing:

        ```shell
        Broker IP: broker.emqx.io
        Broker TCP Port: 1883
        Broker SSL Port: 8883
        ```

    - To run MQTT Broker locally, [EMQX](https://www.emqx.com/en/products/emqx) is recommended: An Open-Source, Cloud-Native, Distributed MQTT Broker for IoT.

2. Connection configuration. Click the `+` button in the left menu bar and fill in the corresponding required fields in the form.

3. After the connection information is configured, click the `Connect` button in the upper right corner to create a connection and connect to MQTT Broker.

4. After the MQTT is connected successfully, you can perform MQTT publish and subscription tests.

![mqttx-gif](./assets/mqttx-gif.gif)

## Better Together with EMQX

MQTT X is designed to connect to test MQTT Brokers such as EMQX, The one-click connection and simple graphical interface make it easy to connect to EMQX or EMQX Cloud to debug and explore functional features.

[Sign up EMQX Cloud for 14 days free trial](https://www.emqx.com/en/try?product=cloud)

[Download EMQX locally right now](https://www.emqx.com/en/try?product=enterprise)

## Get Involved

- Follow [@EMQTech on Twitter](https://twitter.com/EMQTech).
- If you have a specific question, check out our [discussion forums](https://github.com/emqx/emqx/discussions).
- For general discussions, join us on the [official Discord](https://discord.gg/xYGf3fQnES) team.
- Keep updated on [EMQX YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q) by subscribing.

## Develop

Recommended version for Node environment:

- v14.\*.\*

``` shell
# Clone
git clone git@github.com:emqx/MQTTX.git

# Install dependencies
cd MQTTX
yarn install

# Compiles and hot-reloads for development
yarn run electron:serve

# Compiles and minifies for production
yarn run electron:build
```

After the building is successful, the corresponding installation file for the successful build ing will appear in the `dist_electron` directory.

If you need to package it as an installation package for an independent operating system, please refer to the following command:

```shell
# For Windows
yarn run electron:build-win

# For Linux
yarn run electron:build-linux

# For macOS
yarn run electron:build-mac
```

## Contributing

Please make sure to read the [Contributing Guide](https://github.com/emqx/MQTTX/blob/master/.github/CONTRIBUTING.md) before making a pull request.

## Technology Stack

- [Electron](https://electronjs.org/)
- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [TypeORM](https://github.com/typeorm/typeorm)
- [SQLite](https://github.com/mapbox/node-sqlite3)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## Resources

- [MQTT client programming](https://www.emqx.com/en/blog/tag/mqtt-client-programming)

  A series of blogs to help developers get started quickly with MQTT in PHP, Node.js, Python, Golang, and other programming languages.

- [MQTT SDKs](https://www.emqx.com/en/mqtt-client-sdk)

  We have selected popular MQTT client SDKs in various programming languages and provided code examples to help you quickly understand the use of MQTT clients.

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
