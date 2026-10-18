import { expect } from 'chai'
import zlib from 'zlib'
import { gunzipIfCompressed } from '@/utils/gzip'

describe('gunzipIfCompressed', () => {
  it('should decompress gzip payloads', () => {
    const payload = zlib.gzipSync(Buffer.from('{"temp":25}'))
    expect(gunzipIfCompressed(payload).toString()).to.equal('{"temp":25}')
  })

  it('should return non-gzip payloads unchanged', () => {
    const payload = Buffer.from('plain text')
    expect(gunzipIfCompressed(payload)).to.equal(payload)
  })

  it('should return empty payloads unchanged', () => {
    const payload = Buffer.alloc(0)
    expect(gunzipIfCompressed(payload)).to.equal(payload)
  })

  it('should throw on corrupted gzip payloads', () => {
    const payload = Buffer.from([0x1f, 0x8b, 0x00, 0x01])
    expect(() => gunzipIfCompressed(payload)).to.throw()
  })
})
