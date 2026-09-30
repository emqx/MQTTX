import { spawn, ChildProcess } from 'child_process'
import { createServer, Socket } from 'net'
import { generate, parser, IConnectPacket, IPublishPacket } from 'mqtt-packet'

const payload = '{"message":"payload-only"}'

// Exercise the real CLI commands against a local MQTT wire-protocol mock.
const runCli = async (
  args: string[],
  responseInformation?: string,
  {
    output = 'text',
    mqttVersion = 5,
    reconnectValues,
  }: { output?: 'text' | 'log'; mqttVersion?: 3 | 4 | 5; reconnectValues?: (string | undefined)[] } = {},
) => {
  const sockets = new Set<Socket>()
  const connects: IConnectPacket[] = []
  const publishes: IPublishPacket[] = []
  const errors: Error[] = []
  const reconnectTimers: NodeJS.Timeout[] = []
  const expectedConnections = reconnectValues?.length || 1
  const server = createServer((socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('error', (error) => errors.push(error))
    const packets = parser({ protocolVersion: mqttVersion })
    packets.on('error', (error) => errors.push(error))
    socket.on('data', (data) => packets.parse(data))
    packets.on('packet', (packet) => {
      if (packet.cmd === 'connect') {
        connects.push(packet)
        const value = reconnectValues ? reconnectValues[connects.length - 1] : responseInformation
        socket.write(
          generate(
            {
              cmd: 'connack',
              sessionPresent: false,
              ...(mqttVersion === 5
                ? { reasonCode: 0, properties: value === undefined ? {} : { responseInformation: value } }
                : { returnCode: 0 }),
            },
            { protocolVersion: mqttVersion },
          ),
        )
        if (connects.length < expectedConnections) {
          reconnectTimers.push(setTimeout(() => socket.destroy(), 50))
        }
      } else if (packet.cmd === 'subscribe') {
        socket.write(
          generate(
            { cmd: 'suback', messageId: packet.messageId, granted: packet.subscriptions.map(() => 0) },
            { protocolVersion: mqttVersion },
          ),
        )
        socket.write(
          generate(
            { cmd: 'publish', topic: 'test/response-information', payload, qos: 0, retain: false, dup: false },
            { protocolVersion: mqttVersion },
          ),
        )
      } else if (packet.cmd === 'publish') {
        publishes.push(packet)
      }
    })
  })

  let child: ChildProcess | undefined
  let timeout: NodeJS.Timeout | undefined
  let stop: NodeJS.Timeout | undefined
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('No local broker port')

    // Set the output mode in memory without editing the user's configuration file.
    const bootstrap = `
      const state = require('./dist/src/state').default;
      state.setConfigs({ output: '${output}', mqtt: { host: 'localhost', port: 1883, protocol: 'mqtt', maxReconnectTimes: 10 } });
      const { Commander } = require('./dist/src');
      const commander = new Commander();
      commander.init();
      commander.program.parse(['node', 'mqttx', ...process.argv.slice(1)]);
    `
    child = spawn(process.execPath, [
      '-e',
      bootstrap,
      ...args,
      '-h',
      '127.0.0.1',
      '-p',
      String(address.port),
      '-V',
      mqttVersion === 5 ? '5.0' : mqttVersion === 4 ? '3.1.1' : '3.1',
      '-rp',
      reconnectValues ? '50' : '0',
    ])
    const running = child
    const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      const stopWhenReady = () => {
        if (stop) return
        const connected = `${stdout}${stderr}`.match(/Connected/g)?.length || 0
        if ((args[0] === 'conn' && connected === expectedConnections) || stdout.includes('payload-only')) {
          stop = setTimeout(() => running.kill(), 50)
        }
      }
      running.stdout!.on('data', (data) => {
        stdout += data.toString()
        stopWhenReady()
      })
      running.stderr!.on('data', (data) => {
        stderr += data.toString()
        stopWhenReady()
      })
      running.once('error', reject)
      running.once('close', (code) => {
        if (code && code !== 0) reject(new Error(`CLI exited with ${code}: ${stderr}`))
        else resolve({ stdout, stderr })
      })
      timeout = setTimeout(() => {
        reject(new Error(`CLI timed out: ${stdout}\n${stderr}`))
        running.kill()
      }, 5000)
      running.stdin!.end(args.includes('--stdin') ? 'stdin payload\n' : undefined)
    })
    expect(errors).toEqual([])
    expect(connects).toHaveLength(expectedConnections)
    return { ...result, connects, publishes }
  } finally {
    if (timeout) clearTimeout(timeout)
    if (stop) clearTimeout(stop)
    reconnectTimers.forEach(clearTimeout)
    child?.kill()
    sockets.forEach((socket) => socket.destroy())
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

describe('CLI Response Information output', () => {
  it.each(
    [
      ['conn'],
      ['pub', '-t', 'test/response-information', '-m', 'payload'],
      ['pub', '-t', 'test/response-information', '--stdin'],
      ['pub', '-t', 'test/response-information', '--stdin', '--multiline'],
      ['sub', '-t', 'test/response-information'],
      ['sub', '-t', 'test/response-information', '--verbose'],
    ].map((args) => ({ args })),
  )('prints only to stderr for $args', async ({ args }) => {
    const result = await runCli([...args, '--req-response-info'], 'responses/client-1')

    expect(result.stderr).toContain('Response Information: "responses/client-1"\n')
    expect(result.stderr.match(/Response Information:/g)).toHaveLength(1)
    expect(result.stdout).not.toContain('Response Information')
    expect(result.stdout).not.toContain('responses/client-1')
    expect(result.connects[0].properties?.requestResponseInformation).toBe(true)
    if (args[0] === 'pub') expect(result.publishes).toHaveLength(1)
    for (const published of result.publishes) {
      expect(published.properties?.responseTopic).toBeUndefined()
    }
  })

  it.each(['text', 'log'] as const)('keeps clean JSON stdout parseable with output=%s', async (output) => {
    const result = await runCli(
      ['sub', '-t', 'test/response-information', '--output-mode', 'clean', '-f', 'json', '--req-response-info'],
      'responses/client-1',
      { output },
    )

    const message = JSON.parse(result.stdout)
    expect(message.topic).toBe('test/response-information')
    expect(JSON.parse(message.payload)).toEqual({ message: 'payload-only' })
    expect(result.stdout).not.toContain('Response Information')
    expect(result.stderr).toBe('Response Information: "responses/client-1"\n')
  })

  it('does not send the diagnostic to Signale stdout with output=log', async () => {
    const result = await runCli(['conn', '--req-response-info'], 'responses/client-1', { output: 'log' })
    expect(result.stderr).toBe('Response Information: "responses/client-1"\n')
    expect(result.stdout).toContain('Connected')
    expect(result.stdout).not.toContain('responses/client-1')
  })

  it.each([undefined, ''])('leaves stderr empty in clean mode without a value (%s)', async (value) => {
    const result = await runCli(
      ['sub', '-t', 'test/response-information', '--output-mode', 'clean', '--req-response-info'],
      value,
    )
    expect(JSON.parse(result.stdout).topic).toBe('test/response-information')
    expect(result.stderr).toBe('')
  })

  it('ignores an unsolicited value', async () => {
    const result = await runCli(['sub', '-t', 'test/response-information', '--output-mode', 'clean'], 'unsolicited')
    expect(result.stderr).toBe('')
    expect(result.connects[0].properties?.requestResponseInformation).toBeUndefined()
  })

  it.each([3, 4] as const)('does not print for MQTT protocol version %s', async (mqttVersion) => {
    const result = await runCli(['conn', '--req-response-info'], undefined, { mqttVersion })
    expect(result.stderr).not.toContain('Response Information')
    expect(result.connects[0].properties?.requestResponseInformation).toBeUndefined()
  })

  it('uses each new CONNACK after reconnect, including a disappearing value', async () => {
    const result = await runCli(['conn', '--req-response-info'], undefined, {
      reconnectValues: ['first', 'second', undefined],
    })
    expect(result.stderr.match(/Response Information:.*\n/g)).toEqual([
      'Response Information: "first"\n',
      'Response Information: "second"\n',
    ])
    expect(result.stdout).not.toContain('Response Information')
    expect(result.connects.every((packet) => packet.properties?.requestResponseInformation)).toBe(true)
  })
})
