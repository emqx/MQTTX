<img src="https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

# MQTT X 命令行工具

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![社区](https://img.shields.io/badge/Community-MQTT%20X-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ%20中文-FF0000?logo=youtube)](https://www.youtube.com/channel/UCir_r04HIsLjf2qqyZ4A8Cg)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)

[English](https://github.com/emqx/MQTTX/blob/main/cli/README.md) | 简体中文

---

[MQTT X CLI](https://mqttx.app/zh) 是一款开源的 MQTT 5.0 命令行客户端工具，也是命令行上的 MQTT X，旨在帮助开发者在不需要使用图形化界面的基础上，也能更快的开发和调试 MQTT 服务与应用。

> [MQTT](http://mqtt.org/faq) 全称为 Message Queuing Telemetry Transport（消息队列遥测传输）是一种基于 发布/订阅 范式的“轻量级”消息协议，旨在用于受限设备和低带宽，高延迟或不可靠的网络，由 IBM 发布。

## 功能预览

![mqttx-preview](https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-cli-preview.png)

## 安装

### macOS

下载二进制文件并快速安装最新的 MQTT X CLI 稳定版到 macOS 系统上。

> **注意**：请注意区分当前系统环境的 CPU 架构

#### Intel Chip

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.8.0/mqttx-cli-macos-x64
sudo install ./mqttx-cli-macos-x64 /usr/local/bin/mqttx
```

#### Apple Silicon

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.8.0/mqttx-cli-macos-arm64
sudo install ./mqttx-cli-macos-arm64 /usr/local/bin/mqttx
```

#### Homebrew

```shell
brew install emqx/mqttx/mqttx-cli
```

### Linux

下载二进制文件并快速安装最新的 MQTT X CLI 稳定版到 Linux 系统上。

> **注意**：请注意区分当前系统环境的 CPU 架构

#### x86-64

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.8.0/mqttx-cli-linux-x64
sudo install ./mqttx-cli-linux-x64 /usr/local/bin/mqttx
```

#### ARM64

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.8.0/mqttx-cli-linux-arm64
sudo install ./mqttx-cli-linux-arm64 /usr/local/bin/mqttx
```

### Windows

Windows 用户请到 MQTT X 的[发布页面](https://github.com/emqx/MQTTX/releases)内，找到对应的系统架构的 `exe` 包，手动下载后使用

### NPM

```shell
npm install mqttx-cli -g
```

### 其它平台

从 MQTT X 的[发布页面](https://github.com/emqx/MQTTX/releases)内，下载对应的二进制文件。

## 使用

在安装完成后，可在终端直接运行 `mqttx` 命令：

### 快速使用

Connect

```shell
mqttx conn -h 'broker.emqx.io' -p 1883 -u 'admin' -P 'public'
```

Subscribe

```shell
mqttx sub -t 'hello' -h 'broker.emqx.io' -p 1883
```

Publish

```shell
mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -m 'from MQTTX CLI'
```

### 参数介绍

```shell
mqttx --help
```

| 参数          | 描述                         |
| ------------- | ---------------------------- |
| -v, --version | 输出当前 MQTT X CLI 的版本号 |
| -h, --help    | 展示 mqttx 命令的帮助信息    |

| 命令 | 描述                             |
| ---- | -------------------------------- |
| conn | 创建一个连接并连接到 MQTT Broker |
| pub  | 向主题发布一条消息               |
| sub  | 订阅一个主题                     |

#### 连接

```shell
mqttx conn --help
```

| 参数                                       | 描述                                           |
| ------------------------------------------ | ---------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>           | MQTT 版本，默认为 5                            |
| -h, --hostname <HOST>                      | MQTT Broker 的 Host 地址，默认为 localhost     |
| -p, --port <PORT>                          | MQTT Broker 的端口号                           |
| -i, --client-id <ID>                       | 客户端 ID                                      |
| --no-clean                                    | 取消 clean session 标志位，默认为 true            |
| -k, --keepalive <SEC>                      | MQTT 的 Keep Alive，默认为 30                  |
| -u, --username <USER>                      | 连接到 MQTT Broker 的用户名                    |
| -P, --password <PASS>                      | 连接到 MQTT Broker 的密码                      |
| -l, --protocol <PROTO>                     | 连接时的协议，mqtt, mqtts, ws or wss           |
| --key <PATH>                               | key 文件的路径                                 |
| --cert <PATH>                              | cert 文件的路径                                |
| --ca                                       | ca 证书的文件路径                              |
| --insecure                                 | 取消服务器的证书校验                           |
| -up, --user-properties <USERPROPERTIES...> | MQTT 5.0 用户属性，例如：-up "name: mqttx cli" |
| --will-topic <TOPIC>                       | 遗嘱消息的 topic                               |
| --will-message <BODY>                      | 遗嘱消息的 payload                             |
| --will-qos <0/1/2>                         | 遗嘱消息的 QoS                                 |
| --will-retain                              | 遗嘱消息的 retain 标志位                       |
| --help                                     | 展示 conn 命令的帮助信息                       |

#### 订阅

```shell
mqttx sub --help
```

| 参数                                       | 描述                                           |
| ------------------------------------------ | ---------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>           | MQTT 版本，默认为 5                            |
| -h, --hostname <HOST>                      | MQTT Broker 的 Host 地址，默认为 localhost     |
| -p, --port <PORT>                          | MQTT Broker 的端口号                           |
| -i, --client-id <ID>                       | 客户端 ID                                      |
| -q, --qos <0/1/2>                          | 消息的 QoS，默认为 0                           |
| --no-clean                                    | 取消 clean session 标志位，默认为 true            |
| -t, --topic <TOPIC>                        | 需要订阅的 Topic                               |
| -k, --keepalive <SEC>                      | MQTT 的 Keep Alive，默认为 30                  |
| -u, --username <USER>                      | 连接到 MQTT Broker 的用户名                    |
| -P, --password <PASS>                      | 连接到 MQTT Broker 的密码                      |
| -l, --protocol <PROTO>                     | 连接时的协议，mqtt, mqtts, ws or wss           |
| -nl, --no_local                            | MQTT 5.0 订阅选项中的 no local 标识            |
| -rap, --retain-as-published                | MQTT 5.0 订阅选项中的 retain as published 标识    |
| -rh, --retain-handling <0/1/2>             | MQTT 5.0 订阅选项中的 retain handling 标识   |
| --key <PATH>                               | key 文件的路径                                 |
| --cert <PATH>                              | cert 文件的路径                                |
| --ca                                       | ca 证书的文件路径                              |
| --insecure                                 | 取消服务器的证书校验                           |
| -up, --user-properties <USERPROPERTIES...> | MQTT 5.0 用户属性，例如：-up "name: mqttx cli" |
| --will-topic <TOPIC>                       | 遗嘱消息的 topic                               |
| --will-message <BODY>                      | 遗嘱消息的 payload                             |
| --will-qos <0/1/2>                         | 遗嘱消息的 QoS                                 |
| --will-retain                              | 遗嘱消息的 retain 标志位                       |
| -v, --verbose                              | 在接收到的 Payload 前显示当前 Topic            |
| --help                                     | 展示 sub 命令的帮助信息                        |

#### 发布

```shell
mqttx pub --help
```

| 参数                                       | 描述                                           |
| ------------------------------------------ | ---------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>           | MQTT 版本，默认为 5                            |
| -h, --hostname <HOST>                      | MQTT Broker 的 Host 地址，默认为 localhost     |
| -p, --port <PORT>                          | MQTT Broker 的端口号                           |
| -i, --client-id <ID>                       | 客户端 ID                                      |
| -q, --qos <0/1/2>                          | 消息的 QoS，默认为 0                           |
| -t, --topic <TOPIC>                        | 需要发布的 Topic                               |
| -m, --message<MSG>                         | 需要发布的 Payload 消息                        |
| -r, --retain                               | 设置发送消息为 Retain 消息，默认为 fasle       |
| -s, --stdin                                | 从 stdin 中读取信息体                          |
| -M, --multiline                            | 可以通过多行发布多条消息                       |
| -u, --username <USER>                      | 连接到 MQTT Broker 的用户名                    |
| -P, --password <PASS>                      | 连接到 MQTT Broker 的密码                      |
| -l, --protocol <PROTO>                     | 连接时的协议，mqtt, mqtts, ws or wss           |
| --key <PATH>                               | key 文件的路径                                 |
| --cert <PATH>                              | cert 文件的路径                                |
| --ca                                       | ca 证书的文件路径                              |
| --insecure                                 | 取消服务器的证书校验                           |
| -up, --user-properties <USERPROPERTIES...> | MQTT 5.0 用户属性，例如：-up "name: mqttx cli" |
| --will-topic <TOPIC>                       | 遗嘱消息的 topic                               |
| --will-message <BODY>                      | 遗嘱消息的 payload                             |
| --will-qos <0/1/2>                         | 遗嘱消息的 QoS                                 |
| --will-retain                              | 遗嘱消息的 retain 标志位                       |
| --help                                     | 展示 pub 命令的帮助信息                        |

## 与 EMQX 更好的合作

MQTT X 为连接测试 EMQX 等 MQTT 消息服务器而生，一键式的连接方式和简洁的图形界面可以帮助您快速连接到 EMQX 或 EMQX Cloud 调试并探索其功能特性。

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

- v14.\*.\*

```shell
# 克隆项目
git clone git@github.com:emqx/MQTTX.git

# 安装依赖
cd MQTTX/cli
yarn install

# 编译和热重载以进行开发
yarn run dev

# 编译和压缩以构建生产版本
yarn run build
```

构建成功后，会在 `dist` 目录里出现构建成功的相应的文件，需要在 Node.js 环境中使用。

如果需要打包一个二进制可执行文件，请参考以下命令：

```shell
# 全局安装 pkg
npm install pkg -g

# 构建二进制可执行文件
pkg package.json
```

构建成功后，在 `release` 目录里可以看到对应各系统的二进制可执行文件了。

## 贡献

请确保在发出 PR 请求前， 已经仔细阅读过了[贡献指南](https://github.com/emqx/MQTTX/blob/master/.github/CONTRIBUTING_CN.md)

## 技术栈

- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)
- [pkg](https://github.com/vercel/pkg)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
