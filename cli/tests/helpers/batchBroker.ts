/// <reference path="../../src/types/global.d.ts" />
import { ChildProcess, spawn } from 'child_process'
import { createServer, Server, Socket } from 'net'
import { mkdtempSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { generate, parser, Packet, IPublishPacket, IConnackPacket } from 'mqtt-packet'
import { decodeBatch } from '../../src/utils/batchPublishing'
import { PROTOCOL_BATCH_LIMITS } from '../../src/utils/constants'

/** Set up an isolated CLI process and local MQTT broker for each test. */
export const createBatchBroker = () => {
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
  // A shell pipe gives /dev/stdin a FIFO on Linux instead of a socketpair.
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
        if (Date.now() - start > 10000 || child.exitCode !== null || child.signalCode !== null) {
          throw new Error(`Missing ${text}: ${output}`)
        }
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

  return {
    listen,
    write,
    connack,
    launch,
    publish,
    items,
    get directory() {
      return directory
    },
  }
}
