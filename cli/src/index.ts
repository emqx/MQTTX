import 'core-js'
import { Command, Option } from 'commander'
import { getClientId } from './utils/generator'
import { checkUpdate } from './utils/checkUpdate'
import {
  parseNumber,
  parseProtocol,
  parseMQTTVersion,
  parseKeyValues,
  parseQoS,
  parseVariadicOfBooleanType,
  parsePubTopic,
  parseFileRead,
  parseFileSave,
  parseFileWrite,
  parseFormat,
  parseOutputMode,
} from './utils/parse'
import { conn, benchConn } from './lib/conn'
import { pub, benchPub, simulatePub } from './lib/pub'
import { sub, benchSub } from './lib/sub'
import ls from './lib/ls'
import { initConfig } from './lib/init'
import { version } from '../package.json'
import state from './state'
import { DEFAULT_MQTT_PUB_MESSAGE } from './utils/constants'

export class Commander {
  program: Command

  constructor() {
    this.program = new Command()
  }

  init(): void {
    this.program
      .name('mqttx')
      .description('An MQTT client for the command line')
      .enablePositionalOptions()
      .allowUnknownOption(false)
      .version(`${version}\nhttps://mqttx.app/changelogs/v${version}`, '-v, --version')

    this.program
      .command('check')
      .description('Check for updates.')
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(async () => {
        await checkUpdate()
      })

    this.program
      .command('init')
      .description('Initialize the configuration file.')
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(initConfig)

    this.program
      .command('conn')
      .description('Create a connection and connect to MQTT Broker.')
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option('--debug', 'enable debug mode for MQTT.js', false)
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(conn)

    this.program
      .command('pub')
      .description('Publish a message to a topic.')
      .option('-t, --topic <TOPIC>', 'the message topic', parsePubTopic)
      .option('-m, --message <BODY>', 'the message body', DEFAULT_MQTT_PUB_MESSAGE)
      .option('-q, --qos <0/1/2>', 'the QoS of the message', parseNumber, 0)
      .option('-r, --retain', 'send a retained message')
      .option('-d, --dup', 'mark as duplicate flag')
      .option('-s, --stdin', 'read the message body from stdin')
      .option('-M, --multiline', 'read lines from stdin as multiple messages')
      .option('-lm, --line-mode', 'enter interactive mode to send messages line by line (equivalent to -s -M)', false)
      // properties options of MQTT 5.0
      .option('-pf, --payload-format-indicator', 'the payload format indicator of the publish message')
      .option('-e, --message-expiry-interval <NUMBER>', 'the lifetime of the publish message in seconds', parseNumber)
      .option(
        '-ta, --topic-alias <NUMBER>',
        'value that is used to identify the topic instead of using the topic name',
        parseNumber,
      )
      .option('-rt, --response-topic <TOPIC>', 'string which is used as the topic name for a response message')
      .option(
        '-cd, --correlation-data <DATA>',
        'used by the sender of the request message to identify which request the response message is for when it is received',
      )
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      .option('-si, --subscription-identifier <NUMBER>', 'the identifier of the subscription', parseNumber)
      .option('-ct, --content-type <TYPE>', 'a description of the content of the publish message')
      // connect options
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option(
        '-f, --format <TYPE>',
        'the format type of the input message, support base64, json, hex, binary, cbor and msgpack',
        parseFormat,
      )
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // connect properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-Cup, --conn-user-properties <USERPROPERTIES...>',
        'the connect user properties of MQTT 5.0 (e.g. -Cup "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option('--file-read <PATH>', 'read the message body from the file', parseFileRead)
      .option(
        '-Pp, --protobuf-path <PATH>',
        'the path to the .proto file that defines the message format for Protocol Buffers (protobuf)',
      )
      .option(
        '-Pmn, --protobuf-message-name <NAME>',
        'the name of the protobuf message type (must exist in the .proto file)',
      )
      .option(
        '-Ap, --avsc-path <PATH>',
        'the path to the .avsc file that defines the avro schema for AVRO encoding',
        parseFileRead,
      )
      .option(
        '-S, --payload-size <SIZE>',
        'generate a random payload of specified size (e.g., 1KB, 512B, 2MB); ignored if -m, -s, -M, or --file-read is present',
      )
      .option('--debug', 'enable debug mode for MQTT.js', false)
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(pub)

    this.program
      .command('sub')
      .description('Subscribes to one or more topics.')
      .option('-t, --topic <TOPIC...>', 'the message topic')
      .option('-q, --qos <0/1/2...>', 'the QoS of the message', parseQoS)
      // properties options of MQTT 5.0
      .option('-nl, --no_local [FLAG...]', 'the no local MQTT 5.0 flag', parseVariadicOfBooleanType)
      .option(
        '-rap, --retain-as-published [FLAG...]',
        'the retain as published MQTT 5.0 flag',
        parseVariadicOfBooleanType,
      )
      .option('-rh, --retain-handling <0/1/2...>', 'the retain handling MQTT 5.0', parseQoS)
      .option('-si, --subscription-identifier <NUMBER...>', 'the identifier of the subscription', parseNumber)
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      .option(
        '-f, --format <TYPE>',
        'format the message body, support base64, json, hex, binary, cbor and msgpack',
        parseFormat,
      )
      .option('-v, --verbose', 'turn on verbose mode to display incoming MQTT packets')
      .option(
        '--output-mode <default/clean>',
        'choose between the default and clean mode, which outputs the complete MQTT packet data, allowing users to pipe the output as they wish',
        parseOutputMode,
        'default',
      )
      // connect options
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)

      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // connect properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-Cup, --conn-user-properties <USERPROPERTIES...>',
        'the connect user properties of MQTT 5.0 (e.g. -Cup "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      // https://github.com/tj/commander.js/blob/master/examples/options-conflicts.js
      .addOption(
        new Option('--file-write <PATH>', 'append received messages to a specified file')
          .argParser(parseFileWrite)
          .conflicts('fileSave'),
      )
      .addOption(
        new Option('--file-save <PATH>', 'save each received message to a new file')
          .argParser(parseFileSave)
          .conflicts('fileWrite'),
      )
      .option('--delimiter [CHARACTER]', 'append a delimiter to the end of each message, default is "\\n"')
      .option(
        '-Pp, --protobuf-path <PATH>',
        'the path to the .proto file that defines the message format for Protocol Buffers (protobuf)',
      )
      .option(
        '-Pmn, --protobuf-message-name <NAME>',
        'the name of the protobuf message type (must exist in the .proto file)',
      )
      .option(
        '-Ap, --avsc-path <PATH>',
        'the path to the .avsc file that defines the avro schema for AVRO decoding',
        parseFileRead,
      )
      .option('--debug', 'enable debug mode for MQTT.js', false)
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(sub)

