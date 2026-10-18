import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { unzipSync, strFromU8 } from 'fflate'
import {
  buildZip,
  deleteConversationFiles,
  resolveArchive,
  sanitizeArchiveName,
  saveArchive,
  validateFiles,
} from '@/utils/ai/agent/files'

const file = (filePath: string, content = 'x') => ({ path: filePath, content })

describe('agent files', () => {
  describe('validateFiles', () => {
    it('should keep valid paths and normalize them to "/" separators', () => {
      const result = validateFiles([file('src/main.py', 'print(1)'), file('./lib/a.js', 'a')])

      expect(result).to.deep.equal([
        { path: 'src/main.py', content: 'print(1)' },
        { path: 'lib/a.js', content: 'a' },
      ])
    })

    it('should allow dotfiles and nested dotnames', () => {
      expect(validateFiles([file('.gitignore'), file('.env.example')]).map((f) => f.path)).to.deep.equal([
        '.gitignore',
        '.env.example',
      ])
    })

    it('should reject an empty list', () => {
      expect(() => validateFiles([])).to.throw(Error, /at least one file/)
    })

    it('should reject more than 30 files', () => {
      const files = Array.from({ length: 31 }, (_, index) => file(`f${index}.txt`))
      expect(() => validateFiles(files)).to.throw(Error, /at most 30 files/)
    })

    it('should reject a file larger than 256 KB', () => {
      expect(() => validateFiles([file('big.txt', 'a'.repeat(256 * 1024 + 1))])).to.throw(Error, /at most 262144 bytes/)
    })

    it('should reject more than 1 MB in total', () => {
      const files = Array.from({ length: 5 }, (_, index) => file(`f${index}.txt`, 'a'.repeat(256 * 1024)))
      expect(() => validateFiles(files)).to.throw(Error, /larger than 1048576 bytes/)
    })

    it('should reject an absolute path', () => {
      expect(() => validateFiles([file('/etc/passwd')])).to.throw(Error, /must be relative/)
    })

    it('should reject a parent folder escape', () => {
      expect(() => validateFiles([file('../secret.txt')])).to.throw(Error, /stay inside the project/)
      expect(() => validateFiles([file('a/../../b.txt')])).to.throw(Error, /stay inside the project/)
    })

    it('should reject a Windows drive path', () => {
      expect(() => validateFiles([file('C:x.txt')])).to.throw(Error, /must be relative/)
    })

    it('should reject a backslash path', () => {
      expect(() => validateFiles([file('src\\main.py')])).to.throw(Error, /use "\/" separators/)
    })

    it('should reject Windows illegal characters', () => {
      for (const bad of ['src/a:b.txt', 'a*.txt', 'a?.txt', 'a|b.txt', 'a"b.txt', 'a<b.txt']) {
        expect(() => validateFiles([file(bad)]), bad).to.throw(Error, /Windows does not allow/)
      }
    })

    it('should reject Windows reserved names', () => {
      for (const bad of ['nul.txt', 'COM1', 'aux/readme.md', 'lpt9.txt']) {
        expect(() => validateFiles([file(bad)]), bad).to.throw(Error, /Windows reserved name/)
      }
    })

    it('should reject a segment that ends with a space or a dot', () => {
      expect(() => validateFiles([file('foo /bar.txt')])).to.throw(Error, /must not end with a space or a dot/)
      expect(() => validateFiles([file('foo./bar.txt')])).to.throw(Error, /must not end with a space or a dot/)
    })

    it('should reject duplicates ignoring case', () => {
      expect(() => validateFiles([file('README.md'), file('readme.md')])).to.throw(Error, /ignoring case/)
    })
  })

  describe('sanitizeArchiveName', () => {
    it('should replace unsafe characters and trim the edges', () => {
      expect(sanitizeArchiveName('My project!')).to.equal('My-project')
      expect(sanitizeArchiveName('...')).to.equal('project')
    })

    it('should turn a Windows reserved name into a safe one', () => {
      expect(sanitizeArchiveName('con')).to.equal('con-project')
      expect(sanitizeArchiveName('CON')).to.equal('CON-project')
    })

    it('should cap the length at 64 characters', () => {
      expect(sanitizeArchiveName('a'.repeat(80))).to.have.length(64)
    })
  })

  describe('buildZip', () => {
    it('should pack every file under "<name>/" with "/" separators', () => {
      const zip = buildZip('proj', [file('src/main.py', 'hello'), file('README.md', 'docs')])
      const entries = unzipSync(zip)

      expect(Object.keys(entries).sort()).to.deep.equal(['proj/README.md', 'proj/src/main.py'])
      expect(strFromU8(entries['proj/src/main.py'])).to.equal('hello')
      expect(strFromU8(entries['proj/README.md'])).to.equal('docs')
    })
  })

  describe('saveArchive / resolveArchive / deleteConversationFiles', () => {
    let root: string

    beforeEach(() => {
      root = fs.mkdtempSync(path.join(os.tmpdir(), 'mqttx-agent-files-'))
    })

    afterEach(() => {
      fs.rmSync(root, { recursive: true, force: true })
    })

    const save = () =>
      saveArchive(
        {
          conversationId: '11111111-2222-3333-4444-555555555555',
          name: 'My project',
          files: [file('src/main.py', 'print(1)'), file('README.md', 'run')],
        },
        root,
      )

    it('should write the zip and return both file names', async () => {
      const saved = await save()

      expect(saved.name).to.equal('My-project')
      expect(saved.downloadName).to.equal('My-project.zip')
      expect(saved.fileName).to.match(/^[a-z0-9]+-My-project\.zip$/)
      expect(saved.relativePath).to.equal(`11111111-2222-3333-4444-555555555555/${saved.fileName}`)
      expect(saved.relativePath).to.not.contain('\\')
      expect(saved.size).to.be.greaterThan(0)
      expect(saved.files).to.deep.equal([
        { path: 'src/main.py', size: 8 },
        { path: 'README.md', size: 3 },
      ])
      expect(fs.existsSync(path.join(root, saved.relativePath.split('/')[0], saved.fileName))).to.equal(true)
    })

    it('should reject an invalid conversation id', async () => {
      let error: Error | undefined
      try {
        await saveArchive({ conversationId: 'not a uuid', name: 'x', files: [file('a.txt')] }, root)
      } catch (caught) {
        error = caught as Error
      }
      expect(error?.message).to.contain('Invalid conversation id')
    })

    it('should resolve a saved archive and return null for a missing one', async () => {
      const saved = await save()

      const resolved = await resolveArchive(saved.relativePath, root)
      expect(resolved).to.be.a('string')
      expect(fs.existsSync(resolved as string)).to.equal(true)

      expect(await resolveArchive(`${saved.relativePath.split('/')[0]}/missing.zip`, root)).to.equal(null)
    })

    it('should refuse a path that escapes the agent-files directory', async () => {
      expect(await resolveArchive('../outside.zip', root)).to.equal(null)
      expect(await resolveArchive('a/../../outside.zip', root)).to.equal(null)
    })

    it('should delete the whole conversation directory', async () => {
      const saved = await save()
      const dir = path.join(root, saved.relativePath.split('/')[0])

      await deleteConversationFiles(saved.relativePath.split('/')[0], root)
      expect(fs.existsSync(dir)).to.equal(false)
      // Deleting again is fine
      await deleteConversationFiles(saved.relativePath.split('/')[0], root)
    })

    it('should swallow an invalid conversation id when cleaning up', async () => {
      await deleteConversationFiles('not a uuid', root)
    })
  })
})
