import fs from 'fs'
import path from 'path'
import { SSLPath, SSLContent } from '@/views/connections/types'

export const getCAFile = () => {
  // igonre
}

export const getSSLFile = (sslPath: SSLPath): SSLContent | undefined => {
  const { ca, cert, key } = sslPath
  if (ca === '' && cert === '' && key === '') {
    return undefined
  }
  const res: SSLContent = {
    ca: fs.readFileSync(path.join(ca), 'utf-8'),
    cert: fs.readFileSync(path.join(cert), 'utf-8'),
    key: fs.readFileSync(path.join(key), 'utf-8'),
  }
  return res
}

export default {}
