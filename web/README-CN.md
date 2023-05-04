<img src="../assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

# MQTTX Web

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Docker](https://img.shields.io/docker/pulls/emqx/mqttx-web)](https://hub.docker.com/r/emqx/mqttx-web)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![Community](https://img.shields.io/badge/Community-MQTT%20X-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)

[English](./README.md) | 简体中文

---

[MQTTX Web](https://mqttx.app)是一款开源的 MQTT 5.0 浏览器客户端，也是一个在线 MQTT WebSocket 客户端工具。使用 WebSocket 在浏览器中连接到 MQTT，帮助开发者更快地开发和调试 MQTT 服务和应用程序，而不必在本地下载和安装 MQTTX。

> [MQTT](http://mqtt.org/faq) 全称为 Message Queuing Telemetry Transport（消息队列遥测传输）是一种基于 发布/订阅 范式的“轻量级”消息协议，旨在用于受限设备和低带宽，高延迟或不可靠的网络，由 IBM 发布。

## 功能预览

![mqttx-preview](../assets/mqttx-web-preview.png)

## 文档

关于介绍和使用，请参考 [MQTTX Web 文档](https://mqttx.app/zh/docs/web).

## 使用

访问 MQTT WebSocket 客户端工具 (MQTTX Web): [http://www.emqx.io/online-mqtt-client](http://www.emqx.io/online-mqtt-client)

## Docker 部署

```bash
docker pull emqx/mqttx-web:latest

docker run -d --name mqttx-web -p 80:80 emqx/mqttx-web:latest
```

## 与 EMQX 更好的合作

MQTTX 为连接测试 EMQX 等 MQTT 消息服务器而生，一键式的连接方式和简洁的图形界面可以帮助您快速连接到 EMQX 或 EMQX Cloud 调试并探索其功能特性。

[注册 EMQX Cloud 可以享受 14 天免费试用](https://www.emqx.com/zh/try?product=cloud)

[现在就本地下载并安装 EMQX](https://www.emqx.com/zh/try?product=enterprise)

## 社区

- 访问 [EMQ 问答社区](https://askemq.com/) 以获取帮助，也可以分享您的想法或项目。
- 添加小助手微信号 `emqmkt`，加入 EMQ 微信技术交流群。
- 加入我们的 [Discord](https://discord.gg/xYGf3fQnES)，参于实时讨论。
- 关注我们的 [bilibili](https://space.bilibili.com/522222081)，获取最新物联网技术分享。
- 关注我们的 [微博](https://weibo.com/emqtt) 或 [Twitter](https://twitter.com/EMQTech)，获取 EMQ 最新资讯。

## 开发

Node 环境的推荐版本:

- v16.\*.\*

``` shell
# 克隆项目
git clone git@github.com:emqx/MQTTX.git

# 安装依赖
cd MQTTX/web
yarn install

# 编译和热重载以进行开发
yarn run serve

# 编译和压缩以构建生产版本
yarn run build

# 编译并启动一个本地 HTTP 服务器以进行测试
yarn run start
```

## 贡献

请确保在发出 PR 请求前， 已经仔细阅读过了[贡献指南](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING_CN.md)

## 技术栈

- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
