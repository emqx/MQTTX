import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { parse as csv } from 'json2csv'
import ImportData from '@/components/ImportData.vue'

describe('Desktop import form file loading', () => {
  let directory: string
  let form: any
  let errors: string[]
  const legacy = { id: 'connection', clientId: 'client', name: 'Connection', host: 'localhost', port: 1883, ssl: false }
  const group = { id: 'group', name: 'Group', isCollection: true, parentId: null }

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-import-form-'))
    form = new ImportData()
    errors = []
    form.$message = { error: (message: string) => errors.push(message) }
    form.$t = form.$tc = (key: string) => key
  })
  afterEach(() => {
    form.$destroy()
    fs.rmSync(directory, { recursive: true, force: true })
  })
  const load = async (content: string, format = 'JSON') => {
    form.record.importFormat = format
    await form.$nextTick()
    const file = path.join(directory, `backup.${format.toLowerCase()}`)
    fs.writeFileSync(file, content)
    await form.readFilePath(file, format.toLowerCase())
  }

  for (const [name, content] of [
    ['malformed', '{'],
    ['invalid', JSON.stringify([{ ...legacy, port: 70000 }])],
    ['unreadable', undefined],
  ]) {
    it(`clears the previous selection when the next file is ${name}`, async () => {
      await load(JSON.stringify([group, { ...legacy, parentId: 'group' }]))
      expect(form.record.fileContent).to.have.lengthOf(2)
      expect(form.record.filePath).to.equal(path.join(directory, 'backup.json'))
      const file = path.join(directory, `${name}.json`)
      if (content !== undefined) fs.writeFileSync(file, content)
      await form.readFilePath(file, 'json')
      expect(form.record.fileContent).to.deep.equal([])
      expect(form.record.fileName).to.equal('')
      expect(form.record.filePath).to.equal('')
      expect(errors).to.have.lengthOf(1)
    })
  }

  it('reports an unreadable Excel file and clears the previous selection', async () => {
    await load(JSON.stringify([group, { ...legacy, parentId: 'group' }]))
    expect(form.record.fileContent).to.have.lengthOf(2)
    await form.readFilePath(path.join(directory, 'missing.xlsx'), 'xlsx')
    expect(form.record.fileContent).to.deep.equal([])
    expect(form.record.fileName).to.equal('')
    expect(form.record.filePath).to.equal('')
    expect(errors).to.have.lengthOf(1)
    expect(errors[0]).to.match(/^connections\.readFileErr/)
  })

  it('accepts legacy single-connection JSON objects', async () => {
    await load(JSON.stringify(legacy))
    expect(form.record.fileContent).to.deep.equal([legacy])
    expect(errors).to.deep.equal([])
  })

  it('waits for CSV conversion before validating legacy connection rows', async () => {
    await load(csv([{ ...legacy, messages: 'EMPTY_ARRAY', subscriptions: 'EMPTY_ARRAY' }]), 'CSV')
    expect(form.record.fileContent).to.have.lengthOf(1)
    expect(form.record.fileContent[0]).to.include({ id: 'connection', port: 1883, ssl: false })
    expect(form.record.fileContent[0].messages).to.deep.equal([])
    expect(errors).to.deep.equal([])
  })

  it('accepts legacy YAML but restricts group records to JSON', async () => {
    await load(JSON.stringify([legacy]), 'YAML')
    expect(form.record.fileContent).to.deep.equal([legacy])
    await load(JSON.stringify([group]), 'YAML')
    expect(form.record.fileContent).to.deep.equal([])
    expect(errors).to.deep.equal(['connections.fileContentRequired'])
  })
})
