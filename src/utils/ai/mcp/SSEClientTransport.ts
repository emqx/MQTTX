import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import { URL } from 'url'

// Use require for SDK modules since TypeScript can't find the ESM types
const { SSEClientTransport } = require('@modelcontextprotocol/sdk/dist/esm/client/sse.js')

// Implement fetch for Node.js environment
async function nodeFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsedUrl = typeof url === 'string' ? new URL(url) : url
    const requestFn = parsedUrl.protocol === 'https:' ? httpsRequest : httpRequest

    const req = requestFn(
      parsedUrl,
      {
        method: init?.method || 'GET',
        headers: init?.headers as Record<string, string>,
      },
      (res) => {
        const response = {
          ok: res.statusCode! >= 200 && res.statusCode! < 300,
          status: res.statusCode!,
          statusText: res.statusMessage!,
          headers: new Headers(res.headers as Record<string, string>),
          async text() {
            return new Promise((resolve) => {
              let data = ''
              res.on('data', (chunk) => (data += chunk))
              res.on('end', () => resolve(data))
            })
          },
        }

        resolve(response as Response)
      },
    )

    if (init?.body) {
      req.write(init.body)
    }

    req.on('error', reject)
    req.end()
  })
}

// Add fetch to global scope
if (!global.fetch) {
  ;(global as any).fetch = nodeFetch
  ;(global as any).Headers = class Headers extends Map {
    constructor(init?: Record<string, string>) {
      super()
      if (init) {
        Object.entries(init).forEach(([k, v]) => this.set(k, v))
      }
    }
  }
}

// Re-export the SDK's SSEClientTransport
export { SSEClientTransport }
