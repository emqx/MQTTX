# 简介

[MQTTX Desktop](https://mqttx.app/zh) 是支持 macOS、Windows 和 Linux 的开源 MQTT 客户端，用于连接 Broker、收发消息和排查设备通信问题。内置的 MQTTX Agent 是支持自然语言操作 MQTTX 的 AI Agent，涵盖连接管理、消息收发、数据处理与问题排查，也支持按提供的 MQTT 协议进行设备查询与指令交互。Dashboard 独立提供数据可视化，将已收到消息中的字段展示为实时读数和趋势。

从[官网](https://mqttx.app/zh)或 [GitHub](https://github.com/emqx/MQTTX) 下载最新版本，也可以从[源码](https://github.com/emqx/MQTTX)构建。问题和建议请提交 [GitHub issue](https://github.com/emqx/MQTTX/issues)；欢迎 Fork 项目并提交 Pull Request。

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
- [**MQTTX Agent**](./use-desktop/agent.md)：自然语言操作与分析，包括基于协议的设备查询与指令交互；内置 Skill 提供任务指引，已配置的 MCP 工具支持外部系统操作。
- 支持 Plaintext、JSON、Base64、Hex、CBOR 和 MsgPack 等 Payload 格式，并支持 Protobuf 和 Avro 编解码
- 自动解压接收到的 GZIP 消息，然后再进行 Payload 解码
- 支持自定义脚本和定时消息，模拟 MQTT 发布/订阅测试
- [**Dashboard**](./use-desktop/dashboard.md)：当前读数、趋势图、可调整的数据布局与本地消息历史查询。
- **视图器工具**：主题树、流量监控和 Payload Inspector 提供主题、流量与 Payload 检查。
- 订阅的 MQTT 主题支持自定义颜色标签
- 支持以 JSON、CSV、Excel、XML 和 YAML 格式备份和恢复数据
- 提供完整的日志记录功能
- 自由切换 Light、Dark、Night 三种主题模式
- 多语言支持：简体中文、英语、日语、土耳其语、匈牙利语及韩语 🇨🇳 🇺🇸 🇯🇵 🇹🇷 🇭🇺 🇰🇷
