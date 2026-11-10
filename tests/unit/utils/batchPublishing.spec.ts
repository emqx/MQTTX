import { expect } from 'chai'
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
} from '@/utils/batchPublishing'

// Register the shared CLI vectors as individual Mocha cases.
const each = (rows: readonly any[]) => (name: string, test: (...args: any[]) => void) => {
  rows.forEach((row, index) =>
    it(`${name.replace('$name', row?.name || '')} [${index + 1}]`, () => test(...(Array.isArray(row) ? row : [row]))),
  )
}

const property = (count: string | string[], hex: string | Buffer, format: string | string[] = 'v1'): BatchPacket => ({
  topic: 'batch/demo',
  qos: 1,
  retain: false,
  payload: Buffer.isBuffer(hex) ? hex : Buffer.from(hex.replace(/\s/g, ''), 'hex'),
  properties: { userProperties: { 'batch-format': format, 'batch-size': count } },
})
const large = { maxItems: 65535, maxBytes: 268435455 }
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
  each(vectors)('$name (property carrier)', (vector) => {
    const result = decodeBatch(property(vector.count, vector.payload, vector.format), 5, vector.limits)
    expect(result?.error).to.equal(vector.error)
    if (vector.error) expect(result?.items).to.equal(undefined)
    else expect(result?.items?.map((item) => item.length)).to.deep.equal(vector.lengths)
  })
  each(vectors.slice(0, 13))('$name (topic carrier, §9.3)', (vector) => {
    const packet = {
      ...property(vector.count, vector.payload),
      topic: `$batch/${vector.count}/batch/demo`,
      properties: undefined,
    }
    const result = decodeBatch(packet, 4, vector.limits)
    expect(result?.error).to.equal(vector.error)
    if (vector.error) expect(result?.items).to.equal(undefined)
    else expect(result?.items?.map((item) => item.length)).to.deep.equal(vector.lengths)
  })
  it('rejects vectors 3/4 under the smaller specified budgets', () => {
    expect(decodeBatch(property('1', vectors[2].payload), 5)?.error).to.equal('BATCH_LIMIT_EXCEEDED')
    expect(decodeBatch(property('65535', vectors[3].payload), 5, { ...large, maxItems: 65534 })?.error).to.equal(
      'BATCH_LIMIT_EXCEEDED',
    )
  })
})

