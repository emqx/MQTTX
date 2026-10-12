# Connections and authentication

Apply an external deadline and process cleanup to every connection test. Examples assume the indicated listener already exists and that its endpoint is in the user's task scope. Substitute the actual host, port and files; do not treat example paths as installed certificates.

## Transport and protocol selection

`--hostname` is a hostname/IP, not a full URL. Select the transport with `--protocol` and the MQTT version with `--mqtt-version`. These are independent choices.

| Transport | CLI selection | Additional input |
| --- | --- | --- |
| TCP | `-l mqtt` | Broker TCP listener port |
| TLS | `-l mqtts` | TLS listener port and trust settings |
| WebSocket | `-l ws --path /mqtt` | WebSocket listener port/path |
| Secure WebSocket | `-l wss --path /mqtt` | WebSocket path plus TLS settings |

Always specify the actual port: changing `-l` alone does not choose a new CLI port default. MQTT versions are `-V 3.1`, `-V 3.1.1`, or `-V 5.0` (also `5`). MQTT 5 properties require MQTT 5 and broker support. A broker port and its WebSocket path are deployment-specific.

```sh
mqttx conn -h localhost -p 8083 -l ws --path /mqtt -V 5.0 --reconnect-period 0
```

`--ws-headers 'Header: value'` passes one or more WebSocket headers, for example a proxy-required header. It is valid only with `ws`/`wss`. The parser requires colon followed by a space; values containing that delimiter are not reliably preserved by the current parser. Use an options-file `wsHeaders` object for such values. Do not include actual bearer tokens in reports.

## TLS and mutual TLS

For a private CA, use `--ca`. Publicly trusted servers normally use the runtime's trust store. The hostname must match the server certificate.

```sh
mqttx conn -h localhost -p 8883 -l mqtts -V 5.0 \
  --ca ./ca.pem --reconnect-period 0
```

For a listener requiring a client certificate:

```sh
mqttx conn -h localhost -p 8883 -l mqtts -V 5.0 \
  --ca ./ca.pem --cert ./client.pem --key ./client.key --reconnect-period 0
```

Use the same options on `pub`, `sub`, benchmarks and simulation when their installed help lists them. `--alpn` accepts protocol names required by the service, such as `--alpn mqtt`; do not add it speculatively. `--insecure` disables server certificate verification: it is available for an explicitly requested diagnostic comparison, not an automatic fix or a verified secure connection. The CLI exposes no general key-passphrase flag; do not invent one.

## Username/password and enhanced authentication

`-u`/`--username` and `-P`/`--password` are ordinary MQTT credentials. Prefer a protected options file when practical, because command arguments and expanded environment variables can expose passwords. Credentials do not replace TLS.

For MQTT 5 enhanced authentication, the CLI accepts exactly `SCRAM-SHA-1`, `SCRAM-SHA-256`, and `SCRAM-SHA-512`. Select the broker-configured method, provide both username and password, and use MQTT 5:

```sh
mqttx conn --load-options ./scram-connection.json \
  -V 5.0 --authentication-method SCRAM-SHA-256 --reconnect-period 0
```

The `conn` object in the file must include the intended `hostname`, `port`, `protocol`, `username`, `password`, and other connection settings. Do not silently downgrade SCRAM to ordinary authentication after a handshake failure. The broker must support the selected enhanced-auth method; syntax acceptance alone does not verify the handshake. This CLI does not configure the broker's authentication provider.

## Connection lifetime and diagnostics

- `--client-id` selects identity. Ordinary commands use `-i`; benchmarks/simulation use `-I`, because `-i` there means connection interval.
- `--keepalive` is seconds between keepalive activity, not task duration. It is exposed by `conn`, `pub`, `bench conn`, `bench pub` and `simulate`, not `sub`/`bench sub` in 1.13.0.
- `--reconnect-period` is milliseconds; zero disables automatic reconnection. `--maximum-reconnect-times` bounds attempts on ordinary/benchmark commands. Simulation has a known spelling/implementation mismatch documented in the capability map; use a deadline regardless.
- `--debug` enables MQTT.js diagnostics only on ordinary `conn`, `pub`, `sub`. Do not pass it to benchmarks/simulation unless installed help adds support. Capture both output streams, extract useful errors and redact sensitive material.
- A duplicate client ID can evict another connection. Reuse IDs only for an intended session-recovery test, with the old process stopped.
