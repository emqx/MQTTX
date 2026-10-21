# 高级与 MQTT 5.0 连接设置

创建连接时，可以配置高级设置和 MQTT 5.0 的功能。

## 高级设置

在**高级**区域，可以配置连接超时、Keep Alive、清除会话、自动重连和 MQTT 协议版本等选项。

**MQTT 版本**默认为 `5.0`，也可以选择 `3.1` 或 `3.1.1`。使用 MQTT 5.0 时，可以配置会话过期间隔（`Session Expiry Interval`）、接收最大数量（`Receive Maximum`）和主题别名最大值（`Topic Alias Maximum`）等属性。

开启**请求响应信息**后，MQTTX 会向 Broker 请求 CONNACK 中的 Response Information。如果 Broker 返回了该属性，连接页会显示**响应信息**和复制按钮。该值由 Broker 提供，MQTTX 不会自行生成。请求响应消息的发布方式请参阅[请求响应](https://mqttx.app/zh/docs/advanced#请求响应)。

![MQTT 5.0 连接设置](../use-desktop/assets/connection-advanced.png)

## 遗嘱消息

在**遗嘱消息**区域配置连接意外断开时由 Broker 发布的消息。

`Last-Will-QoS` 默认为 `0`，`Last-Will-Retain` 默认为 `False`。填写 `Last-Will-Topic` 和 `Last-Will-Payload` 即可配置遗嘱消息。

![遗嘱消息设置](/images/mqttx-willmessage.png)

完成配置后，点击右上角的**连接**按钮，创建连接并连接到 MQTT Broker。
