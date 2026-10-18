import fs from 'fs'
import path from 'path'
import { zipSync, strToU8 } from 'fflate'
import { getUnifiedAppDataPath } from '@/main/appDataPath'

export interface AgentFileInput {
  path: string
  content: string
}

export interface AgentFileMeta {
  path: string
  size: number
}

export interface SavedArchive {
  fileId: string
  name: string
  /** Name on disk, includes the short random id */
  fileName: string
  /** Name offered when downloading */
  downloadName: string
  /** Path relative to the agent-files directory, always with `/` separators */
  relativePath: string
  size: number
  files: AgentFileMeta[]
}

const MAX_FILES = 30
const MAX_FILE_BYTES = 256 * 1024
const MAX_TOTAL_BYTES = 1024 * 1024
const MAX_NAME_LENGTH = 64
const ARCHIVE_DIR = 'agent-files'

const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
const WINDOWS_ILLEGAL = /[<>:"|?*]/
const CONTROL_CHARS = /[\x00-\x1F]/
const CONVERSATION_ID = /^[0-9a-fA-F-]+$/

const byteLength = (text: string): number => Buffer.byteLength(text, 'utf8')

/** Normalizes one relative path and rejects anything that is unsafe or breaks a Windows extract */
const normalizeRelativePath = (raw: unknown): string => {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error('Every file needs a non-empty "path".')
  }
  if (raw.includes('\0')) {
    throw new Error(`Invalid file path "${raw}": it must not contain a NUL character.`)
  }
  if (raw.includes('\\')) {
    throw new Error(
      `Invalid file path "${raw}": use "/" separators. A Windows-style "\\" path cannot be stored in the zip.`,
    )
  }
  if (raw.startsWith('/') || /^[a-zA-Z]:/.test(raw)) {
    throw new Error(`Invalid file path "${raw}": paths must be relative, for example "src/main.py".`)
  }
  const normalized = path.posix.normalize(raw)
  if (normalized === '' || normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new Error(`Invalid file path "${raw}": it must stay inside the project, so it cannot contain "..".`)
  }
  for (const segment of normalized.split('/')) {
    if (!segment || segment === '.' || segment === '..') {
      throw new Error(`Invalid file path "${raw}": it must stay inside the project.`)
    }
    if (WINDOWS_ILLEGAL.test(segment) || CONTROL_CHARS.test(segment)) {
      throw new Error(
        `Invalid file path "${raw}": "${segment}" contains a character Windows does not allow in names (< > : " | ? * or a control character).`,
      )
    }
    if (/[ .]$/.test(segment)) {
      throw new Error(
        `Invalid file path "${raw}": "${segment}" must not end with a space or a dot, Windows drops those when extracting.`,
      )
    }
    if (WINDOWS_RESERVED.test(segment.split('.')[0])) {
      throw new Error(
        `Invalid file path "${raw}": "${segment}" is a Windows reserved name (CON, PRN, AUX, NUL, COM1-9, LPT1-9).`,
      )
    }
  }
  return normalized
}

/**
 * Returns the files with normalized `/` paths, or throws a message that tells the model what to fix.
 * Path rules keep the archive safe to extract on Windows and macOS (case-insensitive, no reserved names).
 */
export const validateFiles = (files: AgentFileInput[]): AgentFileInput[] => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('save_files needs at least one file.')
  }
  if (files.length > MAX_FILES) {
    throw new Error(`save_files accepts at most ${MAX_FILES} files, got ${files.length}.`)
  }
  const normalized: AgentFileInput[] = []
  const seen = new Set<string>()
  let total = 0
  for (const file of files) {
    if (!file || typeof file.content !== 'string') {
      throw new Error('Every file needs a string "path" and a string "content".')
    }
    const relative = normalizeRelativePath(file.path)
    const key = relative.toLowerCase()
    if (seen.has(key)) {
      throw new Error(
        `Duplicate file path "${relative}". Paths must be unique even ignoring case, because Windows and macOS would overwrite one another when extracting.`,
      )
    }
    seen.add(key)
    const size = byteLength(file.content)
    if (size > MAX_FILE_BYTES) {
      throw new Error(
        `File "${relative}" is ${size} bytes; each file must be at most ${MAX_FILE_BYTES} bytes (256 KB).`,
      )
    }
    total += size
    if (total > MAX_TOTAL_BYTES) {
      throw new Error(
        `The project is larger than ${MAX_TOTAL_BYTES} bytes (1 MB). Save a smaller project, or split it into several save_files calls.`,
      )
    }
    normalized.push({ path: relative, content: file.content })
  }
  return normalized
}

