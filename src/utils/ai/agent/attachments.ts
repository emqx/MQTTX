import fs from 'fs'
import path from 'path'
import { AgentAttachmentKind, AgentAttachmentPart } from '@/types/agent'
import { assertConversationId, getAgentFilesRoot, randomId, writeFileAtomic } from './files'

export const ATTACHMENT_HEAD_BYTES = 4 * 1024
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES = 4
export const MAX_TEXT_BYTES = 256 * 1024
export const MAX_ATTACHMENTS = 10
export const TEXT_MODEL_BYTES = 64 * 1024

const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
}
const CREDENTIAL_EXTENSIONS = ['pem', 'crt', 'cer', 'der', 'key', 'p12', 'pfx']

/** A file the user picked or dropped, before it is written into the message */
export interface PendingAttachment {
  kind: AgentAttachmentKind
  name: string
  size: number
  mediaType?: string
  /** Present for images and text files; read at send time */
  file?: Blob
  /** Absolute path of a certificate or key (never copied, never read) */
  path?: string
}

export interface OutgoingMessage {
  content: string
  attachments: PendingAttachment[]
  /** Skill the user picked from the `/` menu */
  skill?: { skill: string }
}

export type AttachmentLimitError = 'too-many-attachments' | 'too-many-images' | 'too-large'

export const extensionOf = (name: string): string => {
  const index = name.lastIndexOf('.')
  return index > 0 ? name.slice(index + 1).toLowerCase() : ''
}

export const imageMediaType = (name: string): string => IMAGE_EXTENSIONS[extensionOf(name)] ?? 'image/png'

/**
 * Classifies an attachment from its name and its first bytes.
 * Images are known by extension, credentials by extension or a `-----BEGIN ` header, everything else
 * that decodes as UTF-8 without NUL bytes is text. Returns null for anything unsupported.
 */
export const classifyAttachment = (name: string, head: Buffer): AgentAttachmentKind | null => {
  const ext = extensionOf(name)
  if (IMAGE_EXTENSIONS[ext]) return 'image'

  const text = head.toString('utf8')
  if (CREDENTIAL_EXTENSIONS.includes(ext) || text.includes('-----BEGIN ')) {
    if (ext === 'p12' || ext === 'pfx') return 'bundle'
    if (text.includes('BEGIN CERTIFICATE') || ['crt', 'cer', 'der'].includes(ext)) return 'certificate'
    if (text.includes('PRIVATE KEY') || ext === 'key') return 'private-key'
    // A PEM that is neither a certificate nor a private key (for example a public key)
    return 'certificate'
  }

  if (head.includes(0)) return null
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(head)
  } catch {
    return null
  }
  return 'text'
}

/** Keeps the first 64 KB of a text file, cutting on a UTF-8 character boundary */
export const truncateText = (text: string): { text: string; truncated: boolean } => {
  if (Buffer.byteLength(text, 'utf8') <= TEXT_MODEL_BYTES) return { text, truncated: false }
  const cut = Buffer.from(text, 'utf8').subarray(0, TEXT_MODEL_BYTES).toString('utf8')
  return { text: cut.replace(/\uFFFD+$/, ''), truncated: true }
}

/** Returns why an attachment cannot be added to the message, or null when it fits */
export const attachmentLimitError = (
  kind: AgentAttachmentKind,
  size: number,
  counts: { images: number; total: number },
): AttachmentLimitError | null => {
  if (counts.total >= MAX_ATTACHMENTS) return 'too-many-attachments'
  if (kind === 'image') {
    if (counts.images >= MAX_IMAGES) return 'too-many-images'
    if (size > MAX_IMAGE_BYTES) return 'too-large'
  }
  if (kind === 'text' && size > MAX_TEXT_BYTES) return 'too-large'
  return null
}

/** Writes one image into `<agent-files>/<conversationId>/attachments/` and returns its relative path */
const writeImage = async (conversationId: string, name: string, data: Buffer, root?: string): Promise<string> => {
  const id = assertConversationId(conversationId)
  const extension = extensionOf(name)
  const fileName = `${randomId()}${extension ? `.${extension}` : ''}`
  const dir = path.join(getAgentFilesRoot(root), id, 'attachments')
  await fs.promises.mkdir(dir, { recursive: true })
  await writeFileAtomic(path.join(dir, fileName), data)
  return path.posix.join(id, 'attachments', fileName)
}

/** Turns the pending attachments into the message parts: images are written to disk, text is read and cut */
export const materializeAttachments = async (
  attachments: PendingAttachment[],
  conversationId: string,
  root?: string,
): Promise<AgentAttachmentPart[]> => {
  const parts: AgentAttachmentPart[] = []
  for (const attachment of attachments) {
    if (attachment.kind === 'image') {
      if (!attachment.file) continue
      const data = Buffer.from(await attachment.file.arrayBuffer())
      const relativePath = await writeImage(conversationId, attachment.name, data, root)
      parts.push({
        type: 'attachment',
        kind: 'image',
        name: attachment.name,
        size: attachment.size,
        mediaType: attachment.mediaType ?? imageMediaType(attachment.name),
        relativePath,
      })
    } else if (attachment.kind === 'text') {
      const raw = attachment.file ? await attachment.file.text() : ''
      const { text, truncated } = truncateText(raw)
      parts.push({ type: 'attachment', kind: 'text', name: attachment.name, size: attachment.size, text, truncated })
    } else {
      parts.push({
        type: 'attachment',
        kind: attachment.kind,
        name: attachment.name,
        size: attachment.size,
        path: attachment.path,
      })
    }
  }
  return parts
}