    const benchCmd = this.program.command('bench').description('MQTT Benchmark in performance testing.')

    benchCmd
      .command('conn')
      .description('Create a custom number of connections.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker', parseNumber, 10)
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(benchConn)

    benchCmd
      .command('pub')
      .description('Publish a custom number of messages at a custom rate.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker', parseNumber, 10)
      .option('-im, --message-interval <MILLISECONDS>', 'interval of publishing messages', parseNumber, 1000)
      .option(
        '-L, --limit <NUMBER>',
        'the maximum number of messages to publish. a value of 0 means no limit on the number of messages',
        parseNumber,
        0,
      )
      .option(
        '-t, --topic <TOPIC>',
        'the message topic, support %u (username), %c (client id), %i (index) variables',
        parsePubTopic,
      )
      .option('-m, --message <BODY>', 'the message body', DEFAULT_MQTT_PUB_MESSAGE)
      .option('-q, --qos <0/1/2>', 'the QoS of the message', parseNumber, 0)
      .option('-r, --retain', 'send a retained message')
      .option('-d, --dup', 'mark as duplicate flag')
      // properties options of MQTT 5.0
      .option('-pf, --payload-format-indicator', 'the payload format indicator of the publish message')
      .option('-e, --message-expiry-interval <NUMBER>', 'the lifetime of the publish message in seconds', parseNumber)
      .option(
        '-ta, --topic-alias <NUMBER>',
        'value that is used to identify the topic instead of using the topic name',
        parseNumber,
      )
      .option('-rt, --response-topic <TOPIC>', 'string which is used as the topic name for a response message')
      .option(
        '-cd, --correlation-data <DATA>',
        'used by the sender of the request message to identify which request the response message is for when it is received',
      )
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      .option('-si, --subscription-identifier <NUMBER>', 'the identifier of the subscription', parseNumber)
      .option('-ct, --content-type <TYPE>', 'a description of the content of the publish message')
      .option('-v, --verbose', 'print history published total and message rate')
      // connect options
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // connect properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-Cup, --conn-user-properties <USERPROPERTIES...>',
        'the connect user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option('--file-read <PATH>', 'read the message body from the file', parseFileRead)
      .option(
        '--split [CHARACTER]',
        'split the input message in a single file by a specified character, default is "\\n"',
      )
      .option(
        '-S, --payload-size <SIZE>',
        'generate a random payload of specified size (e.g., 1KB, 512B, 2MB); ignored if -m, -s, -M, or --file-read is present',
      )
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(benchPub)

