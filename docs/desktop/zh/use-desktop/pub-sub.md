# 消息的发布与订阅

## 主界面

连接成功后，点击顶部连接名称旁的折叠按钮，可查看或修改基本配置。修改前先断开连接，再重新连接使其生效；每次连接成功后，面板会自动折叠。断开连接时，也可以通过右侧的配置按钮修改全部连接设置。

![mqttx-main](/images/mqttx-main.png)

## 添加订阅

点击左下角的 `New Subscription`，输入 [Topic](https://www.emqx.com/zh/blog/advanced-features-of-mqtt-topics)，并选择主题颜色，也可以使用随机颜色。订阅列表右上角的按钮可隐藏列表。

点击订阅可按主题筛选消息，再次点击可取消筛选，也可以直接切换到其他订阅。点击主题名称可复制主题，需要发布时可粘贴到发布区的主题输入框。

![mqttx-topic](/images/mqttx-topic.png)

添加订阅时可以设置主题别名。订阅列表会显示别名，悬停时显示原始主题，便于区分较长的主题名称。

![mqttx-topic-alias](/images/mqttx-topic-alias.png)

在订阅弹窗中用逗号分隔多个 Topic，即可一次添加多个主题；主题别名也可以用逗号分隔。

![mqttx-multi-topics](/images/mqttx-multi-topics.png)

右键点击订阅可选择**编辑**、**禁用**或**启用**。禁用可临时停止接收该主题的消息，启用后即可恢复，无需重新输入主题。

![mqttx-edit-topic](/images/mqttx-edit-topic.png)

断开连接时，如果开启了 Clean Session（MQTT 3.x）或 Clean Start（MQTT 5.0），可以删除或禁用订阅。持久会话会阻止这些操作：MQTT 3.x 关闭 Clean Session，或 MQTT 5.0 关闭 Clean Start 且 Session Expiry Interval 大于 0 时，Broker 仍保留订阅。新增或编辑订阅仍需先连接。

## 消息发送与接收

在发布区输入已订阅的主题，选择 [QoS](https://www.emqx.com/zh/blog/introduction-to-mqtt-qos) 和 `Retain`，填写 Payload 后点击发送。右侧显示发送的消息，左侧显示接收的消息；向已订阅主题发布时，两侧都会出现对应消息。macOS 用户可按 `Cmd + Enter` 发送，其他系统使用 `Ctrl + Enter`。

![mqttx-message](/images/mqttx-message.png)

在发布区的 `payload` 选项中选择 `Base64`、`Hex`、`JSON`、`Plaintext`、`CBOR` 或 `MsgPack`。消息列表上方的格式选项用于解码接收的消息。

> **注意：** CBOR 和 MsgPack 是高效的二进制格式，相比 JSON 可减小 Payload 体积；两者均使用 JSON 作为输入和输出。

如需使用 `Protobuf` 或 `Avro` 编解码，打开**脚本 > 编解码**。

使用发布区的箭头浏览之前发布过的 Payload。右键点击消息，可复制其 Payload 或主题。

每个连接单独保存发布区（`Topic`、`QoS`、`Retain`、`Payload` 和格式）及发布历史。尚未保存发布区时，会显示该连接最近发送的消息。升级时，旧版共享的发布历史会复制到每个连接。Topic 历史下拉列表中，每条记录的删除图标只删除该条记录。

至此，您就完成了一条 `MQTT` 消息的测试。

## Batch 消息

> 计划在 MQTTX Desktop 1.14.0 提供，1.13.3 尚不支持。

Batch 将同一逻辑主题下的多条有序消息打包到一个 MQTT PUBLISH 中，支持 MQTT 5.0、MQTT 3.1.1，以及 QoS 0/1。发送前，确认 Broker 路由和消费者支持相同的批量格式及上限。每条消息使用固定两字节大端长度前缀，不是 JSON 数组或 VBI 编码。

### 发送 Batch

1. 打开**设置 → 高级**，开启**启用 Batch 发布**。此开关默认关闭，用于控制发布栏是否显示 Batch 选项。
2. 连接 Broker，填写 `demo/batch` 等逻辑主题，选择 **Plaintext**、**QoS 1**，勾选 **Batch**。
3. 每行输入一条消息，点击发送：

   ```text
   hello
   {"temperature":23.5}
   world
   ```

状态栏显示条数和编码后的 Payload 大小。超过配置上限时会阻止发送，请减少条目或在路由允许范围内调高上限。Desktop 每次发送一个批次，不会自动拆包。

![Batch 逐行发布与接收预览](./assets/batch-publish.png)

空行表示空条目，末尾的一个换行不会新增条目。Batch 支持 **Plaintext、JSON、Hex 和 Base64**。JSON 每行必须是完整有效的 JSON；Hex 使用 `01`、`FF` 这样的字符对，Base64 使用 `QQ==` 这样的编码文本。输入无效时，会显示出错行和修改提示，并禁用发送。

Batch 不执行逐条 Schema 和脚本处理，Payload Format Indicator 必须关闭。修改不兼容的发布设置前，MQTTX 会先请求确认。关闭全局开关会退出 Batch 发布模式，但不影响收到的 Batch 消息。发布历史保存 Batch 选项；全局开关关闭时，恢复历史也不会重新启用 Batch。

### 主题与能力协商

| 连接版本   | 发布时填写   | 订阅主题              | Retain           |
| ---------- | ------------ | --------------------- | ---------------- |
| MQTT 5.0   | `demo/batch` | `demo/batch`          | 兼容路由上支持。 |
| MQTT 3.1.1 | `demo/topic` | `$batch/+/demo/topic` | Batch 不支持。   |

MQTT 5.0 自动添加 `batch-format=v1` 和 `batch-size=N` User Properties。MQTT 3.1.1 实际发布到 `$batch/{N}/demo/topic`，发布框只填写 `demo/topic`，避免重复添加前缀。订阅 `#` 无法匹配以 `$` 开头的主题。

如果 MQTT 5.0 路由要求能力协商，在连接前给**连接的** User Properties 添加 `batch-publish`，值为 `v1`，再在连接信息中查看 Batch 协商状态。Broker 未确认声明的版本时，Desktop 会警告，但该警告本身不阻止发布；要求协商的路由须先确认协商成功再发送。Broker 的 Maximum Packet Size 还会限制完整报文大小，包括报文头。

### 接收与查看

Desktop 自动识别收到的 Batch 标记，无论是否开启 Batch 发布。订阅上表对应的主题即可，不需要额外开启接收选项。一个批次显示为一个消息气泡，带 **Batch N** 标记并预览前 5 条；点击 **See More** 打开条目表格，查看内容和字节数，每页 100 条。分页只影响显示，不减少已保存条数。**Save to Local** 导出已保存的 Payload。

![Batch 完整条目表格](./assets/batch-items.png)

Batch 接收跳过整包 GZIP 解压、Schema 和脚本处理。格式错误或超限时显示错误及有限长度的 Hex 预览，不会交付部分解析结果。Plaintext 模式下，非 UTF-8 条目按二进制保留，并显示二进制标记。

### 上限与存储

在**设置 → 高级**中配置：

| 设置            | 默认值   | 作用                                                     |
| --------------- | -------- | -------------------------------------------------------- |
| 启用 Batch 发布 | 关闭     | 显示或隐藏发布栏中的 Batch 选项。                        |
| Batch 最大条数  | `256`    | 发布和接收共用，范围 `1–65535`。                         |
| Batch 最大字节  | `65536`  | 包含条目长度前缀的 Payload 字节数，范围 `1024–1048576`。 |
| Batch 存储模式  | 完整保存 | 保存通过校验的接收批次中的全部条目。                     |

**仅保存摘要**只影响后续收到的批次：保留前 20 条，每条最多前 32 字节，消息会标明摘要状态。省略的数据无法恢复，也无法在之后导出。需要完整数据时使用完整保存；气泡预览前 5 条只是显示限制。