describe('spec §§3.3, 4 and 9.3', () => {
  each([
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
    expect(result?.error).to.equal(error)
    if (error) expect(result?.items).to.equal(undefined)
    else expect(result).to.deep.include({ logicalTopic, count })
  })
  it('preserves slashes and checks topic byte lengths', () => {
    expect(buildTopicCarrier(2, '/a//b/')).to.equal('$batch/2//a//b/')
    expect(parseTopicCarrier('$batch/2//a//b/')).to.deep.equal({ countText: '2', logicalTopic: '/a//b/' })
    expect(() => buildTopicCarrier(1, 'é'.repeat(32768))).to.throw('INVALID_BATCH_TOPIC')
    expect(() => buildTopicCarrier(1, '\ud800')).to.throw('INVALID_BATCH_TOPIC')
  })
  it('selects topic first and rejects metadata before count', () => {
    const packet = property('1', '0000')
    packet.topic = '$batch/01/demo'
    expect(classifyBatch(packet, 5)).to.equal('topic')
    expect(decodeBatch(packet, 5)?.error).to.equal('INVALID_BATCH_METADATA')
    packet.properties = undefined
    packet.retain = true
    expect(decodeBatch(packet, 4)?.error).to.equal('INVALID_BATCH_METADATA')
  })
  each(['', '0', '-1', '+1', '1 ', ' 1', '1\n', '１', '١', '10000000000000000000000'])('rejects count %j', (count) => {
    expect(() => parseBatchCount(count)).to.throw('INVALID_BATCH_COUNT')
  })
  each([false, 0, undefined])('accepts PFI %p', (payloadFormatIndicator) => {
    const packet = property('1', '0000')
    packet.properties!.payloadFormatIndicator = payloadFormatIndicator
    expect(decodeBatch(packet, 5)?.items).to.have.length(1)
  })
  it('reports QoS, marker, format, metadata, count, limit errors in order', () => {
    const packet = property('01', '00', 'unknown')
    packet.qos = 2
    expect(decodeBatch(packet, 5)?.error).to.equal('UNSUPPORTED_BATCH_QOS')
    packet.qos = 1
    delete packet.properties!.userProperties!['batch-size']
    expect(decodeBatch(packet, 5)?.error).to.equal('INVALID_BATCH_MARKERS')
    packet.properties!.userProperties!['batch-size'] = '01'
    expect(decodeBatch(packet, 5)?.error).to.equal('UNSUPPORTED_BATCH_FORMAT')
    packet.properties!.userProperties!['batch-format'] = 'v1'
    packet.properties!.payloadFormatIndicator = true
    expect(decodeBatch(packet, 5)?.error).to.equal('INVALID_BATCH_METADATA')
    packet.properties!.payloadFormatIndicator = false
    expect(decodeBatch(packet, 5)?.error).to.equal('INVALID_BATCH_COUNT')
    packet.properties!.userProperties!['batch-size'] = '1'
    expect(decodeBatch(packet, 5, { maxBytes: 0 })?.error).to.equal('BATCH_LIMIT_EXCEEDED')
  })
  it('requires both exact markers, counts duplicate formats and ignores ordinary data', () => {
    expect(decodeBatch({ ...property('1', '0000'), properties: undefined }, 5)).to.equal(undefined)
    const packet = property('1', '0000', ['v1', 'v1'])
    expect(decodeBatch(packet, 5)?.error).to.equal('INVALID_BATCH_MARKERS')
    packet.properties = { userProperties: { 'Batch-format': 'v1', 'Batch-size': '1' } }
    expect(decodeBatch(packet, 5)).to.equal(undefined)
    expect(decodeBatch(property('1', '0000'), 4)).to.equal(undefined)
  })
  it('enforces item budgets, framing and ordered offset slices without partial results', () => {
    const payload = encodeBatchPayload([Buffer.from(' A '), Buffer.alloc(0), Buffer.from([0xff])])
    const decoded = decodeBatch(property('3', payload), 5)!
    expect(decoded.items).to.deep.equal([Buffer.from(' A '), Buffer.alloc(0), Buffer.from([0xff])])
    expect(decoded.items![0].buffer).to.equal(payload.buffer)
    expect(decodeBatch(property('3', payload), 5, { maxItemBytes: 2 })?.error).to.equal('BATCH_LIMIT_EXCEEDED')
    expect(() => encodeBatchPayload([Buffer.alloc(65536)], large)).to.throw('BATCH_LIMIT_EXCEEDED')
    expect(() => encodeBatchPayload([], large)).to.throw('INVALID_BATCH_COUNT')
    for (let size = 0; size < 256; size++) {
      const result = decodeBatch(property(String((size % 10) + 1), Buffer.alloc(size, size)), 5)
      if (result?.error) expect(result.items).to.equal(undefined)
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
  each([
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
      expect(generated).to.deep.equal(expected)
      expect(generated).to.have.length(bytes)
      expect(calculatePublishSize(packet, version)).to.equal(bytes)
      const result = decodeBatch(parsed(generated, version), version)
      expect(result?.error).to.equal(error)
      if (error) expect(result?.items).to.equal(undefined)
      else expect(result?.items?.map((x) => x.toString())).to.deep.equal(['Msg1', 'LongerMsg2'])
    },
  )
  it('does not require marker ordering', () => {
    const packet = { ...base5, properties: { userProperties: { 'batch-size': '2', 'batch-format': 'v1' } } }
    expect(decodeBatch(parsed(wire(packet, 5), 5), 5)?.items).to.have.length(2)
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
  each(properties)('includes CLI PUBLISH property fixture %#', (properties) => {
    const packet = { ...property('1', '0000'), properties }
    expect(calculatePublishSize(packet, 5)).to.equal(wire(packet, 5).length)
  })
  each([0, 1, 2])('includes all properties together and QoS %i', (qos) => {
    const merged = Object.assign({}, ...properties.slice(1, 12))
    const packet = { ...property('1', '0000'), qos, properties: merged }
    expect(calculatePublishSize(packet, 5)).to.equal(wire(packet, 5).length)
  })
  each([4, 5])('handles VBI boundaries and actual Topic Alias omission in version %i', (version) => {
    for (const size of [0, 99, 100, 127, 128, 16370, 16384, 2097152]) {
      for (const topic of ['', '测试/topic']) {
        const packet = { topic, payload: Buffer.alloc(size), qos: 1, properties: { topicAlias: 1 } }
        expect(calculatePublishSize(packet, version)).to.equal(wire(packet, version).length)
      }
    }
  })
})

describe('MQTT 5 negotiation', () => {
  it('requires one exact, solicited v1 selection on each connection', () => {
    const offered = { 'batch-publish': 'v1' }
    expect(validateBatchSelection(offered, offered)).to.equal(true)
    for (const value of [undefined, 'unknown', ['v1', 'v1'], ['v1', 'unknown']]) {
      const properties = value === undefined ? undefined : { 'batch-publish': value }
      expect(validateBatchSelection(offered, properties)).to.equal(false)
      expect(validateBatchSelection(properties, offered)).to.equal(false)
    }
    expect(validateBatchSelection(undefined, offered)).to.equal(false)
    expect(validateBatchSelection({ 'Batch-publish': 'v1' }, offered)).to.equal(false)
  })
})
