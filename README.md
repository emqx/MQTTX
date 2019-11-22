<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo"/>

## MQTTX

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases) ![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667) [![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)

English | [简体中文](./README-CN.md)

---

MQTTX is a cross-platform MQTT desktop client open sourced by EMQ, which supports macOS, Linux, and Windows.

MQTTX adopts  the form of chat interface, which simplifies the page operation, facilitates the user to quickly test the MQTT/MQTTS connection,  publish and subscribe to MQTT messages.

## Preview

![mqttx-preview](./assets/mqttx-preview.png)

## Installation

Download from [GitHub Releases](https://github.com/emqx/MQTTX/releases) and install it.

## Usage

1. Create broker

```conf
# If you don't have a mqtt broker available, you can use this public broker test.

Broker Address: broker.emqx.io
Broker Port: 1883
```

2. The same broker can create many clients

3. Go back to connectons page, select the broker's client for connection testing

## Develop

``` shell
# Clone
git clone git@github.com:emqx/MQTTX.git

# Install dependencies
cd MQTTX
yarn install

# Compiles and hot-reloads for development
yarn run electron:serve

# Compiles and minifies for production
yarn run electron:build
```

## Contributing

1. Fork this repository

2. Add upstream remote `git remote add upstream git@github.com:emqx/MQTTX.git`

3. Modify code, add commit on new branch, push it

4. Submit a pull request to upstream develop branch, we will review it

## Technology Stack

- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [Electron](https://electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Lowdb](https://github.com/typicode/lowdb)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
