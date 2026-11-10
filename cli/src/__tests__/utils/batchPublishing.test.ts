/// <reference path="../../types/global.d.ts" />
import { generate, parser, IPublishPacket } from 'mqtt-packet'
import {
  BatchPacket,
  BatchLimits,
  PublishProperties,
  parseBatchCount,
  buildTopicCarrier,
  parseTopicCarrier,
  classifyBatch,
  encodeBatchPayload,
  decodeBatch,
  calculatePublishSize,
  validateBatchSelection,
  PROTOCOL_BATCH_LIMITS,
} from '../../utils/batchPublishing'
import { validateBatchOptions, createBatchSelectionCheck } from '../../utils/batchOptions'
import { fileDataSplitter } from '../../utils/fileUtils'
import { Commander } from '../../index'

const property = (count: string | string[], hex: string | Buffer, format: string | string[] = 'v1'): BatchPacket => ({
  topic: 'batch/demo',
  qos: 1,
  retain: false,
  payload: Buffer.isBuffer(hex) ? hex : Buffer.from(hex.replace(/\s/g, ''), 'hex'),
  properties: { userProperties: { 'batch-format': format, 'batch-size': count } },
})
const large = PROTOCOL_BATCH_LIMITS
const vectors: {
  name: string
  count: string | string[]
  payload: string | Buffer
  limits?: BatchLimits
  format?: string
  error?: string
  lengths?: number[]
}[] = [
  { name: '1 empty item', count: '1', payload: '0000', lengths: [0] },
  {
    name: '2 256-byte item',
    count: '1',
    payload: Buffer.concat([Buffer.from('0100', 'hex'), Buffer.alloc(256, 0x41)]),
    lengths: [256],
  },
  {
    name: '3 maximum item',
    count: '1',
    payload: Buffer.concat([Buffer.from('ffff', 'hex'), Buffer.alloc(65535, 0x41)]),
    limits: large,
    lengths: [65535],
  },
  {
    name: '4 maximum count',
    count: '65535',
    payload: Buffer.alloc(131070),
    limits: large,
    lengths: Array(65535).fill(0),
  },
  { name: '5 count 65536', count: '65536', payload: Buffer.alloc(131072), error: 'INVALID_BATCH_COUNT' },
  { name: '6 count 65537', count: '65537', payload: '0000', error: 'INVALID_BATCH_COUNT' },
  { name: '7 leading zero', count: '01', payload: '0000', error: 'INVALID_BATCH_COUNT' },
  { name: '8 minimum payload', count: '1', payload: '00', error: 'BATCH_COUNT_MISMATCH' },
  { name: '9 partial second length', count: '2', payload: '00014100', error: 'INVALID_ITEM_LENGTH' },
  { name: '10 truncated item', count: '1', payload: '000241', error: 'TRUNCATED_ITEM' },
  { name: '11 missing second frame', count: '2', payload: '00024142', error: 'BATCH_COUNT_MISMATCH' },
  { name: '12 trailing byte', count: '1', payload: '00014100', error: 'BATCH_COUNT_MISMATCH' },
  { name: '13 count budget', count: '2', payload: '00000000', limits: { maxItems: 1 }, error: 'BATCH_LIMIT_EXCEEDED' },
  { name: '14 repeated size', count: ['1', '1'], payload: '0000', error: 'INVALID_BATCH_MARKERS' },
  { name: '15 unknown format', count: '1', payload: '0000', format: 'unknown', error: 'UNSUPPORTED_BATCH_FORMAT' },
]

describe('spec §9.2 validation vectors', () => {
  it.each(vectors)('$name (property carrier)', (vector) => {
    const result = decodeBatch(property(vector.count, vector.payload, vector.format), 5, vector.limits)
    expect(result?.error).toBe(vector.error)
    if (vector.error) expect(result?.items).toBeUndefined()
    else expect(result?.items?.map((item) => item.length)).toEqual(vector.lengths)
  })
  it.each(vectors.slice(0, 13))('$name (topic carrier, §9.3)', (vector) => {
    const packet = {
      ...property(vector.count, vector.payload),
      topic: `$batch/${vector.count}/batch/demo`,
      properties: undefined,
    }
    const result = decodeBatch(packet, 4, vector.limits)
    expect(result?.error).toBe(vector.error)
    if (vector.error) expect(result?.items).toBeUndefined()
    else expect(result?.items?.map((item) => item.length)).toEqual(vector.lengths)
  })
  it('rejects vectors 3/4 under the smaller specified budgets', () => {
    expect(decodeBatch(property('1', vectors[2].payload), 5)?.error).toBe('BATCH_LIMIT_EXCEEDED')
    expect(decodeBatch(property('65535', vectors[3].payload), 5, { ...large, maxItems: 65534 })?.error).toBe(
      'BATCH_LIMIT_EXCEEDED',
    )
  })
})

