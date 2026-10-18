import { expect } from 'chai'
import { formatConversationTime } from '@/utils/ai/agent/conversationTime'

describe('formatConversationTime', () => {
  // Fixed reference so the three cases are deterministic: 2026-10-17 15:00 local time
  const now = new Date(2026, 9, 17, 15, 0, 0).getTime()

  it('should show HH:mm for today', () => {
    expect(formatConversationTime(new Date(2026, 9, 17, 9, 5, 0).getTime(), now)).to.equal('09:05')
  })

  it('should show MM-DD earlier the same year', () => {
    expect(formatConversationTime(new Date(2026, 2, 4, 9, 5, 0).getTime(), now)).to.equal('03-04')
  })

  it('should show YYYY-MM-DD for another year', () => {
    expect(formatConversationTime(new Date(2025, 11, 31, 23, 30, 0).getTime(), now)).to.equal('2025-12-31')
  })
})
