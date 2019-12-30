<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo"/>

# MQTT X

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Slack Invite](<https://slack-invite.emqx.io/badge.svg>)](https://slack-invite.emqx.io)
[![Twitter](https://img.shields.io/badge/Twiiter-EMQ%20X-1DA1F2?logo=twitter)](https://twitter.com/emqtt)
[![Reddit](https://img.shields.io/badge/Reddit-EMQ%20X-orange?logo=reddit)](https://www.reddit.com/r/emqx/)

[English](./README.md) | 简体中文

---

**MQTT X** 是 [EMQ](http://emqx.io/cn) 开源的一款跨平台 MQTT 桌面客户端，它支持 macOS, Linux, Windows。

**MQTT X** 采用了聊天界面形式，简化了页面操作逻辑，允许保存多个客户端，方便用户快速测试 MQTT/MQTTS 连接，及 MQTT 消息的发布与订阅。

## 功能预览

![mqttx-preview](./assets/mqttx-preview.png)

## 安装

请从 [GitHub Releases](https://github.com/emqx/MQTTX/releases) 下载符合您的版本并安装使用。

国内用户也可以从 [这里](https://www.emqx.io/downloads/MQTTX/)下载。

## 使用

1. MQTT Broker 准备。

   - 如果您不需要本地部署的 MQTT Broker，那么可以使用 [EMQ X](https://github.com/emqx/emqx) 的线上公开版进行快速测试；

     ```shell
     Broker 地址: broker.emqx.io
     Broker TCP 端口: 1883
     Broker SSL 端口: 8883
     ```

   - 如果您打算部署一个本地运行的 MQTT Broker，那么我们推荐您 [下载 EMQ X](https://github.com/emqx/emqx/releases) 进行安装使用。EMQ X 是一款完全开源，高度可伸缩，高可用的百万级分布式 MQTT 消息服务器，是 5G 时代万物互联的消息引擎，支持 MQTT/CoAP/LwM2M 一站式 IoT 协议接入。

2. 连接配置。点击左侧菜单栏里的 `+` 号按钮，并填写表单中相应的必填项。

3. 连接信息配置完成后，点击右上角的 `Connect` 按钮就可以创建一个连接并连接至 MQTT Broker。

4. MQTT 连接成功后，就可以进行 MQTT 的发布与订阅测试。

![mqttx-gif](./assets/mqttx-gif.gif)

## 开发

``` shell
# 克隆项目
git clone git@github.com:emqx/MQTTX.git

# 安装依赖
cd MQTTX
yarn install

# 编译和热重载以进行开发
yarn run electron:serve

# 编译和压缩以构建生产版本
yarn run electron:build
```

## 贡献

1. Fork 这个项目；

2. 添加 upstream remote `git remote add upstream git@github.com:emqx/MQTTX.git`；

3. 本地修改代码，添加一个 commit 在您本地新的分支里；

4. 向 upstream 仓库的 develop 分支提交一个 Pull Request，我们将会审核它。

## 技术栈

- [Electron](https://electronjs.org/)
- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [TypeScript](https://www.typescriptlang.org/)
- [Lowdb](https://github.com/typicode/lowdb)

## 联系方式

|  方式   | 内容  |
|  ----  | ----  |
| QQ 群（EMQ X 官方群3）| 937041105 |
| EMQ X 官方公众号 | <img src="./assets/wx_qr_code.png" width="160" width="160" alt="MQTTX Logo"/> |

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
