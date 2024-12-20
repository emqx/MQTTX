import CryptoJS from 'crypto-js'
import { customType } from 'drizzle-orm/sqlite-core'

const secretKey = import.meta.env.VITE_DB_SECRET_KEY ?? 'dah9MVR-nxp.qcw_maj'

const encryptedText = customType<{ data: string, driverData: string, notNull: true, default: true }>({
  dataType() {
    return 'text'
  },
  toDriver(value: string): string {
    return CryptoJS.AES.encrypt(value, secretKey).toString()
  },
  fromDriver(value: string): string {
    return CryptoJS.AES.decrypt(value, secretKey).toString(CryptoJS.enc.Utf8)
  },
})

export { encryptedText }
