<img src="https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

# MQTTX 命令行工具

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Docker](https://img.shields.io/docker/pulls/emqx/mqttx-cli)](https://hub.docker.com/r/emqx/mqttx-cli)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![社区](https://img.shields.io/badge/Community-MQTTX-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ%20中文-FF0000?logo=youtube)](https://www.youtube.com/channel/UCir_r04HIsLjf2qqyZ4A8Cg)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)

[English](https://github.com/emqx/MQTTX/blob/main/cli/README.md) | 简体中文

---

[MQTTX CLI](https://mqttx.app/zh/cli) 是一款开源的 MQTT 5.0 命令行客户端工具，也是命令行上的 MQTTX，旨在帮助开发者在不需要使用图形化界面的基础上，也能更快的开发和调试 MQTT 服务与应用。

> [MQTT](https://www.emqx.com/zh/blog/the-easiest-guide-to-getting-started-with-mqtt) 全称为 Message Queuing Telemetry Transport（消息队列遥测传输）是一种基于 发布/订阅 范式的“轻量级”消息协议，旨在用于受限设备和低带宽，高延迟或不可靠的网络，由 IBM 发布。

## 功能预览

![mqttx-preview](https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-cli-preview.png)

## 文档

关于介绍、安装和使用，请参阅 [MQTTX CLI 文档](https://mqttx.app/zh/docs/cli)，下面是一个快速入门指南。

## 安装

### macOS

下载二进制文件并快速安装最新的 MQTTX CLI 稳定版到 macOS 系统上。

> **注意**：请注意区分当前系统环境的 CPU 架构

#### Intel Chip

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.9.3/mqttx-cli-macos-x64
sudo install ./mqttx-cli-macos-x64 /usr/local/bin/mqttx
```

#### Apple Silicon

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.9.3/mqttx-cli-macos-arm64
sudo install ./mqttx-cli-macos-arm64 /usr/local/bin/mqttx
```

#### Homebrew

```shell
brew install emqx/mqttx/mqttx-cli
```

### Linux

下载二进制文件并快速安装最新的 MQTTX CLI 稳定版到 Linux 系统上。

> **注意**：请注意区分当前系统环境的 CPU 架构

#### x86-64

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.9.3/mqttx-cli-linux-x64
sudo install ./mqttx-cli-linux-x64 /usr/local/bin/mqttx
```

#### ARM64

```shell
curl -LO https://www.emqx.com/zh/downloads/MQTTX/v1.9.3/mqttx-cli-linux-arm64
sudo install ./mqttx-cli-linux-arm64 /usr/local/bin/mqttx
```

### Windows

Windows 用户请到 MQTTX 的[发布页面](https://github.com/emqx/MQTTX/releases)内，找到对应的系统架构的 `exe` 包，手动下载后使用

### NPM

```shell
npm install mqttx-cli -g
```

### Docker

```shell
docker pull emqx/mqttx-cli

docker run -it --rm emqx/mqttx-cli
```

### 其它平台

从 MQTTX 的[发布页面](https://github.com/emqx/MQTTX/releases)内，下载对应的二进制文件。

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
# Publish a single message
mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -m 'from MQTTX CLI'

# Publish multiple messages (multiline)
mqttx pub -t 'hello' -h 'broker.emqx.io' -p 1883 -s -M
```

Benchmark

```bash
# Connect Benchmark
mqttx bench conn -c 5000

# Subscribe Benchmark
mqttx bench sub -c 5000 -t bench/%i

# Publish Benchmark
mqttx bench pub -c 5000 -t bench/%i
```

Simulate

```bash
# Specify a local scenario and start the simulation
mqttx simulate -sc tesla -c 10

# Specify a scenario file and start the simulation
mqttx simulate -f <scenario file path> -c 10

# List the built-in scenarios
mqttx ls -sc
```

### 参数介绍

```shell
mqttx --help
```

| 参数          | 描述                        |
| ------------- | --------------------------- |
| -v, --version | 输出当前 MQTTX CLI 的版本号 |
| -h, --help    | 展示 mqttx 命令的帮助信息   |

| 命令     | 描述                             |
| -------- | -------------------------------- |
| check    | 检查更新                         |
| conn     | 创建一个连接并连接到 MQTT Broker |
| pub      | 向主题发布一条消息               |
| sub      | 订阅一个或多个主题               |
| bench    | MQTT 性能测试                    |
| simulate | MQTT 模拟器                      |

### 连接

```shell
mqttx conn --help
```

| 参数                                             | 描述                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| -V, --mqtt-version <5/3.1.1/3.1>                 | MQTT 版本，默认为 5                                                                        |
| -h, --hostname <HOST>                            | MQTT Broker 的 Host 地址，默认为 localhost                                                 |
| -p, --port <PORT>                                | MQTT Broker 的端口号                                                                       |
| -i, --client-id <ID>                             | 客户端 ID                                                                                  |
| --no-clean                                       | 取消 clean session 标志位，默认为 true                                                     |
| -k, --keepalive <SEC>                            | MQTT 的 Keep Alive，默认为 30                                                              |
| -u, --username <USER>                            | 连接到 MQTT Broker 的用户名                                                                |
| -P, --password <PASS>                            | 连接到 MQTT Broker 的密码                                                                  |
| -l, --protocol <PROTO>                           | 连接时的协议，支持 mqtt、mqtts、ws、wss，默认为 mqtt                                       |
| --path <PATH>                                    | websocket 的路径，默认为 /mqtt                                                             |
| --key <PATH>                                     | key 文件的路径                                                                             |
| --cert <PATH>                                    | cert 文件的路径                                                                            |
| --ca                                             | ca 证书的文件路径                                                                          |
| --insecure                                       | 取消服务器的证书校验                                                                       |
| -rp, --reconnect-period <MILLISECONDS>           | 自动重连的间隔时间，通过设置为 0 来禁用自动重连，默认为 1000ms                             |
| --maximum-reconnect-times <NUMBER>               | 最大重连次数，默认为 10                                                                    |
| -up, --user-properties <USERPROPERTIES...>       | MQTT 5.0 用户属性，例如：-up "name: mqttx cli"                                             |
| -Wt, --will-topic <TOPIC>                        | 遗嘱消息的 Topic                                                                           |
| -Wm, --will-message <BODY>                       | 遗嘱消息的 Payload                                                                         |
| -Wq, --will-qos <0/1/2>                          | 遗嘱消息的 QoS                                                                             |
| -Wr, --will-retain                               | 发送的遗嘱消息为保留消息，默认为 false                                                     |
| -Wd, --will-delay-interval <SECONDS>             | 遗嘱消息延迟间隔，单位为秒                                                                 |
| -Wpf, --will-payload-format-indicator            | 遗嘱消息是否为UTF-8编码的字符数据                                                          |
| -We, --will-message-expiry-interval <SECONDS>    | 遗嘱信息的有效期，单位为秒                                                                 |
| -Wct, --will-content-type <CONTENTTYPE>          | 遗嘱消息内容的描述                                                                         |
| -Wrt, --will-response-topic <TOPIC>              | 响应信息的主题名称                                                                         |
| -Wcd, --will-correlation-data <DATA>             | 响应信息的关联数据                                                                         |
| -Wup, --will-user-properties <USERPROPERTIES...> | 遗嘱消息的自定义用户属性                                                                   |
| -se, --session-expiry-interval <SECONDS>         | 会话过期间隔，单位为秒                                                                     |
| --rcv-max, --receive-maximum <NUMBER>            | 接收消息的最大值                                                                           |
| --maximum-packet-size <NUMBER>                   | 客户端愿意接受的最大数据包大小                                                             |
| --topic-alias-maximum <NUMBER>                   | 主题别名的最大值                                                                           |
| --req-response-info                              | 客户端要求服务器提供的响应信息                                                             |
| --no-req-problem-info                            | 客户端向服务器请求问题信息                                                                 |
| --save \[PATH\]                                  | 将参数保存到本地配置文件中，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json |
| --config \[PATH\]                                | 从本地配置文件加载参数，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json     |
| --help                                           | 展示 conn 命令的帮助信息                                                                   |

### 订阅

```shell
mqttx sub --help
```

| 参数                                             | 描述                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| -V, --mqtt-version <5/3.1.1/3.1>                 | MQTT 版本，默认为 5                                                                        |
| -h, --hostname <HOST>                            | MQTT Broker 的 Host 地址，默认为 localhost                                                 |
| -p, --port <PORT>                                | MQTT Broker 的端口号                                                                       |
| -i, --client-id <ID>                             | 客户端 ID                                                                                  |
| -q, --qos <0/1/2>                                | 消息的 QoS，默认为 0                                                                       |
| --no-clean                                       | 取消 clean session 标志位，默认为 true                                                     |
| -t, --topic <TOPIC>                              | 需要订阅的 Topic                                                                           |
| -k, --keepalive <SEC>                            | MQTT 的 Keep Alive，默认为 30                                                              |
| -u, --username <USER>                            | 连接到 MQTT Broker 的用户名                                                                |
| -P, --password <PASS>                            | 连接到 MQTT Broker 的密码                                                                  |
| -l, --protocol <PROTO>                           | 连接时的协议，支持 mqtt、mqtts、ws、wss，默认为 mqtt                                       |
| --path <PATH>                                    | websocket 的路径，默认为 /mqtt                                                             |
| -nl, --no_local                                  | MQTT 5.0 订阅选项中的 no local 标识                                                        |
| -rap, --retain-as-published                      | MQTT 5.0 订阅选项中的 retain as published 标识                                             |
| -rh, --retain-handling <0/1/2>                   | MQTT 5.0 订阅选项中的 retain handling 标识                                                 |
| --key <PATH>                                     | key 文件的路径                                                                             |
| --cert <PATH>                                    | cert 文件的路径                                                                            |
| --ca                                             | ca 证书的文件路径                                                                          |
| --insecure                                       | 取消服务器的证书校验                                                                       |
| -rp, --reconnect-period <MILLISECONDS>           | 自动重连的间隔时间，通过设置为 0 来禁用自动重连，默认为 1000ms                             |
| --maximum-reconnect-times <NUMBER>               | 最大重连次数，默认为 10                                                                    |
| -up, --user-properties <USERPROPERTIES...>       | MQTT 5.0 用户属性，例如：-up "name: mqttx cli"                                             |
| -f, --format <TYPE>                              | 消息格式化类型，支持 base64、json、hex                                                     |
| -v, --verbose                                    | 在接收到的 Payload 前显示当前 Topic                                                        |
| --output-mode <default/clean>                    | 选择默认或简洁模式，简洁模式会输出完整的数据包，允许用户使用 jq 这类工具自由管理输出       |
| -Wt, --will-topic <TOPIC>                        | 遗嘱消息的 Topic                                                                           |
| -Wm, --will-message <BODY>                       | 遗嘱消息的 Payload                                                                         |
| -Wq, --will-qos <0/1/2>                          | 遗嘱消息的 QoS                                                                             |
| -Wr, --will-retain                               | 发送的遗嘱消息为保留消息，默认为 false                                                     |
| -Wd, --will-delay-interval <SECONDS>             | 遗嘱消息延迟间隔，单位为秒                                                                 |
| -Wpf, --will-payload-format-indicator            | 遗嘱消息是否为UTF-8编码的字符数据                                                          |
| -We, --will-message-expiry-interval <SECONDS>    | 遗嘱信息的有效期，单位为秒                                                                 |
| -Wct, --will-content-type <CONTENTTYPE>          | 遗嘱消息内容的描述                                                                         |
| -Wrt, --will-response-topic <TOPIC>              | 响应信息的主题名称                                                                         |
| -Wcd, --will-correlation-data <DATA>             | 响应信息的关联数据                                                                         |
| -Wup, --will-user-properties <USERPROPERTIES...> | 遗嘱消息的自定义用户属性                                                                   |
| -se, --session-expiry-interval <SECONDS>         | 会话过期间隔，单位为秒                                                                     |
| -si, --subscription-identifier <NUMBER>          | 订阅标识符                                                                                 |
| --rcv-max, --receive-maximum <NUMBER>            | 接收消息的最大值                                                                           |
| --maximum-packet-size <NUMBER>                   | 客户端愿意接受的最大数据包大小                                                             |
| --topic-alias-maximum <NUMBER>                   | 主题别名的最大值                                                                           |
| --req-response-info                              | 客户端要求服务器提供的响应信息                                                             |
| --no-req-problem-info                            | 客户端向服务器请求问题信息                                                                 |
| -Cup, --conn-user-properties <USERPROPERTIES...> | MQTT 5.0 的连接用户属性（例如，-Cup "name: mqttx cli"）                                    |
| --save \[PATH\]                                  | 将参数保存到本地配置文件中，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json |
| --config \[PATH\]                                | 从本地配置文件加载参数，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json     |
| --help                                           | 展示 sub 命令的帮助信息                                                                    |
| -Pp, --protobuf-path <PATH>                      | 定义 Protocol Buffers（protobuf）消息格式的 .proto 文件路径                                |
| -Pmn, --protobuf-message-name <NAME>             | Protobuf 消息类型的名称（必须存在于 .proto 文件中）                                        |

### 发布

```shell
mqttx pub --help
```

| 参数                                             | 描述                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| -V, --mqtt-version <5/3.1.1/3.1>                 | MQTT 版本，默认为 5                                                                        |
| -h, --hostname <HOST>                            | MQTT Broker 的 Host 地址，默认为 localhost                                                 |
| -p, --port <PORT>                                | MQTT Broker 的端口号                                                                       |
| -i, --client-id <ID>                             | 客户端 ID                                                                                  |
| -q, --qos <0/1/2>                                | 消息的 QoS，默认为 0                                                                       |
| --no-clean                                       | 取消 clean session 标志位，默认为 true                                                     |
| -t, --topic <TOPIC>                              | 需要发布的 Topic                                                                           |
| -m, --message<MSG>                               | 需要发布的 Payload 消息                                                                    |
| -r, --retain                                     | 设置发送消息为 Retain 消息，默认为 fasle                                                   |
| -s, --stdin                                      | 从 stdin 中读取信息体                                                                      |
| -M, --multiline                                  | 可以通过多行发布多条消息                                                                   |
| -u, --username <USER>                            | 连接到 MQTT Broker 的用户名                                                                |
| -P, --password <PASS>                            | 连接到 MQTT Broker 的密码                                                                  |
| -f, --format <TYPE>                              | 输入消息的格式类型，支持 base64、json 和 hex                                               |
| -l, --protocol <PROTO>                           | 连接时的协议，支持 mqtt、mqtts、ws、wss，默认为 mqtt                                       |
| --path <PATH>                                    | websocket 的路径，默认为 /mqtt                                                             |
| --key <PATH>                                     | key 文件的路径                                                                             |
| --cert <PATH>                                    | cert 文件的路径                                                                            |
| --ca                                             | ca 证书的文件路径                                                                          |
| --insecure                                       | 取消服务器的证书校验                                                                       |
| -rp, --reconnect-period <MILLISECONDS>           | 自动重连的间隔时间，通过设置为 0 来禁用自动重连，默认为 1000ms                             |
| --maximum-reconnect-times <NUMBER>               | 最大重连次数，默认为 10                                                                    |
| -up, --user-properties <USERPROPERTIES...>       | MQTT 5.0 用户属性，例如：-up "name: mqttx cli"                                             |
| -pf, --payload-format-indicator                  | 发布信息的有效载荷格式指标                                                                 |
| -e, --message-expiry-interval <NUMBER>           | 发布信息的有效期，单位为秒                                                                 |
| -ta, --topic-alias <NUMBER>                      | 主题别名，识别主题的值，而不是使用主题名称                                                 |
| -rt, --response-topic <TOPIC>                    | 作为响应信息的主题名称                                                                     |
| -cd, --correlation-data <DATA>                   | 请求信息的发送者在收到响应信息时用来识别是哪个请求的对比数据                               |
| -si, --subscription-identifier <NUMBER>          | 订阅标识符                                                                                 |
| -ct, --content-type <TYPE>                       | 对发布信息内容的描述                                                                       |
| -Wt, --will-topic <TOPIC>                        | 遗嘱消息的 Topic                                                                           |
| -Wm, --will-message <BODY>                       | 遗嘱消息的 Payload                                                                         |
| -Wq, --will-qos <0/1/2>                          | 遗嘱消息的 QoS                                                                             |
| -Wr, --will-retain                               | 发送的遗嘱消息为保留消息，默认为 false                                                     |
| -Wd, --will-delay-interval <SECONDS>             | 遗嘱消息延迟间隔，单位为秒                                                                 |
| -Wpf, --will-payload-format-indicator            | 遗嘱消息是否为UTF-8编码的字符数据                                                          |
| -We, --will-message-expiry-interval <SECONDS>    | 遗嘱信息的有效期，单位为秒                                                                 |
| -Wct, --will-content-type <CONTENTTYPE>          | 遗嘱消息内容的描述                                                                         |
| -Wrt, --will-response-topic <TOPIC>              | 响应信息的主题名称                                                                         |
| -Wcd, --will-correlation-data <DATA>             | 响应信息的关联数据                                                                         |
| -Wup, --will-user-properties <USERPROPERTIES...> | 遗嘱消息的自定义用户属性                                                                   |
| -se, --session-expiry-interval <SECONDS>         | 会话过期间隔，单位为秒                                                                     |
| --rcv-max, --receive-maximum <NUMBER>            | 接收消息的最大值                                                                           |
| --maximum-packet-size <NUMBER>                   | 客户端愿意接受的最大数据包大小                                                             |
| --topic-alias-maximum <NUMBER>                   | 主题别名的最大值                                                                           |
| --req-response-info                              | 客户端要求服务器提供的响应信息                                                             |
| --no-req-problem-info                            | 客户端向服务器请求问题信息                                                                 |
| -Cup, --conn-user-properties <USERPROPERTIES...> | MQTT 5.0 的连接用户属性（例如，-Cup "name: mqttx cli"）                                    |
| --save \[PATH\]                                  | 将参数保存到本地配置文件中，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json |
| --config \[PATH\]                                | 从本地配置文件加载参数，文件支持 json 和 yaml 格式，默认路径为 ./mqttx-cli-config.json     |
| --help                                           | 展示 pub 命令的帮助信息                                                                    |
| -Pp, --protobuf-path <PATH>                      | 定义 Protocol Buffers（protobuf）消息格式的 .proto 文件路径                                |
| -Pmn, --protobuf-message-name <NAME>             | Protobuf 消息类型的名称（必须存在于 .proto 文件中）                                        |

### 性能测试

性能测试命令与普通命令参数基本相同，以下仅列出新增或有变化的参数。

#### 连接性能测试

```shell
mqttx bench conn --help
```

| 参数                          | 描述                             |
| ----------------------------- | -------------------------------- |
| -c, --count <NUMBER>          | 连接数量，默认为 1000            |
| -i, --interval <MILLISECONDS> | 创建连接的间隔时间，默认为 10ms  |
| -I, --client-id <ID>          | 客户端 ID，支持 %i (索引) 占位符 |

#### 订阅性能测试

```shell
mqttx bench sub --help
```

| 参数                          | 描述                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| -c, --count <NUMBER>          | 连接数量，默认为 1000                                                |
| -i, --interval <MILLISECONDS> | 创建连接的间隔时间，单位为毫秒，默认为 10ms                          |
| -I, --client-id <ID>          | 客户端 ID，支持 %i (索引) 占位符                                     |
| -t, --topic <TOPIC...>        | 需要订阅的 Topic, 支持 %u (用户名), %c (客户端 ID), %i (索引) 占位符 |
| -v, --verbose                 | 打印接收到的历史消息数量与消息速率                                   |

#### 发布性能测试

```shell
mqttx bench pub --help
```

| 参数                                   | 描述                                                                 |
| -------------------------------------- | -------------------------------------------------------------------- |
| -c, --count <NUMBER>                   | 连接数量，默认为 1000                                                |
| -i, --interval <MILLISECONDS>          | 创建连接的间隔时间，单位为毫秒，默认为 10ms                          |
| -im, --message-interval <MILLISECONDS> | 发布消息的间隔时间，单位为毫秒，默认为 1000ms                        |
| -I, --client-id <ID>                   | 客户端 ID，支持 %i (索引) 占位符                                     |
| -t, --topic <TOPIC...>                 | 需要订阅的 Topic, 支持 %u (用户名), %c (客户端 ID), %i (索引) 占位符 |
| -v, --verbose                          | 打印发送出的历史消息数量与消息速率                                   |
| ~~-s, --stdin~~                        | ~~从 stdin 中读取信息体~~                                            |
| ~~-M, --multiline~~                    | ~~可以通过多行发布多条消息~~                                         |

### 模拟器

用于模拟特定场景下 MQTT 发布消息操作。

模拟器命令与[发布性能测试](#发布性能测试)参数基本相同，以下仅列出新增或有变化的参数。

```shell
mqttx simulate --help
```

| 参数                            | 描述                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| -sc, --scenario <SCENARIO>      | 模拟内置场景的名称                                                                                                               |
| -f, --file <SCENARIO FILE PATH> | 本地自定义场景脚本的文件路径                                                                                                     |
| -t, --topic <TOPIC...>          | 需要发布的消息主题, 可选, 支持 %u (用户名), %c (客户端 ID), %i (索引) 占位符,  %sc (场景) 占位符, 默认为 `mqttx/simulate/%sc/%c` |

`--scenario` 与 `--file` 参数必须指定一个，如果同时指定，优先使用 `--file` 参数。

自定义物联网数据模拟脚本示例：

<!-- TODO 在文档中补充更详细的信息并链接到文档。 -->

```js
/**
 * MQTTX 场景文件示例
 * 
 * 此脚本生成随机的温度和湿度数据。
 */
function generator (faker, options) {
  return {
    // 如果没有返回主题，则使用命令行参数中的主题。
    // 主题格式：'mqttx/simulate/myScenario/' + clientId,
    message: JSON.stringify({
      temp: faker.number.int({ min: 20, max: 80 }),  // 在 20 到 80 之间生成随机温度。
      hum: faker.number.int({ min: 40, max: 90 }),   // 在 40 到 90 之间生成随机湿度。
    })
  }
}
// 导出场景模块
module.exports = {
  name: 'myScenario',  // 场景名称
  generator,          // 生成器函数
}
```

对于更多示例和详细的编辑指南，请参考 MQTTX GitHub 仓库中的[脚本示例](https://github.com/emqx/MQTTX/tree/main/scripts-example/IoT-data-scenarios)，或查看如何使用 [faker.js](https://fakerjs.dev/) 来生成各种类型的随机数据。

### 列表

`list` 命令提供了可用资源的概览。

> 目前，该命令仅支持列出内置的场景。

```shell
mqttx list --help
```

| 参数             | 描述           |
| ---------------- | -------------- |
| -sc, --scenarios | 列出内置的场景 |

#### 内置场景

可以使用 `--scenarios` 选项来显示内置场景的列表。

```shell
mqttx list --scenarios
```

这个命令会输出一个表格，显示每个内置场景的名称和描述。如果想在模拟命令中使用其中一个，只需在 `--scenario` 选项中指定场景名称：

```shell
mqttx simulate --scenario <SCENARIO>
```

未来，`list` 命令将添加更多选项和功能。敬请期待！

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

- v18.\*.\*

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

请确保在发出 PR 请求前， 已经仔细阅读过了[贡献指南](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING_CN.md)

## 技术栈

- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)
- [pkg](https://github.com/vercel/pkg)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
