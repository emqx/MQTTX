/// <reference types="../../types/global" />

import fs from 'fs'
import os from 'os'
import path from 'path'
import { Commander } from '../../index'
import { appendFile, fileDataSplitter, splitBatchFile } from '../../utils/fileUtils'

describe('appendFile', () => {
  let directory: string
  let filePath: string

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-append-file-'))
    filePath = path.join(directory, 'messages.bin')
  })

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true })
  })

  it('preserves binary bytes when the delimiter is empty', () => {
    const payload = Buffer.from([0x00, 0xff, 0x80, 0x41])

    appendFile(filePath, payload, '')

    expect(fs.readFileSync(filePath)).toEqual(payload)
  })

  it('preserves every byte value and appends a newline by default', () => {
    const payload = Buffer.from(Array.from({ length: 256 }, (_, index) => index))

    appendFile(filePath, payload)

    expect(fs.readFileSync(filePath)).toEqual(Buffer.concat([payload, Buffer.from('\n')]))
  })

  it.each(['\r\n', '|', '\u7ed3\u675f'])('appends the UTF-8 delimiter %j after binary bytes', (delimiter) => {
    const payload = Buffer.from([0xff, 0x80])

    appendFile(filePath, payload, delimiter)

    expect(fs.readFileSync(filePath)).toEqual(Buffer.concat([payload, Buffer.from(delimiter)]))
  })

  it('appends repeated binary messages without changing existing bytes', () => {
    const existing = Buffer.from([0xfe, 0x00])
    const first = Buffer.from([0xff, 0x80])
    const second = Buffer.from([0xc0, 0xaf])
    fs.writeFileSync(filePath, existing)

    appendFile(filePath, first, '')
    appendFile(filePath, second, '')

    expect(fs.readFileSync(filePath)).toEqual(Buffer.concat([existing, first, second]))
  })

  it('preserves UTF-8 text and string delimiters', () => {
    appendFile(filePath, 'Hello, \u4e16\u754c')
    appendFile(filePath, 'next message', '|')

    expect(fs.readFileSync(filePath, 'utf-8')).toBe('Hello, \u4e16\u754c\nnext message|')
  })

  it('writes the delimiter for an empty buffer', () => {
    appendFile(filePath, Buffer.alloc(0))

    expect(fs.readFileSync(filePath)).toEqual(Buffer.from('\n'))
  })

  it('preserves the text of a delimiter flag without a value', () => {
    const commander = new Commander()
    commander.init()
    const subscribe = commander.program.commands.find((command) => command.name() === 'sub')!
    subscribe.parseOptions(['--delimiter'])

    appendFile(filePath, Buffer.from([0xff, 0x80]), subscribe.opts().delimiter)

    expect(fs.readFileSync(filePath)).toEqual(Buffer.from([0xff, 0x80, 0x74, 0x72, 0x75, 0x65]))
  })
})

describe('batch file splitting', () => {
  it.each([
    ['', []],
    ['a\r\n\r\nb\r\n', ['a', '', 'b']],
    ['\n', ['']],
    ['\n\n', ['', '']],
    [' a \n b', [' a ', ' b']],
    ['a\n\n', ['a', '']],
  ] as [string, string[]][])('splits newline input %j', (data, expected) =>
    expect(splitBatchFile(data, true)).toEqual(expected),
  )
  it('uses the existing custom separator semantics', () => {
    expect(splitBatchFile('one::two::::', '::')).toEqual(['one', 'two', ''])
    expect(fileDataSplitter('one\n', true)).toEqual(['one', ''])
  })
})
