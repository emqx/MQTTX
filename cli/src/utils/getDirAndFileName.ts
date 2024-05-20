import path from 'path'
import { fileURLToPath } from 'url'

export default function getDirAndFileName(metaUrl: string) {
  const __filename = fileURLToPath(metaUrl)
  const __dirname = path.dirname(__filename)

  return { __dirname, __filename }
}