/** Keeps only characters that are safe in a file name on every platform */
export const sanitizeArchiveName = (name: string): string => {
  let cleaned = String(name ?? '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/^[-.]+/, '')
    .replace(/[-.]+$/, '')
  if (cleaned.length > MAX_NAME_LENGTH) {
    cleaned = cleaned.slice(0, MAX_NAME_LENGTH).replace(/[-.]+$/, '')
  }
  if (!cleaned) cleaned = 'project'
  // A Windows reserved name cannot be a folder name, so make it unique
  if (WINDOWS_RESERVED.test(cleaned.split('.')[0])) {
    cleaned = `${cleaned}-project`
  }
  return cleaned
}

/** Packs the files into a zip; every entry sits under `<name>/` and uses `/` separators */
export const buildZip = (name: string, files: AgentFileInput[]): Uint8Array => {
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) {
    entries[path.posix.join(name, file.path)] = strToU8(file.content)
  }
  return zipSync(entries)
}

export const getAgentFilesRoot = (root?: string): string =>
  root ?? path.join(getUnifiedAppDataPath('MQTTX'), ARCHIVE_DIR)

export const assertConversationId = (conversationId: string): string => {
  if (!CONVERSATION_ID.test(conversationId)) {
    throw new Error(`Invalid conversation id "${conversationId}".`)
  }
  return conversationId
}

export const randomId = (): string => Math.random().toString(36).slice(2, 10)

/** Writes through a `.tmp` file and renames it, so a failed write never leaves a partial file */
export const writeFileAtomic = async (target: string, data: Uint8Array): Promise<void> => {
  const tmp = `${target}.tmp`
  try {
    await fs.promises.writeFile(tmp, data)
    await fs.promises.rename(tmp, target)
  } catch (error) {
    await fs.promises.rm(tmp, { force: true }).catch(() => undefined)
    throw error
  }
}

/** Writes one zip into `<agent-files>/<conversationId>/` and returns what the message needs to keep */
export const saveArchive = async (
  { conversationId, name, files }: { conversationId: string; name: string; files: AgentFileInput[] },
  root?: string,
): Promise<SavedArchive> => {
  const valid = validateFiles(files)
  const safeName = sanitizeArchiveName(name)
  const id = assertConversationId(conversationId)
  const dir = path.join(getAgentFilesRoot(root), id)
  await fs.promises.mkdir(dir, { recursive: true })

  const data = buildZip(safeName, valid)
  const fileId = randomId()
  const fileName = `${fileId}-${safeName}.zip`
  await writeFileAtomic(path.join(dir, fileName), data)

  return {
    fileId,
    name: safeName,
    fileName,
    downloadName: `${safeName}.zip`,
    relativePath: path.posix.join(id, fileName),
    size: data.byteLength,
    files: valid.map((file) => ({ path: file.path, size: byteLength(file.content) })),
  }
}

/** Resolves a stored relative path inside agent-files without touching the disk; null when it is unsafe */
const resolveArchiveTarget = (relativePath: string, root?: string): string | null => {
  if (typeof relativePath !== 'string' || relativePath === '' || relativePath.includes('\\')) return null
  if (relativePath.includes('\0')) return null
  const parts = relativePath.split('/').filter(Boolean)
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) return null
  const archiveRoot = getAgentFilesRoot(root)
  const target = path.join(archiveRoot, ...parts)
  // path.relative is empty for the root, starts with '..' outside it, and is absolute across Windows drives
  const relative = path.relative(archiveRoot, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null
  return target
}

/** Resolves a stored relative path to an absolute path inside agent-files, or null when it is unsafe/missing */
export const resolveArchive = async (relativePath: string, root?: string): Promise<string | null> => {
  const target = resolveArchiveTarget(relativePath, root)
  if (!target) return null
  try {
    await fs.promises.access(target, fs.constants.F_OK)
  } catch {
    return null
  }
  return target
}

/** Sync version of resolveArchive, for reading attachment bytes while rendering */
export const resolveArchiveSync = (relativePath: string, root?: string): string | null => {
  const target = resolveArchiveTarget(relativePath, root)
  if (!target) return null
  return fs.existsSync(target) ? target : null
}

/** Removes every archive of one conversation; never throws (Windows can keep a file handle open) */
export const deleteConversationFiles = async (conversationId: string, root?: string): Promise<void> => {
  let id: string
  try {
    id = assertConversationId(conversationId)
  } catch (error) {
    console.warn('[agent-files] skipped cleanup:', (error as Error).message)
    return
  }
  const dir = path.join(getAgentFilesRoot(root), id)
  try {
    await fs.promises.rm(dir, { recursive: true, force: true })
  } catch (error) {
    console.warn(`[agent-files] could not delete ${dir}:`, (error as Error).message || error)
  }
}
