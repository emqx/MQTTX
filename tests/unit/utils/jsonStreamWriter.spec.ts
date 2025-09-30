import { expect } from 'chai'
import { JSONStreamWriter } from '@/utils/jsonStreamWriter'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('JSONStreamWriter', () => {
  let tempDir: string
  let tempFile: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-stream-test-'))
    tempFile = path.join(tempDir, 'test.json')
  })

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir)
    }
  })

  it('should write empty array', () => {
    const writer = new JSONStreamWriter(tempFile)
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([])
  })

  it('should write single object', () => {
    const writer = new JSONStreamWriter(tempFile)
    writer.writeObject({ id: 1, name: 'test' })
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([{ id: 1, name: 'test' }])
  })

  it('should write multiple objects', () => {
    const writer = new JSONStreamWriter(tempFile)
    writer.writeObject({ id: 1, name: 'test1' })
    writer.writeObject({ id: 2, name: 'test2' })
    writer.writeObject({ id: 3, name: 'test3' })
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
      { id: 3, name: 'test3' },
    ])
  })

  it('should write object with streaming array', async () => {
    async function* testGenerator() {
      yield [{ msg: 'message1' }, { msg: 'message2' }]
      yield [{ msg: 'message3' }]
    }

    const writer = new JSONStreamWriter(tempFile)
    await writer.writeObjectWithStreamingArray({ id: 1, name: 'connection' }, 'messages', testGenerator())
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([
      {
        id: 1,
        name: 'connection',
        messages: [{ msg: 'message1' }, { msg: 'message2' }, { msg: 'message3' }],
      },
    ])
  })

  it('should write multiple objects with streaming arrays', async () => {
    async function* generator1() {
      yield [{ msg: 'conn1-msg1' }]
      yield [{ msg: 'conn1-msg2' }]
    }

    async function* generator2() {
      yield [{ msg: 'conn2-msg1' }]
    }

    const writer = new JSONStreamWriter(tempFile)
    await writer.writeObjectWithStreamingArray({ id: 1, name: 'conn1' }, 'messages', generator1())
    await writer.writeObjectWithStreamingArray({ id: 2, name: 'conn2' }, 'messages', generator2())
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([
      {
        id: 1,
        name: 'conn1',
        messages: [{ msg: 'conn1-msg1' }, { msg: 'conn1-msg2' }],
      },
      {
        id: 2,
        name: 'conn2',
        messages: [{ msg: 'conn2-msg1' }],
      },
    ])
  })

  it('should handle empty streaming array', async () => {
    async function* emptyGenerator() {
      // yields nothing
    }

    const writer = new JSONStreamWriter(tempFile)
    await writer.writeObjectWithStreamingArray({ id: 1, name: 'test' }, 'messages', emptyGenerator())
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([{ id: 1, name: 'test', messages: [] }])
  })

  it('should handle nested objects', () => {
    const writer = new JSONStreamWriter(tempFile)
    writer.writeObject({
      id: 1,
      nested: { a: 1, b: 2 },
      array: [1, 2, 3],
    })
    writer.close()

    const content = fs.readFileSync(tempFile, 'utf-8')
    const parsed = JSON.parse(content)
    expect(parsed).to.deep.equal([
      {
        id: 1,
        nested: { a: 1, b: 2 },
        array: [1, 2, 3],
      },
    ])
  })
})
