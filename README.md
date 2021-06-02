<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo"/>

# MQTT X

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667) [![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack Invite](<https://slack-invite.emqx.io/badge.svg>)](https://slack-invite.emqx.io)
[![Reddit](https://img.shields.io/badge/Reddit-EMQ%20X-orange?logo=reddit)](https://www.reddit.com/r/emqx/)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)
[![Community](https://img.shields.io/badge/Community-MQTT%20X-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)

English | [简体中文](./README-CN.md) | [日本語](./README-JP.md)

---

[MQTT X](https://mqttx.app) is a cross-platform MQTT 5.0 client tool open sourced by [EMQ](https://emqx.io), which can run on macOS, Linux and Windows, and supports formatting MQTT payload.

[MQTT X](https://mqttx.app) simplifies the operation logic of the page with the help of chatting software. The user can quickly create a connection to save and establish multiple connection clients at the same time. It is convenient for the user to quickly test the connection of MQTT/TCP、MQTT/TLS, MQTT/WebSocket Publish / Subscribe functions and other features.

> [MQTT](http://mqtt.org/faq) stands for MQ Telemetry Transport. It is a publish/subscribe, extremely simple and lightweight messaging protocol, designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

## Preview

![mqttx-preview](./assets/mqttx-preview.png)

## Installation

Currently available for download from these app stores

### MacOS App Store

[![Get it from the Snap Store](./assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

### Linux

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)

### Released Packages

Download from [GitHub Releases](https://github.com/emqx/MQTTX/releases) and install it.

Alternative, you can download [here](https://www.emqx.io/downloads/MQTTX/).

## Usage

See our [blog](https://www.emqx.io/blog/mqtt-x-guideline) or [manual](./docs/manual.md) for details.

1. MQTT Broker preparation.

    - If you do not need the MQTT Broker deployed locally, you can use the online public version of [EMQ X](https://github.com/emqx/emqx) for quick test;

        ```shell
        Broker IP: broker.emqx.io
        Broker TCP Port: 1883
        Broker SSL Port: 8883
        ```

    - If you plan to deploy a MQTT Broker running locally, we recommend you to download [EMQ X](https://github.com/emqx/emqx/releases) for installation. EMQ X broker is a fully open source, highly scalable, highly available distributed MQTT messaging broker for IoT, M2M and Mobile applications that can handle tens of millions of concurrent clients.

2. Connection configuration. Click the `+` button in the left menu bar and fill in the corresponding required fields in the form.

3. After the connection information is configured, click the `Connect` button in the upper right corner to create a connection and connect to MQTT Broker.

4. After the MQTT is connected successfully, you can perform MQTT publish and subscription tests.

![mqttx-gif](./assets/mqttx-gif.gif)

## Community

The MQTT X community can be found on [GitHub Discussions](https://github.com/emqx/MQTTX/discussions), where you can ask questions, voice ideas, and share your projects.

To chat with other community members you can join the [EMQ X Slack](https://slack-invite.emqx.io).

## Develop

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

# For MacOS
yarn run electron:build-mac
```

## Contributing

Please make sure to read the [Contributing Guide](https://github.com/emqx/MQTTX/blob/master/.github/CONTRIBUTING.md) before making a pull request.

## Technology Stack

- [Electron](https://electronjs.org/)
- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [Lowdb](https://github.com/typicode/lowdb)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
