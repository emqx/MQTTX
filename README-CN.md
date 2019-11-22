<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo"/>

## MQTTX

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases) ![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667) [![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)

[English](./README.md) | 简体中文

---

MQTTX 是 EMQ 开源的一款跨平台 MQTT 桌面客户端，它支持 macOS, Linux, Windows。

MQTTX 采用了聊天界面形式，简化了页面操作逻辑，方便用户快速测试 MQTT/MQTTS 连接，及 MQTT 消息的发布与订阅。

## 预览

![mqttx-preview](./assets/mqttx-preview.png)

## 安装

请从 [GitHub Releases](https://github.com/emqx/MQTTX/releases) 下载符合您的版本并安装使用。

## 使用

1. 首先创建一个 Broker

```conf
# 如果你暂时没有一个可用的 MQTT Broker，你可以用这个公共的 Broker 进行测试

Broker 地址: broker.emqx.io
Broker 端口: 1883
```

2. 同一个 Broker 下可以创建多个客户端

3. 回到连接页面，选择刚才创建的 Broker 下的客户端进行连接测试

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

1. Fork 这个项目

2. 添加 upstream remote `git remote add upstream git@github.com:emqx/MQTTX.git`

3. 本地修改代码，添加一个 commit 在您本地新的分支里

4. 向 upstream 仓库的 develop 分支提交一个 Pull Request，我们将会审核它

## 技术栈

- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [Electron](https://electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Lowdb](https://github.com/typicode/lowdb)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