    benchCmd
      .command('sub')
      .description('Create a custom number of connections then subscribe to one or multiple topics.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker', parseNumber, 10)
      .option(
        '-t, --topic <TOPIC...>',
        'the message topic, support %u (username), %c (client id), %i (index) variables',
      )
      .option('-q, --qos <0/1/2...>', 'the QoS of the message', parseQoS)
      // properties options of MQTT 5.0
      .option('-nl, --no_local [FLAG...]', 'the no local MQTT 5.0 flag', parseVariadicOfBooleanType)
      .option(
        '-rap, --retain-as-published [FLAG...]',
        'the retain as published MQTT 5.0 flag',
        parseVariadicOfBooleanType,
      )
      .option('-rh, --retain-handling <0/1/2...>', 'the retain handling MQTT 5.0', parseQoS)
      .option('-si, --subscription-identifier <NUMBER...>', 'the identifier of the subscription', parseNumber)
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      .option('-v, --verbose', 'print history received messages and rate')
      // connect options
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)

      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option(
        '--maximum-reconnect-times <NUMBER>',
        'the maximum reconnect times',
        parseNumber,
        state.getConfig('maxReconnectTimes'),
      )
      // connect properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-Cup, --conn-user-properties <USERPROPERTIES...>',
        'the connect user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(benchSub)

    this.program
      .command('simulate')
      .description('Publish scenario-specific simulation messages at a custom rate and a number of connections.')
      .option('-sc, --scenario <SCENARIO>', 'the name of the built-in scenario to execute')
      .option('-f, --file <SCENARIO FILE PATH>', 'the path of the custom script file to simulate')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker', parseNumber, 10)
      .option('-im, --message-interval <MILLISECONDS>', 'interval of publishing messages', parseNumber, 1000)
      .option(
        '-L, --limit <NUMBER>',
        'the maximum number of messages to publish. a value of 0 means no limit on the number of messages',
        parseNumber,
        0,
      )
      .option(
        '-t, --topic <TOPIC>',
        'the message topic, support %u (username), %c (client id), %i (index), %sc (scenario) variables',
        parsePubTopic,
        'mqttx/simulate/%sc/%c',
      )
      .option('-q, --qos <0/1/2>', 'the QoS of the message', parseNumber, 0)
      .option('-r, --retain', 'send a retained message')
      .option('-d, --dup', 'mark as duplicate flag')
      // properties options of MQTT 5.0
      .option('-pf, --payload-format-indicator', 'the payload format indicator of the publish message')
      .option('-e, --message-expiry-interval <NUMBER>', 'the lifetime of the publish message in seconds', parseNumber)
      .option(
        '-ta, --topic-alias <NUMBER>',
        'value that is used to identify the topic instead of using the topic name',
        parseNumber,
      )
      .option('-rt, --response-topic <TOPIC>', 'string which is used as the topic name for a response message')
      .option(
        '-cd, --correlation-data <DATA>',
        'used by the sender of the request message to identify which request the response message is for when it is received',
      )
      .option(
        '-up, --user-properties <USERPROPERTIES...>',
        'the user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      .option('-si, --subscription-identifier <NUMBER>', 'the identifier of the subscription', parseNumber)
      .option('-ct, --content-type <TYPE>', 'a description of the content of the publish message')
      .option('-v, --verbose', 'print history published total and message rate')
      // connect options
      .option('-V, --mqtt-version <5.0/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', state.getConfig('host'))
      .option('-p, --port <PORT>', 'the broker port', parseNumber, state.getConfig('port'))
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false', true)
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username', state.getConfig('username'))
      .option('-P, --password <PASS>', 'the password', state.getConfig('password'))
      .option(
        '-l, --protocol <PROTO>',
        'the protocol to use, mqtt, mqtts, ws, or wss',
        parseProtocol,
        state.getConfig('protocol'),
      )
      .option('--path <PATH>', 'the path of websocket', '/mqtt')
      .option(
        '-wh, --ws-headers <WSHEADERS...>',
        'headers for WebSocket options (only works with MQTT over WebSocket connections, e.g. -wh "Authorization: Bearer token")',
        parseKeyValues,
      )
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option('--alpn <PROTO...>', 'set one or multiple ALPN (Application Layer Protocol Negotiation) protocols')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'interval between two reconnections, disable auto reconnect by setting to 0',
        parseNumber,
        1000,
      )
      .option('--maximun-reconnect-times <NUMBER>', 'the maximum reconnect times', parseNumber, 10)
      // connect properties options of MQTT 5.0
      .option('-se, --session-expiry-interval <SECONDS>', 'the session expiry interval in seconds', parseNumber)
      .option('--rcv-max, --receive-maximum <NUMBER>', 'the receive maximum value', parseNumber)
      .option('--maximum-packet-size <NUMBER>', 'the maximum packet size the client is willing to accept', parseNumber)
      .option('--topic-alias-maximum <NUMBER>', 'the topic alias maximum value', parseNumber)
      .option('--req-response-info', 'the client requests response information from the server')
      .option('--no-req-problem-info', 'the client requests problem information from the server')
      .option(
        '-Cup, --conn-user-properties <USERPROPERTIES...>',
        'the connect user properties of MQTT 5.0 (e.g. -up "name: mqttx cli")',
        parseKeyValues,
      )
      // will message options
      .option('-Wt, --will-topic <TOPIC>', 'the will topic')
      .option('-Wm, --will-message <BODY>', 'the will message')
      .option('-Wq, --will-qos <0/1/2>', 'the will qos', parseNumber)
      .option('-Wr, --will-retain', 'send a will retained message')
      // will message properties options of MQTT 5.0
      .option('-Wd, --will-delay-interval <SECONDS>', 'the will delay interval in seconds', parseNumber)
      .option('-Wpf, --will-payload-format-indicator', 'will message is UTF-8 encoded character data or not')
      .option('-We, --will-message-expiry-interval <SECONDS>', 'lifetime of the will message in seconds', parseNumber)
      .option('-Wct, --will-content-type <CONTENTTYPE>', 'description of the will message’s content')
      .option('-Wrt, --will-response-topic <TOPIC>', 'topic name for a response message')
      .option('-Wcd, --will-correlation-data <DATA>', 'correlation data for the response message')
      .option('-Wup, --will-user-properties <USERPROPERTIES...>', 'the user properties of will message', parseKeyValues)
      .option(
        '-so, --save-options [PATH]',
        'save the parameters to the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .option(
        '-lo, --load-options [PATH]',
        'load the parameters from the local configuration file, which supports json and yaml format, default path is ./mqttx-cli-options.json',
      )
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(simulatePub)

    this.program
      .command('ls')
      .description('List information based on the provided options.')
      .option('-sc, --scenarios', 'List all built-in scenarios')
      .allowUnknownOption(false)
      .hook('preAction', (thisCommand) => {
        globalThis.command = thisCommand
      })
      .action(ls)
  }
}

export default Commander
