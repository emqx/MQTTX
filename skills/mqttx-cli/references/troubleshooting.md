# Troubleshooting MQTTX CLI

## Configuration and credentials

The CLI reads defaults from `~/.mqttx-cli/config`. `mqttx init` is interactive and writes that configuration, so it is unnecessary for a one-off automated invocation.

`--load-options` accepts a JSON or YAML file keyed by command name. A minimal JSON example is:

```json
{
  "sub": {
    "hostname": "127.0.0.1",
    "port": 1883,
    "protocol": "mqtt",
    "mqttVersion": 5,
    "topic": ["mqttx-test/example"],
    "qos": [1],
    "reconnectPeriod": 0,
    "maximumReconnectTimes": 0
  }
}
```

Run `mqttx sub --load-options ./mqttx-options.json` under an external deadline. Options-file keys use internal camelCase names, not the CLI's dashed flag spelling. For MQTT 5, the file uses numeric `mqttVersion: 5`, while the CLI flag is `-V 5.0`. Loaded options replace the default options object, so include the connection and operation settings required by the task; explicit CLI options override loaded values. The `conn` and `pub` entries use their respective command names; a publish topic is a string, while subscription topics are an array.

If credentials are needed, use an existing protected file with `username` and `password` fields in the relevant command entry. Restrict access to any temporary credentials file, do not commit it, and remove only temporary files created for the task. Do not assume environment variables are expanded inside JSON/YAML. Do not print the file or save a secret-bearing command in the final report.

## Diagnose from observed evidence

| Observation | Next check |
| --- | --- |
| `mqttx` missing or reports an unexpected version | Follow `INSTALL.md`; inspect PATH and installation ownership before reinstalling. |
| DNS error, refused connection, or deadline before `Connected` | Verify hostname, port, network access and broker listener. In Docker, `localhost` is inside the container. |
| Connection rejected for authentication/authorization | Verify the intended credentials, authentication method and broker access policy. Repeating the same rejected credentials is not a recovery strategy. |
| TLS validation failure | Match `mqtts`/`wss`, hostname, CA trust, and required client certificate/key. Do not automatically add `--insecure`. |
| Connected but subscription rejected | Check topic ACLs and MQTT subscription reason codes. Connection acceptance does not imply subscription permission. |
| Subscription accepted but no message observed | Check exact topic/filter, publisher endpoint, timing and publish evidence. Subscribe before publishing. Consider shared subscriptions, no-local behavior and old retained messages when relevant. |
| Unexpected disconnections | Check duplicate client IDs and broker disconnect reason codes. Use separate IDs for simultaneous publisher/subscriber processes. |
| Session resumes but offline messages are missing | Check the original subscription/QoS, session and message expiry, broker queue limits, and authorization of disconnected clients. Compare on an isolated broker before attributing the loss to the CLI. |
| Last Will is not observed | Confirm observer readiness, the exact will topic, an unexpected disconnect, will delay/expiry, and broker authorization for will publication. A normal MQTT DISCONNECT does not trigger the will. |
| Empty clean output with exit code 0 | Repeat a bounded diagnostic invocation using default output; current error paths can hide failures. Do not classify this as success. |
| JSON parsing fails | Clean mode is a stream of pretty-printed objects. `--format json` concerns payloads, not CLI framing. Check for decode errors and preserve the raw diagnostic evidence. |

For a broker that requires MQTT 3.1.1, use `-V 3.1.1` and omit MQTT 5-only options. For WebSocket listeners, verify `-l ws`/`-l wss` and `--path` against the broker configuration.

Use `--debug` only when the ordinary diagnostics are insufficient. Debug logs and packet output may contain sensitive connection or message data; extract relevant details and redact before reporting. Do not label a connection problem as an MQTTX defect without evidence separating client, network and broker behavior.
