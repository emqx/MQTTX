import { expect } from 'chai'
import {
  batchHexPreview,
  formatBatchPublishError,
  inspectBatchLines,
  prepareBatchPublish,
  splitBatchLines,
  storeBatchItems,
  validBatchMaxBytes,
  validBatchMaxItems,
} from '@/utils/batchPayload'
import { DEFAULT_BATCH_LIMITS, decodeBatch, calculatePublishSize } from '@/utils/batchPublishing'
import connections from '@/lang/connections'

const text = (item: Buffer) => item.toString()
const message = { topic: 'demo/topic', qos: 1, retain: false, payload: 'Msg1\nLongerMsg2' }

describe('Desktop batch input', () => {
  for (const [input, expected] of [
    ['', []],
    ['a\r\n\r\nb\r\n', ['a', '', 'b']],
    ['\n', ['']],
    ['\n\n', ['', '']],
    [' a \n b', [' a ', ' b']],
    ['a\n\n', ['a', '']],
    ['a\rb', ['a\rb']],
  ] as [string, string[]][]) {
    it(`splits ${JSON.stringify(input)} with CLI newline semantics`, () =>
      expect(splitBatchLines(input)).to.deep.equal(expected))
  }
  it('encodes each line independently and includes all length prefixes', () => {
    const input = inspectBatchLines('41 42\r\n\r\nff\r\n', 'Hex')
    expect(input.count).to.equal(3)
    expect(input.bytes).to.equal(9)
    expect(input.items).to.deep.equal([Buffer.from('AB'), Buffer.alloc(0), Buffer.from([255])])
    expect(inspectBatchLines('QQ==\nQg==', 'Base64').items).to.deep.equal([Buffer.from('A'), Buffer.from('B')])
    expect(inspectBatchLines('{"a":1}\n\nfalse', 'JSON').items?.map(text)).to.deep.equal(['{"a":1}', '', 'false'])
  })
  it('rejects bad hex, base64 and JSON at their line, with no partial item result', () => {
    for (const [payload, type] of [
      ['41\n4', 'Hex'],
      ['QQ==\n@@==', 'Base64'],
      ['{}\n{', 'JSON'],
    ] as [string, PayloadType][]) {
      const result = inspectBatchLines(payload, type)
      expect(result.line).to.equal(2)
      expect(result.error).to.be.a('string')
      expect(result.items).to.equal(undefined)
    }
  })
  it('builds property and topic carriers without changing editor text', () => {
    for (const version of [4, 5]) {
      const prepared = prepareBatchPublish(message, 'Plaintext', version, undefined, DEFAULT_BATCH_LIMITS)
      expect(prepared.error).to.equal(undefined)
      expect(prepared.bytes).to.equal(18)
      expect(decodeBatch(prepared.packet!, version)?.items?.map(text)).to.deep.equal(['Msg1', 'LongerMsg2'])
      expect(prepared.packet?.topic).to.equal(version === 5 ? 'demo/topic' : '$batch/2/demo/topic')
      expect(message.payload).to.equal('Msg1\nLongerMsg2')
    }
  })
  it('rejects protocol, topic, metadata and local-budget conflicts', () => {
    for (const [override, version, props, limits, error] of [
      [{}, 3, undefined, DEFAULT_BATCH_LIMITS, 'BATCH_MQTT_VERSION'],
      [{ qos: 2 }, 5, undefined, DEFAULT_BATCH_LIMITS, 'UNSUPPORTED_BATCH_QOS'],
      [{ topic: '$batch/2/demo' }, 5, undefined, DEFAULT_BATCH_LIMITS, 'BATCH_LOGICAL_TOPIC'],
      [{ topic: 'a+b' }, 5, undefined, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_TOPIC'],
      [{ topic: '' }, 5, undefined, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_TOPIC'],
      [{ retain: true }, 4, undefined, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_METADATA'],
      [{}, 5, { payloadFormatIndicator: true }, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_METADATA'],
      [{}, 5, { userProperties: { 'batch-format': 'v1' } }, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_MARKERS'],
      [{}, 5, { userProperties: { 'batch-size': ['2'] } }, DEFAULT_BATCH_LIMITS, 'INVALID_BATCH_MARKERS'],
      [{}, 5, undefined, { maxItems: 1 }, 'BATCH_LIMIT_EXCEEDED'],
      [{}, 5, undefined, { maxBytes: 17 }, 'BATCH_LIMIT_EXCEEDED'],
    ] as any[])
      expect(prepareBatchPublish({ ...message, ...override }, 'Plaintext', version, props, limits).error).to.equal(
        error,
      )
  })
  it('compares the complete packet against the broker limit, including VBI and properties', () => {
    const prepared = prepareBatchPublish(
      message,
      'Plaintext',
      5,
      { userProperties: { x: 'y'.repeat(128) } },
      DEFAULT_BATCH_LIMITS,
    )
    const size = calculatePublishSize(prepared.packet!, 5)
    expect(
      prepareBatchPublish(
        message,
        'Plaintext',
        5,
        prepared.packet?.properties && { userProperties: { x: 'y'.repeat(128) } },
        DEFAULT_BATCH_LIMITS,
        size,
      ).packet,
    ).to.not.equal(undefined)
    expect(
      prepareBatchPublish(
        message,
        'Plaintext',
        5,
        { userProperties: { x: 'y'.repeat(128) } },
        DEFAULT_BATCH_LIMITS,
        size - 1,
      ).error,
    ).to.equal('BATCH_PACKET_TOO_LARGE')
  })
})

describe('Desktop batch storage bounds', () => {
  it('keeps invalid UTF-8 in a lossless b64 object only for Plaintext', () => {
    const item = Buffer.from([0xff, 0x00, 0xc0, 0x80])
    expect(storeBatchItems([item], 'full', 'Plaintext', text)).to.deep.equal([{ b64: item.toString('base64') }])
    expect(storeBatchItems([Buffer.from('�')], 'full', 'Plaintext', text)).to.deep.equal(['�'])
    expect(storeBatchItems([item], 'full', 'Hex', (b) => b.toString('hex'))).to.deep.equal(['ff00c080'])
  })
  it('keeps at most 20 items and truncates UTF-8 on a complete character within 32 raw bytes', () => {
    const items = Array.from({ length: 25 }, () => Buffer.from('a'.repeat(31) + '中tail'))
    const saved = storeBatchItems(items, 'summary', 'Plaintext', text)
    expect(saved).to.have.length(20)
    expect(saved[0]).to.equal('a'.repeat(31) + '…')
    expect(storeBatchItems([Buffer.from('é'.repeat(16))], 'summary', 'Plaintext', text)).to.deep.equal(['é'.repeat(16)])
    const binary = Buffer.alloc(40, 255)
    expect(storeBatchItems([binary], 'summary', 'Plaintext', text)).to.deep.equal([
      { b64: Buffer.alloc(32, 255).toString('base64') },
    ])
    expect(storeBatchItems([binary], 'summary', 'Hex', (b) => b.toString('hex'))).to.deep.equal(['ff'.repeat(32) + '…'])
  })
  it('only converts the saved prefix and does not expose the tail in summary mode', () => {
    const converted: Buffer[] = []
    const saved = storeBatchItems([Buffer.from('{"message":"' + 'x'.repeat(60) + '"}')], 'summary', 'JSON', (item) => {
      converted.push(item)
      return JSON.stringify(JSON.parse(item.toString()))
    })
    expect(converted[0].length).to.equal(32)
    expect(saved[0]).to.equal('{"message":"' + 'x'.repeat(20) + '…')
  })
  it('cuts the raw Buffer before making a bounded hex preview', () => {
    expect(batchHexPreview(Buffer.alloc(1000000, 255), 7)).to.equal('ffffff')
    expect(batchHexPreview(Buffer.from([1]), 10)).to.equal('01')
    expect(batchHexPreview(Buffer.alloc(4), 0)).to.equal('')
  })
  it('accepts only finite integer settings in the specified ranges', () => {
    for (const value of [1, 100, 65535]) expect(validBatchMaxItems(value)).to.equal(true)
    for (const value of [0, 65536, 1.5, NaN, Infinity, '100', undefined])
      expect(validBatchMaxItems(value)).to.equal(false)
    for (const value of [1024, 65536, 1048576]) expect(validBatchMaxBytes(value)).to.equal(true)
    for (const value of [1023, 1048577, 1024.5, NaN, Infinity, null]) expect(validBatchMaxBytes(value)).to.equal(false)
  })
})

describe('Localized batch publish diagnostics', () => {
  const translate =
    (lang: Language) =>
    (key: string, values: Record<string, number | undefined> = {}) => {
      const text = connections[key.replace('connections.', '') as keyof typeof connections][lang]
      return text.replace(/\{(\w+)\}/g, (_, name) => String(values[name]))
    }
  it('identifies count, framed payload bytes and the per-item byte ceiling', () => {
    const cases = [
      [{ ...message, payload: '\n'.repeat(120) }, DEFAULT_BATCH_LIMITS, '超出上限：120 条 > 100'],
      [{ ...message, payload: 'x'.repeat(69998) }, DEFAULT_BATCH_LIMITS, '超出上限：70000 B > 65536 B'],
      [
        { ...message, payload: 'x'.repeat(65536) },
        { maxItems: 100, maxBytes: 1048576 },
        '第 1 条超出上限：65536 B > 65535 B',
      ],
    ] as const
    for (const [input, limits, expected] of cases) {
      const prepared = prepareBatchPublish(input, 'Plaintext', 5, undefined, limits)
      expect(prepared.error).to.equal('BATCH_LIMIT_EXCEEDED')
      expect(formatBatchPublishError(prepared, limits, undefined, translate('zh'))).to.equal(expected)
    }
  })
  for (const lang of ['zh', 'en', 'tr', 'ja', 'hu', 'ko'] as Language[]) {
    it(`localizes each publish reason in ${lang} without changing its protocol code`, () => {
      for (const error of [
        'INVALID_BATCH_TOPIC',
        'INVALID_BATCH_MARKERS',
        'INVALID_BATCH_METADATA',
        'UNSUPPORTED_BATCH_QOS',
        'BATCH_LIMIT_EXCEEDED',
      ]) {
        const input = { error, count: 120, bytes: 240 }
        const reason = formatBatchPublishError(input, DEFAULT_BATCH_LIMITS, undefined, translate(lang))
        expect(reason).to.be.a('string').and.not.equal('')
        expect(reason).not.to.include(error).and.not.to.include('connections.').and.not.to.include('{')
        if (error === 'BATCH_LIMIT_EXCEEDED') expect(reason).to.include('120').and.include('100')
        expect(input.error).to.equal(error)
      }
    })
  }
})
