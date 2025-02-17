import { describe, expect, it } from 'vitest'
import { getMessageId } from '../idGenerator'

describe('getMessageId', () => {
  it('should return a string that starts with "message_" followed by a UUIDv4', () => {
    const id = getMessageId()

    expect(typeof id).toBe('string')

    expect(id.startsWith('message_')).toBe(true)

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const uuid = id.split('message_')[1]
    expect(uuid).toMatch(uuidRegex)
  })
})
