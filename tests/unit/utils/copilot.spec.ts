import { expect } from 'chai'
import { processStream } from '@/utils/copilot'

describe('Copilot', () => {
  describe('processStream', () => {
    it('should process stream data and invoke callback for each content', async () => {
      let readCount = 0
      const mockReader = {
        read: async () => {
          readCount++
          if (readCount === 1) {
            return {
              done: false,
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n'),
            }
          } else if (readCount === 2) {
            return {
              done: false,
              value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":" World"}}]}\n\n'),
            }
          } else {
            return { done: true }
          }
        },
      }

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response

      const callbackResults: string[] = []
      const callback = (content: string) => {
        callbackResults.push(content)
      }

      const result = await processStream(mockResponse, callback)

      expect(result).to.be.true
      expect(callbackResults).to.have.lengthOf(2)
      expect(callbackResults[0]).to.equal('Hello')
      expect(callbackResults[1]).to.equal(' World')
    })
  })
})
