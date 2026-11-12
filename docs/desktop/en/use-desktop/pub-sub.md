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

## Batch Messages

From v1.14.0, MQTTX can send several messages on one topic as a single MQTT packet, called a batch. Batches work with MQTT 5.0 and MQTT 3.1.1 at QoS 0 or 1.

> **Note:** Batch messages require MQTT broker support. Before using them, make sure your broker and subscribers support batch messages.

### Send a batch

1. Open **Settings > Advanced** and turn on **Enable Batch publishing**.
2. Connect, enter a topic such as `demo/batch`, select `Plaintext` and **QoS 1**, then check **Batch**.
3. Enter one message per line and click Send:

   ```text
   hello
   {"temperature":23.5}
   world
   ```

The line below the editor shows the message count and size. A batch over the limits cannot be sent; MQTTX does not split it.

![Batch publishing and received message](./assets/batch-publish.png)

`Plaintext`, `JSON`, `Hex` and `Base64` are supported, and each line is encoded in the selected format: one complete JSON value per line, Hex as bytes such as `01 FF`, Base64 as encoded text such as `QQ==`. An empty line is an empty message; the final newline does not add one. If a line is invalid, MQTTX shows which line and does not send.

> **Note:** If the current settings conflict with Batch, such as `JSON`, `CBOR` or `MsgPack` format or QoS 2, MQTTX lists the settings it needs to change when you check Batch and changes them only after you confirm. You can select `JSON` again afterwards. Keep Payload Format Indicator off.

### MQTT 5.0 and 3.1.1

| Connection | Publish topic | Subscribe to          | Retain        |
| ---------- | ------------- | --------------------- | ------------- |
| MQTT 5.0   | `demo/batch`  | `demo/batch`          | Supported     |
| MQTT 3.1.1 | `demo/topic`  | `$batch/+/demo/topic` | Not supported |

On MQTT 5.0, MQTTX adds the `batch-format=v1` and `batch-size=N` User Properties. On MQTT 3.1.1, it publishes to `$batch/{N}/demo/topic`, so enter only `demo/topic` in the topic field. A `#` subscription does not match topics that start with `$`.

If your MQTT 5.0 broker requires clients to declare batch support when connecting, add `batch-publish` with value `v1` to the connection's User Properties before connecting, then check **Batch negotiation** in the connection information. If the broker does not accept, MQTTX shows a notice but still lets you publish.

### Receive and view

Subscribe to the topic in the table above. Received batches are recognized automatically, even when Batch publishing is off. Each batch is shown as one message with a **Batch × N** tag and the first 5 messages. When a batch has more than 5 messages and was stored with **Save all**, click **See More** to view each message and its size, 100 per page. **Save to Local** in that dialog exports it.

![Batch item table](./assets/batch-items.png)

A malformed or oversized batch shows an error and a short hex preview. In `Plaintext` format, messages that are not valid UTF-8 are kept as binary and marked **binary**.

> **Note:** Batches skip Schema and scripts, and received batches are not GZIP-decompressed.

### Limits and storage

Configure these options in **Settings > Advanced**:

| Setting                 | Default  | Description                                                                |
| ----------------------- | -------- | -------------------------------------------------------------------------- |
| Enable Batch publishing | Off      | Show the Batch option in the publish bar; turning it off exits Batch mode. |
| Batch max items         | `256`    | Shared by publishing and receiving; range `1–65535`.                       |
| Batch max bytes         | `65536`  | Each message adds 2 bytes for its length; range `1024–1048576`.            |
| Batch storage mode      | Save all | Store every received message.                                              |

Publish history can restore Batch mode only while **Enable Batch publishing** is on.

A single message can be up to 65,535 bytes. On MQTT 5.0, **Broker Maximum Packet Size** also limits the whole packet.

With **Summary only**, later batches keep only the first 20 messages, up to 32 bytes each, and are marked as summaries. The rest cannot be recovered or exported.
