# 🖥️ MQTTX Desktop

[MQTTX Desktop](https://mqttx.app) is a cross-platform MQTT 5.0 desktop client, open-sourced by EMQ. It runs on macOS, Linux, and Windows, offering a user-friendly graphical interface that simplifies testing operations with a familiar, chat-like interface.

## 📸 Preview

![mqttx-preview](../../assets/mqttx-preview.png)

## 📚 Documentation

For comprehensive guides on installation, configuration, and usage, visit the [MQTTX Desktop Documentation](https://mqttx.app/docs).

## 📥 Downloads

**[Download MQTTX Desktop](https://mqttx.app/downloads)** from the official downloads page, with versions available for macOS, Windows, and Linux.

## 🛠️ Usage

After installation, MQTTX Desktop is ready to use. Here's a quick overview of basic operations:

- **Create and Manage Connections**: Easily configure connections to various MQTT Brokers.
- **Publish and Subscribe**: Intuitively publish messages to topics and subscribe to receive messages.
- **Advanced Features**: Utilize scripts, benchmarks, and IoT data simulation for comprehensive testing and development.

For more detailed instructions and advanced features, check out the [Getting Started guide](https://mqttx.app/docs/get-started).

## ⚙️ Better Together with EMQX

MQTTX Desktop works seamlessly with EMQX, enhancing MQTT solutions with its graphical interface and advanced features.

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

Start with the cloud serverless MQTT messaging services built on EMQX. Get started for free, with a pay-as-you-go model offering 1M session minutes per month.

- [Try Free](https://www.emqx.com/en/cloud/serverless-mqtt)

## 🌍 Join EMQ Community

- **Stay Updated**: Follow [Twitter @EMQTech](https://twitter.com/EMQTech) for the latest updates.
- **Ask Questions**: Visit our [discussion forums](https://github.com/emqx/emqx/discussions) for specific queries.
- **Join Discussions**: Engage with the community on [official Discord](https://discord.gg/xYGf3fQnES).
- **Watch and Learn**: Subscribe to [EMQX YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q) for tutorials and insights.

## 🔨 Develop

Contribute to the development of MQTTX Desktop:

- Recommended Node version: `v18.17`.
- Ensure [pnpm](https://pnpm.io/) is installed for package management.

```shell
# Initial setup
git clone git@github.com:emqx/MQTTX.git
cd MQTTX

# Install dependencies using pnpm
pnpm install

# Development and production build commands
pnpm run dev:desktop
pnpm run build:desktop
```

For more information on development and contribution, see the [Development Documentation](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md).

## 🤝 Contributing

Interested in contributing to MQTTX Desktop? Read our [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md) for guidelines on how to contribute.

## 💡 Technology Stack

MQTTX Desktop is built using [Electron](https://www.electronjs.org/), [Vue](https://vuejs.org/), [TypeScript](https://www.typescriptlang.org/), and integrates with [MQTT.js](https://github.com/mqttjs/MQTT.js).

## ⚖️ License

MQTTX Desktop is licensed under the Apache License 2.0. For more details, see the [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
