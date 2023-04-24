<img src="https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-logo.png" width="480" alt="MQTTX Logo" />

# MQTT X CLI

[![GitHub Release](https://img.shields.io/github/release/emqx/mqttx?color=brightgreen)](https://github.com/emqx/mqttx/releases)
![build packages](https://github.com/emqx/MQTTX/workflows/build%20packages/badge.svg)
[![Total Downloads](https://img.shields.io/github/downloads/emqx/mqttx/total.svg)](https://github.com/emqx/mqttx/releases)
[![Docker](https://img.shields.io/docker/pulls/emqx/mqttx-cli)](https://hub.docker.com/r/emqx/mqttx-cli)
[![Slack](https://img.shields.io/badge/Slack-EMQX-39AE85?logo=slack)](https://slack-invite.emqx.io/) [![Discord](https://img.shields.io/discord/931086341838622751?label=Discord&logo=discord)](https://discord.gg/xYGf3fQnES)
[![Community](https://img.shields.io/badge/Community-MQTT%20X-yellow?logo=github)](https://github.com/emqx/MQTTX/discussions)
[![YouTube](https://img.shields.io/badge/Subscribe-EMQ-FF0000?logo=youtube)](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q)
[![Twitter](https://img.shields.io/badge/Follow-EMQ-1DA1F2?logo=twitter)](https://twitter.com/EMQTech)

English | [简体中文](https://github.com/emqx/MQTTX/blob/main/cli/README-CN.md)

---

[MQTT X CLI](https://mqttx.app/cli) is an open source MQTT 5.0 CLI Client and MQTT X on the command line. Designed to help develop and debug MQTT services and applications faster without the need to use a graphical interface.

> [MQTT](http://mqtt.org/faq) stands for MQ Telemetry Transport. It is a publish/subscribe, extremely simple and lightweight messaging protocol, designed for constrained devices and low-bandwidth, high-latency or unreliable networks.

## Preview

![mqttx-preview](https://raw.githubusercontent.com/emqx/MQTTX/main/assets/mqttx-cli-preview.png)

## Documentation

For introduction, installation, and usage, see the [MQTT X CLI documentation](https://mqttx.app/docs/cli). Below is a quick start guide.

## Installation

### macOS

To install the latest MQTTX CLI stable release on **macOS** using **binary download**.

> **Note**: Please note CPU architecture  of the current system environment

#### Intel Chip

```shell
curl -LO https://www.emqx.com/en/downloads/MQTTX/v1.9.1/mqttx-cli-macos-x64
sudo install ./mqttx-cli-macos-x64 /usr/local/bin/mqttx
```

#### Apple Silicon

```shell
curl -LO https://www.emqx.com/en/downloads/MQTTX/v1.9.1/mqttx-cli-macos-arm64
sudo install ./mqttx-cli-macos-arm64 /usr/local/bin/mqttx
```

#### Homebrew

```shell
brew install emqx/mqttx/mqttx-cli
```

### Linux

To install the latest MQTTX CLI stable release on **Linux** using **binary download**.

> **Note**: Please note CPU architecture  of the current system environment

#### x86-64

```shell
curl -LO https://www.emqx.com/en/downloads/MQTTX/v1.9.1/mqttx-cli-linux-x64
sudo install ./mqttx-cli-linux-x64 /usr/local/bin/mqttx
```

#### ARM64

```shell
curl -LO https://www.emqx.com/en/downloads/MQTTX/v1.9.1/mqttx-cli-linux-arm64
sudo install ./mqttx-cli-linux-arm64 /usr/local/bin/mqttx
```

### Windows

Windows users should go to the MQTT X [release page](https://github.com/emqx/MQTTX/releases) and find the `exe` package for the corresponding system architecture, download it manually and execute.

### NPM

```shell
npm install mqttx-cli -g
```

### Docker

```shell
docker pull emqx/mqttx-cli

docker run -it --rm emqx/mqttx-cli
```

### Other platforms

Download packaged binaries from the [MQTT X releases page](https://github.com/emqx/MQTTX/releases).

## Usage

After installing it, run `mqttx` on the terminal

### Quickstart

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

Benchmark

```bash
# Connect Benchmark
mqttx bench conn -c 5000

# Subscribe Benchmark
mqttx bench sub -c 5000 -t bench/%i

# Publish Benchmark
mqttx bench pub -c 5000 -t bench/%i
```

### Help

```shell
mqttx --help
```

| Options       | Description               |
| ------------- | ------------------------- |
| -v, --version | Output the version number |
| -h, --help    | Display help for command  |

| Command | Description                                    |
| ------- | ---------------------------------------------- |
| check   | Check for updates                              |
| conn    | Create a connection and connect to MQTT Broker |
| pub     | Publish a message to a topic                   |
| sub     | Subscribes to one or multiple topics           |
| bench   | MQTT Benchmark in performance testing          |

#### Connect

```shell
mqttx conn --help
```

| Options                                          | Description                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>                 | the MQTT version (default: 5)                                                                                                      |
| -h, --hostname <HOST>                            | the broker host (default: "localhost")                                                                                             |
| -p, --port <PORT>                                | the broker port                                                                                                                    |
| -i, --client-id <ID>                             | the client id                                                                                                                      |
| --no-clean                                       | set the clean session flag to false (default: true)                                                                                |
| -k, --keepalive <SEC>                            | send a ping every SEC seconds (default: 30)                                                                                        |
| -u, --username <USER>                            | the username                                                                                                                       |
| -P, --password <PASS>                            | the password                                                                                                                       |
| -l, --protocol <PROTO>                           | the protocol to use, mqtt or mqtts (default: mqtt)                                                                                 |
| --key <PATH>                                     | path to the key file                                                                                                               |
| --cert <PATH>                                    | path to the cert file                                                                                                              |
| --ca <PATH>                                      | path to the ca certificate                                                                                                         |
| --insecure                                       | do not verify the server certificate                                                                                               |
| -rp, --reconnect-period <MILLISECONDS>           | interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)                                       |
| --maximun-reconnect-times <NUMBER>               | the maximum reconnect times (default: 10)                                                                                          |
| -up, --user-properties <USERPROPERTIES...>       | the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")                                                                       |
| -Wt, --will-topic <TOPIC>                        | the will topic                                                                                                                     |
| -Wm, --will-message <BODY>                       | the will message                                                                                                                   |
| -Wq, --will-qos <0/1/2>                          | the will qos                                                                                                                       |
| -Wr, --will-retain                               | send a will retained message (default: false)                                                                                      |
| -Wd, --will-delay-interval <SECONDS>             | the will delay interval in seconds                                                                                                 |
| -Wpf, --will-payload-format-indicator            | will message is UTF-8 encoded character data or not                                                                                |
| -We, --will-message-expiry-interval <SECONDS>    | lifetime of the will message in seconds                                                                                            |
| -Wct, --will-content-type <CONTENTTYPE>          | description of the will message’s content                                                                                          |
| -Wrt, --will-response-topic <TOPIC>              | topic name for a response message                                                                                                  |
| -Wcd, --will-correlation-data <DATA>             | correlation data for the response message                                                                                          |
| -Wup, --will-user-properties <USERPROPERTIES...> | the user properties of will message                                                                                                |
| -se, --session-expiry-interval <SECONDS>         | the session expiry interval in seconds                                                                                             |
| --rcv-max, --receive-maximum <NUMBER>            | the receive maximum value                                                                                                          |
| --maximum-packet-size <NUMBER>                   | the maximum packet size the client is willing to accept                                                                            |
| --topic-alias-maximum <NUMBER>                   | the topic alias maximum value                                                                                                      |
| --req-response-info                              | the client requests response information from the server                                                                           |
| --no-req-problem-info                            | the client requests problem information from the server                                                                            |
| --save \[PATH\]                                  | save the parameters to the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json` |
| --config \[PATH\]                                | load the parameters from the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json` |
| --help                                           | display help for conn command                                                                                                      |

#### Subscribe

```shell
mqttx sub --help
```

| Options                                          | Description                                                                                                                                     |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>                 | the MQTT version (default: 5)                                                                                                                   |
| -h, --hostname <HOST>                            | the broker host (default: "localhost")                                                                                                          |
| -p, --port <PORT>                                | the broker port                                                                                                                                 |
| -i, --client-id <ID>                             | the client id                                                                                                                                   |
| -q, --qos <0/1/2>                                | the QoS of the message (default: 0)                                                                                                             |
| --no-clean                                       | set the clean session flag to false (default: true)                                                                                             |
| -t, --topic <TOPIC>                              | the message topic                                                                                                                               |
| -k, --keepalive <SEC>                            | send a ping every SEC seconds (default: 30)                                                                                                     |
| -u, --username <USER>                            | the username                                                                                                                                    |
| -P, --password <PASS>                            | the password                                                                                                                                    |
| -l, --protocol <PROTO>                           | the protocol to use, mqtt or mqtts (default: mqtt)                                                                                              |
| -nl, --no_local                                  | the no local MQTT 5.0 flag                                                                                                                      |
| -rap, --retain-as-published                      | the retain as published MQTT 5.0 flag                                                                                                           |
| -rh, --retain-handling <0/1/2>                   | the retain handling MQTT 5.0                                                                                                                    |
| --key <PATH>                                     | path to the key file                                                                                                                            |
| --cert <PATH>                                    | path to the cert file                                                                                                                           |
| --ca                                             | path to the ca certificate                                                                                                                      |
| --insecure                                       | do not verify the server certificate                                                                                                            |
| -rp, --reconnect-period <MILLISECONDS>           | interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)                                                    |
| --maximun-reconnect-times <NUMBER>               | the maximum reconnect times (default: 10)                                                                                                       |
| -up, --user-properties <USERPROPERTIES...>       | the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")                                                                                    |
| -f, --format <TYPE>                              | format the message body, support base64, json, hex                                                                                              |
| -v, --verbose                                    | print the topic before the message                                                                                                              |
| --output-mode <default/clean>                    | choose between the default and clean mode, which outputs the complete MQTT packet data, allowing users to pipe the output as they wish          |
| -Wt, --will-topic <TOPIC>                        | the will topic                                                                                                                                  |
| -Wm, --will-message <BODY>                       | the will message                                                                                                                                |
| -Wq, --will-qos <0/1/2>                          | the will qos                                                                                                                                    |
| -Wr, --will-retain                               | send a will retained message (default: false)                                                                                                   |
| -Wd, --will-delay-interval <SECONDS>             | the will delay interval in seconds                                                                                                              |
| -Wpf, --will-payload-format-indicator            | will message is UTF-8 encoded character data or not                                                                                             |
| -We, --will-message-expiry-interval <SECONDS>    | lifetime of the will message in seconds                                                                                                         |
| -Wct, --will-content-type <CONTENTTYPE>          | description of the will message’s content                                                                                                       |
| -Wrt, --will-response-topic <TOPIC>              | topic name for a response message                                                                                                               |
| -Wcd, --will-correlation-data <DATA>             | correlation data for the response message                                                                                                       |
| -Wup, --will-user-properties <USERPROPERTIES...> | the user properties of will message                                                                                                             |
| -se, --session-expiry-interval <SECONDS>         | the session expiry interval in seconds                                                                                                          |
| -si, --subscription-identifier <NUMBER>          | the identifier of the subscription                                                                                                              |
| --rcv-max, --receive-maximum <NUMBER>            | the receive maximum value                                                                                                                       |
| --maximum-packet-size <NUMBER>                   | the maximum packet size the client is willing to accept                                                                                         |
| --topic-alias-maximum <NUMBER>                   | the topic alias maximum value                                                                                                                   |
| --req-response-info                              | the client requests response information from the server                                                                                        |
| --no-req-problem-info                            | the client requests problem information from the server                                                                                         |
| -Cup, --conn-user-properties <USERPROPERTIES...> | the connect user properties of MQTT 5.0 (e.g. -Cup "name: mqttx cli")                                                                           |
| --save \[PATH\]                                  | save the parameters to the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json`                |
| --config \[PATH\]                                | load the parameters from the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json`              |
| --help                                           | display help for sub command                                                                                                                    |

#### Publish

```shell
mqttx pub --help
```

| Options                                          | Description                                                                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| -V, --mqtt-version <5/3.1.1/3.1>                 | the MQTT version (default: 5)                                                                                                      |
| -h, --hostname <HOST>                            | the broker host (default: "localhost")                                                                                             |
| -p, --port <PORT>                                | the broker port                                                                                                                    |
| -i, --client-id <ID>                             | the client id                                                                                                                      |
| -q, --qos <0/1/2>                                | the QoS of the message (default: 0)                                                                                                |
| --no-clean                                       | set the clean session flag to false (default: true)                                                                                |
| -t, --topic <TOPIC>                              | the message topic                                                                                                                  |
| -m, --message<MSG>                               | the message body (default: "Hello From MQTT X CLI")                                                                                |
| -r, --retain                                     | send a retained message (default: false)                                                                                           |
| -s, --stdin                                      | read the message body from stdin                                                                                                   |
| -M, --multiline                                  | read lines from stdin as multiple messages                                                                                         |
| -u, --username <USER>                            | the username                                                                                                                       |
| -P, --password <PASS>                            | the password                                                                                                                       |
| -l, --protocol <PROTO>                           | the protocol to use, mqtt or mqtts (default: mqtt)                                                                                 |
| --key <PATH>                                     | path to the key file                                                                                                               |
| --cert <PATH>                                    | path to the cert file                                                                                                              |
| --ca                                             | path to the ca certificate                                                                                                         |
| --insecure                                       | do not verify the server certificate                                                                                               |
| -rp, --reconnect-period <MILLISECONDS>           | interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)                                       |
| --maximun-reconnect-times <NUMBER>               | the maximum reconnect times (default: 10)                                                                                          |
| -up, --user-properties <USERPROPERTIES...>       | the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")                                                                       |
| -pf, --payload-format-indicator                  | the payload format indicator of the publish message                                                                                |
| -e, --message-expiry-interval <NUMBER>           | the lifetime of the publish message in seconds                                                                                     |
| -ta, --topic-alias <NUMBER>                      | value that is used to identify the topic instead of using the topic name                                                           |
| -rt, --response-topic <TOPIC>                    | string which is used as the topic name for a response message                                                                      |
| -cd, --correlation-data <DATA>                   | used by the sender of the request message to identify which request the response message is for when it is received                |
| -si, --subscription-identifier <NUMBER>          | the identifier of the subscription                                                                                                 |
| -ct, --content-type <TYPE>                       | a description of the content of the publish message                                                                                |
| -Wt, --will-topic <TOPIC>                        | the will topic                                                                                                                     |
| -Wm, --will-message <BODY>                       | the will message                                                                                                                   |
| -Wq, --will-qos <0/1/2>                          | the will qos                                                                                                                       |
| -Wr, --will-retain                               | send a will retained message (default: false)                                                                                      |
| -Wd, --will-delay-interval <SECONDS>             | the will delay interval in seconds                                                                                                 |
| -Wpf, --will-payload-format-indicator            | will message is UTF-8 encoded character data or not                                                                                |
| -We, --will-message-expiry-interval <SECONDS>    | lifetime of the will message in seconds                                                                                            |
| -Wct, --will-content-type <CONTENTTYPE>          | description of the will message’s content                                                                                          |
| -Wrt, --will-response-topic <TOPIC>              | topic name for a response message                                                                                                  |
| -Wcd, --will-correlation-data <DATA>             | correlation data for the response message                                                                                          |
| -Wup, --will-user-properties <USERPROPERTIES...> | the user properties of will message                                                                                                |
| -se, --session-expiry-interval <SECONDS>         | the session expiry interval in seconds                                                                                             |
| --rcv-max, --receive-maximum <NUMBER>            | the receive maximum value                                                                                                          |
| --maximum-packet-size <NUMBER>                   | the maximum packet size the client is willing to accept                                                                            |
| --topic-alias-maximum <NUMBER>                   | the topic alias maximum value                                                                                                      |
| --req-response-info                              | the client requests response information from the server                                                                           |
| --no-req-problem-info                            | the client requests problem information from the server                                                                            |
| -Cup, --conn-user-properties <USERPROPERTIES...> | the connect user properties of MQTT 5.0 (e.g. -Cup "name: mqttx cli")                                                              |
| --save \[PATH\]                                  | save the parameters to the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json`   |
| --config \[PATH\]                                | load the parameters from the local configuration file, which supports json and yaml format, default path is `./mqttx-cli-config.json` |
| --help                                           | display help for pub command                                                                                                       |

### Benchmark

The bench command is used to test the performance of the broker. It has basically the same as the normal command options, the following will only list the new or changed options.

#### Connect Benchmark

```shell
mqttx bench conn --help
```

| Options                       | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| -c, --count <NUMBER>          | the number of connections (default: 1000)            |
| -i, --interval <MILLISECONDS> | interval of connecting to the broker (default: 10ms) |
| -I, --client-id <ID>          | the client id, support %i (index) variable           |

#### Subscribe Benchmark

```shell
mqttx bench sub --help
```

| Options                       | Description                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------ |
| -c, --count <NUMBER>          | the number of connections (default: 1000)                                      |
| -i, --interval <MILLISECONDS> | interval of connecting to the broker (default: 10ms)                           |
| -I, --client-id <ID>          | the client id, support %i (index) variable                                     |
| -t, --topic <TOPIC...>        | the message topic, support %u (username), %c (client id), %i (index) variables |
| -v, --verbose                 | print history received messages and rate                                       |

#### Publish Benchmark

```shell
mqttx bench pub --help
```

| Options                                | Description                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| -c, --count <NUMBER>                   | the number of connections (default: 1000)                                      |
| -i, --interval <MILLISECONDS>          | interval of connecting to the broker (default: 10ms)                           |
| -im, --interval-message <MILLISECONDS> | interval of publishing message to the broker (default: 1000ms)                 |
| -I, --client-id <ID>                   | the client id, support %i (index) variable                                     |
| -t, --topic <TOPIC...>                 | the message topic, support %u (username), %c (client id), %i (index) variables |
| -m, --message <MSG>                               | the message body (default: "Hello From MQTT X CLI")                                                                                |
| -sim, --simulator <SIMULATOR> | Using the simulator to generate scenario-specific messages, it will override the -m parameter |
| -v, --verbose                          | print history received messages and rate                                       |
| ~~-s, --stdin~~                        | ~~read the message body from stdin~~                                           |
| ~~-M, --multiline~~                    | ~~read lines from stdin as multiple messages~~                                 |

## Better Together with EMQX

MQTT X is designed to connect to test MQTT Brokers such as EMQX, The one-click connection and simple graphical interface make it easy to connect to EMQX or EMQX Cloud to debug and explore functional features.

[Sign up EMQX Cloud for 14 days free trial](https://www.emqx.com/en/try?product=cloud)

[Download EMQX locally right now](https://www.emqx.com/en/try?product=enterprise)

## Get Involved

- Follow [@EMQTech on Twitter](https://twitter.com/EMQTech).
- If you have a specific question, check out our [discussion forums](https://github.com/emqx/emqx/discussions).
- For general discussions, join us on the [official Discord](https://discord.gg/xYGf3fQnES) team.
- Keep updated on [EMQX YouTube](https://www.youtube.com/channel/UC5FjR77ErAxvZENEWzQaO5Q) by subscribing.

## Develop

Recommended version for Node environment:

- v16.\*.\*

``` shell
# Clone
git clone git@github.com:emqx/MQTTX.git

# Install dependencies
cd MQTTX/cli
yarn install

# Compiles and hot-reloads for development
yarn run dev

# Compiles and minifies for production
yarn run build
```

After a successful build, the corresponding file for the successful build will appear in the `dist` directory and will need to be used in a Node.js environment.

If you need to package a binary executable, please refer to the following command.

```shell
# Install pkg lib
npm install pkg -g

# Build binary
pkg package.json
```

After a successful build, you will see the binary executable for each system in the `release` directory.

## Contributing

Please make sure to read the [Contributing Guide](https://github.com/emqx/MQTTX/blob/main/.github/CONTRIBUTING.md) before making a pull request.

## Technology Stack

- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/en/)
- [pkg](https://github.com/vercel/pkg)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)

## License

Apache License 2.0, see [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE).
