# MQTT features and stateful workflows

Use the connection guide to select the transport and protocol. Apply an external deadline to all examples. Below, `127.0.0.1:1883` is an existing, authorized test broker. MQTT protocol semantics follow the [MQTT 5 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html); the CLI-specific caveats below come from the 1.13.0 implementation.

## Topics, QoS and multiple subscriptions

Publish to a concrete topic; `+` and `#` are subscription wildcards. Quote topic filters, including `$SYS/#` and `$share/group/filter`, so the shell does not expand them. Shared subscriptions require broker support and distribute messages among members; they are unsuitable when every observer must receive every message.

`-q 0`, `1`, or `2` selects QoS. Confirm the granted subscription QoS and errors rather than assuming the requested level was accepted. `--dup` sets the publish duplicate flag; it does not schedule duplicate sends or guarantee application deduplication.

For `sub` and `bench sub`, topic-aligned QoS/boolean/retain-handling values can be supplied together:

```sh
mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/a' 'mqttx-test/b' -q 0 1 \
  --no_local false true --retain-as-published false true \
  --retain-handling 0 2 --reconnect-period 0
```

The current mapper uses the value at each topic index, falling back to the first value when later entries are missing. Supply one value for all topics or an explicit value for each. `--no_local` has an underscore and takes explicit `true`/`false` values; it concerns messages published by the same MQTT client, not other clients on the same machine. Do not use No Local with a shared subscription.

`--retain-as-published` controls forwarding of the RETAIN flag. `--retain-handling` values are 0 (send retained messages), 1 (send only for a new subscription), 2 (do not send retained messages). `--subscription-identifier` on a subscription labels matching deliveries; use one positive integer per invocation. Although help declares it variadic, the current CLI numeric parser does not accumulate identifiers per topic; an options-file array can express per-topic values.

## Retained messages

For a requested retained-message test, start with a dedicated topic and record any existing state before changing it:

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/retained' -q 1 --retain -m 'retained probe' --reconnect-period 0
```

Then start a fresh subscriber and inspect the received message and RETAIN flag. Only when clearing that exact retained topic is within the task, publish a **zero-byte** retained payload (`-m ''` in a POSIX shell, or an empty file with `--file-read`). The string `null` is not a zero-byte payload. Do not perform broad retained-topic cleanup.

## Persistent sessions

For MQTT 3.1/3.1.1 use a stable client ID with `--no-clean`. For MQTT 5, also set a finite `--session-expiry-interval` in seconds; in 1.13.0, `--no-clean` without this option defaults session expiry to `0xFFFFFFFF`.

```sh
mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --client-id mqttx-session-probe --no-clean --session-expiry-interval 60 \
  -t 'mqttx-test/session' -q 1 --reconnect-period 0
```

To test offline delivery: establish and confirm the subscription; stop that owned client; publish the probe at QoS 1 while it is offline; reconnect with the same ID and session settings before expiry; match the message. Automatic resubscription and retained messages can obscure whether a session was resumed, so use a unique non-retained marker and broker/session evidence where available. Do not delete an existing user's session as test cleanup; use a dedicated test identity and finite expiry.

## Last Will

Observe a dedicated will topic with a separate client first, then connect the test client:

```sh
mqttx conn -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --client-id mqttx-will-probe --will-topic 'mqttx-test/will' \
  --will-message 'offline probe' --will-qos 1 --will-delay-interval 2 \
  --session-expiry-interval 30 --reconnect-period 0
```

After `Connected`, deliberately terminate only that test process without an MQTT DISCONNECT when testing unexpected loss. Allow time for broker detection and will delay, then verify the marker. A normal MQTT disconnect is not a will trigger; do not depend on a particular CLI signal's graceful-disconnect behavior. `--will-retain` persists the will and should be used only for a requested retained-will test.

MQTT 5 will properties: `--will-payload-format-indicator` marks UTF-8 data; `--will-message-expiry-interval` controls message lifetime; `--will-content-type`, `--will-response-topic`, `--will-correlation-data` and `--will-user-properties` attach metadata. These flags accompany `--will-topic`; they do not create a separate publish operation.

## MQTT 5 properties

| Packet / purpose | Options and usage |
| --- | --- |
| CONNECT flow/size limits | `--receive-maximum` (alias `--rcv-max`), `--maximum-packet-size`, `--topic-alias-maximum`; these advertise client receive constraints, not broker configuration. |
| CONNECT information requests | `--req-response-info`, `--no-req-problem-info`; these request broker behavior, not a subscription or automatic responder. |
| CONNECT user metadata | Use `--user-properties 'key: value'` on `conn` and `bench conn`; use `--conn-user-properties` on `pub`, `sub`, `bench pub`, `bench sub`, and `simulate`. |
| PUBLISH metadata | `--payload-format-indicator`, `--content-type`, `--message-expiry-interval`, `--user-properties`. Payload format indicator does not encode or validate JSON. |
| PUBLISH request/response | `--response-topic`, `--correlation-data`; application participants must implement the reply and correlation. |
| Topic aliases | `--topic-alias` is outbound connection-scoped state and must respect the server's advertised limit; it is not a persistent topic rename. |
| SUBSCRIBE metadata | `--user-properties` and `--subscription-identifier` on sub/bench sub; inspect the received packet with `sub --verbose`. |

Use quoted `key: value` pairs for user properties; repeated keys become multiple values. For values containing `: `, use an options-file object because the CLI parser splits on that delimiter. Numeric MQTT properties must respect their protocol ranges even when the CLI accepts a number outside them.

The publishing commands also register `--subscription-identifier`, but MQTT 5 forbids a client-originated PUBLISH from containing that property. Do not use it for valid publishing; a broker may disconnect the client. Availability in help is not proof of a valid protocol combination.

Example metadata publication:

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/metadata' -q 1 -m '{"status":"ok"}' \
  --payload-format-indicator --content-type application/json \
  --message-expiry-interval 30 --user-properties 'source: mqttx' \
  --reconnect-period 0
```

For request/response, first subscribe to a unique reply topic and confirm readiness. Publish the request with that `--response-topic` and a unique `--correlation-data` value. A responder must read these properties and explicitly publish the response with matching correlation data. Verify both the reply topic and correlation data (which can be represented as bytes in packet output). Setting these properties alone does not create a responder or await a reply. The CLI argument is text; do not assume Base64 text is automatically decoded into arbitrary binary correlation data.
