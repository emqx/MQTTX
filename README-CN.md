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

[MQTTX](https://mqttx.app/zh) 是 [EMQ](https://www.emqx.com/zh) 开源的跨平台 [MQTT 5.0](https://www.emqx.com/zh/blog/introduction-to-mqtt-5) 客户端工具集，用于物联网应用的开发、测试和故障排查。[MQTTX Desktop](https://mqttx.app/zh/docs) 支持 macOS、Windows 和 Linux，采用聊天式界面管理多个连接与订阅，并内置 MQTTX Agent，可用自然语言创建连接、收发消息和排查问题；[MQTTX CLI](https://mqttx.app/zh/docs/cli) 面向终端和自动化流程，提供消息收发、压测与数据模拟；[MQTTX Web](https://mqttx.app/web-client) 则无需安装桌面应用，可在浏览器中通过 WebSocket 调试 MQTT 服务。

![mqttx-preview](./assets/mqttx-preview.png)

## 功能特性

- 桌面版与 CLI 支持 MQTT 3.1、3.1.1 和 5.0，可通过 TCP、TLS 和 WebSocket 连接。
- 在桌面版中管理连接分组、搜索消息，并导入导出连接配置。
- 桌面版支持 JSON、Base64、Hex 等消息编解码、Protobuf/Avro Schema 和 GZIP 解压。
- 使用桌面版的脚本和定时消息测试业务逻辑，通过主题树、仪表盘和消息体查看器分析数据。
- 使用 CLI 进行压测、模拟物联网数据，并通过标准输入和管道接入 Shell 脚本或 CI 流程。
- Web 版支持通过 WebSocket 收发 MQTT 3.1.1 和 5.0 消息，也可使用 Docker 自行部署。

## 快速开始

### MQTTX Desktop

从 [GitHub Releases](https://github.com/emqx/MQTTX/releases) 或 [EMQ 下载站](https://www.emqx.com/zh/downloads/MQTTX/) 下载对应平台的安装包。也可以通过 [Mac App Store](https://apps.apple.com/cn/app/mqttx/id1514074565?mt=12)、[Snap](https://snapcraft.io/mqttx) 或 [Flathub](https://flathub.org/apps/details/com.emqx.MQTTX) 安装。macOS 用户还可以使用 Homebrew：

```shell
brew install --cask mqttx
```

1. 打开 MQTTX，点击左侧的 `+` 创建连接。
2. 填写 Broker 地址并点击 `Connect`。可以使用自己的 Broker，或公共测试服务器 `broker.emqx.io`（TCP 端口 `1883`，TLS 端口 `8883`）。
3. 订阅一个主题，再向同一主题发布 JSON 消息，即可在消息区查看收到的内容。

![mqttx-gif](./assets/mqttx-gif.gif)

### MQTTX CLI

选择一种方式安装。使用 npm 前，请按[安装指南](./INSTALL.md#npm)确认 Node.js 版本要求；也可以从[下载页面](https://mqttx.app/zh/downloads)获取独立二进制文件。

```shell
# macOS（Homebrew）
brew install emqx/mqttx/mqttx-cli

# 或使用 npm
npm install --global mqttx-cli
```

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

在**设置 → MQTTX Agent** 中启用并配置模型后，从左侧栏打开，或用 `Cmd/Ctrl + J` 唤起浮窗。Skills、MCP、操作审批和模型配置说明见 [MQTTX Agent 指南](./docs/desktop/zh/use-desktop/agent.md)。

### 外部 AI Agent 与 CLI skill

为你使用的 AI Agent 安装 [mqttx-cli skill](./skills/mqttx-cli/SKILL.md)，让它调用 MQTTX CLI 执行 MQTT 测试与故障排查：

```shell
npx skills add emqx/MQTTX --skill mqttx-cli
```

安装后，可以这样描述任务：

> 使用 mqttx-cli skill，验证本地 127.0.0.1:1883 Broker 的消息收发。使用 mqttx-test/ 下的唯一主题，在 15 秒内结束检查，并报告结果。

CLI 的安装与更新见 [INSTALL.md](./INSTALL.md)，其他 skill 安装方式见 [CLI README](./cli/README-CN.md#ai-agent-支持)。

## 文档与社区

- 使用指南：[Desktop](https://mqttx.app/zh/docs)、[CLI](https://mqttx.app/zh/docs/cli)、[Web](https://mqttx.app/zh/docs/web)，以及[桌面版使用手册](./docs/manual-cn.md)。
- 学习资源：[MQTT 入门及进阶](https://www.emqx.com/zh/mqtt)、[MQTT SDK 与代码示例](https://www.emqx.com/zh/mqtt-client-sdk)。
- Broker：[公共 MQTT 测试服务器](https://www.emqx.com/zh/mqtt/public-mqtt5-broker)、[本地运行 EMQX](https://www.emqx.com/zh/try?product=enterprise)、[EMQX Cloud 试用](https://www.emqx.com/zh/try?product=cloud)。
- 提问与交流：[GitHub Discussions](https://github.com/emqx/MQTTX/discussions)、[EMQ 问答社区](https://askemq.com/)、[Discord](https://discord.gg/xYGf3fQnES)。也可添加小助手微信号 `emqmkt` 加入技术交流群。
- 关注动态：[bilibili](https://space.bilibili.com/522222081)、[微博](https://weibo.com/emqtt)、[X](https://x.com/EMQTech)。

## 开发与贡献

以下步骤适用于桌面版。请使用 [`.nvmrc`](./.nvmrc) 中指定的 Node.js 版本，在仓库根目录运行 `nvm use` 后开始开发：

```shell
git clone git@github.com:emqx/MQTTX.git
cd MQTTX
nvm use
yarn install
yarn run electron:serve
```

使用 `yarn run electron:build` 构建所有平台的安装包，或运行 `electron:build-win`、`electron:build-linux`、`electron:build-mac` 对应的 Yarn 脚本构建单个平台。产物输出到 `dist_electron`。

CLI 和 Web 的开发步骤分别见 [CLI README](./cli/README-CN.md#开发) 与 [Web README](./web/README-CN.md#开发)。提交 Pull Request 前请阅读[贡献指南](./.github/CONTRIBUTING_CN.md)。

桌面版基于 [Electron](https://electronjs.org/)、[Vue](https://vuejs.org/) + [Element](https://element.eleme.io)、[TypeScript](https://www.typescriptlang.org/)、[TypeORM](https://github.com/typeorm/typeorm)、[SQLite](https://github.com/TryGhost/node-sqlite3) 和 [MQTT.js](https://github.com/mqttjs/MQTT.js) 构建。

## License

Apache License 2.0, see [LICENSE](./LICENSE).