describe('spec §§3.3, 4 and 9.3', () => {
  it.each([
    ['$batch/2/batch/demo', '00000000', undefined, 'batch/demo', 2],
    ['$batch/1//demo', '0000', undefined, '/demo', 1],
    ['$batch/01/batch/demo', '0000', 'INVALID_BATCH_COUNT', undefined, undefined],
    ['$batch/0/batch/demo', '0000', 'INVALID_BATCH_COUNT', undefined, undefined],
    ['$batch/2', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch/2/', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch/2/$SYS/demo', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch/1/a+b', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch/1/a#b', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
    ['$batch/1/a\0b', '0000', 'INVALID_BATCH_TOPIC', undefined, undefined],
  ])('decodes %s', (topic, hex, error, logicalTopic?, count?) => {
    const result = decodeBatch({ topic: topic as string, payload: Buffer.from(hex as string, 'hex'), qos: 1 }, 4)
    expect(result?.error).toBe(error)
    if (error) expect(result?.items).toBeUndefined()
    else expect(result).toMatchObject({ logicalTopic, count })
  })
  it('preserves slashes and checks topic byte lengths', () => {
    expect(buildTopicCarrier(2, '/a//b/')).toBe('$batch/2//a//b/')
    expect(parseTopicCarrier('$batch/2//a//b/')).toEqual({ countText: '2', logicalTopic: '/a//b/' })
    expect(() => buildTopicCarrier(1, 'é'.repeat(32768))).toThrow('INVALID_BATCH_TOPIC')
    expect(() => buildTopicCarrier(1, '\ud800')).toThrow('INVALID_BATCH_TOPIC')
  })
  it('selects topic first and rejects metadata before count', () => {
    const packet = property('1', '0000')
    packet.topic = '$batch/01/demo'
    expect(classifyBatch(packet, 5)).toBe('topic')
    expect(decodeBatch(packet, 5)?.error).toBe('INVALID_BATCH_METADATA')
    packet.properties = undefined
    packet.retain = true
    expect(decodeBatch(packet, 4)?.error).toBe('INVALID_BATCH_METADATA')
  })
  it.each(['', '0', '-1', '+1', '1 ', ' 1', '1\n', '１', '١', '10000000000000000000000'])(
    'rejects count %j',
    (count) => {
      expect(() => parseBatchCount(count)).toThrow('INVALID_BATCH_COUNT')
    },
  )
  it.each([false, 0, undefined])('accepts PFI %p', (payloadFormatIndicator) => {
    const packet = property('1', '0000')
    packet.properties!.payloadFormatIndicator = payloadFormatIndicator
    expect(decodeBatch(packet, 5)?.items).toHaveLength(1)
  })
  it('reports QoS, marker, format, metadata, count, limit errors in order', () => {
    const packet = property('01', '00', 'unknown')
    packet.qos = 2
    expect(decodeBatch(packet, 5)?.error).toBe('UNSUPPORTED_BATCH_QOS')
    packet.qos = 1
    delete packet.properties!.userProperties!['batch-size']
    expect(decodeBatch(packet, 5)?.error).toBe('INVALID_BATCH_MARKERS')
    packet.properties!.userProperties!['batch-size'] = '01'
    expect(decodeBatch(packet, 5)?.error).toBe('UNSUPPORTED_BATCH_FORMAT')
    packet.properties!.userProperties!['batch-format'] = 'v1'
    packet.properties!.payloadFormatIndicator = true
    expect(decodeBatch(packet, 5)?.error).toBe('INVALID_BATCH_METADATA')
    packet.properties!.payloadFormatIndicator = false
    expect(decodeBatch(packet, 5)?.error).toBe('INVALID_BATCH_COUNT')
    packet.properties!.userProperties!['batch-size'] = '1'
    expect(decodeBatch(packet, 5, { maxBytes: 0 })?.error).toBe('BATCH_LIMIT_EXCEEDED')
  })
  it('requires both exact markers, counts duplicate formats and ignores ordinary data', () => {
    expect(decodeBatch({ ...property('1', '0000'), properties: undefined }, 5)).toBeUndefined()
    const packet = property('1', '0000', ['v1', 'v1'])
    expect(decodeBatch(packet, 5)?.error).toBe('INVALID_BATCH_MARKERS')
    packet.properties = { userProperties: { 'Batch-format': 'v1', 'Batch-size': '1' } }
    expect(decodeBatch(packet, 5)).toBeUndefined()
    expect(decodeBatch(property('1', '0000'), 4)).toBeUndefined()
  })
  it('enforces item budgets, framing and ordered offset slices without partial results', () => {
    const payload = encodeBatchPayload([Buffer.from(' A '), Buffer.alloc(0), Buffer.from([0xff])])
    const decoded = decodeBatch(property('3', payload), 5)!
    expect(decoded.items).toEqual([Buffer.from(' A '), Buffer.alloc(0), Buffer.from([0xff])])
    expect(decodeBatch(property('3', payload), 5, { maxItemBytes: 2 })?.error).toBe('BATCH_LIMIT_EXCEEDED')
    expect(() => encodeBatchPayload([Buffer.alloc(65536)], large)).toThrow('BATCH_LIMIT_EXCEEDED')
    expect(() => encodeBatchPayload([], large)).toThrow('INVALID_BATCH_COUNT')
    for (let size = 0; size < 256; size++) {
      const result = decodeBatch(property(String((size % 10) + 1), Buffer.alloc(size, size)), 5)
      if (result?.error) expect(result.items).toBeUndefined()
    }
  })
})

const hex5 =
  '32 44 00 0A 62 61 74 63 68 2F 64 65 6D 6F 00 01 23 26 00 0C 62 61 74 63 68 2D 66 6F 72 6D 61 74 00 02 76 31 26 00 0A 62 61 74 63 68 2D 73 69 7A 65 00 01 32 00 04 4D 73 67 31 00 0A 4C 6F 6E 67 65 72 4D 73 67 32'
const hex4 =
  '32 29 00 13 24 62 61 74 63 68 2F 32 2F 62 61 74 63 68 2F 64 65 6D 6F 00 01 00 04 4D 73 67 31 00 0A 4C 6F 6E 67 65 72 4D 73 67 32'
const fromHex = (hex: string) => Buffer.from(hex.replace(/\s/g, ''), 'hex')
const wire = (packet: BatchPacket, version: number) =>
  generate(
    {
      cmd: 'publish',
      dup: false,
      retain: false,
      ...packet,
      qos: packet.qos as 0 | 1 | 2,
      messageId: 1,
    } as IPublishPacket,
    { protocolVersion: version },
  )
const parsed = (bytes: Buffer, version: number) => {
  let packet: IPublishPacket | undefined
  const p = parser({ protocolVersion: version })
  p.on('packet', (value) => {
    if (value.cmd === 'publish') packet = value
  })
  p.parse(bytes)
  return packet as BatchPacket
}

describe('spec §§9.1, 9.3 and 9.8 exact packets', () => {
  const base5 = property('2', encodeBatchPayload([Buffer.from('Msg1'), Buffer.from('LongerMsg2')]))
  const base4 = { ...base5, topic: '$batch/2/batch/demo', properties: undefined }
  it.each([
    [5, base5, fromHex(hex5), 70, undefined],
    [4, base4, fromHex(hex4), 43, undefined],
    [
      5,
      { ...base5, qos: 0 },
      Buffer.concat([fromHex('3042'), fromHex(hex5).subarray(2, 14), fromHex(hex5).subarray(16)]),
      68,
      undefined,
    ],
    [
      4,
      { ...base4, qos: 0 },
      Buffer.concat([fromHex('3027'), fromHex(hex4).subarray(2, 23), fromHex(hex4).subarray(25)]),
      41,
      undefined,
    ],
    [
      5,
      { ...base5, qos: 2, retain: true },
      Buffer.concat([fromHex('3544'), fromHex(hex5).subarray(2)]),
      70,
      'UNSUPPORTED_BATCH_QOS',
    ],
    [4, { ...base4, qos: 2 }, Buffer.concat([fromHex('3429'), fromHex(hex4).subarray(2)]), 43, 'UNSUPPORTED_BATCH_QOS'],
    [
      5,
      { ...base4, qos: 2 },
      Buffer.concat([fromHex('342a'), fromHex(hex4).subarray(2, 25), fromHex('00'), fromHex(hex4).subarray(25)]),
      44,
      'UNSUPPORTED_BATCH_QOS',
    ],
  ] as [number, BatchPacket, Buffer, number, string | undefined][])(
    'matches golden packet #%# (%i)',
    (version, packet, expected, bytes, error) => {
      const generated = wire(packet, version)
      expect(generated).toEqual(expected)
      expect(generated).toHaveLength(bytes)
      expect(calculatePublishSize(packet, version)).toBe(bytes)
      const result = decodeBatch(parsed(generated, version), version)
      expect(result?.error).toBe(error)
      if (error) expect(result?.items).toBeUndefined()
      else expect(result?.items?.map((x) => x.toString())).toEqual(['Msg1', 'LongerMsg2'])
    },
  )
  it('does not require marker ordering', () => {
    const packet = { ...base5, properties: { userProperties: { 'batch-size': '2', 'batch-format': 'v1' } } }
    expect(decodeBatch(parsed(wire(packet, 5), 5), 5)?.items).toHaveLength(2)
  })
})

describe('complete PUBLISH length compared with mqtt-packet.generate', () => {
  const properties: PublishProperties[] = [
    {},
    { payloadFormatIndicator: false },
    { messageExpiryInterval: 123 },
    { topicAlias: 1 },
    { responseTopic: 'reply/测试' },
    { correlationData: 'é-測試' },
    { correlationData: Buffer.from([0, 255]) },
    { subscriptionIdentifier: 127 },
    { subscriptionIdentifier: 128 },
    { subscriptionIdentifier: 16384 },
    { contentType: 'application/octet-stream' },
    { userProperties: { hello: 'world', key: ['one', 'two', 'é'] } },
    { userProperties: { a: 'x'.repeat(110) } },
    { userProperties: { a: 'x'.repeat(16380) } },
  ]
  it.each(properties)('includes CLI PUBLISH property fixture %#', (properties) => {
    const packet = { ...property('1', '0000'), properties }
    expect(calculatePublishSize(packet, 5)).toBe(wire(packet, 5).length)
  })
  it.each([0, 1, 2])('includes all properties together and QoS %i', (qos) => {
    const merged = Object.assign({}, ...properties.slice(1, 12))
    const packet = { ...property('1', '0000'), qos, properties: merged }
    expect(calculatePublishSize(packet, 5)).toBe(wire(packet, 5).length)
  })
  it.each([4, 5])('handles VBI boundaries and actual Topic Alias omission in version %i', (version) => {
    for (const size of [0, 99, 100, 127, 128, 16370, 16384, 2097152]) {
      for (const topic of ['', '测试/topic']) {
        const packet = { topic, payload: Buffer.alloc(size), qos: 1, properties: { topicAlias: 1 } }
        expect(calculatePublishSize(packet, version)).toBe(wire(packet, version).length)
      }
    }
  })
})

describe('options and negotiation', () => {
  const options = (): PublishOptions => ({
    mqttVersion: 5,
    hostname: '127.0.0.1',
    clientId: 'batch',
    keepalive: 30,
    clean: true,
    reconnectPeriod: 0,
    maximumReconnectTimes: 0,
    topic: 'demo/topic',
    message: 'test',
    qos: 1,
    batch: true,
  })
  it.each([
    { mqttVersion: 3 },
    { qos: 2 },
    { mqttVersion: 4, retain: true },
    { payloadFormatIndicator: true },
    { userProperties: { 'batch-format': 'v1' } },
    { userProperties: { 'batch-size': '2' } },
    { batchNegotiate: true, connUserProperties: { 'batch-publish': 'v1' } },
    { batchNegotiate: true, mqttVersion: 4 },
    { batchNegotiate: true, batch: false },
    { batchMaxItems: 0 },
    { batchMaxItems: 65536 },
    { batchMaxItems: 1.5 },
    { batchMaxBytes: 1023 },
    { batchMaxBytes: 1048577 },
    { batchItems: 0 },
    { batchItems: 65536 },
    { stdin: true },
    { multiline: true },
    { lineMode: true },
    { payloadSize: '1KB' },
    { split: true, batch: false },
    { split: true },
    { protobufPath: 'schema.proto' },
    { topic: '$SYS/demo' },
    { topic: '$batch' },
  ])('rejects option conflict %j', (override) => {
    expect(() => validateBatchOptions({ ...options(), ...override } as PublishOptions, 'pub')).toThrow()
  })
  it.each([
    ['$batch/2/demo/topic', ' Try: -t demo/topic'],
    ['$batch/2//demo', ' Try: -t /demo'],
    ['$batch/no-separator', ''],
  ])('rejects prefixed logical topic %s', (topic, suggestion) => {
    expect(() => validateBatchOptions({ ...options(), topic }, 'pub')).toThrow(
      `With -b, -t takes the logical topic; the $batch/{N}/ prefix is added automatically.${suggestion}`,
    )
    expect(() => validateBatchOptions({ ...options(), topic, batch: false }, 'pub')).not.toThrow()
  })
  it('explains invalid logical topics and unsupported bench splitting', () => {
    expect(() => validateBatchOptions({ ...options(), topic: '$SYS/demo' }, 'pub')).toThrow(
      'Invalid topic for -b: $SYS/demo (INVALID_BATCH_TOPIC, spec §3.3).',
    )
    expect(() => validateBatchOptions({ ...options(), split: true }, 'benchPub')).toThrow(
      'bench pub -b uses the whole file as one item template; --split is unsupported.',
    )
  })
  it('requires -b for bench item counts and negotiation', () => {
    expect(() => validateBatchOptions({ ...options(), batch: false, batchItems: 2 }, 'benchPub')).toThrow(
      '-bi requires -b.',
    )
    expect(() => validateBatchOptions({ ...options(), batch: false, batchNegotiate: true }, 'benchPub')).toThrow(
      '--batch-negotiate requires batch publishing with MQTT 5.0.',
    )
    expect(() => validateBatchOptions(options(), 'benchPub')).not.toThrow()
    expect(() =>
      validateBatchOptions({ ...options(), batchItems: 101, batchNegotiate: true }, 'benchPub'),
    ).not.toThrow()
  })
  it.each([0, 65536, 1.5, NaN, Infinity])('rejects invalid bench item count %p', (batchItems) => {
    expect(() => validateBatchOptions({ ...options(), batchItems }, 'benchPub')).toThrow('Invalid --batch-items:')
  })
  it('exposes bench -b and explains the default count and -bi requirement', () => {
    const commander = new Commander()
    commander.init()
    const benchPub = commander.program.commands
      .find((c) => c.name() === 'bench')!
      .commands.find((c) => c.name() === 'pub')!
    benchPub.parseOptions(['-b', '-bi', '101'])
    expect(benchPub.opts()).toMatchObject({ batch: true, batchItems: 101 })
    const help = benchPub.helpInformation()
    expect(help).toContain('-b, --batch')
    expect(help).toContain('100 items per packet by default')
    expect(help).toContain('requires -b')
  })
  it.each([undefined, 'unknown', ['v1', 'v1'], ['v1', 'unknown']])(
    'rejects missing, mismatched or repeated selection %p',
    (value) => {
      const up = value === undefined ? undefined : { 'batch-publish': value }
      expect(validateBatchSelection({ 'batch-publish': 'v1' }, up)).toBe(false)
    },
  )
  it('requires an exact offer and selection and checks session resumption', () => {
    const selected = { properties: { userProperties: { 'batch-publish': 'v1' } } }
    expect(validateBatchSelection(undefined, selected.properties.userProperties)).toBe(false)
    expect(validateBatchSelection({ 'batch-publish': ['v1', 'unknown'] }, selected.properties.userProperties)).toBe(
      false,
    )
    const check = createBatchSelectionCheck({ 'batch-publish': 'v1' }, true)
    expect(check(selected)).toBe(true)
    expect(() => check({ sessionPresent: true })).toThrow(
      'Batch session resume failed: v1 capability was not reselected.',
    )
    expect(() => check({ sessionPresent: false })).toThrow('Batch negotiation failed:')
    const unpinned = createBatchSelectionCheck()
    expect(unpinned({ sessionPresent: true })).toBe(false)
  })
})

describe('batch file splitting reuses bench splitter', () => {
  it.each([
    ['', []],
    ['a\r\n\r\nb\r\n', ['a', '', 'b']],
    ['\n', ['']],
    ['\n\n', ['', '']],
    [' a \n b', [' a ', ' b']],
    ['a\n\n', ['a', '']],
  ] as [string, string[]][])('splits newline input %j', (data, expected) =>
    expect(fileDataSplitter(data, true, true)).toEqual(expected),
  )
  it('uses the existing custom separator semantics', () => {
    expect(fileDataSplitter('one::two::::', '::', true)).toEqual(['one', 'two', ''])
    expect(fileDataSplitter('one\n', true)).toEqual(['one', ''])
  })
})
