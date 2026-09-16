# Configuration and utility commands

## Help, version, update check and discovery

```sh
mqttx --version
mqttx --help
mqttx help pub
mqttx bench --help
mqttx bench pub --help
mqttx simulate --help
mqttx ls --scenarios
```

Root `-v` means version; `sub`/benchmark publishing/subscription/simulation `-v` means verbose. Root `-h` means help; networking subcommands use `-h` for hostname, so use `--help` there. Check the exact subcommand before composing a command.

`mqttx check` queries the remote MQTTX version service and reports an available update; it does not install it. Run with a deadline when an update check is requested. A network error is not proof that the installation is current, and the product's reported latest release may not yet exist in every package channel. Follow `INSTALL.md` for installation/update actions.

`mqttx ls --scenarios` lists built-in simulation scenarios. It is not broker administration or topic discovery.

## User defaults and `init`

`mqttx init` interactively creates or replaces `~/.mqttx-cli/config` (the current user's home on each platform). It asks for output mode, transport, host, port, maximum reconnect attempts, username and password. Use an interactive terminal only when initialization is requested. There is no `init --yes` or noninteractive flag in 1.13.0; never leave a headless task waiting on those prompts.

For requested noninteractive setup, write the documented INI configuration directly, preserving unrelated existing settings and protecting credentials. A minimal example:

```ini
[default]
output = text

[mqtt]
host = 127.0.0.1
port = 1883
protocol = mqtt
max_reconnect_times = 10
```

Valid default output modes are `text` (spinner style) and `log` (timestamped logs); neither is JSON output. Optional `username` and `password` belong under `[mqtt]`. The loader only recognizes these defaults, not arbitrary CLI flags. In 1.13.0, zero `max_reconnect_times` in this file falls back to the default due to truthy fallback logic; use explicit CLI reconnect controls for zero-retry tasks.

Inspect existing configuration without exposing secrets, back it up before a requested replacement, and verify the resulting behavior. Do not treat a completed `init` process alone as proof that a file was written successfully.

## Per-command JSON/YAML options

All networking command families support `--save-options [PATH]` (`-so`) and `--load-options [PATH]` (`-lo`). Omitting the path means `./mqttx-cli-options.json`. Files ending in `.yaml`/`.yml` use YAML; others use JSON. These files are separate from the INI defaults.

| Invocation | Top-level options key |
| --- | --- |
| `conn` | `conn` |
| `pub` | `pub` |
| `sub` | `sub` |
| `bench conn` | `benchConn` |
| `bench pub` | `benchPub` |
| `bench sub` | `benchSub` |
| `simulate` | `simulate` |

Loading selects that command's object, then overrides it with explicitly supplied CLI options. It does not fill the object with every Commander default; supply all required settings, particularly counts/intervals, topics, client IDs and output choices for benchmarks/simulation. JSON/YAML values bypass CLI argument parsers, so use correctly typed numbers, booleans and arrays. Environment variable references inside the file are not expanded.

See the [minimal subscription options example](troubleshooting.md#configuration-and-credentials). Key mappings that commonly differ from flags:

| CLI | Options-file field |
| --- | --- |
| `--hostname`, `--protocol`, `--port` | `hostname`, `protocol`, numeric `port` |
| `--mqtt-version` | Numeric `mqttVersion`: 3 for MQTT 3.1, 4 for 3.1.1, 5 for 5.0 |
| `--no-clean` | `clean: false` |
| `--no-req-problem-info` | `reqProblemInfo: false` |
| `--topic`, `--qos` on sub/bench sub | `topic` and `qos` arrays (publish uses scalar values) |
| `--no_local` | `no_local`, a boolean or per-topic boolean array |
| `--ws-headers`, `--user-properties`, `--conn-user-properties` | `wsHeaders`, `userProperties`, `connUserProperties` objects |
| Other dashed flags | Usually camelCase, e.g. `clientId`, `messageInterval`, `protobufPath`, `outputMode`; inspect the implementation if uncertain. |

`--save-options` is **not a dry run**: it saves parameters and then performs the connection/publish/subscription/load operation. It merges command keys into an existing file but replaces that command's whole options object, and can save credentials. Use it only when both saving and the network action are requested; otherwise construct a file directly. For example, an explicitly requested publish-and-save operation is:

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/config' -q 1 -m 'saved options probe' \
  --reconnect-period 0 --save-options ./publish-options.yaml
```

Replaying `mqttx pub --load-options ./publish-options.yaml` publishes again. A CLI `-m` argument can replace its message. Prefer a fresh file for test options and remove only task-owned temporary files. Never commit credentials or print saved credential objects.
