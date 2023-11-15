# 🌐 MQTTX Web

[MQTTX Web](https://mqttx.app) is an innovative and open-source MQTT 5.0 client tool available directly in your browser. It utilizes WebSocket technology for connecting to MQTT brokers, enabling you to develop, test, and debug MQTT services and applications quickly and efficiently without downloading or installing software.

## 📸 Preview

![mqttx-preview](../../assets/mqttx-web-preview.png)

## 📚 Documentation

Discover comprehensive details on MQTTX Web's features, configuration, and more in the [MQTTX Web Documentation](https://mqttx.app/docs/web).

## 🛠️ Usage

Experience MQTTX Web's capabilities firsthand:

Access the MQTT WebSocket Client (MQTTX Web) at [MQTTX Web Client](http://www.emqx.io/online-mqtt-client).

## 🐳 Deploy from Docker Image

Deploy MQTTX Web quickly and securely using Docker:

```bash
docker pull emqx/mqttx-web:latest
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

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

## 💻 Develop

Set up your development environment for MQTTX Web:

- Recommended Node version: `v18.17`.
- Make sure to have [pnpm](https://pnpm.io/) installed for package management.

```shell
# Initial setup
git clone git@github.com:emqx/MQTTX.git

# Install dependencies using pnpm
pnpm install

# Development and production build commands
pnpm run dev:web
pnpm run build:web
```

## 💻 Develop

Set up your development environment for MQTTX Web:

- Recommended Node version: `v18.17`.
- Ensure [pnpm](https://pnpm.io/) is installed for package management.

```shell
# Initial setup
git clone git@github.com:emqx/MQTTX.git
cd MQTTX/web

# Install dependencies using pnpm
pnpm install

# Development and production build commands
pnpm run dev:web
pnpm run build:web
```

For more extensive development guidelines and contribution details:

**📄 [Development Documentation](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md)**

## 🤝 Contributing

Contribute to MQTTX Web's development by reading our [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md).

## 💡 Technology Stack

MQTTX Web is crafted using [Vue](https://vuejs.org/), [Element UI](https://element.eleme.io), [TypeScript](https://www.typescriptlang.org/), and [MQTT.js](https://github.com/mqttjs/MQTT.js), providing a seamless and powerful user experience.

## ⚖️ License

MQTTX Web is under Apache License 2.0. For more details, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
