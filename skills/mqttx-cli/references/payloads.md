# Payloads, codecs and files

Use `pub`/`sub` for transformations. Benchmarks and simulation have different input capabilities; do not transfer ordinary pub/sub flags to them. Run examples against an existing authorized broker and apply the deadlines from the basic workflow guide.

## Input modes

| Mode | Behavior |
| --- | --- |
| `pub --message` / `-m` | One message; quote shell content or use a file for complex input. |
| `pub --stdin` / `-s` | One message from stdin at EOF. Close the input stream; otherwise publication waits. |
| `pub --stdin --multiline` / `-s -M` | Separate messages per input line. It is not a multiline JSON-document mode. |
| `pub --line-mode` / `-lm` | Equivalent to stdin + multiline; with a TTY, type a line and Enter to send it. End and clean up the session explicitly. |
| `pub --file-read` | One payload from file bytes, without requiring shell input redirection. |
| `pub --payload-size` / `-S` | Generate random bytes; e.g. `512B`, `1KB`, `2MB` (1024-based units). Use within the requested load and broker packet limits. |

Choose one input source. In 1.13.0, file input takes precedence over stdin; random generation is selected only when no file/stdin is used and the message equals the built-in default. Thus explicitly passing that same default text is a corner case; avoid mixing `--payload-size` and `--message`.

TTY line mode trims lines. Piped multiline mode skips empty lines, bypasses format/schema transformations, and starts sending the buffered lines on connection rather than waiting for all future input. Do not use it as a reliable indefinite producer or schema-converting stream. For precise delivery, blank payloads or per-line encoding, parse the source and invoke bounded single-message `pub` commands, checking each result.

## Formats

`--format` / `-f` selects a payload transformation, not log framing:

| Format | `pub` input | `sub` result |
| --- | --- | --- |
| Omitted | UTF-8 text or unchanged file/stdin bytes | Text decoding; arbitrary binary may be lossy |
| `json` | Parse and serialize JSON | Parse and format JSON |
| `base64` | Decode Base64 text into bytes | Encode received bytes as Base64 text |
| `hex` | Decode hexadecimal text (whitespace allowed) | Hexadecimal text, grouped for display |
| `binary` | Keep bytes unchanged | Preserve a Buffer; best with per-message file saving |
| `cbor` | JSON input encoded as CBOR | CBOR decoded to JSON text |
| `msgpack` | JSON input encoded as MessagePack | MessagePack decoded to JSON text |

For example, first run a bounded subscriber on the matching topic, then publish:

```sh
mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/cbor' -q 1 --format cbor --reconnect-period 0
```

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/cbor' -q 1 --format cbor -m '{"value":42}' --reconnect-period 0
```

Use `msgpack` similarly. Base64 publication such as `-f base64 -m 'AAEC/w=='` sends bytes, not literal Base64 text. Validate decoded bytes or structured values rather than comparing pretty-print whitespace. A decode error may emit a diagnostic and return fallback text; it is not successful decoding.

## Protobuf and Avro

Use one schema system at a time. Protobuf requires **both** `--protobuf-path` (`-Pp`) and `--protobuf-message-name` (`-Pmn`); Avro uses `--avsc-path` (`-Ap`). Keep the schemas consistent between publisher and subscriber. Benchmarks/simulation do not expose these schema flags.

Create `reading.proto` when a minimal test schema is needed:

```proto
syntax = "proto3";
package demo;
message Reading { string device = 1; int32 value = 2; }
```

After the matching subscriber is ready:

```sh
mqttx pub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/protobuf' -q 1 -m '{"device":"probe","value":42}' \
  --protobuf-path ./reading.proto --protobuf-message-name demo.Reading --reconnect-period 0
```

```sh
mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/protobuf' -q 1 \
  --protobuf-path ./reading.proto --protobuf-message-name demo.Reading --reconnect-period 0
```

An equivalent `reading.avsc`:

```json
{"type":"record","name":"Reading","fields":[{"name":"device","type":"string"},{"name":"value","type":"int"}]}
```

Use `--avsc-path ./reading.avsc` instead of the two Protobuf flags on both commands, with JSON message input. This sends a schema-encoded payload, not an Avro container file or a schema-registry envelope.

Publishing applies format conversion before schema serialization; subscribing applies schema decoding before format conversion. Usually omit `--format` with a schema, or use `--format json` to format the decoded JSON. Do not stack CBOR/MessagePack and schema serialization as though they were independent codecs.

In 1.13.0, `--output-mode clean` formats the original payload again instead of the schema-decoded value. For decoded Protobuf/Avro results, use default output or save the decoded result to a file; do not interpret the clean payload as the decoded schema object.

## Save received messages

The output directory must exist. These options are mutually exclusive:

- `--file-save ./capture.bin` saves each message separately, using `capture.bin`, `capture(1).bin`, and so on as files exist. Use `--format binary` for raw bytes and no schema flags when raw wire payload is intended.
- `--file-write ./messages.txt` appends processed messages to one file, with `--delimiter` (default newline). Pass an explicit delimiter string; the CLI does not generally decode shell escape sequences. This implementation converts data to text during append, so it is not lossless binary concatenation.

```sh
mqttx sub -h 127.0.0.1 -p 1883 -l mqtt -V 5.0 \
  -t 'mqttx-test/binary' -q 1 --format binary \
  --file-save ./capture.bin --reconnect-period 0
```

`sub --verbose` adds the incoming packet to default output. `--output-mode clean` provides JSON packet framing but still requires an external deadline and a streaming parser. For schema-aware capture, file output uses the processed value even though clean stdout does not.
