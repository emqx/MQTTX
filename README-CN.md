<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/badge/Discord-MQTTX-5865F2?logo=discord)](https://discord.gg/xYGf3fQnES)
[![社区](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ%20中文-FF0000?logo=youtube)](https://www.youtube.com/channel/UCir_r04HIsLjf2qqyZ4A8Cg)
[![X](https://img.shields.io/badge/Follow-EMQTech-000000?logo=x&logoColor=white)](https://x.com/EMQTech)

---

[MQTTX](https://mqttx.app/zh) 是 [EMQ](https://www.emqx.com/zh) 开源的跨平台 [MQTT 5.0](https://www.emqx.com/zh/blog/introduction-to-mqtt-5) 客户端工具集，用于物联网应用的开发、测试和故障排查。[MQTTX Desktop](https://mqttx.app/zh/docs) 支持 macOS、Windows 和 Linux，以聊天式界面管理多个连接与订阅，并内置 MQTTX Agent，可用自然语言创建连接、收发消息和排查问题；[MQTTX CLI](https://mqttx.app/zh/docs/cli) 为终端和自动化提供消息收发、压测与数据模拟；[MQTTX Web](https://mqttx.app/web-client) 无需安装，即可在浏览器中通过 WebSocket 调试 MQTT。

> [MQTT](https://www.emqx.com/zh/blog/the-easiest-guide-to-getting-started-with-mqtt)（Message Queuing Telemetry Transport，消息队列遥测传输）是一种基于发布/订阅模式的轻量级消息协议，专为受限设备以及低带宽、高延迟或不可靠的网络而设计。

![mqttx-preview](./assets/mqttx-preview.png)

## 功能特性

- 桌面版与 CLI 支持 MQTT 3.1、3.1.1 和 5.0，可通过 TCP、TLS 和 WebSocket 连接。
- 在桌面版中管理连接分组、搜索消息，并导入导出连接配置。
- 桌面版支持 JSON、Base64、Hex 等消息编解码、Protobuf/Avro Schema 和 GZIP 解压。
- 使用桌面版的脚本和定时消息测试业务逻辑，通过主题树、仪表盘和消息体查看器分析数据。
- 使用 CLI 进行压测、模拟物联网数据，并通过标准输入和管道接入 Shell 脚本或 CI 流程。
- Web 版支持通过 WebSocket 收发 MQTT 3.1.1 和 5.0 消息，也可使用 Docker 自行部署。

<details>
<summary>查看各客户端的完整功能</summary>

### MQTTX Desktop

适用于 macOS、Windows 和 Linux 的图形化客户端，用于交互调试和消息分析。

- 通过 TCP、TLS、WebSocket 或安全 WebSocket 连接，支持 MQTT 3.1、3.1.1 和 5.0。
- 配置 MQTT 5.0 连接、发布和订阅的用户属性，使用 SCRAM 增强认证，并查看 Broker 返回的 CONNACK 响应信息。
- 通过内置的 MQTTX Agent 用自然语言操作客户端，支持技能（Skills）、MCP 工具、操作审批和多家模型提供商。
- 编解码 Plaintext、JSON、Base64、Hex、CBOR 和 MsgPack 消息，使用 Protobuf 或 Avro Schema，并自动解压接收到的 GZIP 消息。
- 使用脚本转换收发消息，或定时发布消息。
- 使用主题树、仪表盘、流量监控和消息体查看器分析消息，支持 JSON 树和消息差异对比。
- 管理连接分组、搜索消息，并为每个连接保留独立的发布区和发布历史。
- 通过 JSON、CSV、Excel、XML 或 YAML 导入和导出连接；JSON 备份保留连接分组。
- 切换浅色、深色或夜间主题，支持英语、简体中文、日语、土耳其语、匈牙利语和韩语。

### MQTTX CLI

适用于终端调试、Shell 脚本、CI 自动化和性能测试的命令行客户端。

- 使用 `mqttx conn`、`mqttx pub` 和 `mqttx sub` 连接、发布和订阅，支持 MQTT 3.1、3.1.1 和 5.0，以及 TCP、TLS 和 WebSocket 连接。
- 使用 `mqttx bench` 进行连接、发布和订阅压测，使用 `mqttx simulate` 生成物联网测试数据。
- 从标准输入读取消息，通过管道将接收的消息交给其他工具，并以 JSON 或 YAML 保存和加载连接参数。
- 编解码 JSON、Base64、Hex、CBOR 和 MsgPack 消息，支持 Protobuf 和 Avro Schema。
- 通过 [MQTTX CLI skill](./skills/mqttx-cli/SKILL.md)，让外部 AI Agent 执行 MQTT 测试和故障排查。

### MQTTX Web

无需安装桌面应用，在浏览器中打开[在线客户端](https://mqttx.app/web-client)即可开始测试。

- 通过 WebSocket（`ws://` 或 `wss://`）收发 MQTT 3.1.1 和 5.0 消息；HTTPS 页面使用 `wss://`。
- 在聊天式界面中管理多个连接和订阅，查看发送和接收的消息。
- 使用 [Docker 自行部署](./web/README-CN.md#docker-部署)，在自己的环境中运行 Web 客户端。

</details>

## 快速开始

### MQTTX Desktop

从 [GitHub Releases](https://github.com/emqx/MQTTX/releases) 下载对应平台的安装包。国内用户也可以从 [EMQ 下载站](https://www.emqx.com/zh/downloads/MQTTX/) 下载。

[![Download on the Mac App Store](./assets/app-store-download.svg)](https://apps.apple.com/cn/app/mqttx/id1514074565?mt=12)
[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

macOS 用户也可以使用 [Homebrew](https://formulae.brew.sh/cask/mqttx) 安装：

```shell
brew install --cask mqttx
```

1. 打开 MQTTX，点击左侧的 `+` 创建连接，并填写表单中的必填项。
2. 填写 Broker 地址并点击 `Connect`。可以使用自己的 Broker，或 [EMQX Cloud](https://www.emqx.com/zh/cloud) 提供的免费[公共 MQTT 5.0 服务器](https://www.emqx.com/zh/mqtt/public-mqtt5-broker) `broker.emqx.io`（TCP 端口 `1883`，TLS 端口 `8883`）。
3. 订阅一个主题，再向同一主题发布 JSON 消息，即可在消息区查看收到的内容。

![mqttx-gif](./assets/mqttx-gif.gif)

### MQTTX CLI

选择一种方式安装。使用 npm 前，请按[安装指南](./INSTALL.md#npm)确认 Node.js 版本要求。

```shell
# macOS（Homebrew）
brew install emqx/mqttx/mqttx-cli

# 或使用 npm
npm install --global mqttx-cli
```

也提供独立的二进制文件和 Docker 镜像，详见 [MQTTX CLI README](./cli/README-CN.md) 或 [MQTTX 下载页面](https://mqttx.app/zh/downloads)。

安装后，在两个终端中分别订阅和发布，订阅端即可收到 JSON 消息：

```shell
# 终端 1：订阅
mqttx sub -h broker.emqx.io -t 'mqttx/quickstart'

# 终端 2：发布
mqttx pub -h broker.emqx.io -t 'mqttx/quickstart' -m '{"temperature":23.5}'
```

更多命令、压测和数据模拟用法见 [CLI 文档](https://mqttx.app/zh/docs/cli)。

### MQTTX Web

在浏览器中打开[在线客户端](https://mqttx.app/web-client)，通过 `ws://` 或 `wss://` 连接 Broker；HTTPS 页面使用 `wss://`。也可以用 Docker 自行部署：

```shell
docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

部署与使用方法见 [Web README](./web/README-CN.md)。

## AI 辅助

### 桌面版 MQTTX Agent

MQTTX Agent 是内置于桌面版的 AI 助手。在**设置 → MQTTX Agent** 中启用并填写服务商的 API Host、API Key 和模型后，即可从左侧栏以全屏打开，或用 `Cmd/Ctrl + J` 以浮窗打开。

- 它通过工具操作 MQTTX：创建并连接连接、订阅与发布、读取消息、构建主题树和仪表盘、调用你配置的 MCP 服务器，以及编写客户端代码、测试数据和编解码。
- **操作前询问**（默认）会在改动前请求批准，**自动**则不再询问。
- 对话和工具调用结果会发送给你配置的模型服务商，请避免在对话中输入密钥等敏感信息。

完整的配置、技能、MCP、权限和限制说明请参阅 [MQTTX Agent](./docs/desktop/zh/use-desktop/agent.md)。

### 外部 AI Agent 与 CLI skill

<details>
<summary>让 Agent 安装或更新 MQTTX CLI</summary>

[INSTALL.md](./INSTALL.md) 提供面向 agent 的安装与更新步骤，包括环境检测、安装渠道选择和版本验证。可以将下面的提示词交给 agent：

> 读取 https://raw.githubusercontent.com/emqx/MQTTX/main/INSTALL.md，按照其中的步骤为当前环境安装或更新 MQTTX CLI，并验证命令路径和版本。

</details>

[mqttx-cli skill](./skills/mqttx-cli/SKILL.md) 帮助 agent 使用 MQTTX CLI 完成连接检查、消息收发、MQTT 5 功能验证、TLS/认证、编解码、压测、数据模拟和故障排查。

通过 [Skills CLI](https://github.com/vercel-labs/skills) 安装：

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

从本地源码安装时，在仓库根目录运行 `npx skills add . --skill mqttx-cli`。也可以将整个 `skills/mqttx-cli` 目录（包括 `references`）复制到 agent 支持的技能目录，或让 agent 直接读取其中的 `SKILL.md`。

安装后，可以这样描述任务：

> 使用 mqttx-cli skill，验证本地 127.0.0.1:1883 broker 的消息收发。使用 mqttx-test/ 下的唯一 topic，在 15 秒内结束检查，并报告结果。

## 与 EMQX 搭配使用

MQTTX 可以连接任何 MQTT Broker，与 [EMQX](https://www.emqx.com/zh/products/emqx) 搭配使用效果更佳。只需几步即可连接到 EMQX 或 EMQX Cloud，调试您的应用并探索 Broker 的各项功能。

- [免费试用 EMQX Cloud 14 天](https://www.emqx.com/zh/try?product=cloud)
- [下载 EMQX 并在本地运行](https://www.emqx.com/zh/try?product=enterprise)

## 文档与社区

- 使用指南：[Desktop](https://mqttx.app/zh/docs)、[CLI](https://mqttx.app/zh/docs/cli)、[Web](https://mqttx.app/zh/docs/web)，以及[桌面版使用手册](./docs/manual-cn.md)。
- [MQTT 入门及进阶](https://www.emqx.com/zh/mqtt)

  EMQ 提供了通俗易懂的技术文章及简单易用的客户端工具，帮助您学习 MQTT 并快速入门 MQTT 客户端编程。

- [MQTT SDKs](https://www.emqx.com/zh/mqtt-client-sdk)

  我们选取了各个编程语言中热门的 MQTT 客户端 SDK，并提供代码示例，帮助您快速掌握 MQTT 客户端库的使用。

- [公共 MQTT 测试服务器](https://www.emqx.com/zh/mqtt/public-mqtt5-broker)。
- 提问与交流：[GitHub Discussions](https://github.com/emqx/MQTTX/discussions)、[EMQ 问答社区](https://askemq.com/)、[Discord](https://discord.gg/xYGf3fQnES)。也可添加小助手微信号 `emqmkt` 加入技术交流群。
- 关注动态：[bilibili](https://space.bilibili.com/522222081)、[微博](https://weibo.com/emqtt)、[X](https://x.com/EMQTech)。

## 开发与贡献

以下步骤适用于桌面版。

请使用 [`.nvmrc`](./.nvmrc) 中指定的 Node.js 版本（当前为 v22）。如果使用 [nvm](https://github.com/nvm-sh/nvm)，在仓库根目录运行 `nvm use` 即可。

```shell
git clone git@github.com:emqx/MQTTX.git
cd MQTTX
nvm use
yarn install
yarn run electron:serve
```

构建 Windows、Linux 和 macOS 安装包：

```shell
yarn run electron:build
```

安装包输出到 `dist_electron`。

<details>
<summary>构建单个平台的安装包</summary>

```shell
# For Windows
yarn run electron:build-win

# For Linux
yarn run electron:build-linux

# For macOS
yarn run electron:build-mac
```

</details>

CLI 和 Web 的开发步骤分别见 [CLI README](./cli/README-CN.md#开发) 与 [Web README](./web/README-CN.md#开发)。提交 Pull Request 前请阅读[贡献指南](./.github/CONTRIBUTING_CN.md)。

桌面版基于 [Electron](https://electronjs.org/)、[Vue](https://vuejs.org/) + [Element](https://element.eleme.io)、[TypeScript](https://www.typescriptlang.org/)、[TypeORM](https://github.com/typeorm/typeorm)、[SQLite](https://github.com/TryGhost/node-sqlite3) 和 [MQTT.js](https://github.com/mqttjs/MQTT.js) 构建。

## License

Apache License 2.0, see [LICENSE](./LICENSE).
