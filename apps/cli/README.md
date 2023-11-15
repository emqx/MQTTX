# 💻 MQTTX CLI

[MQTTX CLI](https://mqttx.app/cli) is an open-source MQTT 5.0 command-line client that facilitates the development and debugging of MQTT services and applications. It's designed for quick, efficient operations without the need for a graphical interface.

## 📸 Preview

![mqttx-preview](https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-cli-preview.png)

## 📚 Documentation

For a comprehensive guide on installation, configuration, and usage, visit the [MQTTX CLI documentation](https://mqttx.app/docs/cli).

## 📥 Installation

Download MQTTX CLI from the [MQTTX Downloads page](https://mqttx.app/downloads) and follow the instructions for your specific platform.

## 🛠️ Quickstart Usage

After installation, you can start using MQTTX CLI right away. Here are some basic commands:

- **Connect to a Broker**

  ```shell
  mqttx conn -h 'broker.emqx.io' -p 1883 -u 'admin' -P 'public'
  ```

- **Subscribe to a Topic**

  ```shell
  mqttx sub -t 'hello' -h 'broker.emqx.io' -p 1883
  ```

- **Publish a Message**

  ```shell
  mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -m 'from MQTTX CLI'
  ```

For more detailed usage and advanced options, refer to the [Getting Started guide](https://mqttx.app/docs/cli/get-started).

## ⚙️ Better Together with EMQX

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

## 🔨 Develop

Set up your development environment for MQTTX CLI:

- Recommended Node version: `v18.17`.
- Ensure [pnpm](https://pnpm.io/) is installed for package management.

```shell
# Initial setup
git clone git@github.com:emqx/MQTTX.git
cd MQTTX

# Install dependencies using pnpm
pnpm install

# Development and production build commands
pnpm run dev:cli
pnpm run build:cli
```

For more extensive development guidelines and contribution details:

**📄 [Development Documentation](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md)**

## 🤝 Contributing

Contribute to MQTTX CLI's development by reading our [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md).

## 💡 Technology Stack

MQTTX CLI is built with [TypeScript](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/en/), [pkg](https://github.com/vercel/pkg), and [MQTT.js](https://github.com/mqttjs/MQTT.js).

## ⚖️ License

MQTTX CLI is under Apache License 2.0. For more details, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
