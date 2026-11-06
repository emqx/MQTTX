// Cloud ZIP packages are parsed as data; extraction never executes extension code.
import fs from 'fs'
import path from 'path'
import { unzipSync } from 'fflate'

interface ArchiveEntry {
  name: string
  directory: boolean
  bytes: Buffer
  relative?: string
}
interface ZipMetadata {
  length: number
  crc: number
  directory: boolean
}

function safeName(value: string): string {
  if (typeof value !== 'string' || value.length > 1024 || /[\\\x00-\x1f<>:"|?*]/.test(value) || value.startsWith('/')) {
    throw new Error('Unsafe archive path.')
  }
  const parts = value.split('/').filter((part) => part && part !== '.')
  if (
    parts.length > 32 ||
    parts.some(
      (part) => part === '..' || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
    )
  ) {
    throw new Error('Unsafe archive path.')
  }
  return parts.join('/')
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
  return n >>> 0
})
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function zipEntries(data: Buffer, maxFiles: number, maxBytes: number): ArchiveEntry[] {
  let end = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (data.readUInt32LE(i) === 0x06054b50 && i + 22 + data.readUInt16LE(i + 20) === data.length) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error('Invalid ZIP archive.')
  const count = data.readUInt16LE(end + 10),
    start = data.readUInt32LE(end + 16),
    size = data.readUInt32LE(end + 12)
  if (
    data.readUInt16LE(end + 4) ||
    data.readUInt16LE(end + 6) ||
    count !== data.readUInt16LE(end + 8) ||
    count === 65535 ||
    count > maxFiles ||
    start + size !== end
  ) {
    throw new Error('Unsupported or oversized ZIP archive.')
  }
  const metadata = new Map<string, ZipMetadata>()
  let offset = start,
    total = 0
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || data.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP directory.')
    const flags = data.readUInt16LE(offset + 8),
      compression = data.readUInt16LE(offset + 10)
    const nameSize = data.readUInt16LE(offset + 28),
      extraSize = data.readUInt16LE(offset + 30),
      commentSize = data.readUInt16LE(offset + 32)
    const length = data.readUInt32LE(offset + 24),
      attributes = data.readUInt32LE(offset + 38)
    const type = (attributes >>> 16) & 0xf000
    const next = offset + 46 + nameSize + extraSize + commentSize
    if (
      next > end ||
      flags & 1 ||
      ![0, 8].includes(compression) ||
      ![0, 0x8000, 0x4000].includes(type) ||
      length === 0xffffffff
    ) {
      throw new Error('Encrypted, linked or unsupported ZIP entry.')
    }
    const name = data.subarray(offset + 46, offset + 46 + nameSize).toString(flags & 0x800 ? 'utf8' : 'latin1')
    safeName(name)
    total += length
    if (total > maxBytes || metadata.has(name)) throw new Error('Oversized or duplicate archive entry.')
    metadata.set(name, {
      length,
      crc: data.readUInt32LE(offset + 16),
      directory: name.endsWith('/') || type === 0x4000 || Boolean(attributes & 0x10),
    })
    offset = next
  }
  if (offset !== end) throw new Error('Invalid ZIP directory size.')
  const output = unzipSync(data, {
    filter: (entry) => {
      const record = metadata.get(entry.name)
      if (!record || entry.originalSize !== record.length) throw new Error('Invalid ZIP entry size.')
      return true
    },
  })
  return [...metadata].map(([name, record]) => {
    const bytes = output[name]
    if (!bytes || bytes.length !== record.length || crc32(bytes) !== record.crc) throw new Error('Corrupt ZIP entry.')
    return { name, directory: record.directory, bytes: Buffer.from(bytes) }
  })
}

function writeEntries(root: string, entries: ArchiveEntry[]): void {
  const names = new Map<string, boolean>()
  for (const entry of entries) {
    entry.relative = safeName(entry.name)
    if (!entry.relative && !entry.directory) throw new Error('Archive file has no name.')
    if (!entry.relative) continue
    const key = entry.relative.toLowerCase()
    if (names.has(key) && !(entry.directory && names.get(key))) throw new Error('Duplicate archive path.')
    names.set(key, entry.directory)
  }
  for (const entry of entries) {
    if (!entry.relative) continue
    const parts = entry.relative.toLowerCase().split('/')
    for (let i = 1; i < parts.length; i++)
      if (names.get(parts.slice(0, i).join('/')) === false) throw new Error('Conflicting archive paths.')
  }
  for (const entry of entries) {
    if (!entry.relative) continue
    const target = path.join(root, entry.relative)
    if (entry.directory) fs.mkdirSync(target, { recursive: true })
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, entry.bytes, { flag: 'wx', mode: 0o600 })
    }
  }
}

export function extractCloudZip(data: Buffer, directory: string): void {
  if (data.length > 20 * 1024 * 1024) throw new Error('Extension package exceeds 20 MiB.')
  writeEntries(directory, zipEntries(data, 2000, 64 * 1024 * 1024))
}
