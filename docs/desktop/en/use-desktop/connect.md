# Create Connection with General Settings

Use **General** on the **New** connection page to set broker details, user authentication, and SSL/TLS options.

## Broker Information

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

<img src="./assets/mqttx-brokerinfo.png" alt="mqttx-brokerinfo" style="zoom:40%;" />

## User Authentication

If the broker requires user authentication, enter **Username** and **Password**.

<img src="./assets/mqttx-user.png" alt="mqttx-user" style="zoom:40%;" />

## SSL/TLS

Enable **SSL/TLS** to encrypt the connection between MQTTX and the broker.

- **SSL/TLS**: Enable or disable TLS; off by default.
- **SSL Secure**: Verify the server certificate chain and hostname. Turning it off skips both checks. You can temporarily disable it when testing untrusted certificates in development or a trusted internal network; keep it enabled in production and for external connections.
- **CA signed server certificate**: Verify the server using a trusted CA.
- **CA or Self-signed certificates**: Supply your own certificates. One-way authentication requires **CA File**; two-way authentication also requires **Client Certificate File** and **Client key file**. Use the folder icon beside each field to select the file.

<img src="./assets/mqttx-certs.png" alt="mqttx-certs" style="zoom:40%;" />

## Configure Advanced Settings

In **Advanced**, set the connection timeout, [Keep Alive](https://www.emqx.com/en/blog/mqtt-keep-alive), Clean Session or Clean Start, automatic reconnection, and MQTT version.

**MQTT Version** defaults to `5.0`; `3.1` and `3.1.1` are also available. With MQTT 5.0, you can set optional properties such as `Session Expiry Interval`, `Receive Maximum`, and `Topic Alias Maximum`.

For all options, see [Advanced and MQTT 5.0 Settings](../advanced/advanced-setting.md).

![MQTT 5.0 connection settings](./assets/connection-advanced.png)

## Configure Last Will and Testament

In **Last Will and Testament**, configure the message that the broker publishes if the client disconnects unexpectedly.

`Last-Will-QoS` defaults to `0` and `Last-Will-Retain` to `False`. Enter `Last-Will-Topic` and `Last-Will-Payload` to complete the configuration.

![mqttx-willmessage](/images/mqttx-willmessage.png)

Click **Connect** in the upper right corner to create the connection and connect to the broker.
