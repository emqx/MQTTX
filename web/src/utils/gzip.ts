import zlib from 'zlib'

// Gzip data always starts with the magic bytes 1f 8b; anything else passes through unchanged.
export const gunzipIfCompressed = (payload: Buffer): Buffer =>
  payload[0] === 0x1f && payload[1] === 0x8b ? zlib.gunzipSync(payload) : payload
