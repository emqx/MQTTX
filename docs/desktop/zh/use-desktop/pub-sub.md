# 消息的发布与订阅

## 主界面

连接成功后，即可进入连接的主界面。点击顶部连接名称旁的折叠按钮，可以查看并修改该连接的基本信息。在断开连接的情况下，修改这些常用配置项需要重新连接后才能生效。每次连接成功后，面板都会自动折叠。断开连接时，您也可以点击右边的配置按钮进行更多连接配置的修改。

![mqttx-main](/images/mqttx-main.png)

## 添加订阅

点击左下角的 `New Subscription` 按钮，可以快速添加一个 [Topic](https://www.emqx.com/zh/blog/advanced-features-of-mqtt-topics)。每个 `Topic` 可以用一种颜色进行标记，颜色可以随机生成或通过颜色选择器进行选择。添加完成后，点击订阅列表中的已订阅 Topic，可以实现消息过滤。此时消息视图中只会显示当前主题的消息内容，再次点击即可取消过滤。

![mqttx-topic](/images/mqttx-topic.png)

在添加 `Topic` 时，可以给每个 Topic 设置一个别名。别名是可选项。设置别名并完成订阅

后，订阅列表中的 `Topic` 将以别名显示。鼠标悬浮在 `Topic` 项上时，提示框将同时显示出该 `Topic` 的原值。这在需要监控查看的多个 `Topic` 过长，难以辨别 `Topic` 具体含义时，有很大帮助。

![mqttx-topic-alias](/images/mqttx-topic-alias.png)

在 Topic 输入框中输入多个 Topic，使用逗号（,）进行分割，点击确认订阅成功后，订阅列表中会包含多个 Topic。对于使用客户端层别名功能，也可以同时对多个 Topic 进行设置，同样使用逗号分隔（,）。

![mqttx-multi-topics](/images/mqttx-multi-topics.png)

订阅的主题支持**编辑/禁用/启用**。右键点击已经订阅过的 Topic 列表项，在右键菜单中我们可以快速选择编辑、禁用或启用等操作。当订阅的 Topic 过多时，如果并非所有的 Topic 消息都需要接收，您可以使用禁用功能避免再次订阅相同的 Topic。需要重新接收该 Topic 的消息时，只需再次启用即可。

![mqttx-edit-topic](/images/mqttx-edit-topic.png)

## 消息发送与接收

`Topic` 订阅成功后，就可以来测试消息的收发了。在页面右下角填入刚才所订阅的 `Topic` 信息，可选择 [QoS](https://www.emqx.com/zh/blog/introduction-to-mqtt-qos) 和 `Retain` 的值，输入 `payload` 后，点击最右侧的发送按钮，就向刚才订阅的 `Topic` 发送了一条消息。发送成功后，您也可以立即接收到刚才所发送的消息。注意，消息框内，右侧是发送的消息，左侧是接收到的消息。对于 macOS 用户，您可以使用 `command + enter` 快捷键，其它用户可以使用 `control + enter` 快捷键来快速发送消息。

![mqttx-message](/images/mqttx-message.png)

发布和订阅的消息格式都支持快速的格式转换，在消息栏的 `payload` 选项，支持将消息快速转化为 `Base64`、`Hex`、`JSON`、`Plaintext`、`CBOR`、`MsgPack` 六种格式。同时在消息列表上方，您也可以选择相同的格式对消息进行解码并展示。

> **注意：** CBOR 和 MsgPack 是两种高效的二进制格式，在传输大体积数据时，相比 JSON 有更好的压缩和传输效率。当使用这些格式时，消息的输入输出都会使用 JSON 格式。

如需使用更高级的编解码功能，可以跳转到 `脚本` 页面，选择 `编解码` 标签，支持 `Protobuf` 和 `Avro` 两种编解码协议。

在发布区域，可以使用箭头按钮切换之前发布过的 Payload。如需复制某条消息的 Payload 或主题，在消息列表中右键点击该消息即可。

至此，您就完成了一条 `MQTT` 消息的测试。
