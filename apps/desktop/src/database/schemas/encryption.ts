import CryptoJS from 'crypto-js'
import { customType } from 'drizzle-orm/sqlite-core'

// FIXME: During database migration, drizzle-kit will prompt "import.meta" is not available with the "cjs" output format and will be empty
// Temporary solution: Use process.env.VITE_DB_SECRET_KEY. Although there will still be a warning, the secretKey will be correctly assigned
// Issue: https://github.com/drizzle-team/drizzle-orm/issues/3304
const secretKey = import.meta.env?.VITE_DB_SECRET_KEY ?? process.env?.VITE_DB_SECRET_KEY ?? 'dah9MVR-nxp.qcw_maj'

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
