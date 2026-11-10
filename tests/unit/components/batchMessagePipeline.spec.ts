import { expect } from 'chai'
import { EventEmitter } from 'events'
import { encodeBatchPayload, decodeBatch } from '@/utils/batchPublishing'
import { getBatchNegotiationStatus } from '@/utils/batchPayload'
import { tearDownMessagePipeline } from '@/utils/connectionMessagePipeline'
import store from '@/store'

if (typeof document.queryCommandSupported !== 'function') (document as any).queryCommandSupported = () => false
const ConnectionsDetail = require('@/views/connections/ConnectionsDetail.vue').default
const methods = (ConnectionsDetail as any).options.methods
const packet = (items = [Buffer.from('first'), Buffer.from('second')]) => ({
  topic: 'demo',
  payload: encodeBatchPayload(items),
  qos: 1,
  retain: false,
  properties: { userProperties: { 'batch-format': 'v1', 'batch-size': String(items.length) } },
})
const receiveContext = () => {
  const context: any = {
    ...methods,
    record: { mqttVersion: '5.0' },
    receivedMsgType: 'Plaintext',
    batchMaxItems: 100,
    batchMaxBytes: 65536,
    maxPayloadDisplaySize: 7,
    batchStorageMode: 'full',
    decompressGzip: true,
    scriptOption: { apply: 'all', function: {}, schema: {} },
    convertPayloadBySchema: () => {
      throw new Error('Batch must bypass Schema')
    },
    convertPayloadByFunction: () => {
      throw new Error('Batch must bypass scripts')
    },
  }
  context.convertPayloadByType = methods.convertPayloadByType.bind(context)
  context.processReceivedMessage = methods.processReceivedMessage.bind(context)
  return context
}

