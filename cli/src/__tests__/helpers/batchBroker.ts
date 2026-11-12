/// <reference path="../../types/global.d.ts" />
import { createServer, Server, Socket } from 'net'
import { generate, parser, Packet, IPublishPacket, IConnackPacket } from 'mqtt-packet'
import { createCli } from './cli'
import { decodeBatch, encodeBatchPayload } from '../../utils/batchPublishing'
import { PROTOCOL_BATCH_LIMITS } from '../../utils/constants'

export const createBatchBroker = () => {
  const sockets = new Set<Socket>()
  const servers: Server[] = []
  const cli = createCli()

  afterEach(async () => {
    sockets.forEach((socket) => socket.destroy())
    sockets.clear()
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
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
  const launch = (port: number, args: string[], input?: string) =>
    cli.launch([...args, '-h', '127.0.0.1', '-p', String(port)], { input })

  const publication = (
    topic: string,
    message: string | Buffer | Buffer[],
    options: Partial<Pick<IPublishPacket, 'qos' | 'messageId' | 'properties'>> & { count?: number } = {},
  ): IPublishPacket => {
    let payload: string | Buffer = ''
    let count = options.count
    if (Array.isArray(message)) {
      payload = encodeBatchPayload(message, PROTOCOL_BATCH_LIMITS)
      count = message.length
    } else {
      payload = message
    }
    let properties = options.properties
    if (count !== undefined && !topic.startsWith('$batch/')) {
      properties = {
        ...properties,
        userProperties: { ...properties?.userProperties, 'batch-format': 'v1', 'batch-size': String(count) },
      }
    }
    return {
      cmd: 'publish',
      topic,
      payload,
      qos: options.qos ?? 0,
      messageId: options.messageId,
      retain: false,
      dup: false,
      properties,
    }
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
    publication,
    stop: cli.stop,
    get directory() {
      return cli.directory
    },
  }
}
