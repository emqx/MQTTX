# MQTTX CLI workflows

The examples target a user-selected local test broker on `127.0.0.1:1883` using MQTT 5 over TCP with no authentication. Replace the endpoint, transport and topic with the authorized values. Existing CLI configuration may supply credentials; inspect its relevance without exposing secrets. These examples do not start a broker.

## Bounded connection check

With GNU `timeout` available:

```sh
timeout --signal=INT --kill-after=2s 10s \
  mqttx conn -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 --reconnect-period 0
```

Observe `Connected`, then stop the process early if using an interactive process controller. Otherwise, a successful connection still remains open until `timeout` interrupts it. GNU `timeout` normally returns 124 when its deadline expires; that reports the wrapper's deadline, not a broker authentication error. Inspect the captured diagnostics to determine whether connection succeeded before termination.

On macOS without GNU `timeout`, or on Windows, use the agent's subprocess API with a deadline, terminate/kill escalation and a final wait. Do not run an unbounded command as a fallback or assume that a tool's output-yield interval stops the process.

## Publish one message

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/example' -q 1 -m 'hello from MQTTX' --reconnect-period 0
```

Run this under a process deadline too, since connecting can stall. Look for `Message published` and inspect errors, not only the exit code. At QoS 1, success indicates the publish exchange completed with the broker; it does not demonstrate downstream application handling.

For an existing UTF-8 payload file, preserve its contents through stdin rather than constructing shell-escaped message text (POSIX shell):

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/example' -q 1 --stdin --reconnect-period 0 < payload.json
```

Alternatively use `--file-read ./payload.json`, including from PowerShell. Do not add `--format json` unless JSON validation/reformatting is wanted. Do not use `--multiline` for one multiline JSON document: it publishes lines as separate messages.

## Observe for a finite interval

```sh
timeout --signal=INT --kill-after=2s 10s \
  mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/+' -q 1 --reconnect-period 0
```

The default output exposes subscription success and errors. If no messages arrive after subscription is accepted, report "no messages observed during the 10-second window". If subscription acceptance was never observed, report the check as failed or inconclusive.

When readiness is not needed and structured message output is useful, add `--output-mode clean`. For a captured clean stream, this prints each message in compact form:

```sh
jq -c '{topic, payload, qos: .packet.qos, retain: .packet.retain}' messages.json
```

The `jq` command parses successive JSON values even though each value spans multiple lines. Empty input is not evidence of a successful subscription. Avoid `jq -s` on a live unbounded stream, since it waits for EOF and buffers all values. Preserve stderr separately for diagnosis.

## Verify a publish/subscribe round trip

Use this sequence with a process controller that can capture output while a child is running:

1. Choose a new run identifier. Derive a topic under the allowed test prefix, such as `mqttx-test/<run-id>`, and a unique payload marker. Use two distinct client IDs (or the CLI's generated IDs).
2. Start `mqttx sub` for that exact topic, QoS 1, with explicit connection arguments and `--reconnect-period 0`. Keep default output so readiness is visible. Apply a deadline to the whole check, for example 15 seconds.
3. Wait for `Subscribed to <exact-topic>` in stdout/stderr. If an error occurs, the process exits or the deadline expires first, stop the check and clean up without publishing.
4. Run `mqttx pub` against the same endpoint/topic with QoS 1 and the marker, without retain. Bound it by the remaining time. Capture publish diagnostics.
5. Require both publish success and an observed subscriber message with the exact topic and marker. Ignore unrelated or old retained messages. Report this as a verified MQTT round trip, not an application-level acknowledgment.
6. In a final cleanup step, interrupt the subscriber and any still-running publisher, wait briefly, then force termination if necessary and reap both. Only terminate processes created for this check. No retained-message deletion is needed.

Do not background a subscriber with a fixed sleep and assume it is ready. If the execution environment cannot capture readiness and manage child processes, explain that limitation rather than claim a verified round trip.
