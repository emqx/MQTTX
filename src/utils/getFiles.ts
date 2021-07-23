import fs from 'fs'
import { Notification } from 'element-ui'

export const getSSLFile = (sslPath: SSLPath): SSLContent | undefined => {
  const { ca, cert, key } = sslPath
  try {
    const res: SSLContent = {
      ca: ca !== '' ? [fs.readFileSync(ca)] : undefined,
      cert: cert !== '' ? fs.readFileSync(cert) : undefined,
      key: key !== '' ? fs.readFileSync(key) : undefined,
    }
    return res
  } catch (error) {
    Notification({
      title: error.toString(),
      message: '',
      type: 'error',
    })
  }
}

export default {}
