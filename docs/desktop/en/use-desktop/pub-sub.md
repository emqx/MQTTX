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

> Planned for MQTTX Desktop 1.14.0. This feature is not available in 1.13.3.

Batch sends ordered items on one logical topic in a single MQTT PUBLISH. It supports MQTT 5.0 and MQTT 3.1.1 with QoS 0 or 1. Before sending, confirm that the broker route and consumers support the same batch format and limits. This format uses a two-byte big-endian length prefix for each item, not a JSON array or VBI framing.

### Send a batch

1. Open **Settings → Advanced** and turn on **Enable Batch publishing**. It is off by default and controls whether the publish bar shows the Batch checkbox.
2. Connect, enter a logical topic such as `demo/batch`, select **Plaintext** and **QoS 1**, then check **Batch**.
3. Enter one item per line and click Send:

   ```text
   hello
   {"temperature":23.5}
   world
   ```

The status line shows the item count and encoded payload size. A batch over the configured limits cannot be sent; shorten it or raise the limits within the route's allowance. Desktop sends one batch per click and does not split it automatically.

Empty lines are empty items; one final newline does not add an item. Batch supports **Plaintext, JSON, Hex, and Base64**. Each JSON item must be valid JSON on one line. For Hex, use byte pairs such as `01` and `FF`; for Base64, use encoded text such as `QQ==`. Invalid input shows the failing line and a correction hint, and disables sending.

Batch skips per-item Schema and scripts, and requires Payload Format Indicator to be off. MQTTX asks for confirmation before changing incompatible publish settings. Turning off the global setting exits Batch publishing mode; it does not hide received batches. Publish history retains the Batch choice, but cannot re-enable it while the global setting is off.

### Topics and negotiation

| Connection | Publish topic | Subscribe to          | Retain                          |
| ---------- | ------------- | --------------------- | ------------------------------- |
| MQTT 5.0   | `demo/batch`  | `demo/batch`          | Supported on compatible routes. |
| MQTT 3.1.1 | `demo/topic`  | `$batch/+/demo/topic` | Not supported for batches.      |

MQTT 5.0 adds `batch-format=v1` and `batch-size=N` User Properties automatically. MQTT 3.1.1 publishes to `$batch/{N}/demo/topic`; give the publish field only `demo/topic` to avoid a duplicate prefix. A subscription to `#` does not match topics starting with `$`.

If an MQTT 5.0 route requires negotiation, add `batch-publish` with value `v1` to the **connection's** User Properties before connecting. Check the Batch negotiation status in the connection information. Desktop warns if the offered version is not selected; this warning does not itself block publishing. On routes that require negotiation, publish only after confirming selection. The broker's Maximum Packet Size also limits the complete packet, including headers.

### Receive and inspect

Desktop recognizes incoming batch markers automatically, even when Batch publishing is disabled. Subscribe to the appropriate topic above; no receive-side checkbox is needed. A batch appears as one message bubble with a **Batch N** badge and the first five items. **See More** opens the item table, showing content and byte size with 100 items per page. Pagination changes the view, not the stored item count. **Save to Local** exports the saved payload.

Batch reception bypasses whole-payload GZIP decompression, Schema, and scripts. Invalid or oversized batches show an error and a bounded hex preview instead of partially decoded items. In Plaintext mode, non-UTF-8 items are preserved as binary and shown with a binary indicator.

### Limits and storage

Configure these options in **Settings → Advanced**:

| Setting                 | Default | Behavior                                                            |
| ----------------------- | ------- | ------------------------------------------------------------------- |
| Enable Batch publishing | Off     | Show or hide the Batch option in the publish bar.                   |
| Batch max items         | `256`   | Shared publish/receive limit; range `1–65535`.                      |
| Batch max bytes         | `65536` | Payload bytes including item length prefixes; range `1024–1048576`. |
| Batch storage mode      | Full    | Save all items in accepted incoming batches.                        |

**Summary** storage keeps only the first 20 items, up to 32 bytes per item, for future incoming batches. The message identifies it as a summary. Omitted data cannot be recovered or exported later. Use Full when you need the complete batch; the five-item bubble preview is only a display limit.
