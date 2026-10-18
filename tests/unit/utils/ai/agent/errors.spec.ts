import { expect } from 'chai'
import { APICallError } from '@ai-sdk/provider'
import { describeAgentError } from '@/utils/ai/agent/errors'

describe('describeAgentError', () => {
  const apiError = (message: string, responseBody?: string) =>
    new APICallError({ message, url: 'https://api.example.com', requestBodyValues: {}, statusCode: 401, responseBody })

  it('should use the status code and body when the message is empty', () => {
    expect(describeAgentError(apiError('', 'Authentication Fails'))).to.equal('401: Authentication Fails')
  })

  it('should prefer the message over the body', () => {
    expect(describeAgentError(apiError('Invalid API key', '{"error":{}}'))).to.equal('401: Invalid API key')
  })

  it('should use the message of a plain error', () => {
    expect(describeAgentError(new Error('Network down'))).to.equal('Network down')
  })

  it('should stringify a value that is not an error', () => {
    expect(describeAgentError('boom')).to.equal('boom')
  })
})