describe('Desktop batch message pipeline', () => {
  it('stores one incoming PUBLISH as one converted item array before Schema, script or gzip', () => {
    const context = receiveContext()
    const incoming = packet([Buffer.from(' A '), Buffer.alloc(0), Buffer.from([255])])
    const message = context.processReceivedMessage(incoming.topic, incoming.payload, incoming)
    expect(JSON.parse(message.payload)).to.deep.equal([' A ', '', { b64: '/w==' }])
    expect(JSON.parse(message.meta)).to.deep.equal({
      batch: { carrier: 'property', logicalTopic: 'demo', count: 3 },
      payloadBytes: 10,
      msgType: 'Plaintext',
    })
    context.receivedMsgType = 'Hex'
    expect(
      JSON.parse(context.processReceivedMessage(incoming.topic, incoming.payload, incoming).payload),
    ).to.deep.equal(['2041 20', '', 'ff'])
  })

  it('identifies topic carrier first using the delivering client version', () => {
    const context = receiveContext()
    const incoming = { ...packet(), topic: '$batch/2/demo', properties: undefined }
    const message = context.processReceivedMessage(incoming.topic, incoming.payload, incoming, 4)
    expect(JSON.parse(message.meta).batch).to.deep.equal({ carrier: 'topic', logicalTopic: 'demo', count: 2 })
    const conflict = { ...incoming, properties: packet().properties }
    expect(
      JSON.parse(context.processReceivedMessage(conflict.topic, conflict.payload, conflict, 5).meta).batch.error,
    ).to.equal('INVALID_BATCH_METADATA')
  })

  it('validates all frames before saving a summary and rejects a malformed unsaved item', () => {
    const context = receiveContext()
    context.batchStorageMode = 'summary'
    const incoming = packet(Array.from({ length: 21 }, () => Buffer.from('x'.repeat(40))))
    const good = context.processReceivedMessage(incoming.topic, incoming.payload, incoming)
    expect(JSON.parse(good.payload)).to.have.length(20)
    expect(JSON.parse(good.payload)[0]).to.equal('x'.repeat(32) + '…')
    expect(JSON.parse(good.meta).batch).to.deep.equal({
      carrier: 'property',
      logicalTopic: 'demo',
      count: 21,
      summary: true,
    })
    incoming.payload = incoming.payload.subarray(0, incoming.payload.length - 1)
    const bad = context.processReceivedMessage(incoming.topic, incoming.payload, incoming)
    expect(JSON.parse(bad.meta).batch).to.deep.equal({
      carrier: 'property',
      logicalTopic: 'demo',
      count: 21,
      error: 'TRUNCATED_ITEM',
    })
    expect(bad.payload).to.equal(incoming.payload.subarray(0, 3).toString('hex'))
  })

  it('enforces hard limits before item conversion and stores only the bounded hex preview', () => {
    const context = receiveContext()
    context.batchMaxItems = 1
    context.convertPayloadByType = () => {
      throw new Error('Must not parse items')
    }
    const incoming = packet()
    const message = context.processReceivedMessage(incoming.topic, incoming.payload, incoming)
    expect(JSON.parse(message.meta).batch.error).to.equal('BATCH_LIMIT_EXCEEDED')
    expect(message.payload).to.equal('000566')
  })

  it('buffers one row per PUBLISH and preserves ignoreQoS0Message', async () => {
    const context = receiveContext()
    const client: any = new EventEmitter()
    client.options = { protocolVersion: 5 }
    const saved: MessageModel[][] = []
    const rendered: MessageModel[] = []
    context.saveMessage = (_: string, messages: MessageModel[]) => saved.push(messages)
    context.printMessageLog = () => undefined
    context.renderMessage = (_: string, message: MessageModel) => rendered.push(message)
    context.$log = { info: () => undefined }
    const original = store.getters.ignoreQoS0Message
    store.getters.ignoreQoS0Message = true
    try {
      methods.onMessageArrived.call(context, client, 'c1')
      const incoming = packet()
      client.emit('message', incoming.topic, incoming.payload, { ...incoming, qos: 0 })
      client.emit('message', incoming.topic, incoming.payload, incoming)
      await new Promise((resolve) => setTimeout(resolve, 1100))
      expect(saved).to.have.length(1)
      expect(saved[0]).to.have.length(1)
      expect(JSON.parse(saved[0][0].payload)).to.deep.equal(['first', 'second'])
      expect(rendered).to.have.length(2)
    } finally {
      tearDownMessagePipeline(client)
      store.getters.ignoreQoS0Message = original
    }
  })

  it('awaits ordinary history before scripts and conversion, even when conversion fails', async () => {
    const events: string[] = []
    const history: any[] = []
    let releaseHistory!: () => void
    const context = {
      ...methods,
      record: { id: 'c1' },
      insertHistory: (...args: any[]) => {
        events.push('history')
        history.push(args)
        return new Promise<void>((resolve) => {
          releaseHistory = resolve
        })
      },
      convertPayloadByFunction: (value: string) => {
        events.push('script')
        return value + ' converted'
      },
      handlePayloadBySchemaOrType: (value: string) => {
        events.push('conversion')
        expect(value).to.equal('raw converted')
        return undefined
      },
      client: {
        publish: () => {
          throw new Error('Invalid payload must not be sent')
        },
      },
    }
    const result: Error[] = []
    const pending = methods.publishMessage.call(
      context,
      { topic: 'ordinary', payload: 'raw', qos: 1, retain: false, batch: false },
      'JSON',
      undefined,
      (error: Error) => result.push(error),
    )
    expect(events).to.deep.equal(['history'])
    releaseHistory()
    expect(await pending).to.equal(false)
    expect(events).to.deep.equal(['history', 'script', 'conversion'])
    expect(history[0][0]).to.deep.equal({ payload: 'raw', payloadType: 'JSON', connectionId: 'c1' })
    expect(history[0][1]).to.deep.equal({ topic: 'ordinary', qos: 1, retain: false, batch: false, connectionId: 'c1' })
    expect(result[0].message).to.equal('The payload could not be converted to JSON')
  })

  it('records history before batch validation and reports localized publish errors', async () => {
    const errors: string[] = []
    const events: string[] = []
    const context: any = {
      ...methods,
      record: { id: 'c1', mqttVersion: '5.0' },
      batchMaxItems: 100,
      batchMaxBytes: 65536,
      insertHistory: async (_: any, header: any) => {
        expect(header.batch).to.equal(true)
        events.push('history')
      },
      handleErrorOnPublish: (error: Error) => {
        events.push('error')
        errors.push(error.message)
      },
      $t: (key: string, values: any) => `${key} ${JSON.stringify(values)}`,
      processProperties: methods.processProperties,
      filterNonNullEntries: methods.filterNonNullEntries,
      client: {
        publish: () => {
          throw new Error('Invalid batch must not be sent')
        },
      },
    }
    for (const [override, reason] of [
      [{ payload: '\n'.repeat(120) }, 'connections.batchItemsLimit {"count":120,"max":100}'],
      [{ payload: 'x'.repeat(69998) }, 'connections.batchBytesLimit {"bytes":70000,"max":65536}'],
      [{ topic: 'a+b' }, 'connections.batchInvalidTopic'],
      [{ properties: { userProperties: { 'batch-format': 'v1' } } }, 'connections.batchMarkerConflict'],
      [{ properties: { payloadFormatIndicator: true } }, 'connections.batchInvalidMetadata'],
      [{ qos: 2 }, 'connections.batchUnsupportedQos'],
    ] as any[]) {
      events.length = 0
      expect(
        await methods.publishMessage.call(
          context,
          { topic: 'demo', payload: 'valid', qos: 1, retain: false, batch: true, ...override },
          'Plaintext',
        ),
      ).to.equal(false)
      expect(events).to.deep.equal(['history', 'error'])
      expect(errors[errors.length - 1]).to.include(reason)
    }
  })

  it('sends framed bytes and keeps editor text and batch flag in history and the outgoing bubble', async () => {
    const history: any[] = []
    const sent: any[] = []
    const bubbles: any[] = []
    const context: any = {
      ...methods,
      record: { id: 'c1', mqttVersion: '3.1.1' },
      batchMaxItems: 100,
      batchMaxBytes: 65536,
      insertHistory: async (...args: any[]) => history.push(args),
      handleSuccessfulPublish: async (...args: any[]) => bubbles.push(args),
      convertPayloadByFunction: () => {
        throw new Error('Must skip scripts')
      },
      handlePayloadBySchemaOrType: () => {
        throw new Error('Must skip Schema')
      },
      client: {
        publish: (topic: string, payload: Buffer, options: any, done: (error?: Error) => void) => {
          sent.push({ topic, payload, ...options })
          done()
        },
      },
    }
    const message = {
      ...packet(),
      id: 'out',
      payload: 'first\nsecond\n',
      out: true,
      batch: true,
      properties: undefined,
    }
    expect(await methods.publishMessage.call(context, message, 'Plaintext')).to.equal(true)
    expect(sent).to.have.length(1)
    expect(sent[0].topic).to.equal('$batch/2/demo')
    expect(decodeBatch(sent[0], 4)?.items?.map((item) => item.toString())).to.deep.equal(['first', 'second'])
    expect(history[0][0].payload).to.equal(message.payload)
    expect(history[0][1]).to.include({ batch: true, topic: 'demo' })
    expect(bubbles[0][1]).to.equal(message.payload)
    expect(JSON.parse(bubbles[0][0].meta).batch.count).to.equal(2)
  })

  it('revalidates each timer iteration and stops on a newly reduced broker limit', async () => {
    const originalInterval = window.setInterval
    let tick!: () => Promise<void>
    let stops = 0
    let sends = 0
    const errors: string[] = []
    const context: any = {
      ...methods,
      record: { id: 'c1', mqttVersion: '5.0' },
      batchMaxItems: 100,
      batchMaxBytes: 65536,
      insertHistory: async () => undefined,
      sendTimedMessageCount: 0,
      stopTimedSend: () => {
        stops++
        context.sendTimeId = null
      },
      notifyMsgWithAgent: (message: string) => errors.push(message),
      $t: (key: string) => key,
      $log: { error: () => undefined },
      client: { publish: () => sends++ },
    }
    context.handleErrorOnPublish = methods.handleErrorOnPublish.bind(context)
    context.publishMessage = methods.publishMessage.bind(context)
    window.setInterval = ((callback: any) => {
      tick = callback
      return 1
    }) as any
    try {
      methods.timedSendMessage.call(
        context,
        1,
        { ...packet(), batch: true, payload: 'one\ntwo', properties: undefined },
        'Plaintext',
      )
      await tick()
      expect(sends).to.equal(1)
      context.brokerMaximumPacketSize = 1
      await tick()
      expect(sends).to.equal(1)
      expect(stops).to.equal(2)
      expect(errors[0]).to.include('connections.batchPacketTooLarge')
    } finally {
      window.setInterval = originalInterval
    }
  })

  it('shows negotiation and the broker limit from each successful CONNACK', () => {
    let saved: any
    const context: any = {
      changeActiveConnection: (value: any) => (saved = value),
      $notify: () => undefined,
      $tc: (key: string) => key,
      setShowClientInfo: () => undefined,
      $emit: () => undefined,
      $log: { info: () => undefined },
      record: {},
    }
    const selection = { 'batch-publish': 'v1' }
    for (const [offer, response, state] of [
      [undefined, undefined, 'batchNotRequested'],
      [selection, selection, 'batchSelected'],
      [selection, undefined, 'batchNotSelected'],
      [selection, { 'batch-publish': ['v1', 'v1'] }, 'batchNotSelected'],
      [undefined, selection, 'batchNotRequested'],
    ] as any[]) {
      methods.onConnect.call(
        context,
        { properties: { userProperties: response, maximumPacketSize: 123 } },
        { id: 'c1', mqttVersion: '5.0', client: { options: { properties: { userProperties: offer } } } },
      )
      expect(saved).to.include({
        batchRequested: offer !== undefined,
        batchSelected: state === 'batchSelected',
        maximumPacketSize: 123,
      })
      expect(getBatchNegotiationStatus('5.0', saved.batchRequested, saved.batchSelected)).to.equal(state)
    }
    methods.onConnect.call(context, {}, { id: 'c1', mqttVersion: '3.1.1', client: { options: {} } })
    expect(saved).to.include({ batchRequested: false, batchSelected: false, maximumPacketSize: undefined })
    expect(getBatchNegotiationStatus('3.1.1', saved.batchRequested, saved.batchSelected)).to.equal('batchNotApplicable')
  })

  it('logs count, bytes and error without batch item content', () => {
    const logs: string[] = []
    methods.printMessageLog.call({ $log: { info: (line: string) => logs.push(line) } }, 'c1', {
      payload: 'secret item',
      meta: JSON.stringify({ batch: { count: 2, error: 'TRUNCATED_ITEM' }, payloadBytes: 18 }),
    })
    expect(logs[0]).to.include('count=2').and.include('bytes=18').and.include('TRUNCATED_ITEM')
    expect(logs[0]).not.to.include('secret')
  })
})
