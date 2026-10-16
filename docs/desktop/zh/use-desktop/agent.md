# MQTTX Agent

MQTTX Agent 是内置于 MQTTX 桌面客户端的助手。你用自然语言提出需求，它会通过工具来操作 MQTTX：创建并连接连接、订阅与发布、读取消息，以及调用你的 MCP 工具。每个操作都走 MQTTX 现有的代码路径，和手动操作一致，因此连接列表、订阅列表和消息列表会实时更新。

![MQTTX Agent 面板](/images/mqttx-agent.png)

## 开启与配置

1. 打开 **设置 → MQTTX Agent**，打开 **启用 MQTTX Agent**。
2. 填写你的服务商的 **API Host**、**API Key** 和 **模型**。常用地址：

| 服务商 | API Host |
| --- | --- |
| OpenAI | `https://api.openai.com/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| Anthropic | `https://api.anthropic.com/v1` |
| xAI | `https://api.x.ai/v1` |
| Google | `https://generativelanguage.googleapis.com/v1beta` |
| SiliconFlow | `https://api.siliconflow.cn/v1` |
| Azure OpenAI | `https://<resourceName>.openai.azure.com` |

3. 通过左侧导航栏的星形按钮、连接页右上角的 **MQTTX Agent** 按钮，或 `Cmd/Ctrl + J` 打开面板。

面板有两种模式：贴在右侧的**侧栏**，以及覆盖主区域、让应用继续在后台运行的**全屏**。用面板头部的展开按钮切换，拖动面板左边缘可以调整宽度。

## 能做什么

- 列出并读取连接配置
- 创建、修改、删除连接
- 连接与断开
- 订阅与取消订阅
- 以 Plaintext、JSON、Base64 或 Hex 发布消息
- 读取历史消息、等待新消息
- 调用你配置的 MCP 工具

你可以直接说"连接到 broker.emqx.io 并订阅 `testtopic/#`"、"向 `mqttx/test` 发布一条 JSON 测试消息"，或"显示我的连接及状态"。

## 权限模式

- **操作前询问**（默认）：读取自动执行；创建、连接、订阅、发布、删除以及全部 MCP 工具都会先请求批准。每个请求会显示一张卡片，可以选择**允许一次**、**本次对话中始终允许这个工具**或**拒绝**。
- **自动**：全部自动执行，不再询问。

可以在输入框的权限胶囊里切换（只影响当前会话），也可以在 **设置 → MQTTX Agent → 默认权限模式** 里设置默认值。第一次切到"自动"时，MQTTX 会提示风险让你确认。

## 步数上限

一次回复最多执行 **每次回复的最大步数** 个工具步骤（默认 50，范围 10–200，可在设置中修改）。达到上限时会暂停并显示**继续**按钮，点击后继续执行。

## 会话

面板会保存会话历史。全屏模式下会话列表在左侧；侧栏模式下从头部的历史按钮打开。你可以重命名会话（全屏下双击标题，或用 `···` 菜单），也可以连同消息一起删除。

## MCP

在 **设置 → MQTTX Agent** 的 **MCP 服务器配置** 中配置 MCP server，同时支持 **Streamable HTTP** 和 **SSE** 的 URL：

```json
{
  "mcpServers": {
    "weather": { "url": "http://127.0.0.1:8000/mcp" },
    "legacy": { "url": "http://127.0.0.1:8001/sse" }
  }
}
```

在"操作前询问"模式下，每次 MCP 工具调用都会请求批准。

## 已知限制

- 收到的消息只在连接页面打开时才会存入 MQTTX。Agent 操作某个连接时会自动打开它的页面，所以 Agent 运行期间不受影响；其他连接的页面关闭时不会收集消息。

## 隐私说明

你的对话和工具调用结果会发送给你配置的模型服务商，以便它生成回复。密码、证书和私钥不会被发送：连接相关的工具会对它们做遮盖，只返回一个表示"是否已设置"的标记。
