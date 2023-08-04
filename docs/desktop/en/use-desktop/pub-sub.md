# Publish and Subscribe

## Main Interface

Upon successful connection, you'll access the main interface of the connection. Click the fold button next to the connection name at the top to expand and display the basic configuration information. This feature is handy for swiftly modifying several common connection configurations. Note that modifications require a disconnect, then a re-connect to take effect. After each successful connection, the panel will automatically fold up. In the disconnected state, you can click the configuration button on the right to modify more connection configurations.

![mqttx-main](/images/mqttx-main.png)

## Add Subscription

Click the `New Subscription` button in the lower left corner to swiftly add a Topic. Each Topic can be marked with a color, which can be randomly generated or chosen via the color selector. The rightmost button at the top of the subscription list can hide the subscription list to make more room on the page. After completion, click on the subscribed Topic items in the subscription list for message filtering. The message view will only display the message content subscribed to the current topic. Click again to cancel the filter; You can also directly click other subscribed Topic items to view the corresponding message content. By clicking on the topic name, you can quickly copy the current topic information. When you need to send a message to this topic, you can quickly paste it into the topic input box of the message bar to modify it, and you can quickly complete the operation.

![mqttx-topic](/images/mqttx-topic.png)

When adding `Topic`, you can set an alias for each Topic. This option is optional. When the subscription is set and added, the `Topic` in the subscription list will be displayed as an alias, and hovering over the `Topic` item will also display the original value of the `Topic`. This is very helpful when multiple `Topics` that need to be monitored are too long to distinguish the specific meaning of `Topic`.

![mqttx-topic-alias](/images/mqttx-topic-alias.png)

We open the dialog of the subscription topic, in the Topic input box, enter multiple Topics and use comma (,) to split, click to confirm the success of the subscription, we can see that the subscription list contains multiple Topics. for the use of the client layer alias function can also support the simultaneous setting of multiple Topics, the same use of comma separation (,).

![mqttx-multi-topics](/images/mqttx-multi-topics.png)

Subscribed Topics support **Edit/Disable/Enable** functions, right click on the subscribed Topic list item, in the context menu we can quickly choose to edit, disable or enable the operation. When subscribing to too many Topics, sometimes not all the Topic messages you want to receive, in order to avoid subscribing to the same Topic again, the disable function is provided, if you want to receive messages from the Topic again, just enable it again.

![mqttx-edit-topic](/images/mqttx-edit-topic.png)

## Publish and Receiving Messages

After the `Topic` is successfully subscribed, you can test the sending and receiving of messages. Fill in the `Topic` information you just subscribed to in the lower right corner of the page. You can select the values of `QoS`, `Retain`, input `payload`, and click the send button on the far right to send a message to the `Topic` you just subscribed. After sending successfully, you can immediately receive the message just sent. Note that in the message box, the right column is the sent message, and the left column is the received message. macOS users can use the `command + enter` shortcut to quickly send messages, and other users can use the `control + enter` shortcut to do that.

Through the `payload` option in the message bar, the messages can quickly be converted into multiple formats, such as `Base64`, `Hex`,`JSON` and `Plaintext`.

![mqttx-message](/images/mqttx-message.png)

So far, the testing of an `MQTT` message is completed.