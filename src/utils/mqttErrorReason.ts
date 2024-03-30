const MqttErrorReason: Record<string, { [code: number]: string }> = {
  '3.1': {
    128: 'Not authorized',
  },
  '3.1.1': {
    128: 'Not authorized',
  },
  '5.0': {
    0: 'Normal disconnection',
    4: 'Disconnect with Will Message',
    16: 'No matching subscribers',
    17: 'No subscription existed',
    24: 'Continue authentication',
    25: 'Re-authenticate',
    128: 'Unspecified error',
    129: 'Malformed Packet',
    130: 'Protocol Error',
    131: 'Implementation specific error',
    132: 'Unsupported Protocol Version',
    133: 'Client Identifier not valid',
    134: 'Bad User Name or Password',
    135: 'Not authorized',
    136: 'Server unavailable',
    137: 'Server busy',
    138: 'Banned',
    139: 'Server shutting down',
    140: 'Bad authentication method',
    141: 'Keep Alive timeout',
    142: 'Session taken over',
    143: 'Topic Filter invalid',
    144: 'Topic Name invalid',
    145: 'Packet Identifier in use',
    146: 'Packet Identifier not found',
    147: 'Receive Maximum exceeded',
    148: 'Topic Alias invalid',
    149: 'Packet too large',
    150: 'Message rate too high',
    151: 'Quota exceeded',
    152: 'Administrative action',
    153: 'Payload format invalid',
    154: 'Retain not supported',
    155: 'QoS not supported',
    156: 'Use another server',
    157: 'Server moved',
    158: 'Shared Subscriptions not supported',
    159: 'Connection rate exceeded',
    160: 'Maximum connect time',
    161: 'Subscription Identifiers not supported',
    162: 'Wildcard Subscriptions not supported',
  },
}

type MqttVersion = '3.1' | '3.1.1' | '5.0'

const getErrorReason = (version: MqttVersion, code: number) => {
  const versionMap = MqttErrorReason[version]
  return versionMap[code] ?? 'Unknown error'
}

export default getErrorReason
