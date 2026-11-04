# CLI capability map

Command/flag coverage baseline: repository `cli/src/index.ts`, version **1.13.0**. Benchmark behavior notes also reflect the current handlers. All registered executable commands are routed below. Consult installed `--help` for argument arity, aliases and changes. This table records availability, not a promise that every combination is valid or bug-free.

## Commands

| Command | Guidance |
| --- | --- |
| `conn`, `pub`, `sub` | [Workflows](workflows.md), [connections](connections.md), [MQTT features](mqtt-features.md), [payloads](payloads.md) |
| `bench conn`, `bench pub`, `bench sub` | [Benchmarks](benchmarks-and-simulation.md) |
| Benchmark rates, count mismatches and overload | [Benchmark diagnostics](benchmark-diagnostics.md) |
| `simulate`, `ls --scenarios` | [Simulation and discovery](benchmarks-and-simulation.md) |
| `init`, `check` | [Configuration and utilities](configuration.md) |
| Root `--help`, `--version`, `help [command]`, `bench --help` | [Help and version](configuration.md#help-version-update-check-and-discovery) |

## Registered flags

**Network** below means all seven networking commands: `conn`, `pub`, `sub`, `bench conn`, `bench pub`, `bench sub`, `simulate`. Read the benchmark guide for differences in flags also used by ordinary commands, especially topic templates, verbose output, file input and client IDs. Flags absent from a command's row must not be assumed to work there.

| Long option | Commands | Guide |
| --- | --- | --- |
| `--mqtt-version` | Network | [Usage](connections.md) |
| `--hostname` | Network | [Usage](connections.md) |
| `--port` | Network | [Usage](connections.md) |
| `--client-id` | Network | [Usage](connections.md) |
| `--no-clean` | Network | [Usage](mqtt-features.md) |
| `--keepalive` | `conn`, `pub`, `bench conn`, `bench pub`, `simulate` | [Usage](connections.md) |
| `--username` | Network | [Usage](connections.md) |
| `--password` | Network | [Usage](connections.md) |
| `--protocol` | Network | [Usage](connections.md) |
| `--path` | Network | [Usage](connections.md) |
| `--ws-headers` | Network | [Usage](connections.md) |
| `--key` | Network | [Usage](connections.md) |
| `--cert` | Network | [Usage](connections.md) |
| `--ca` | Network | [Usage](connections.md) |
| `--insecure` | Network | [Usage](connections.md) |
| `--alpn` | Network | [Usage](connections.md) |
| `--reconnect-period` | Network | [Usage](connections.md) |
| `--maximum-reconnect-times` | `conn`, `pub`, `sub`, `bench conn`, `bench pub`, `bench sub` | [Usage](connections.md) |
| `--session-expiry-interval` | Network | [Usage](mqtt-features.md) |
| `--receive-maximum` (also `--rcv-max`) | Network | [Usage](mqtt-features.md) |
| `--maximum-packet-size` | Network | [Usage](mqtt-features.md) |
| `--topic-alias-maximum` | Network | [Usage](mqtt-features.md) |
| `--req-response-info` | Network | [Usage](mqtt-features.md) |
| `--no-req-problem-info` | Network | [Usage](mqtt-features.md) |
| `--user-properties` | Network | [Usage](mqtt-features.md) |
| `--will-topic` | Network | [Usage](mqtt-features.md) |
| `--will-message` | Network | [Usage](mqtt-features.md) |
| `--will-qos` | Network | [Usage](mqtt-features.md) |
| `--will-retain` | Network | [Usage](mqtt-features.md) |
| `--will-delay-interval` | Network | [Usage](mqtt-features.md) |
| `--will-payload-format-indicator` | Network | [Usage](mqtt-features.md) |
| `--will-message-expiry-interval` | Network | [Usage](mqtt-features.md) |
| `--will-content-type` | Network | [Usage](mqtt-features.md) |
| `--will-response-topic` | Network | [Usage](mqtt-features.md) |
| `--will-correlation-data` | Network | [Usage](mqtt-features.md) |
| `--will-user-properties` | Network | [Usage](mqtt-features.md) |
| `--save-options` | Network | [Usage](configuration.md) |
| `--load-options` | Network | [Usage](configuration.md) |
| `--debug` | `conn`, `pub`, `sub` | [Usage](connections.md) |
| `--authentication-method` | Network | [Usage](connections.md) |
| `--topic` | `pub`, `sub`, `bench pub`, `bench sub`, `simulate` | [Usage](mqtt-features.md) |
| `--message` | `pub`, `bench pub` | [Usage](payloads.md) |
| `--qos` | `pub`, `sub`, `bench pub`, `bench sub`, `simulate` | [Usage](mqtt-features.md) |
| `--retain` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--dup` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--stdin` | `pub` | [Usage](payloads.md) |
| `--multiline` | `pub` | [Usage](payloads.md) |
| `--line-mode` | `pub` | [Usage](payloads.md) |
| `--payload-format-indicator` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--message-expiry-interval` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--topic-alias` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--response-topic` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--correlation-data` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--subscription-identifier` | `pub`, `sub`, `bench pub`, `bench sub`, `simulate` | [Usage](mqtt-features.md) |
| `--content-type` | `pub`, `bench pub`, `simulate` | [Usage](mqtt-features.md) |
| `--format` | `pub`, `sub` | [Usage](payloads.md) |
| `--conn-user-properties` | `pub`, `sub`, `bench pub`, `bench sub`, `simulate` | [Usage](mqtt-features.md) |
| `--file-read` | `pub`, `bench pub` | [Usage](payloads.md) |
| `--protobuf-path` | `pub`, `sub` | [Usage](payloads.md) |
| `--protobuf-message-name` | `pub`, `sub` | [Usage](payloads.md) |
| `--avsc-path` | `pub`, `sub` | [Usage](payloads.md) |
| `--payload-size` | `pub`, `bench pub` | [Usage](payloads.md) |
| `--no_local` | `sub`, `bench sub` | [Usage](mqtt-features.md) |
| `--retain-as-published` | `sub`, `bench sub` | [Usage](mqtt-features.md) |
| `--retain-handling` | `sub`, `bench sub` | [Usage](mqtt-features.md) |
| `--verbose` | `sub`, `bench pub`, `bench sub`, `simulate` | [Usage](payloads.md) |
| `--output-mode` | `sub` | [Usage](payloads.md) |
| `--file-write` | `sub` | [Usage](payloads.md) |
| `--file-save` | `sub` | [Usage](payloads.md) |
| `--delimiter` | `sub` | [Usage](payloads.md) |
| `--count` | `bench conn`, `bench pub`, `bench sub`, `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--interval` | `bench conn`, `bench pub`, `bench sub`, `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--message-interval` | `bench pub`, `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--limit` | `bench pub`, `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--split` | `bench pub` | [Usage](benchmarks-and-simulation.md) |
| `--scenario` | `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--file` | `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--maximun-reconnect-times` | `simulate` | [Usage](benchmarks-and-simulation.md) |
| `--scenarios` | `ls` | [Usage](benchmarks-and-simulation.md) |

## Version-specific checks

- `simulate --maximun-reconnect-times` is misspelled and differs from the property read by its runtime; use an external deadline.
- `sub --subscription-identifier` uses a scalar numeric parser despite variadic help; use a scalar per invocation or a typed options-file array.
- A publishing `--subscription-identifier` flag is registered, but client-originated MQTT 5 PUBLISH packets must not contain that property.
- Clean output bypasses the schema-decoded payload, and suppresses readiness/some error logs. Some connection failures return exit code 0.
- Piped multiline input bypasses format/schema transformations and has timing limitations; file append converts bytes to text.
- Older publisher/simulator builds expand `%c` differently from benchmark subscriptions; current handlers use the final per-client ID. See [topic templates](benchmarks-and-simulation.md#topic-and-client-templates).
- Benchmark subscription readiness can coexist with partial rejections. Earlier benchmark implementations also had rate-normalization and connection-recovery defects; verify actual message flow and timing using [benchmark diagnostics](benchmark-diagnostics.md).

The specialized guides explain alternatives. Do not work around these limitations by changing CLI code during a usage task. If a requested behavior cannot be expressed reliably, state the limitation and the closest supported workflow.

## Maintenance and validation

When updating this skill for a new release, compare command registration and installed help with this table, then inspect the affected handlers before changing examples. Recheck the caveats instead of carrying them forward as universal rules. Validate commands against a local broker with explicit bounds and no operational topics; record which combinations were actually exercised. Documentation coverage and live interoperability coverage are separate.

Validation baseline for this revision: the official Linux x64 CLI 1.13.0 and isolated Mosquitto 2.0.22 listeners. Live checks exercised MQTT 3.1/3.1.1/5.0, TLS and mTLS, WebSocket headers, password authentication through an options file, all six format choices, Protobuf/Avro, random payloads, stdin and file input, piped/TTY line modes, numbered file saving and append delimiters, MQTT 5 publication/subscription properties, retained-message clearing, persistent-session delivery, delayed wills, all three benchmark commands, file splitting, all four bundled scenarios, a custom generator, YAML save/load, and `check`. The first-phase checks also verified deadlines, clean-stream parsing and cleanup.

Additional benchmark validation compared CLI 1.13.1 with source `9380e6fc` on Linux ARM64/Node 18, including sustained interactive load, independent monotonic timing and broker-side close reasons. A macOS ARM64 prerelease from that source was also exercised against local MQTT wire fixtures and a broker. These checks cover benchmark rates, connection recovery, client-ID topic expansion and QoS 0/1 split replay; they do not establish a general throughput ceiling or full platform interoperability.

SCRAM against an enhanced-auth broker, service-specific ALPN, WSS, interactive `init` completion, and Windows execution remain outside these live checks. macOS coverage is limited to the benchmark paths above. Their other workflows and flag availability were checked against source/help. Confirm these in the target environment and do not report interoperability success from syntax checks alone. Session/will validation used a separate anonymous single-listener broker after the combined authentication-listener fixture did not deliver those messages; broker configuration is part of the evidence, not a CLI defect diagnosis.
