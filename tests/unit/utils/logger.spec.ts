import '../mocks/browserStorage'
import { expect } from 'chai'
import fs from 'fs-extra'
import path from 'path'
import { watchFileAppender } from '@/utils/logger'
import Logs from '@/views/log/index.vue'

type Listener = (curr: fs.Stats, prev: fs.Stats) => void

describe('Log file watcher lifecycle', () => {
  const original = {
    open: fs.open,
    read: fs.read,
    close: fs.close,
    watchFile: fs.watchFile,
    unwatchFile: fs.unwatchFile,
    pathExistsSync: fs.pathExistsSync,
  }
  let directory: string
  let filename: string
  let completeOpen: (error?: NodeJS.ErrnoException) => void
  let reads: Array<(error?: NodeJS.ErrnoException) => void>
  let listeners: Listener[]
  let unwatchCalls: Array<[string, Listener | undefined]>
  let closed: number[]
  let openFds: Set<number>
  let data: string[]
  let errors: NodeJS.ErrnoException[]

  beforeEach(() => {
    fs.ensureDirSync('/tmp/mqttx-log-watcher')
    directory = fs.mkdtempSync('/tmp/mqttx-log-watcher/logger-')
    filename = path.join(directory, 'log')
    fs.writeFileSync(filename, 'existing log\n')
    reads = []
    listeners = []
    unwatchCalls = []
    closed = []
    openFds = new Set()
    data = []
    errors = []

    // Keep real file descriptors and byte reads, but control asynchronous completion and stat notifications.
    fs.open = ((_filename: string, _flags: string, callback: (error: Error | null, fd: number) => void) => {
      completeOpen = (error) => {
        if (error) return callback(error, -1)
        const fd = fs.openSync(filename, 'r')
        openFds.add(fd)
        callback(null, fd)
      }
    }) as typeof fs.open
    fs.read = ((
      fd: number,
      buffer: Buffer,
      offset: number,
      length: number,
      position: number,
      callback: (error: NodeJS.ErrnoException | null, bytesRead: number, buffer: Buffer) => void,
    ) => {
      const bytesRead = fs.readSync(fd, buffer, offset, length, position)
      reads.push((error) => callback(error || null, bytesRead, buffer))
    }) as typeof fs.read
    fs.close = ((fd: number, callback: (error: Error | null) => void) => {
      fs.closeSync(fd)
      openFds.delete(fd)
      closed.push(fd)
      callback(null)
    }) as typeof fs.close
    fs.watchFile = ((_filename: string, _options: Record<string, unknown>, listener: Listener) => {
      listeners.push(listener)
    }) as typeof fs.watchFile
    fs.unwatchFile = ((_filename: string, listener?: Listener) => {
      unwatchCalls.push([_filename, listener])
      listeners = listener ? listeners.filter((entry) => entry !== listener) : []
    }) as typeof fs.unwatchFile
    fs.pathExistsSync = () => true
  })

  afterEach(() => {
    Object.assign(fs, original)
    openFds.forEach((fd) => fs.closeSync(fd))
    fs.removeSync(directory)
  })

  const start = () =>
    watchFileAppender(
      filename,
      (buffer) => data.push(buffer.toString()),
      (error) => errors.push(error),
    ) as unknown as (() => void) | undefined

  const append = (text: string, targets = listeners.slice()) => {
    const prev = fs.statSync(filename)
    fs.appendFileSync(filename, text)
    const curr = fs.statSync(filename)
    curr.mtime = new Date(prev.mtime.getTime() + 1000)
    targets.forEach((listener) => listener(curr, prev))
  }

  it('reads appended bytes and active errors, then removes only its listener and closes once', () => {
    const dispose = start()
    completeOpen()
    const listener = listeners[0]
    let otherCalls = 0
    const otherListener = () => otherCalls++
    listeners.push(otherListener)

    append('appended\n')
    reads.shift()!()
    expect(data).to.deep.equal(['appended\n'])
    const readError = new Error('read failed')
    append('unread\n')
    reads.shift()!(readError)
    expect(errors).to.deep.equal([readError])

    dispose?.()
    dispose?.()
    expect(unwatchCalls).to.deep.equal([[filename, listener]])
    expect(closed).to.have.lengthOf(1)
    expect(openFds.size).to.equal(0)
    expect(listeners).to.deep.equal([otherListener])

    append('after disposal\n', [listener, ...listeners])
    expect(reads).to.have.lengthOf(0)
    expect(data).to.deep.equal(['appended\n'])
    expect(errors).to.deep.equal([readError])
    expect(otherCalls).to.equal(3)
  })

  it('closes a late-opened descriptor without starting a watcher', () => {
    const dispose = start()
    dispose?.()
    dispose?.()
    completeOpen()

    expect(listeners).to.have.lengthOf(0)
    expect(closed).to.have.lengthOf(1)
    expect(openFds.size).to.equal(0)
    expect(data).to.have.lengthOf(0)
    expect(errors).to.have.lengthOf(0)
  })

  it('waits for all in-flight reads, suppressing data and errors after disposal', () => {
    const dispose = start()
    completeOpen()
    append('first\n')
    append('second\n')
    expect(reads).to.have.lengthOf(2)
    dispose?.()
    expect(closed).to.have.lengthOf(0)

    reads.shift()!()
    expect(data).to.have.lengthOf(0)
    expect(closed).to.have.lengthOf(0)
    reads.shift()!(new Error('late read failure'))
    expect(errors).to.have.lengthOf(0)
    expect(closed).to.have.lengthOf(1)
    expect(openFds.size).to.equal(0)
    dispose?.()
    expect(closed).to.have.lengthOf(1)
  })

  it('reports open errors while active and suppresses them after disposal', () => {
    const openError = new Error('open failed')
    start()
    completeOpen(openError)
    expect(errors).to.deep.equal([openError])

    const dispose = start()
    dispose?.()
    completeOpen(new Error('late open failure'))
    expect(errors).to.deep.equal([openError])
    expect(listeners).to.have.lengthOf(0)
    expect(openFds.size).to.equal(0)
  })

  it('releases the Log page watcher in beforeDestroy', () => {
    const options = (Logs as any).options
    const context = {
      onLogReadDataHandle: (buffer: Buffer) => data.push(buffer.toString()),
      onLogReadErrorHandle: (error: NodeJS.ErrnoException) => errors.push(error),
      $nextTick: () => {},
    }
    options.mounted.forEach((hook: () => void) => hook.call(context))
    completeOpen()
    const listener = listeners[0]
    const destroyHooks = options.beforeDestroy || []
    destroyHooks.forEach((hook: () => void) => hook.call(context))

    expect(listeners).to.have.lengthOf(0)
    expect(unwatchCalls).to.have.lengthOf(1)
    expect(unwatchCalls[0][1]).to.equal(listener)
    expect(closed).to.have.lengthOf(1)
    expect(openFds.size).to.equal(0)
  })
})
