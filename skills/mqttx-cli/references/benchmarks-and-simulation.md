# Benchmarks and simulation

Use these commands when load generation or data simulation is requested. Establish the target, allowed topic prefix, number of clients, message size/rate, message limit and runtime before starting. Defaults include **1000 connections** and unlimited publishing (`--limit 0`), so always supply explicit bounds. A quick example is not a capacity benchmark.

Examples below assume an existing authorized broker on `127.0.0.1:1883`. Wrap every command in an external deadline. `bench conn` and `bench sub` remain active; publisher limits do not cover stalled connections or failures.

## Connection and subscription benchmarks

```sh
mqttx bench conn -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --count 2 --interval 100 --client-id 'probe-conn-%i' --reconnect-period 0
```

Record the actual created connections and elapsed connection time, then end the run at its deadline. `--count` is clients, `--interval` is the delay in milliseconds between starting client connections.

```sh
mqttx bench sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --count 2 --interval 100 --client-id 'probe-sub-%i' \
  -t 'mqttx-test/load/%i' -q 1 --verbose --reconnect-period 0
```

Start subscribers before publishers and inspect subscription rejections as well as the aggregate readiness line. In 1.13.0, `All connections subscribed` can appear when only some subscriptions succeeded. This command reports received totals/rates, not individual decoded payloads. Use ordinary `sub` for payload inspection, files, codecs and clean output.

## Publishing benchmark

```sh
mqttx bench pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --count 2 --interval 100 --message-interval 500 --limit 6 \
  --client-id 'probe-pub-%i' -t 'mqttx-test/load/%i' -q 1 \
  -m 'bounded load probe' --verbose --reconnect-period 0
```

`--message-interval` (`-im`) is the publication interval **per client** in milliseconds. Rough offered rate after all clients connect is `count * 1000 / messageInterval` messages/second, subject to acknowledgments and scheduling. `--limit` (`-L`) is an aggregate count across clients, not a per-client quota. Measure actual counts; do not equate configured rate with achieved throughput. The implementation waits for all configured clients to connect before publishing, so a failed client can stall the run.

`--payload-size 1KB` can replace `-m` for random bytes. `--file-read ./messages.txt --split` splits a file on newline and replays its parts for each client. An explicit `--split 'PATTERN'` is interpreted as a JavaScript regular expression; trailing delimiters can create empty messages. Keep an external deadline and inspect totals: uneven client progress can prevent split-mode completion. Without `--split`, the whole file is the repeated payload. `bench pub` does not accept ordinary `--stdin`, `--format`, Protobuf or Avro flags; prepare encoded bytes in a file if those are required.

## Topic and client templates

- Use `--client-id` (short `-I`) for benchmarks/simulation. Short `-i` is the connection interval, unlike ordinary `conn`/`pub`/`sub`.
- `%i` is the 1-based client index; an ID lacking `%i` gets `_index` appended when count is greater than one.
- Benchmark topic templates support `%i`, `%u` (provided username), and `%c`. Simulation also supports `%sc` (scenario name). Quote templates in the shell.
- In 1.13.0, `bench pub`/`simulate` substitute `%c` with the base client-ID template, while `bench sub` uses the final per-client ID. Use explicit `%i` topic templates to align publishers/subscribers; do not assume `%c` means the same expanded value in both paths. `%u` remains unresolved if no username is provided.

## Built-in simulation and listing

```sh
mqttx ls --scenarios
```

`ls` lists bundled scenarios only when `--scenarios` (`-sc`) is supplied; it does not enumerate broker topics, clients or retained messages. Use the installed list rather than assuming a particular bundle. The repository includes `weather`, `tesla`, `smart_home` and `IEM` (case-sensitive filenames).

```sh
mqttx simulate --scenario weather -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --count 1 --interval 100 --message-interval 500 --limit 3 \
  --client-id 'probe-sim-%i' -t 'mqttx-test/sim/%sc/%i' -q 1 \
  --verbose --reconnect-period 0
```

Discover the scenario, start a bounded subscriber on the resulting topic, then run simulation. Verify actual messages and scenario fields. Simulation generates payloads; it does not create devices or configure the broker. It shares benchmark count/rate/limit semantics and supports connection and MQTT property options, but has no generic `--message`, `--format` or `--payload-size` input flags.

## Custom scenario scripts

Use `--file ./probe.js` (`-f`, which means format on ordinary pub/sub) instead of `--scenario`. Scripts are executable JavaScript loaded into the CLI process, not data templates: inspect user-provided scripts before running them and preserve the requested topic/load scope. Choose exactly one scenario source.

A `.js` CommonJS module in a CommonJS context (not a directory configured as `type: module`) can contain:

```js
module.exports = {
  name: 'probe',
  description: 'Small sensor readings for an MQTT test',
  generator(faker, options) {
    return {
      message: JSON.stringify({
        device: options.clientId,
        value: faker.number.int({ min: 0, max: 100 }),
      }),
    }
  },
}
```

The required synchronous `generator(faker, options)` returns `{ message, topic? }`, where `message` is a string or Buffer. The CLI injects its bundled Faker instance and the current client's options. Export `name` so `%sc` has a meaningful value. Optional `author`, `version`, `description`, `dataFormat` fields describe the scenario. A returned `topic` overrides the CLI topic template; inspect this before publishing. Do not return a Promise or raw JavaScript object as the MQTT payload.

```sh
mqttx simulate --file ./probe.js -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  --count 1 --interval 100 --message-interval 500 --limit 3 \
  --client-id probe-custom -t 'mqttx-test/sim/%sc' -q 1 --reconnect-period 0
```

In 1.13.0, simulation advertises the misspelled `--maximun-reconnect-times`, but runtime code reads `maximumReconnectTimes`. Do not rely on that flag for a finite run; use `--reconnect-period 0` for one-shot tests and enforce a wall-clock deadline. Keep reconnection only when the requested scenario needs it.

Report requested and achieved client/message counts, QoS, payload size, timing, observed rates/errors, and cleanup. Subscriber delivery totals can exceed published totals when multiple subscriptions receive each publication; this is not automatically duplication by the publisher.
