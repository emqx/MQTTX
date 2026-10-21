# MQTTX Manual

> This manual covers MQTTX Desktop v1.13.2. For the latest documentation, see [mqttx.app/docs](https://mqttx.app/docs).

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [Development Guide](#development-guide)
- [FAQ](#faq)

## Introduction

[MQTTX Desktop](https://mqttx.app) is an open-source MQTT 5.0 client from [EMQ](https://www.emqx.com/) for macOS, Windows, and Linux. Its chat-style interface supports multiple connections and subscriptions over TCP, TLS, and WebSocket, with MQTTX Agent for connection setup, messaging, and troubleshooting in natural language.

Download the latest release from the [website](https://mqttx.app) or [GitHub](https://github.com/emqx/MQTTX), or build it from [source](https://github.com/emqx/MQTTX). Report problems and suggestions in [GitHub issues](https://github.com/emqx/MQTTX/issues); fork the project and submit a pull request to contribute.

### Preview

![mqttx-gif](../assets/mqttx-gif.gif)

- Runs on Windows, macOS, and Linux
- Fully compliant with MQTT 5.0, 3.1.1, and 3.1
- MQTT 5.0 user properties on connect, publish, and subscribe, plus SCRAM enhanced authentication
- CONNACK Response Information on the connection page
- CA-signed and self-signed certificates, with one-way and two-way SSL/TLS authentication
- MQTT over WebSockets
- MQTTX Agent that operates MQTTX in natural language, with Skills, MCP, action approval, and multiple model providers
- Payload formats: Plaintext, JSON, Base64, Hex, CBOR, and MsgPack, with Protobuf and Avro schemas
- Automatic GZIP decompression of received messages
- Custom scripts and timed messages for MQTT pub/sub simulation
- Viewer tools: Topic Tree, Dashboard, Traffic Monitor, and Payload Inspector
- A publish area and publish history per connection
- Customizable colors for subscriptions
- Data backup and recovery in JSON, CSV, Excel, XML, and YAML, with JSON keeping connection groups
- Light, Dark, and Night themes
- Available in English, Simplified Chinese, Japanese, Turkish, Hungarian, and Korean

## Installation

Please install the suitable version from [GitHub Releases](https://github.com/emqx/MQTTX/releases).

If network reasons cause slow network speeds or jam when downloading from GitHub, you can also click [here](https://www.emqx.com/downloads/MQTTX/) and select the versions that match your requirement and install it.

**Note**: When downloading, please download the latest version whenever possible.

- macOS

For the current desktop release, download a package from the [MQTTX download page](https://mqttx.app/downloads). MQTTX is also available on the Mac App Store; its version may differ.

[![Download on the Mac App Store](../assets/app-store-download.svg)](https://apps.apple.com/us/app/mqttx/id1514074565?mt=12)

When you need to download files to install, it is recommended to download the installation package file in `dmg` format first. You can also download the compressed file of `mac.zip`, which can be used quickly after decompression.

**System requirement for MQTTX 1.13.2**: macOS 12 or later. Choose the Intel or Apple Silicon package for your Mac.

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

Once your broker is ready, click `+` in the left sidebar or **New Connection** to open the connection form.

When no connections are saved, the welcome page offers three shortcuts:

- **New Connection**: Open the connection form, or press `Cmd/Ctrl + N`.
- **Try public broker**: Create a connection named `broker.emqx.io` to `broker.emqx.io:1883` and connect immediately.
- **Import Data**: Import JSON, YAML, CSV, XML, or Excel files. The app reloads after a successful import.

![mqttx-create](../assets/mqttx-create.png)

### Client related information

Configure the following fields on the connection form.

1. Broker Information

   **Client ID**, **Host**, and **Port** have default values. Set them to match your broker.

   - **Name**: Enter a connection name, such as `emqx_test`.
   - **Client ID**: A unique identifier for the connection. Click the refresh button to generate one.
   - **Host**: Choose `mqtt://` or `ws://`, or `mqtts://` or `wss://` for TLS. The default hostname is the public broker `broker.emqx.io`; replace it with your broker's hostname or IP address when needed.
     - **Path**: For WebSocket connections, enter the server's endpoint path; the default is `/mqtt`.
   - **Port**: Use the port configured for the selected protocol. EMQX defaults are listed below; your broker may use different ports.

     | Protocol | Default EMQX port |
     | -------- | ----------------- |
     | mqtt://  | 1883              |
     | mqtts:// | 8883              |
     | ws://    | 8083              |
     | wss://   | 8084              |

   ![mqttx-brokerinfo](../assets/mqttx-brokerinfo.png)

2. User Authentication Information

   If the broker requires user authentication, enter **Username** and **Password**.

   ![mqttx-user](../assets/mqttx-user.png)

3. SSL/TLS

   Enable **SSL/TLS** to encrypt the connection between MQTTX and the broker.

   - **SSL/TLS**: Enable or disable TLS; off by default.
   - **SSL Secure**: Verify the server certificate chain and hostname. Turning it off skips both checks. You can temporarily disable it when testing untrusted certificates in development or a trusted internal network; keep it enabled in production and for external connections.
   - **CA signed server certificate**: Verify the server using a trusted CA.
   - **CA or Self-signed certificates**: Supply your own certificates. One-way authentication requires **CA File**; two-way authentication also requires **Client Certificate File** and **Client key file**. Use the folder icon beside each field to select the file.

   ![mqttx-certs](../assets/mqttx-certs.png)

4. Advanced Configuration

   In **Advanced**, set the connection timeout, [Keep Alive](https://www.emqx.com/en/blog/mqtt-keep-alive), Clean Session or Clean Start, automatic reconnection, and MQTT version.

5. MQTT 5.0

   **MQTT Version** defaults to `5.0`; `3.1` and `3.1.1` are also available. With MQTT 5.0, you can set optional properties such as `Session Expiry Interval`, `Receive Maximum`, and `Topic Alias Maximum`.

   ![mqttx-v5](../assets/mqttx-v5.png)

6. Will Message

   In **Last Will and Testament**, configure the message that the broker publishes if the client disconnects unexpectedly.

   `Last-Will-QoS` defaults to `0` and `Last-Will-Retain` to `False`. Enter `Last-Will-Topic` and `Last-Will-Payload` to complete the configuration.

   ![mqttx-willmessage](../assets/mqttx-willmessage.png)

Click **Connect** in the upper right corner to create the connection and connect to the broker.

### Subscribe and publish MQTT messages

1. Main interface

   After connecting, expand the panel next to the connection name to view or edit basic settings. Disconnect before changing settings, then reconnect to apply them. The panel collapses after each successful connection. While disconnected, use the configuration button on the right for all connection settings.

   ![mqttx-main](../assets/mqttx-main.png)

2. Add subscription

   Click `New Subscription` in the lower left corner and enter a [Topic](https://www.emqx.com/en/blog/advanced-features-of-mqtt-topics). Choose a color or use a randomly generated one. The button at the top right of the subscription list hides the list.

   Click a subscription to filter messages; click it again to clear the filter, or select another subscription to change the filter. Click the topic name to copy it, then paste it into the publish area's topic field when needed.

   ![mqttx-topic](../assets/mqttx-topic.png)

   Optionally, set a topic alias when adding a subscription. The list displays the alias, while hovering shows the original topic. Aliases help distinguish long topic names.

   ![mqttx-topic-alias](../assets/mqttx-topic-alias.png)

   To add multiple topics at once, separate them with commas in the subscription dialog. Use commas to separate their aliases too.

   ![mqttx-multi-topics](../assets/mqttx-muti-topics.png)

   Right-click a subscription to **Edit**, **Disable**, or **Enable** it. Disable a subscription to stop receiving its messages temporarily; enable it to resume without entering the topic again.

   ![mqttx-edit-topic](../assets/mqttx-edit-topic.png)

   While disconnected, you can delete or disable subscriptions if Clean Session (MQTT 3.x) or Clean Start (MQTT 5.0) is enabled. MQTTX blocks these changes for persistent sessions: Clean Session disabled, or Clean Start disabled with a Session Expiry Interval greater than 0. The broker retains those subscriptions. Adding or editing a subscription still requires a connection.

3. Sending and receiving of messages

   In the publish area, enter a subscribed topic, choose [QoS](https://www.emqx.com/en/blog/introduction-to-mqtt-qos) and `Retain`, enter the payload, and click Send. Sent messages appear on the right and received messages on the left. A message published to a subscribed topic appears in both. Press `Cmd + Enter` on macOS or `Ctrl + Enter` on other systems to publish.

   ![mqttx-message](../assets/mqttx-message.png)

   Choose `Base64`, `Hex`, `JSON`, `Plaintext`, `CBOR`, or `MsgPack` in the publish area's `payload` selector. Use the format selector above the message list to decode received messages.

   > **Note:** CBOR and MsgPack are efficient binary formats that can reduce payload size compared with JSON. Both use JSON for input and output.

   For `Protobuf` and `Avro` encoding and decoding, open **Script > Schema**.

   Use the arrows in the publish area to browse previously published payloads. Right-click a message to copy its payload or topic.

   Each connection saves its own publish area (`Topic`, `QoS`, `Retain`, `Payload`, and format) and publish history. A connection with no saved publish area opens with its most recent sent message. Upgrading copies the previously shared history to each connection. In the topic history drop-down, use an entry's delete icon to remove only that entry.

   So far, the testing of an `MQTT` message is completed.

### MQTT 5

1. User Properties

    Click the New button to come to the New Client page, first we need to select the MQTT version 5.0, so you can see the bottom of the card to configure User Properties, the card is a key-value pair can be configured input box, you can click the upper right corner of the Add button to add User Properties configuration, click the Delete button at the end of each line to delete the configuration, and finally enter the required configuration Finally, you can enter the name and content of the property to be configured. After a successful connection, the MQTT server will be able to obtain the content of the client's User Properties.

![mqttx-user-properties-connect](../assets/mqttx-user-properties-connect.png)

    In addition to the configuration of user properties when connecting on the client side, this release also supports the configuration of user properties when publishing messages. When creating a new connection to an MQTT 5.0 client, we can see a Meta button in the bottom right corner of the publish message area, click on it to bring up a card for configuring the properties at publish time, and we can see the user properties configuration at the top of the card.

![mqttx-user-properties-publish](../assets/mqttx-user-properties-publish.png)

    For MQTT 5.0 connections, you can also add user properties in the new or edit subscription dialog. They are sent with the SUBSCRIBE packet, for example the `stream-offset` property used by EMQX MQTT Streams. Click the icon next to a subscription in the list to view its user properties.

2. Request Response

    Click the Meta button, enter a Response Topic: /ack/1 in the input box, enter a comparison data: light, and subscribe to a /ack/1 in the currently connected client.

    MQTTX can also show the response information that the broker returns. In the advanced settings of an MQTT 5.0 connection, turn on `Request Response Info`. When the broker returns Response Information in CONNACK, the connection information area at the top of the connection page shows `Response Information` (the Response Information value) with a copy button, and it stays visible while the connection settings are collapsed. If the value is too long, click it to view the full content. Nothing is shown for MQTT 3.x connections or after the connection is disconnected.

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
- **Advanced**: log level, data recovery and backup, clear history data, ignore QoS 0 messages, GZIP message decompression, topic whitespace detection, and GPU acceleration.
- **MQTTX Agent**: enable the agent, configure the model provider, reasoning strength, default permission mode, maximum steps per reply, and MCP servers. See [MQTTX Agent](./desktop/en/use-desktop/agent.md).

![mqttx-theme](../assets/mqttx-theme.png)

**GZIP message decompression**

The `Decompress GZIP messages` switch in the Advanced section decompresses received GZIP messages and is off by default. A received message that starts with the gzip magic number `1f 8b` is decompressed first, then decoded with the selected payload format or Schema; messages that are not gzipped are left unchanged. A message that cannot be decompressed is marked with an error and keeps its original content. Decompressed messages show a `GZIP` badge next to their QoS value (hover it to see `Automatically decompressed from GZIP`), and the badge is stored with the message, so history messages keep it after you turn the switch off or restart MQTTX.

#### Data management

The advanced settings include data backup and recovery functions. Users can choose two import and export ways: the upper right menu on the connection page or the advanced bar on the settings page.

On the settings page, you can click the data backup and recovery buttons in the advanced functions at the bottom. When selecting data backup, all connection data will be exported, including all received and sent messages. When selecting data recovery, after choosing the path of the imported file, the data can be recovered after confirmation. The file format supports `JSON`, `XML`, `CSV`, `Excel`, and `YAML`.

Backing up to `JSON` also keeps connection groups: nested and empty groups, their order, and the group each connection belongs to, and a single-connection JSON export includes its parent groups. The other formats keep their existing connection or message layout without groups. Older connection-only backups can still be imported and are placed at the root level, importing an existing ID updates that entity, and a file with conflicting IDs, missing group references, or a cyclic group hierarchy is rolled back as a whole.

Connections remain disconnected after recovery. See [Advanced settings](https://mqttx.app/docs/advanced#backup-and-restore) for JSON compatibility and import conflict rules.

![mqttx-advance](../assets/mqttx-advance.png)

### MQTTX Agent

MQTTX Agent is an AI assistant built into the desktop app. You describe what you need in plain language and it operates MQTTX through tools: it creates and connects connections, subscribes and publishes, reads messages, builds the Topic Tree and dashboards, writes scripts and schemas, calls your MCP servers, and changes app settings.

Type `/` and choose **Zero EMQX** to create a free temporary test broker and save its TLS connection. Ask the Agent to connect in a separate step. The broker expires according to its returned lifetime and is not for production.

To turn it on, open **Settings → MQTTX Agent**, enable **Enable MQTTX Agent**, and fill in the **API Host**, **API Key**, and **Model** of your provider. Open the agent full screen with the star button in the left bar, or as a floating window with `Cmd/Ctrl + J` or the **MQTTX Agent** button at the top right of a connection or script page.

The default **Ask before actions** mode lets reads run automatically and asks for approval before creating, connecting, subscribing, publishing, deleting, or calling MCP tools. **Auto** skips these prompts, but script tests always require approval; change the default in **Settings → MQTTX Agent → Default permission mode**.

Your conversations and tool results are sent to the model provider you configure, so avoid entering secrets in the chat. See [MQTTX Agent](./desktop/en/use-desktop/agent.md) for setup, attachments, Skills, MCP, conversation history, and limitations.

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

- **Topic Tree** (Beta): shows received topics and messages as a hierarchy, with search, a graphical view, and syncing of historical messages from a connection. The divider between the tree and the details panel can be dragged to resize the panel between 20% and 60% of the width, and the width is remembered. The Sub-Topics area lists only the direct children of the selected node, and its title shows the number of sub-topics and the number of levels below them, for example `Sub-Topics (55 · 2 levels)`. Up to 100 sub-topics are listed, followed by `... and N more`, Expand All asks for confirmation when the tree has more than 1,000 nodes, and large topic trees no longer slow the page down.
- **Dashboard**: builds a view of the values you care about from live messages. The dashboard list sits on the left and can be resized between 160 and 400 pixels, and `Add Widget` places Big Number, Line, or Gauge widgets that read a connection, a topic pattern, and a value field from the payload. Widgets can be dragged and resized on a 12-column grid, and opening a dashboard loads the latest 1,000 data points in the selected time range before updating live.
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

Click the `Clear History` button in the toolbar at the top of the connection page. A confirmation dialog names the connection, and the messages are cleared only after you confirm.

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

Use Git, Yarn, and Node.js 22, matching [`.nvmrc`](../.nvmrc). Familiarity with Vue.js, Electron, and TypeScript is recommended. The commands below use [nvm](https://github.com/nvm-sh/nvm); use your version manager to select the same Node.js version if needed. For contributions, fork the repository first and clone your fork.

```shell
# Clone the repository
git clone https://github.com/emqx/MQTTX.git

# Install dependencies
cd MQTTX
nvm use
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
