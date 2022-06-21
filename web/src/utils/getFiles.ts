import { Notification } from 'element-ui'
import { SSLPath, SSLContent } from '@/views/connections/types'

export const getSSLFile = (sslPath: SSLPath): SSLContent | undefined => {
  const { ca, cert, key } = sslPath
  try {
    const res: SSLContent = {
      ca: ca !== '' ? ca : undefined,
      cert: cert !== '' ? cert : undefined,
      key: key !== '' ? key : undefined,
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
