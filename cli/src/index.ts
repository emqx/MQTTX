import 'core-js'
import { Command } from 'commander'
import { getClientId } from './utils/generator'
import { checkUpdate } from './utils/checkUpdate'
import {
  parseNumber,
  parseProtocol,
  parseMQTTVersion,
  parseUserProperties,
  parseQoS,
  parseVariadicOfBooleanType,
  parsePubTopic,
} from './utils/parse'
import { conn, benchConn } from './lib/conn'
import { pub, benchPub } from './lib/pub'
import { sub, benchSub } from './lib/sub'
import { version } from '../package.json'

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
      .version(`${version}\nhttps://mqttx.app/changelogs/v${version}`, '-v, --version')

    this.program
      .command('check')
      .description('Check for updates.')
      .action(async () => {
        await checkUpdate()
      })

    this.program
      .command('conn')
      .description('Create a connection and connect to MQTT Broker.')
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(conn)

    this.program
      .command('pub')
      .description('Publish a message to a topic.')
      .requiredOption('-t, --topic <TOPIC>', 'the message topic', parsePubTopic)
      .option('-m, --message <BODY>', 'the message body', 'Hello From MQTT X CLI')
      .option('-q, --qos <0/1/2>', 'the QoS of the message', parseNumber, 0)
      .option('-r, --retain', 'send a retained message')
      .option('-d, --dup', 'mark as duplicate flag')
      .option('-s, --stdin', 'read the message body from stdin')
      .option('-M, --multiline', 'read lines from stdin as multiple messages')
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
        parseUserProperties,
      )
      .option('-si, --subscription-identifier <NUMBER>', 'the identifier of the subscription', parseNumber)
      .option('-ct, --content-type <TYPE>', 'a description of the content of the publish message')
      // connect options
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(pub)

    this.program
      .command('sub')
      .description('Subscribes to one or more topics.')
      .requiredOption('-t, --topic <TOPIC...>', 'the message topic')
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
        parseUserProperties,
      )
      .option('-v, --verbose', 'print the topic before the message')
      // connect options
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-i, --client-id <ID>', 'the client id', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')

      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(sub)

    const benchCmd = this.program.command('bench').description('MQTT Benchmark in performance testing.')

    benchCmd
      .command('conn')
      .description('Create a custom number of connections.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker (default: 10ms)', parseNumber, 10)
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(benchConn)

    benchCmd
      .command('pub')
      .description('Publish a custom number of messages at a custom rate.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker (default: 10ms)', parseNumber, 10)
      .option(
        '-im, --message-interval <MILLISECONDS>',
        'interval of publishing messages (default: 1000ms)',
        parseNumber,
        1000,
      )
      .requiredOption(
        '-t, --topic <TOPIC>',
        'the message topic, support %u (username), %c (client id), %i (index) variables',
        parsePubTopic,
      )
      .option('-m, --message <BODY>', 'the message body', 'Hello From MQTT X CLI')
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
        parseUserProperties,
      )
      .option('-si, --subscription-identifier <NUMBER>', 'the identifier of the subscription', parseNumber)
      .option('-ct, --content-type <TYPE>', 'a description of the content of the publish message')
      .option('-v, --verbose', 'print history published total and message rate')
      // connect options
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')
      .option('-k, --keepalive <SEC>', 'send a ping every SEC seconds', parseNumber, 30)
      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(benchPub)

    benchCmd
      .command('sub')
      .description('Create a custom number of connections then subscribe to one or multiple topics.')
      .option('-c, --count <NUMBER>', 'the number of connections', parseNumber, 1000)
      .option('-i, --interval <MILLISECONDS>', 'interval of connecting to the broker (default: 10ms)', parseNumber, 10)
      .requiredOption(
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
        parseUserProperties,
      )
      .option('-v, --verbose', 'print history received messages and rate')
      // connect options
      .option('-V, --mqtt-version <5/3.1.1/3.1>', 'the MQTT version', parseMQTTVersion, 5)
      .option('-h, --hostname <HOST>', 'the broker host', 'localhost')
      .option('-p, --port <PORT>', 'the broker port', parseNumber)
      .option('-I, --client-id <ID>', 'the client id, support %i (index) variable', getClientId())
      .option('--no-clean', 'set the clean session flag to false (default: true)')

      .option('-u, --username <USER>', 'the username')
      .option('-P, --password <PASS>', 'the password')
      .option('-l, --protocol <PROTO>', 'the protocol to use, mqtt or mqtts (default: mqtt)', parseProtocol)
      .option('--key <PATH>', 'path to the key file')
      .option('--cert <PATH>', 'path to the cert file')
      .option('--ca <PATH>', 'path to the ca certificate')
      .option('--insecure', 'do not verify the server certificate')
      .option(
        '-rp, --reconnect-period <MILLISECONDS>',
        'Interval between two reconnections, disable auto reconnect by setting to 0 (default: 1000ms)',
        parseNumber,
        1000,
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
        parseUserProperties,
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
      .option(
        '-Wup, --will-user-properties <USERPROPERTIES...>',
        'the user properties of will message',
        parseUserProperties,
      )
      .action(benchSub)
  }
}

export default Commander
