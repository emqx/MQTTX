/// <reference types="../../types/global" />

import fs from 'fs'
import os from 'os'
import path from 'path'
import { appendFile } from '../../utils/fileUtils'

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
})
