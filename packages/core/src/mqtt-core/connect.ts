import type { ConnectionForm } from 'mqttx'
import { getClientId } from '../utils'
// eslint-disable-next-line unicorn/prefer-node-protocol
import { Buffer } from 'buffer'

export function getDefaultConnectionFormRecord(): ConnectionForm {
  return {
    name: '',
    protocol: 'mqtt',
    host: 'broker.emqx.io',
    port: 1883,
    clientId: getClientId(),
    clientIdWithTime: false,
    path: '/mqtt',
    username: '',
    password: '',
    ssl: false,
    rejectUnauthorized: true,
    ALPNProtocols: [],
    certType: 'server',
    ca: {
      name: '',
      content: '',
    },
    cert: {
      name: '',
      content: '',
    },
    key: {
      name: '',
      content: '',
    },
    protocolVersion: 5,
    connectTimeout: 10,
    keepalive: 60,
    reconnect: true,
    reconnectPeriod: 4000,
    clean: true,
    properties: {
      sessionExpiryInterval: 0,
      receiveMaximum: undefined,
      maximumPacketSize: undefined,
      topicAliasMaximum: undefined,
      requestResponseInformation: undefined,
      requestProblemInformation: undefined,
      userProperties: undefined,
      authenticationMethod: undefined,
      authenticationData: undefined,
    },
    will: {
      // Only when both the topic and payload are not empty, the will message is considered enabled
      topic: '',
      payload: Buffer.from(''),
      qos: 0,
      retain: false,
      properties: {
        willDelayInterval: undefined,
        payloadFormatIndicator: undefined,
        messageExpiryInterval: undefined,
        contentType: '',
        responseTopic: '',
        correlationData: undefined,
        userProperties: undefined,
      },
    },
  }
}
