# MQTTX Manual

> This manual covers MQTTX Desktop v1.13.1. For the latest documentation, see [mqttx.app/docs](https://mqttx.app/docs).

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [Development Guide](#development-guide)
- [FAQ](#faq)

## Introduction

[MQTTX](https://mqttx.app) is an open-source, cross-platform MQTT 5.0 desktop client from [EMQ](https://www.emqx.com/) for macOS, Linux, and Windows. Its chat-style interface lets you work with multiple connections at once and quickly test connecting, publishing, subscribing, and other MQTT features over TCP, TLS, and WebSocket.

Check the [website](https://mqttx.app) or [GitHub](https://github.com/emqx/MQTTX) for the latest release before installing. You can also clone the source code and build MQTTX yourself. If you run into a problem or have an idea, open a [GitHub issue](https://github.com/emqx/MQTTX/issues), or fork the project and submit a pull request.

### Preview

![mqttx-gif](../assets/mqttx-gif.gif)

- Runs on Windows, macOS, and Linux
- Fully compliant with MQTT 5.0, 3.1.1, and 3.1
- MQTT 5.0 user properties on connect, publish, and subscribe, plus SCRAM enhanced authentication
- CA-signed and self-signed certificates, with one-way and two-way SSL/TLS authentication
- MQTT over WebSockets
- Payload formats: Plaintext, JSON, Base64, Hex, CBOR, and MsgPack, with Protobuf and Avro schemas
- Custom scripts and timed messages for MQTT pub/sub simulation
- Viewer tools: Topic Tree, Traffic Monitor, and Payload Inspector
- Customizable colors for subscriptions
- Data backup and recovery in JSON, CSV, Excel, XML, and YAML
- Light, Dark, and Night themes
- Available in English, Simplified Chinese, Japanese, Turkish, Hungarian, and Korean

## Installation

Please install the suitable version from [GitHub Releases](https://github.com/emqx/MQTTX/releases).

If network reasons cause slow network speeds or jam when downloading from GitHub, you can also click [here](https://www.emqx.com/downloads/MQTTX/) and select the versions that match your requirement and install it.

**Note**: When downloading, please download the latest version whenever possible.

- macOS

For macOS users, it is recommended to download from the Mac App Store.

[![Download on the Mac App Store](../assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

When you need to download files to install, it is recommended to download the installation package file in `dmg` format first. You can also download the compressed file of `mac.zip`, which can be used quickly after decompression.

**Note**: However, for different `macOS` system versions, `zip` compression package may not be opened after decompression in the `10.15.2` version system. Please refer to the `dmg` file.

The macOS users can also install MQTTX using [brew cask](https://formulae.brew.sh/cask/mqttx)

```shell
brew install --cask mqttx
```

- Windows

For Windows users, please download the latest version of the `exe` file for your architecture (64-bit `x64` or 32-bit `ia32`). After downloading, you can install it according to the instructions of Setup.

- Linux

For Linux users, please download the latest `AppImage`, `deb`, or `rpm` file for your architecture (`x64` or `arm64`), or install MQTTX from Flathub or the Snap Store.

For installation using `snap` file, you can also execute this command to install or visit Snap Store or Flathub quickly:

[![Get it from the Snap Store](https://snapcraft.io/static/images/badges/en/snap-store-black.svg)](https://snapcraft.io/mqttx)
<a href='https://flathub.org/apps/details/com.emqx.MQTTX'><img height='56' alt='Download on Flathub' src='https://flathub.org/assets/badges/flathub-badge-en.png'/></a>

```shell
# Flathub
flatpak install flathub com.emqx.MQTTX

# Snap Store (x64 only)
sudo snap install mqttx
```

**Note**: When installing with `snap` files, there may be a problem with insufficient permissions. For details, refer to this `issue` [https://github.com/emqx/MQTTX/issues/109](https://github.com/emqx/MQTTX/issues/109)

## Usage

### MQTT Broker preparation

- If you don't need to deploy an MQTT broker locally, you can use the free [public MQTT 5.0 broker](https://www.emqx.com/en/mqtt/public-mqtt5-broker) for quick testing:

  ```text
  Host: broker.emqx.io
  TCP port: 1883
  SSL/TLS port: 8883
  ```

- If you plan to run an MQTT broker locally, we recommend [EMQX](https://www.emqx.com/en/products/emqx), an open-source, cloud-native, distributed MQTT broker for IoT.

  Install EMQX by using Docker:

  ```shell
  docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8883:8883 -p 8084:8084 -p 18083:18083 emqx/emqx
  ```

### Quickly establish a connection

When MQTT Broker is ready, click `+` in the left menu bar to enter the main program page. If there is no data on the page, you can also directly click the `new connection` button on the right to configure a new client connection quickly.

![mqttx-create](../assets/mqttx-create.png)

### Client related information

After entering the creation page, it is required to configure or fill in the relevant information for connecting to the client.

1. Broker information

   When configuring the `Broker` information,`Client ID`, `Host`, and `Port` are already filled in by default. You can also modify it based on the actual `Broker` information. Click the refresh button to the right of `Client ID` to quickly generate a new `Client ID`.

   The drop-down box in front of `Host` is used to select the connection protocol, which supports `mqtt: //`, `ws: //`. If an `SSL / TLS` authentication connection is used, it needs to be modified to `mqtts: //`. , `Wss: //`.

    **Note**: When the protocol is modified, the connection port needs to be modified.

![mqttx-brokerinfo](../assets/mqttx-brokerinfo.png)

2. User authentication information

   If your broker has enabled user authentication, you can fill in the information of `Username` and `Password` in the configuration item.

![mqttx-user](../assets/mqttx-user.png)

3. SSL/TLS

   When you need to enable `SSL/TLS` authentication, you only need to set the `SSL/TLS` configuration item in the configuration as `true`. The two methods,`CA signed self` and `Self signed` are provided.

   If `Self signed` is selected, certificate configuration can be performed. Click the folder button on the far right to select the certificates you have generated. If it is a one-way connection, you only need to select your `CA File`. If it is a two-way authentication, you also need to select to configure `Client Certificate File` and `Client key file`. When the option of `Strict validate Certificate` is enabled, a more complete certificate verification connection will be enabled. It is generally recommended to enable it when you need to test the production environment.

![mqttx-certs](../assets/mqttx-certs.png)

4. Advanced configuration

   In the advanced configuration, you can configure `Connection Timeout Duration`, `KeepAlive`, `Clean Session`, `Auto Reconnect`, `MQTT Version`, etc.

5. MQTT 5.0

   In the advanced configuration, you can select the protocol version of MQTT, including MQTT v3.1.1 and MQTT v5.0; the default is v3.1.1. If you choose v5.0, you can configure `Session Expiry Interval`, `Receive Maximum`, and `Topic Alias Maximu` (optional).

![mqttx-v5](../assets/mqttx-v5.png)

6. Will Message

    Below the advanced configuration, you can configure the Will Message. The values of `Last-Will-QoS` and `Last-Will-Retain` are filled with 0 and `False` by default. When you enter the values of `Last-Will-Topic` and `Last-Will-Payload`, you can complete the configuration of Will Message.

![mqttx-willmessage](../assets/mqttx-willmessage.png)

After the configuration is complete, click the `Connect` button in the upper right corner to quickly create a connection and connect to MQTT Broker.

### Subscribe and publish MQTT messages

1. Main interface

   After the connection is successful, you can enter the main interface of the connection. Click the fold button next to the connection name at the top to expand and display some basic information of the configuration. It is convenient to quickly modify several commonly used configurations of the connection. You need to disconnect when modifying, and click connect again to take effect. After each successful connection, the panel will automatically fold up. In the disconnected state, you can also click the configuration button on the right to modify more connection configurations.

![mqttx-main](../assets/mqttx-main.png)

2. Add subscription

   Click the `New Subscription` button in the lower left corner to quickly add a Topic. Each Topic can be marked with a color, which can be randomly generated or opened by the color selector. The rightmost button at the top of the subscription list can hide the subscription list to show more space on the page. After the addition is complete, click on the subscribed Topic items in the subscription list to achieve message filtering. The message view will only display the message content subscribed to the current topic. Click again to cancel the filter; You can also directly click other subscribed Topic items to view the corresponding message content. By clicking on the topic name, you can quickly copy the current topic information. When you need to send a message to this topic, you can quickly paste it into the topic input box of the message bar to modify it, and you can quickly complete the operation.

![mqttx-topic](../assets/mqttx-topic.png)

   When adding `Topic`, you can set an alias for each Topic. This option is an optional. When the subscription is set and added, the `Topic` in the subscription list will be displayed as an alias, and the mouse over the `Topic` item, the prompt box will also display the original value of the `Topic`. This is very helpful when multiple `Topics` that need to be monitored are too long to distinguish the specific meaning of `Topic`.

![mqttx-topic-alias](../assets/mqttx-topic-alias.png)

   We open the dialog of the subscription topic, in the Topic input box, enter multiple Topics and use comma (,) to split, click to confirm the success of the subscription, we can see that the subscription list contains multiple Topics. for the use of the client layer alias function can also support the simultaneous setting of multiple Topics, the same use of comma separation (,).

![mqttx-muti-topics](../assets/mqttx-muti-topics.png)

   Subscribed Topics support **Edit/Disable/Enable**, right click on the subscribed Topic list item, in the context menu we can quickly choose to edit, disable or enable the operation. When subscribing to too many Topics, sometimes not all the Topic messages you want to receive, in order to avoid subscribing to the same Topic again, the disable function is provided, if you want to receive messages from the Topic again, just enable it again.

![mqttx-edit-topic](../assets/mqttx-edit-topic.png)

3. Sending and receiving of messages

   After the `Topic` is successfully subscribed, you can test the sending and receiving of messages. Fill in the `Topic` information you just subscribed to in the lower right corner of the page. You can select the values of `QoS`, `Retain`, input `payload`, and click the send button on the far right to send a message to the `Topic` you just subscribed. After sending successfully, you can immediately receive the message just sent. Note that in the message box, the right column is the sent message, and the left column is the received message. macOS users can use the `command + enter` shortcut to quickly send messages, and other users can use the `control + enter` shortcut to do that.

   Through the `payload` option in the message bar, the messages can quickly be converted between `Base64`, `Hex`, `JSON`, `Plaintext`, `CBOR`, and `MsgPack`. For `Protobuf` and `Avro`, use the `Schema` tab on the `Script` page.

   Use the arrow buttons in the publish area to step through previously published payloads. To copy a message's payload or topic, right-click the message in the list.

![mqttx-message](../assets/mqttx-message.png)

So far, the test of an `MQTT` message is completed.

### MQTT 5

1. User Properties

    Click the New button to come to the New Client page, first we need to select the MQTT version 5.0, so you can see the bottom of the card to configure User Properties, the card is a key-value pair can be configured input box, you can click the upper right corner of the Add button to add User Properties configuration, click the Delete button at the end of each line to delete the configuration, and finally enter the required configuration Finally, you can enter the name and content of the property to be configured. After a successful connection, the MQTT server will be able to obtain the content of the client's User Properties.

![mqttx-user-properties-connect](../assets/mqttx-user-properties-connect.png)

    In addition to the configuration of user properties when connecting on the client side, this release also supports the configuration of user properties when publishing messages. When creating a new connection to an MQTT 5.0 client, we can see a Meta button in the bottom right corner of the publish message area, click on it to bring up a card for configuring the properties at publish time, and we can see the user properties configuration at the top of the card.

![mqttx-user-properties-publish](../assets/mqttx-user-properties-publish.png)

    For MQTT 5.0 connections, you can also add user properties in the new or edit subscription dialog. They are sent with the SUBSCRIBE packet, for example the `stream-offset` property used by EMQX MQTT Streams. Click the icon next to a subscription in the list to view its user properties.

2. Request Response

    Click the Meta button, enter a Response Topic: /ack/1 in the input box, enter a comparison data: light, and subscribe to a /ack/1 in the currently connected client.

![mqttx-response-topic](../assets/mqttx-response-topic.png)

3. Content Type and Payload Format Indicator

    Click the Meta button, enter the Content-Type in the input box, click Set Payload Format Indicator value, and publish the message.

![mqttx-content-type](../assets/mqttx-content-type.png)

4. SCRAM enhanced authentication

    If your broker has SCRAM authentication enabled, select `SCRAM-SHA-1`, `SCRAM-SHA-256`, or `SCRAM-SHA-512` from the `Authentication Method` dropdown in the connection settings, then connect with your username and password.

5. Subscription identifier and subscription options

We open the pop-up box for the Subscription topic. Below, you can set the Subscription Identifier and the subscription options containing No Local, Retain as Published, and Retain Handling. The user can specify a numeric subscription identifier in the subscription message and return this identifier when the message is distributed. Clients can establish a mapping of subscription identifiers to message handlers to direct messages to the corresponding message handler via the subscription identifier when a PUBLISH message is received and can configure these subscription options to change the server's behavior.

![mqttx-sub-flag](../assets/mqttx-sub-flag.png)

### Setting

Click the settings button at the bottom of the left menu bar, or use the shortcut. macOS users can use the `command +,` shortcut, and other users can use the `control +,` shortcut to jump to the settings page. The settings page has the following sections:

- **General**: language, auto check update, auto resubscribe, multi topics subscribe, max reconnect times, and max payload display size.
- **Appearance**: sync with OS theme, theme (Light, Dark, or Night), and JSON highlighting.
- **Extensions**: one-click installation of MQTTX CLI.
- **Advanced**: log level, data recovery and backup, clear history data, ignore QoS 0 messages, topic whitespace detection, and GPU acceleration.

![mqttx-theme](../assets/mqttx-theme.png)

#### Data management

The advanced settings include data backup and recovery functions. Users can choose two import and export ways: the upper right menu on the connection page or the advanced bar on the settings page.

On the settings page, you can click the data backup and recovery buttons in the advanced functions at the bottom. When selecting data backup, all connection data will be exported, including all received and sent messages. When selecting data recovery, after choosing the path of the imported file, the data can be recovered after confirmation. The file format supports `JSON`, `XML`, `CSV`, `Excel`, and `YAML`.

![mqttx-advance](../assets/mqttx-advance.png)

### Script

MQTTX provides a script editing function. Users can write custom functions (JavaScript) to transform sent and received `Payload`, and custom Schemas (`Protobuf` or `Avro`) to encode and decode them. Combined with timed messages, this enables automated testing with simulated data.

Click the `script` button in the menu bar on the left to enter the script editing page. In this page, users can write JavaScript code in the code editor at the top. There is only one `execute` API globally. The user needs write a script function that receives a `value` parameter, which is `Payload`, and the function can be customized to modify the `value`, and finally, the function can be executed by passing it as a parameter to the `execute` custom-written functions.

There is also an `input` and `output` box below. You can enter the expected input value. Click the `test` button on the right to view the execution result in the `output` box. The format of the input value includes `JSON` With `Plaintext`, it is convenient for users to debug custom-written script functions in advance. After completing the test, you can click the `Save` button in the upper right corner and enter the name of the script to save the script. After saving, you can go to the connection page for use. The saved script can also be edited and deleted.

In the connection page, click the drop-down menu in the upper right corner, select `Run Script`. In the pop-up window, select the pre-saved script you need to use, and then select the script to be applied, including Published, Received, and All. After the selection is completed, select the data format to be sent or received according to the data type, and use the message sending and receiving normally. At this time, if the expected effect is seen, a script function is completed. If the user needs to cancel the script, you can click the red `Stop script` button in the top status bar to stop using the script.

This function is scalable and flexible and requires users to cooperate with actual needs to use it.

![mqttx-script](../assets/mqttx-script.png)

Script examples are in the [scripts-example](https://github.com/emqx/MQTTX/tree/main/scripts-example) folder, including custom functions, Schemas, and IoT data scenarios. If you have a better and more practical script, you can submit your code there, so that more people can use it.

### Log

MQTTX includes a logging function to help users debug connections and report errors. The log system has 4 levels, and you can choose the level in the Advanced section of the settings page:

- DEBUG provides detailed debugging information, including MQTT.js packet details
- INFO is used to prompt user operation information
- WARN generates a warning of unsafe/potential risks
- ERROR produces a failed error

By default, logs will be written to the log file:

- Linux: `~/.config/MQTTX/logs/log`
- macOS: `~/Library/Application Support/MQTTX/logs/log`
- Windows: `%USERPROFILE%\AppData\Roaming\MQTTX\logs\log`

Every time MQTTX is closed, the current log file is renamed with a UTC timestamp in the `YYYY-MM-DDThh-mm-ss.log` format.

![mqttx-log](../assets/mqttx-log.png)

### Viewer

The Viewer in the left menu bar provides MQTT data visualization:

- **Topic Tree** (Beta): shows received topics and messages as a hierarchy, with search, a graphical view, and syncing of historical messages from a connection.
- **Traffic Monitor**: charts the broker's sent and received traffic from the `$SYS` system topics. Opening it from the connection page subscribes to `$SYS/#` automatically.

    > By default, EMQX only allows clients on localhost to subscribe to `$SYS` topics. To access them remotely, adjust the broker's ACL rules.

- **Payload Inspector**: examines the messages of one topic. Diff View compares each message with the previous one, and JSON Tree shows JSON payloads as a searchable tree that can also be visualized as a graph.

### Others

1. Connection operation

   By clicking the action bar button at the top, you can quickly disconnect, delete the current connection, import and export current data, set timed messages, and more. Right-click a connection in the connection list to duplicate it, open it in a new window, or copy its Host or Broker address.

![mqttx-connection](../assets/mqttx-connection.png)

2. Message processing

You can filter out all messages, received messages, and published messages through the `All`,`Received`, `Published` buttons in the upper right corner of the message bar.

Click the action bar button at the top, select the `Search`  item, or use the shortcut key. macOS users can use the command + f shortcut, and Other users can use the control + f shortcut to open the `Topic` search function. The fuzzy query of topics and payload is supported.

Click on the action bar button at the top and select the `Clear History` item. You can quickly clear the messages sent and received by the current connection.

![mqttx-search](../assets/mqttx-search.png)

3. Check the update

   Click the `i` button at the bottom left to enter the `About` page to learn about the version information of [MQTTX](https://mqttx.app) and related information of [EMQX](https://www.emqx.io) . Click `Check for Updates` to check if there are newer versions.

![mqttx-update](../assets/mqttx-update.png)

4. Max reconnection times

    The General section of the settings page includes a setting for the maximum number of reconnections, which can be set as an integer. When the broker is disconnected or the connection is unavailable, the connection will be completely disconnected if the number of reconnections exceeds this setting value.

5. Multi-window

    In the connection list, right-click and select `New window` to create a new window for the connection. In the new window, you can connect, subscribe to topics, publish and receive messages, etc. If there is a connection between multiple connections created, or you need to view messages received simultaneously, you can create numerous view windows and view them simultaneously. After v1.4.1, users can also click the window button at the top to quickly create a new window.

![mqttx-window](../assets/mqttx-window.png)

![mqttx-muti-window](../assets/mqttx-muti-window.png)

6. Timed message

    In the drop-down menu in the upper right corner, you can click the `Timed message` item to set the sending frequency in seconds. After the setting is completed, manually send a message, and the message will be automatically sent according to the set sending frequency.

![mqttx-timed-message](../assets/mqttx-timed-message.png)

## Development Guide

When developing, you need to have `Node.js` and `Git` installed locally, and be familiar with `Vue.js`, `Electron`, `TypeScript`, and related technologies. Use the Node.js version in [`.nvmrc`](../.nvmrc) (currently v22).

```shell
# Fork & Clone project
git clone git@github.com:${name}/MQTTX.git

# Install dependencies
cd MQTTX
yarn install

# Run the app in development mode with hot reload
yarn run electron:serve

# Build installers for Windows, Linux, and macOS
yarn run electron:build
```

Installers are written to the `dist_electron` directory. To build for a single platform, run one of the following:

```shell
yarn run electron:build-win
yarn run electron:build-linux
yarn run electron:build-mac
```

## FAQ

**Q: What is the MQTT Client?**

The MQTT client is any device that runs the MQTT library and connects to the MQTT Broker over the network. Publishers and subscribers refer to the client publishing messages or subscribing to receive them. Publishers and subscribers can be the same MQTT client (publishing and subscribing functionality can also be implemented in the same MQTT client). An MQTT client can be a tiny device with limited resources or a typical piece of computer software running a graphical user interface MQTT client for testing purposes. So it can be understood that any device or software component that connects to the MQTT service over the TCP/IP protocol can be called an MQTT client.

**Q: Why use MQTTX?**

MQTTX is an open-source, cross-platform MQTT desktop client tool. It can be used by users who are building their messaging servers for MQTT or by users who are developing MQTT Broker and studying and learning about MQTT to test connections, subscribe and publish messages, etc. Users can quickly set up multiple connection clients to test MQTT/TCP, MQTT/TLS connections, publish/subscribe functionality, and other features. MQTTX provides a quick, in-depth understanding of MQTT protocol-related features for MQTT research and applications.

**Q: Why does MQTTX use the UI design of chat software?**

Based on the understanding of the MQTT protocol of pub/sub model. It simplifies test operations with the help of a familiar, chat-like interface. It's easy and quick to create multiple, simultaneous online MQTT client connections and can test the connection, publishing, and subscription functions of MQTT/TCP, MQTT/TLS, MQTT/WebSocket, as well as other MQTT protocol features.

For example, create a new connection as `User A`, subscribe to a `Topic`, just like to join a chat channel, and then create a new connection as `User B`, publish a message to the `Topic` that `User A` has subscribed to, we can receive the message from User B in User A's page. In fact, in the IoT world as well, devices can use pub/sub feature of MQTT to communicate with each other. MQTTX emulates this and translates it into the user interface to help users understand and test MQTT-related content faster.

**Q: Is MQTTX free?**

Yes. Fully open source. See the [LICENSE](https://github.com/emqx/MQTTX/blob/main/LICENSE) for details.

**Q: What do you do when you have problems with MQTTX?**

1. You can visit the [GitHub](https://github.com/emqx/MQTTX) for MQTTX, go to the [issue](https://github.com/emqx/MQTTX/issues?q=is%3Aissue+is%3Aopen+sort%3Aupdated-desc) tab and click on submit issue to give feedback.
2. Go to our GitHub [Discussions](https://github.com/emqx/MQTTX/discussions) tab to give feedback.
3. Finally, you can contact us at the community information below to give us feedback on any issues you may have.

## Community, discussion, contribution, and support

You can reach the EMQ community and developers via the following channels:

- [GitHub Discussions](https://github.com/emqx/MQTTX/discussions)
- [Discord](https://discord.gg/xYGf3fQnES)
- [EMQX Slack](https://slack-invite.emqx.io/)
- [X](https://x.com/EMQTech)
- [Blog](https://www.emqx.com/en/blog)
