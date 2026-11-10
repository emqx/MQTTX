/// <reference path="../../types/global.d.ts" />
import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { generate, parser, Packet, IPublishPacket, IConnackPacket } from 'mqtt-packet'
import { decodeBatch, encodeBatchPayload, PROTOCOL_BATCH_LIMITS } from '../../utils/batchPublishing'

jest.setTimeout(60000)

describe('batch publishing with a local broker', () => {
  const sockets = new Set<Socket>()
  const servers: Server[] = []
  const children: ChildProcess[] = []
  let directory: string
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'mqttx-cli-batch-e2e-'))
  })
  afterEach(async () => {
    for (const child of children.splice(0)) {
      if (child.exitCode === null && child.signalCode === null) {
        const closed = new Promise((resolve) => child.once('close', resolve))
        child.kill()
        await closed
      }
    }
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
    rmSync(directory, { recursive: true, force: true })
  })
  const listen = async (version: number, onPacket: (packet: Packet, socket: Socket) => void) => {
    const server = createServer((socket) => {
      sockets.add(socket)
      socket.on('error', () => {})
      socket.on('close', () => sockets.delete(socket))
      const packets = parser({ protocolVersion: version })
      socket.on('data', (data) => packets.parse(data))
      packets.on('packet', (packet) => onPacket(packet, socket))
    })
    servers.push(server)
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No local broker port')
    return address.port
  }
  const write = (socket: Socket, packet: Packet, version = 5) =>
    socket.write(generate(packet, { protocolVersion: version }))
  const connack = (socket: Socket, version = 5, properties?: IConnackPacket['properties'], sessionPresent = false) =>
    write(socket, { cmd: 'connack', reasonCode: 0, returnCode: 0, sessionPresent, properties }, version)
  const launch = (port: number, args: string[], input?: string) => {
    const cliArgs = ['bin/index.js', ...args, '-h', '127.0.0.1', '-p', String(port)]
    const child = spawn(
      input === undefined ? process.execPath : '/bin/sh',
      input === undefined ? cliArgs : ['-c', 'cat | exec "$0" "$@"', process.execPath, ...cliArgs],
      { env: { ...process.env, HOME: directory, USERPROFILE: directory } },
    )
    children.push(child)
    let output = ''
    let stdout = ''
    child.stdout!.on('data', (data) => {
      output += data
      stdout += data
    })
    child.stderr!.on('data', (data) => {
      output += data
    })
    const closed = new Promise<{ code: number | null; output: string; stdout: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill()
        reject(new Error(`CLI timed out: ${output}`))
      }, 15000)
      child.once('error', reject)
      child.once('close', (code) => {
        clearTimeout(timeout)
        resolve({ code, output, stdout })
      })
    })
    child.stdin!.end(input)
    const until = async (text: string) => {
      const start = Date.now()
      while (!output.includes(text)) {
        if (Date.now() - start > 10000 || child.exitCode !== null || child.signalCode !== null)
          throw new Error(`Missing ${text}: ${output}`)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }
    return { child, closed, until }
  }
  const publish = async (
    args: string[],
    settings: { version?: number; properties?: IConnackPacket['properties']; input?: string } = {},
  ) => {
    const packets: IPublishPacket[] = []
    const offers: unknown[] = []
    const version = settings.version ?? 5
    const port = await listen(version, (packet, socket) => {
      if (packet.cmd === 'connect') {
        offers.push(packet.properties?.userProperties)
        connack(socket, version, settings.properties)
      } else if (packet.cmd === 'publish') {
        packets.push(packet)
        if (packet.qos === 1) write(socket, { cmd: 'puback', messageId: packet.messageId, reasonCode: 0 }, version)
      }
    })
    const result = await launch(
      port,
      ['pub', '-t', 'demo/topic', '-q', '1', '-V', version === 4 ? '3.1.1' : '5', ...args],
      settings.input,
    ).closed
    return { ...result, packets, offers }
  }
  const items = (packet: IPublishPacket, version = 5) =>
    decodeBatch(
      { ...packet, payload: Buffer.isBuffer(packet.payload) ? packet.payload : Buffer.from(packet.payload) },
      version,
      PROTOCOL_BATCH_LIMITS,
    )?.items?.map((item) => item.toString())

  it('does not report success after a negative PUBACK', async () => {
    let publications = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'publish') {
        publications++
        write(socket, { cmd: 'puback', messageId: packet.messageId, reasonCode: 0x83 })
      }
    })
    const result = await launch(port, ['pub', '-b', '-q', '1', '-t', 'demo', '-m', 'test']).closed
    expect(result.code).toBe(1)
    expect(result.output).toContain('Publish error: Implementation specific error')
    expect(result.stdout).not.toContain('Message published')
    expect(result.output).not.toContain('Message published')
    expect(publications).toBe(1)
  })

  it('preserves quotes and backslashes in default output while showing control characters', async () => {
    const messages = ['{"id":"device-001","temp":23.1}', 'a\nb\rc\t\0\u001b', 'C:\\data\\device\\n', 'say "hello"']
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [0] })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: encodeBatchPayload(messages.map((message) => Buffer.from(message))),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': String(messages.length) } },
        })
      }
    })
    const subscriber = launch(port, ['sub', '-b', '-t', 'demo'])
    await subscriber.until('[4]')
    subscriber.child.kill('SIGINT')
    const result = await subscriber.closed
    expect(result.stdout.split(/\r?\n/).filter((line) => /^\[\d+\]/.test(line))).toEqual([
      '[1] {"id":"device-001","temp":23.1}',
      '[2] a\\nb\\rc\\u0009\\u0000\\u001b',
      '[3] C:\\data\\device\\n',
      '[4] say "hello"',
    ])
    const clean = launch(port, ['sub', '-b', '-t', 'demo', '--output-mode', 'clean'])
    await clean.until('"batch":')
    clean.child.kill('SIGINT')
    expect(JSON.parse((await clean.closed).stdout).batch.items).toEqual(messages)
  })

  it('publishes repeated and file items, enforces limits/selection, and preserves ordinary pub', async () => {
    const repeated = await publish(['-b', '-m', ' A ', '-m', '', '-m', 'B', '--batch-max-items', '2'])
    expect(repeated.code).toBe(0)
    expect(repeated.packets.map((packet) => items(packet))).toEqual([[' A ', ''], ['B']])
    const topicCarrier = await publish(['-b', '-m', '41', '-m', '', '-f', 'hex'], { version: 4 })
    expect(topicCarrier.code).toBe(0)
    expect(topicCarrier.packets[0].topic).toBe('$batch/2/demo/topic')
    expect(items(topicCarrier.packets[0], 4)).toEqual(['A', ''])
    const file = join(directory, 'items.txt')
    writeFileSync(file, ' a \r\n\r\nb\r\n')
    const fromFile = await publish(['-b', '--file-read', file])
    expect(items(fromFile.packets[0])).toEqual([' a ', '', 'b'])
    const piped = await publish(['-b', '--file-read', '/dev/stdin'], { input: 'one\n\nthree\n' })
    expect(piped.code).toBe(0)
    expect(items(piped.packets[0])).toEqual(['one', '', 'three'])
    writeFileSync(file, 'a::b::::')
    expect(items((await publish(['-b', '--file-read', file, '--split', '::'])).packets[0])).toEqual(['a', 'b', ''])
    writeFileSync(file, '\n'.repeat(2000))
    const many = await publish(['-b', '--file-read', file, '--batch-max-items', '1', '-q', '0'], { version: 4 })
    expect(many.code).toBe(0)
    expect(many.packets).toHaveLength(2000)
    writeFileSync(file, 'a::b::::')
    const bytes = await publish(['-b', '-m', 'x'.repeat(1022), '-m', '', '--batch-max-bytes', '1024'])
    expect(bytes.code).toBe(0)
    expect(bytes.packets.map((packet) => packet.payload.length)).toEqual([1024, 2])
    const tooBig = await publish(['-b', '-m', 'x'.repeat(1023), '--batch-max-bytes', '1024'])
    expect(tooBig.code).toBe(1)
    expect(tooBig.packets).toHaveLength(0)
    expect(tooBig.output).toContain('Batch input error: item 1')
    expect((await publish(['-m', 'first', '-m', 'last'])).packets.map((packet) => packet.payload.toString())).toEqual([
      'last',
    ])
    expect((await publish(['--file-read', file])).packets[0].payload.toString()).toBe('a::b::::')
    const manual = await publish(['-t', '$batch/1/demo', '-m', '000141', '-f', 'hex'])
    expect(manual.code).toBe(0)
    expect(manual.packets[0].payload).toEqual(Buffer.from('000141', 'hex'))
    const selected = await publish(['-b', '-m', 'x', '--batch-negotiate'], {
      properties: { userProperties: { 'batch-publish': 'v1' } },
    })
    expect(selected.code).toBe(0)
    expect(selected.offers).toEqual([{ 'batch-publish': 'v1' }])
    for (const selection of [undefined, 'unknown', ['v1', 'v1'], ['v1', 'unknown']]) {
      const declined = await publish(['-b', '--batch-negotiate'], {
        properties: selection === undefined ? undefined : { userProperties: { 'batch-publish': selection } },
      })
      expect(declined.code).toBe(1)
      expect(declined.packets).toHaveLength(0)
      expect(declined.output).toContain('Batch negotiation failed:')
    }
    const size = generate(selected.packets[0], { protocolVersion: 5 }).length
    expect((await publish(['-b', '-m', 'x'], { properties: { maximumPacketSize: size } })).code).toBe(0)
    const over = await publish(['-b', '-m', 'x'], { properties: { maximumPacketSize: size - 1 } })
    expect(over.code).toBe(1)
    expect(over.packets).toHaveLength(0)
    expect(over.output).toContain('Batch packet too large:')
    const prefix = await publish(['-b', '-t', '$batch/2/demo/topic'])
    expect(prefix.code).toBe(1)
    expect(prefix.output).toContain('Try: -t demo/topic')
    expect(prefix.offers).toHaveLength(0)
    const stdinConflict = await publish(['-b', '-s', '-M'])
    expect(stdinConflict.code).toBe(1)
    expect(stdinConflict.output).toContain('-b reads items from -m or --file-read (one per line).')
    let connects = 0
    let resumedPublications = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') {
        connects++
        connack(socket, 5, connects === 1 ? { userProperties: { 'batch-publish': 'v1' } } : undefined, connects > 1)
      } else if (packet.cmd === 'publish') {
        resumedPublications++
        socket.destroy()
      }
    })
    const resumed = await launch(port, [
      'pub',
      '-b',
      '--batch-negotiate',
      '--no-clean',
      '-rp',
      '10',
      '-t',
      'demo',
      '-q',
      '1',
      '-m',
      'x',
    ]).closed
    expect(resumed.code).toBe(1)
    expect(resumed.output).toContain('Batch session resume failed: v1 capability was not reselected.')
    expect(connects).toBe(2)
    expect(resumedPublications).toBe(1)
  })

  it('decodes sub atomically, preserves raw envelope files, and keeps MQTT acknowledgements', async () => {
    const payload = encodeBatchPayload([Buffer.from('first'), Buffer.alloc(0), Buffer.from('last')])
    const valid = (topic: string, messageId: number): IPublishPacket => ({
      cmd: 'publish',
      topic,
      qos: 1,
      retain: false,
      dup: false,
      messageId,
      payload,
      properties: topic.startsWith('$batch/')
        ? undefined
        : { userProperties: { 'batch-format': 'v1', 'batch-size': '3' } },
    })
    let acknowledgements = 0
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [1] })
        write(socket, {
          ...valid('demo', 1),
          payload: Buffer.from('000166000267', 'hex'),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': '2' } },
        })
        write(socket, valid('demo', 2))
        write(socket, valid('$batch/3/demo', 3))
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 1,
          dup: false,
          retain: false,
          messageId: 4,
          payload: Buffer.from('after-batch'),
        })
      }
      if (packet.cmd === 'puback') acknowledgements++
    })
    const file = join(directory, 'items.out')
    const sub = launch(port, [
      'sub',
      '-b',
      '-t',
      'demo',
      '--output-mode',
      'clean',
      '--file-write',
      file,
      '--delimiter',
      '|',
    ])
    await sub.until('after-batch')
    sub.child.kill('SIGINT')
    const result = await sub.closed
    const outputs = JSON.parse(`[${result.stdout.trim().replace(/}\s*{/g, '},{')}]`)
    expect(outputs).toHaveLength(4)
    expect(outputs[0].batch.error).toBe('TRUNCATED_ITEM')
    expect(outputs[0].batch.items).toBeUndefined()
    expect(outputs[1].batch).toMatchObject({
      carrier: 'property',
      logicalTopic: 'demo',
      count: 3,
      items: ['first', '', 'last'],
    })
    expect(outputs[2].batch).toMatchObject({
      carrier: 'topic',
      logicalTopic: 'demo',
      count: 3,
      items: ['first', '', 'last'],
    })
    expect(outputs[3].batch).toBeUndefined()
    expect(readFileSync(file, 'utf8')).toBe('first||last|first||last|after-batch|')
    expect(acknowledgements).toBe(4)
    const saved = join(directory, 'envelope.bin')
    const saveSub = launch(port, ['sub', '-b', '-t', 'demo', '--file-save', saved])
    await saveSub.until('after-batch')
    saveSub.child.kill('SIGINT')
    await saveSub.closed
    expect(readFileSync(saved)).toEqual(Buffer.from('000166000267', 'hex'))
    expect(readFileSync(join(directory, 'envelope(1).bin'))).toEqual(payload)
    expect(readFileSync(join(directory, 'envelope(2).bin'))).toEqual(payload)
    const plainSub = launch(port, ['sub', '-t', 'demo', '--output-mode', 'clean'])
    await plainSub.until('after-batch')
    plainSub.child.kill('SIGINT')
    expect((await plainSub.closed).stdout).not.toContain('"batch":')
    const warningPort = await listen(4, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket, 4)
      if (packet.cmd === 'subscribe')
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: packet.subscriptions.map(() => 1) }, 4)
    })
    const warned = launch(warningPort, ['sub', '-V', '3.1.1', '-b', '-t', 'demo', 'other'])
    await warned.until('Subscribed to other')
    warned.child.kill('SIGINT')
    expect((await warned.closed).output.match(/Note: MQTT 3.1.1 batches arrive/g)).toHaveLength(1)
  })

  it('bench counts packets for -L, successful items and failed batch packets separately', async () => {
    const publications: IPublishPacket[] = []
    const port = await listen(5, (packet, socket) => {
      if (packet.cmd === 'connect') connack(socket)
      if (packet.cmd === 'publish') {
        publications.push(packet)
        write(socket, { cmd: 'puback', messageId: packet.messageId, reasonCode: publications.length === 2 ? 0x83 : 0 })
      }
      if (packet.cmd === 'subscribe') {
        write(socket, { cmd: 'suback', messageId: packet.messageId, granted: [1] })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: publications[0].payload,
          properties: publications[0].properties,
        })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: Buffer.from('0002ff', 'hex'),
          properties: { userProperties: { 'batch-format': 'v1', 'batch-size': '1' } },
        })
        write(socket, {
          cmd: 'publish',
          topic: 'demo',
          qos: 0,
          retain: false,
          dup: false,
          payload: Buffer.from('ordinary'),
        })
      }
    })
    const published = await launch(port, [
      'bench',
      'pub',
      '-b',
      '-bi',
      '101',
      '-S',
      '1KB',
      '-c',
      '1',
      '-im',
      '1',
      '-L',
      '3',
      '-q',
      '1',
      '-t',
      'demo',
      '-v',
    ]).closed
    expect(published.code).toBe(1)
    expect(publications).toHaveLength(3)
    expect(publications[0].payload.length).toBeGreaterThan(65536)
    expect(items(publications[0])).toHaveLength(101)
    expect(items(publications[0])![0]).toBe(items(publications[0])![100])
    expect(published.output).toContain('Published total: 202 items (2 packets), failed: 1 packets')
    const standaloneItems = await launch(port, ['bench', 'pub', '-bi', '2', '-c', '1', '-L', '1', '-t', 'demo']).closed
    expect(standaloneItems.code).toBe(1)
    expect(standaloneItems.output).toContain('Error: -bi requires -b.')
    expect(publications).toHaveLength(3)
    const defaults = await launch(port, [
      'bench',
      'pub',
      '-b',
      '-c',
      '1',
      '-im',
      '1',
      '-L',
      '1',
      '-q',
      '1',
      '-t',
      'demo',
      '-m',
      'template',
    ]).closed
    expect(defaults.code).toBe(0)
    expect(publications).toHaveLength(4)
    expect(items(publications[3])).toEqual(Array(100).fill('template'))
    expect(defaults.output).toContain('Published total: 100 items (1 packets), failed: 0 packets')
    const subscribed = launch(port, ['bench', 'sub', '-b', '-c', '1', '-t', 'demo', '-v'])
    await subscribed.until('Received total: 101 items (1 batch packets), failed: 1 packets, ordinary: 1 packets')
    subscribed.child.kill('SIGINT')
    const result = await subscribed.closed
    expect(result.code).toBe(130)
    expect(result.output).toContain('Received total: 101 items')
  })
})
