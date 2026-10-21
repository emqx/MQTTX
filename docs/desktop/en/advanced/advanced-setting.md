# Create a Connection with Advanced and MQTT 5.0 Settings

When you create a new connection, you can configure the advanced settings and settings for MQTT 5.0 features.

## Configure Advanced Settings

In **Advanced**, set the connection timeout, [Keep Alive](https://www.emqx.com/en/blog/mqtt-keep-alive), Clean Session or Clean Start, automatic reconnection, and MQTT version.

**MQTT Version** defaults to `5.0`; `3.1` and `3.1.1` are also available. With MQTT 5.0, you can set optional properties such as `Session Expiry Interval`, `Receive Maximum`, and `Topic Alias Maximum`.

Enable **Request Response Info** in an MQTT 5.0 connection's advanced settings to request Response Information in CONNACK. If returned, the connection header shows **Response Information** and a copy button, even when its settings are collapsed. Click a long value to view it in full. The value comes from the broker; MQTTX does not generate it. It is hidden for MQTT 3.x connections and after disconnecting.

See [Request Response](https://mqttx.app/docs/advanced#request-response) for the publishing workflow.

![MQTT 5.0 connection settings](../use-desktop/assets/connection-advanced.png)

## Configure Last Will and Testament

In **Last Will and Testament**, configure the message that the broker publishes if the client disconnects unexpectedly.

`Last-Will-QoS` defaults to `0` and `Last-Will-Retain` to `False`. Enter `Last-Will-Topic` and `Last-Will-Payload` to complete the configuration.

![mqttx-willmessage](/images/mqttx-willmessage.png)

Click **Connect** in the upper right corner to create the connection and connect to the broker.
