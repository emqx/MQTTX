import fs from 'fs'
import path from 'path'
import { SSLPath, SSLContent } from '@/views/connections/types'

export const getSSLFile = (sslPath: SSLPath): SSLContent | undefined => {
  const { ca, cert, key } = sslPath
  const res: SSLContent = {
    ca: ca !== '' ? [fs.readFileSync(path.join(ca), 'utf-8')] : undefined,
    cert: cert !== '' ? fs.readFileSync(path.join(cert), 'utf-8') : undefined,
    key: key !== '' ? fs.readFileSync(path.join(key), 'utf-8') : undefined,
  }
  return res
}

export default {}
