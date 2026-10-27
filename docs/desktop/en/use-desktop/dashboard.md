# Dashboard

Use Dashboard to display MQTT message fields as numeric readings, gauges, and trend charts. This guide starts with connecting and receiving data, then covers widget configuration and checking live updates and local history.

Configure the view directly in **Viewer → Dashboard**; MQTTX Agent is not required. Choose a connection, topic filter, and payload field for each widget to display measurements from different sources together.

![MQTTX Dashboard](https://mqttx.app/images/mqttx-dashboard.png)

## Connect and receive the data

1. Connect an MQTTX client to the broker that receives your device's messages.
2. Subscribe to the device topic or an MQTT topic filter, such as `factory/+/telemetry`.
3. Confirm that messages arrive in the connection's message list.

Dashboard uses the messages MQTTX receives. Choosing a topic filter for a widget does not subscribe the MQTT client to that topic.

Find the numeric fields to display in a received payload. For example:

```json
{
  "deviceId": "line-01",
  "temperature": 24.8,
  "humidity": 56,
  "pressure": 1.02
}
```

set a widget's **Value Field** to `temperature`, `humidity`, or `pressure` to read that value.

## Choose a useful view for each measurement

- **Big Number** displays a current reading, such as temperature, pressure, or a counter sent by a device.
- **Gauge** places a reading within a range, such as humidity from 0 to 100%.
- **Line** shows changes over time for inspecting trends and fluctuations during a test.

For the JSON example in the preparation steps, add a temperature Big Number, humidity Gauge, and pressure Big Number. Add a temperature Line chart to inspect changes over time.

## Create a Dashboard

1. Open **Viewer → Dashboard** from the left sidebar.
2. Select **Create Dashboard** and enter a name and description.
3. Select **Add Widget** and choose **Big Number**, **Line**, or **Gauge**.
4. Configure its data source and the options available for that widget type.
5. Drag and resize the widget to arrange your view. Add other measurements as needed.

Drag the right edge of the Dashboard list to change its width. Use a Dashboard's right-click menu or `⋯` menu to edit or delete it.

### Bind a widget to a message field

Configure these fields under **Data Source**:

| Field          | What to choose                                         |
| -------------- | ------------------------------------------------------ |
| Connection     | The MQTTX connection receiving the messages            |
| Topic Pattern  | The topic or MQTT filter that identifies the messages  |
| Value Field    | The JSON path to the value in the payload              |
| Fallback Value | The value used when the requested field cannot be read |

Both live matching and history queries support MQTT `+` and `#` topic filters. An exact topic selects one device's readings; a filter includes messages from matching topics. A shared filter does not create a separate series for each device automatically.

### Make the reading easy to interpret

Name the widget after the measurement. Configure the options available for its type, including color, decimal places, unit, range, thresholds, or line style. The editor shows **Smooth Lines** and **Area Fill** for line presentation where supported.

For the example above, give the temperature and pressure numeric widgets the units °C and bar, and set the humidity gauge range to 0–100%. A clear Line chart title, such as **Temperature trend (°C)**, identifies the plotted measurement and its unit.

The available controls depend on the widget type. Dashboard colors follow the Light, Dark, and Night themes.

## Follow incoming readings and inspect history

1. Publish a message from the device or another MQTT client to a topic matched by the widget's filter. Confirm that the message appears in the selected connection's message list.
2. Compare the widget's reading with the selected payload field. If a fallback value appears, check the JSON path and field value.
3. Publish another message with a changed value and confirm that the numeric or Gauge reading updates, or that the Line chart receives another point. If it does not update, check the active connection, broker subscription, topic filter, and selected connection.
4. Select a time range in the toolbar that includes the received messages. Compare the displayed history with the locally stored message records.

The history query uses local message records. It does not retrieve earlier broker messages that MQTTX never received. Keep the source publishing to observe ongoing live updates.

<details>
<summary>Layout and history limits</summary>

- The Dashboard list width can be set from 160 to 400 pixels and is remembered.
- Widgets use a 12-column grid.
- Each widget shows up to 1,000 of the latest data points in the selected time range.

</details>

## Example: ask MQTTX Agent to prepare a view

1. Configure and open [MQTTX Agent](https://mqttx.app/docs/agent), then select the Zero EMQX Skill with `/`.
2. Submit this request to create a temporary broker, publish sample messages, and prepare a Dashboard:

> Create a temporary Zero EMQX broker, save its connection as Factory Demo, connect, and subscribe to `factory/+/telemetry`. Publish 12 JSON messages with `deviceId` and varying `temperature`, `humidity`, and `pressure` values to `factory/line-01/telemetry`, one at a time. Create a Factory Overview dashboard with the three current readings and a temperature trend chart, then open it.

3. In Ask mode, review and approve the requested actions. Confirm that Factory Demo is connected and subscribed, and that it received separate JSON messages on `factory/line-01/telemetry`.
4. Open Factory Overview. Compare the current readings with the latest message and choose a history range that includes the sample messages to inspect the trend.

Continue editing the Dashboard with the manual controls described above. To use another broker or data source, first connect and subscribe, then change the widgets' data-source settings.
