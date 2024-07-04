<img src="../assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

# MQTTX Web

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![platforms](https://img.shields.io/badge/platforms-Browser-lightgrey)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)

[![GitHub Downloads](https://img.shields.io/github/downloads/emqx/MQTTX/total?label=GitHub%20Downloads)](https://mqttx.app/downloads)
[![Docker Web Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-web?label=Docker%20Web%20Pulls)](https://hub.docker.com/r/emqx/mqttx-web)
[![Docker CLI Pulls](https://img.shields.io/docker/pulls/emqx/mqttx-cli?label=Docker%20CLI%20Pulls)](https://hub.docker.com/r/emqx/mqttx-cli)

[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/)
[![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter Follows](https://img.shields.io/twitter/follow/EMQTech?label=Twitter%20Follows)](https://twitter.com/EMQTech)

---

[MQTTX Web](https://mqttx.app) is an open source MQTT 5.0 browser client and an online MQTT WebSocket client tool. Use WebSocket to connect to MQTT in your browser to help you develop and debug your MQTT services and applications faster without having to download and install MQTTX locally.

> [MQTT](https://www.emqx.com/en/blog/the-easiest-guide-to-getting-started-with-mqtt) stands for MQ Telemetry Transport. It is a publish/subscribe, extremely simple and lightweight messaging protocol, designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

## Preview

![mqttx-preview](../assets/mqttx-web-preview.png)

## Documentation

For introduction, and usage, please refer to the [MQTTX Web Documentation](https://mqttx.app/docs/web).

## Usage

Visit MQTT WebSocket Client (MQTTX Web): <https://mqttx.app/web-client>

## Deploy from Docker Image

```bash
docker pull emqx/mqttx-web:latest

docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

## Manual compilation and deployment

If you need to make some personalized settings, such as changing the default connection path, deployment path, etc., you can achieve these modifications by editing the .env configuration file and compiling manually. For information on how to compile the project and package docker images, you can refer to the [development section](#Develop).

## Better Together with EMQX

MQTTX is designed to connect to test MQTT Brokers such as EMQX, The one-click connection and simple graphical interface make it easy to connect to EMQX or EMQX Cloud to debug and explore functional features.

[Sign up EMQX Cloud for 14 days free trial](https://www.emqx.com/en/try?product=cloud)

[Download EMQX locally right now](https://www.emqx.com/en/try?product=enterprise)

## Get Involved

- Follow [@EMQTech on Twitter](https://twitter.com/EMQTech).
- If you have a specific question, check out our [discussion forums](https://github.com/emqx/emqx/discussions).
- For general discussions, join us on the [official Discord](https://discord.gg/xYGf3fQnES) team.
- Keep updated on [EMQX YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q) by subscribing.

## Develop

Recommended version for Node environment:

- v16.\*.\*

```shell
# Clone the repository
git clone git@github.com:emqx/MQTTX.git

# Install dependencies
cd MQTTX/web
yarn install

# Compiles and hot-reloads for development
yarn run serve

# Compiles and minifies for production
yarn run build

# Compiles for production & serve generated files of site locally
yarn run start

# Compiles and prepares for Docker containerization
yarn run build:docker

# Build Docker image
docker build -t mqttx-web .

# Run Docker image
docker run -p 80:80 mqttx-web
```

## Contributing

Please make sure to read the [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md) before making a pull request.

## Technology Stack

- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
