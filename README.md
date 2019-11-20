<img src="./assets/mqttx-logo.png" width="480" alt="MQTTX Logo" align=center/>

## MQTTX

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases) ![Support Platforms](https://camo.githubusercontent.com/a50c47295f350646d08f2e1ccd797ceca3840e52/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f706c6174666f726d2d6d61634f5325323025374325323057696e646f77732532302537432532304c696e75782d6c69676874677265792e737667) [![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)

English | [简体中文](./README-CN.md)

MQTTX is a cross-platform MQTT desktop client open sourced by EMQ, which supports macOS, Linux, and Windows.

MQTTX adopts  the form of chat interface, which simplifies the page operation, facilitates the user to quickly test the MQTT/MQTTS connection,  publish and subscribe to MQTT messages.

## Preview



## Installation

Download from [GitHub Releases](https://github.com/emqx/MQTTX/releases) and install it.

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

## Technology Stack

- [Vue](https://vuejs.org/) + [Element](https://element.eleme.io)
- [Lowdb](https://github.com/typicode/lowdb)
- [Electron](https://electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/master/LICENSE).
