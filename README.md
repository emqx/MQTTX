<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?label=Release&color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![GitHub Downloads](https://img.shields.io/github/downloads/emqx/MQTTX/total?label=GitHub%20Downloads)](https://mqttx.app/downloads)
[![Docker Web pulls](https://img.shields.io/docker/pulls/emqx/mqttx-web?label=Docker%20Web%20pulls)](https://hub.docker.com/r/emqx/mqttx-web)
[![Docker CLI pulls](https://img.shields.io/docker/pulls/emqx/mqttx-cli?label=Docker%20CLI%20pulls)](https://hub.docker.com/r/emqx/mqttx-cli)
[![Community](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter Follows](https://img.shields.io/twitter/follow/EMQTech?label=Twitter%20Follows)](https://twitter.com/EMQTech)

---

[MQTTX](https://mqttx.app/): A `Powerful` and `All-in-One` MQTT 5.0 Client Toolbox for Desktop, CLI, and WebSocket. Developed by EMQ, this cross-platform tool streamlines the testing and development of MQTT-based applications.

> [MQTT](https://mqtt.org/faq) stands for MQ Telemetry Transport. It is a publish/subscribe, straightforward, lightweight messaging protocol designed for constrained devices and low bandwidth, high latency, or unreliable networks.

![mqttx-preview](./assets/mqttx-preview.png)

## 📥 Downloads

MQTTX is available across a variety of platforms, offering tailored solutions for your needs:

- **Desktop Applications**: For macOS, Windows, and Linux.
- **CLI Tools**: Compatible with macOS, Windows, and Linux.
- **Web Application (WebSocket)**: Easily accessible through any web browser.
- **Docker**: Docker images specifically for Web and CLI versions deployed on any platform.

**👉 [Download MQTTX Now](https://mqttx.app/downloads)** - Click here for detailed download links and installation instructions for all supported platforms.

## 🌟 Why MQTTX

MQTTX makes developing and testing MQTT applications faster and easier.

🔨 **All-in-One**

Offers three convenient versions - Desktop, CLI, and Web - designed to adapt to your preferred work environment, with cross-platform compatibility (macOS, Linux, Windows).

🛠️ **Rich Developer Features**

Beyond basic MQTT operations, MQTTX comes ready with features such as Scripts, Benchmarks, and IoT Data Simulation, providing a comprehensive MQTT solution.

🔄 **MQTT Compatibility**

MQTTX is 100% compliant with MQTT 5.0, 3.1.1, and 3.1. We consistently keep up with the latest MQTT standards, ensuring testing features fully meet and comply with the protocol's requirements.

👀 Want More? Explore **[All Features](https://mqttx.app/features)**.

## 🚀 Get Started

MQTTX simplifies working with MQTT Brokers. For a complete understanding and detailed guidance:

**📖 [Explore MQTTX Documentation](https://mqttx.app/docs)** - Click here for step-by-step instructions and more insights on MQTTX.

### Prepare an MQTT Broker

- **Public Broker for Testing**: If you don't need a local MQTT Broker, use the [public MQTT 5.0 Broker](https://www.emqx.com/en/mqtt/public-mqtt5-broker) provided by [EMQX Cloud](https://www.emqx.com/en/cloud).

  ```shell
  Broker IP: broker.emqx.io
  Broker TCP Port: 1883
  Broker SSL Port: 8883
  ```

- **Local Broker**: For a local setup, [EMQX](https://www.emqx.com/en/products/emqx) is recommended. It's an open-source, cloud-native, distributed MQTT Broker for IoT.

### Graphical User Interface

1. **Configure Your Connect**

   Access the MQTTX interface and click the `+` button in the left menu bar. Fill in the required fields in the connection form.

2. **Connect to the Broker**

   Once the connection details are set, click the `Connect` button in the upper right corner to establish a connection with your MQTT Broker.

3. **Publish and Subscribe**

   You can now test MQTT publish and subscription functions with a successful connection.

_For a more interactive understanding, check out this MQTTX demonstration:_

![mqttx-gif](./assets/mqttx-gif.gif)

### Command Line Interface

1. **Connect**

   ```shell
   mqttx conn -h 'broker.emqx.io' -p 1883 -u 'admin' -P 'public'
   ```

2. **Subscribe**

   ```shell
   mqttx sub -t 'hello' -h 'broker.emqx.io' -p 1883
   ```

3. **Publish**

   Publish a single message.

   ```shell
   mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -m 'from MQTTX CLI'
   ```

   Publish multiple messages (multiline)

   ```shell
   mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -s -M
   ```

## 🔗 Learn More

Discover more about each version of MQTTX and find the one that fits your needs:

- [MQTTX Desktop](apps/desktop/README.md)
- [MQTTX CLI](apps/cli/README.md)
- [MQTTX Web](apps/web/README.md)

## 🌐 Better Together with EMQX

MQTTX enhances EMQX deployments, offering an intuitive client interface for robust MQTT solutions on any platform, and you can quickly deploy EMQX anywhere on-premises or in private, hybrid, and public clouds.

- [EMQX on AWS MarketPlace →](https://aws.amazon.com/marketplace/pp/prodview-cwa2e6xbrwtzi)
- [EMQX Kubernetes Operator →](https://www.emqx.com/en/emqx-kubernetes-operator)
- [EMQX Terraform →](https://www.emqx.com/en/emqx-terraform)

🔓 **Open Source**

```shell
docker pull emqx/emqx
docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8084:8084 -p 8883:8883 -p 18083:18083 emqx/emqx
```

- [Download more versions](https://www.emqx.io/downloads)

☁️ **Cloud Serverless**

Start for free with the cloud serverless MQTT messaging services built on EMQX—pay-as-you-go with the free tier of 1M session minutes/month.

- [Try Free](https://www.emqx.com/en/cloud/serverless-mqtt)

## 🌍 Join EMQ Community

- **Stay Updated**: Follow us on [Twitter @EMQTech](https://twitter.com/EMQTech) for the latest updates.
- **Ask Questions**: Visit our [discussion forums](https://github.com/emqx/emqx/discussions) for specific queries.
- **Join Discussions**: Connect with the community on our [official Discord](https://discord.gg/xYGf3fQnES).
- **Watch and Learn**: Subscribe to [EMQX YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q) for insightful content.

## 🛠️ Develop

Explore and contribute to MQTTX development. For setup and build instructions, refer to our development documentation.

**📄 [Development Documentation](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md)**

### Technology Stack

MQTTX is built using [Vue 3.0](https://v3.vuejs.org/), [Vite](https://vitejs.dev/), [Electron](https://www.electronjs.org/), [TypeScript](https://www.typescriptlang.org/), [MQTT.js](https://github.com/mqttjs/MQTT.js) and employs a [Monorepo](https://en.wikipedia.org/wiki/Monorepo) architecture for project management.

## 🤝 Contributing

Are you interested in making MQTTX better? Check out our **[Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md)** for guidelines on contributing.

## 📚 Resources

Enhance your MQTT knowledge and skills with these resources:

- **[MQTT Client Programming](https://www.emqx.com/en/blog/tag/mqtt-client-programming)**: Explore our blog series for getting started with MQTT in various programming languages, including PHP, Node.js, Python, Golang, and more.

- **[MQTT SDKs](https://www.emqx.com/en/mqtt-client-sdk)**: Discover popular MQTT client SDKs across different programming languages, complete with code examples for a quick understanding of MQTT client usage.

## 📄 License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
