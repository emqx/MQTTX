import { CloudError } from '../../utils/cloudErrors'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export interface CloudToken {
  value: string
  expiresAt: number
}
export interface CredentialProtection {
  isEncryptionAvailable(): boolean
  getSelectedStorageBackend(): string
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
}
export interface CredentialVault {
  load(): CloudToken | null
  save(token: CloudToken): void
  clear(): void
}

export function atomicJSON(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 })
  const tmp = `${file}.${randomUUID()}.tmp`
  try {
    fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600, flag: 'wx' })
    fs.renameSync(tmp, file)
  } finally {
    fs.rmSync(tmp, { force: true })
  }
}
export class CredentialStore {
  readonly root: string
  readonly secure: CredentialProtection
  readonly binding: string
  readonly file: string
  readonly marker: string
  constructor(root: string, secure: CredentialProtection, binding: string) {
    this.root = root
    this.secure = secure
    this.binding = binding
    this.file = path.join(root, 'session.json')
    this.marker = path.join(root, 'session-generation.json')
  }
  generation(): string {
    if (!fs.existsSync(this.marker)) atomicJSON(this.marker, { value: randomUUID() })
    return JSON.parse(fs.readFileSync(this.marker, 'utf8')).value
  }
  available(): boolean {
    return (
      this.secure.isEncryptionAvailable() &&
      !(process.platform === 'linux' && this.secure.getSelectedStorageBackend() === 'basic_text')
    )
  }
  save(token: CloudToken): void {
    if (!this.available()) throw new CloudError('STORAGE_UNAVAILABLE')
    const plaintext = JSON.stringify({ binding: this.binding, generation: this.generation(), token })
    atomicJSON(this.file, { encrypted: this.secure.encryptString(plaintext).toString('base64') })
  }
  load(): CloudToken | null {
    if (!fs.existsSync(this.file)) return null
    if (!this.available()) throw new CloudError('STORAGE_READ_FAILED')
    const encrypted = JSON.parse(fs.readFileSync(this.file, 'utf8')).encrypted
    const value = JSON.parse(this.secure.decryptString(Buffer.from(encrypted, 'base64')))
    if (value.binding !== this.binding || value.generation !== this.generation()) return null
    const t = value.token
    if (!t || typeof t.value !== 'string' || !Number.isFinite(t.expiresAt))
      throw new CloudError('STORED_SESSION_INVALID')
    return t
  }
  clear(): void {
    // Invalidate the disk generation before deleting, so a failed deletion cannot restore an old login.
    atomicJSON(this.marker, { value: randomUUID() })
    fs.rmSync(this.file, { force: true })
  }
}
