# Publish and Subscribe

## Main Interface

After connecting, expand the panel next to the connection name to view or edit basic settings. Disconnect before changing settings, then reconnect to apply them. The panel collapses after each successful connection. While disconnected, use the configuration button on the right for all connection settings.

![mqttx-main](/images/mqttx-main.png)

## Add Subscription

Click `New Subscription` in the lower left corner and enter a [Topic](https://www.emqx.com/en/blog/advanced-features-of-mqtt-topics). Choose a color or use a randomly generated one. The button at the top right of the subscription list hides the list.

Click a subscription to filter messages; click it again to clear the filter, or select another subscription to change the filter. Click the topic name to copy it, then paste it into the publish area's topic field when needed.

![mqttx-topic](/images/mqttx-topic.png)

Optionally, set a topic alias when adding a subscription. The list displays the alias, while hovering shows the original topic. Aliases help distinguish long topic names.

![mqttx-topic-alias](/images/mqttx-topic-alias.png)

To add multiple topics at once, separate them with commas in the subscription dialog. Use commas to separate their aliases too.

![mqttx-multi-topics](/images/mqttx-multi-topics.png)

Right-click a subscription to **Edit**, **Disable**, or **Enable** it. Disable a subscription to stop receiving its messages temporarily; enable it to resume without entering the topic again.

![mqttx-edit-topic](/images/mqttx-edit-topic.png)

While disconnected, you can delete or disable subscriptions if Clean Session (MQTT 3.x) or Clean Start (MQTT 5.0) is enabled. MQTTX blocks these changes for persistent sessions: Clean Session disabled, or Clean Start disabled with a Session Expiry Interval greater than 0. The broker retains those subscriptions. Adding or editing a subscription still requires a connection.

## Publish and Receiving Messages

In the publish area, enter a subscribed topic, choose [QoS](https://www.emqx.com/en/blog/introduction-to-mqtt-qos) and `Retain`, enter the payload, and click Send. Sent messages appear on the right and received messages on the left. A message published to a subscribed topic appears in both. Press `Cmd + Enter` on macOS or `Ctrl + Enter` on other systems to publish.

![mqttx-message](/images/mqttx-message.png)

Choose `Base64`, `Hex`, `JSON`, `Plaintext`, `CBOR`, or `MsgPack` in the publish area's `payload` selector. Use the format selector above the message list to decode received messages.

> **Note:** CBOR and MsgPack are efficient binary formats that can reduce payload size compared with JSON. Both use JSON for input and output.

For `Protobuf` and `Avro` encoding and decoding, open **Script > Schema**.

Use the arrows in the publish area to browse previously published payloads. Right-click a message to copy its payload or topic.

Each connection saves its own publish area (`Topic`, `QoS`, `Retain`, `Payload`, and format) and publish history. A connection with no saved publish area opens with its most recent sent message. Upgrading copies the previously shared history to each connection. In the topic history drop-down, use an entry's delete icon to remove only that entry.

So far, the testing of an `MQTT` message is completed.
