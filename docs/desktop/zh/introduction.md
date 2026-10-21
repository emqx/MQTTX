# 简介

[MQTTX Desktop](https://mqttx.app/zh) 是由 [EMQ](https://www.emqx.com/zh) 开源的跨平台 MQTT 5.0 桌面客户端，支持 macOS、Linux 和 Windows。它采用类似聊天软件的界面，可以同时管理多个连接，通过 TCP、TLS 和 WebSocket 快速测试连接、发布、订阅等 MQTT 功能。

安装前，请访问 [官网](https://mqttx.app/zh) 或 [GitHub](https://github.com/emqx/MQTTX) 了解最新版本。你也可以克隆 [源码](https://github.com/emqx/MQTTX) 自行构建。如果遇到问题或有建议，欢迎提交 [GitHub issue](https://github.com/emqx/MQTTX/issues)，或者 Fork 本项目并提交 Pull Request。

## 选择客户端

- [MQTTX Desktop](https://mqttx.app/zh/docs)：用于图形化调试、消息分析，并内置 MQTTX Agent。本篇指南介绍桌面版。
- [MQTTX CLI](https://mqttx.app/zh/docs/cli)：用于命令行收发消息、Shell 管道、自动化测试、压测和物联网数据模拟。
- [MQTTX Web](https://mqttx.app/zh/docs/web)：在浏览器中通过 WebSocket 连接 MQTT。可以直接使用[在线客户端](https://mqttx.app/web-client)，也可以用 Docker 自行部署。

## 预览

![mqttx-gif](/images/mqttx-gif.gif)

## 桌面版功能

- 采用聊天界面设计，收发 MQTT 消息简单直观
- 支持在 Windows、macOS 和 Linux 上运行
- 100% 兼容 MQTT v5.0、v3.1.1 和 v3.1 协议
- 支持 MQTT 5.0 连接、发布和订阅时的用户属性，以及 SCRAM 增强认证
- 支持单向和双向 SSL/TLS 认证
- 支持[通过 WebSocket 连接 MQTT 服务器](https://www.emqx.com/zh/blog/connect-to-mqtt-broker-with-websocket)
- [MQTTX Agent](/zh/docs/agent)：用自然语言操作 MQTTX，自动创建连接、订阅和发布消息，并调用 MCP 工具
- 支持 Plaintext、JSON、Base64、Hex、CBOR 和 MsgPack 等 Payload 格式，并支持 Protobuf 和 Avro 编解码
- 自动解压接收到的 GZIP 消息，然后再进行 Payload 解码
- 支持自定义脚本和定时消息，模拟 MQTT 发布/订阅测试
- 视图器工具：主题树、仪表盘、流量监控和消息体查看器
- 订阅的 MQTT 主题支持自定义颜色标签
- 支持以 JSON、CSV、Excel、XML 和 YAML 格式备份和恢复数据
- 提供完整的日志记录功能
- 自由切换 Light、Dark、Night 三种主题模式
- 多语言支持：简体中文、英语、日语、土耳其语、匈牙利语及韩语 🇨🇳 🇺🇸 🇯🇵 🇹🇷 🇭🇺 🇰🇷
