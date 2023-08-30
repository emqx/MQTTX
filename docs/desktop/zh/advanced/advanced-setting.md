# Create a Connection with Advanced and MQTT 5.0 Settings

When you create a new connection, you can configure the advanced settings and settings for MQTT 5.0 features.

## Configure Advanced Settings

In the Advanced section, you can configure the MQTT protocol-related features.

The default value of the **MQTT Version** is `5.0` and you can configure the MQTT 5.0 specific features such as `Session Expiry Interval`, `Receive Maximum`, and `Topic Alias Maximum` (optional). You can also select other MQTT protocol versions from the drop-down list. Other optional values are `3.1` and `3.1.1`.

For detailed information on the advanced settings, see [Advanced]. <!--To do: add links later-->

<img src="./assets/connection-advanced.png" alt="connection-advanced" style="zoom:40%;" />

## Configure Last Will and Testament

In the **Last Will and Testament** section, you can configure options for will messages.

The `Last-Will-QoS` and `Last-Will-Retain` fields are preset with 0 and `False`, respectively. Input the `Last-Will-Topic` and `Last-Will-Payload` values to complete the Will Message configuration.

![mqttx-willmessage](/images/mqttx-willmessage.png)

After completing the configuration, click the `Connect` button in the upper right corner to swiftly create a connection and connect to the MQTT Broker.
