import moment from 'moment'

/**
 * Compact timestamp for a conversation row: `HH:mm` for today, `MM-DD` earlier the same year,
 * `YYYY-MM-DD` for other years.
 */
export const formatConversationTime = (value: number, now: number = Date.now()): string => {
  const date = moment(value)
  if (!date.isValid()) return ''
  const reference = moment(now)
  if (date.isSame(reference, 'day')) return date.format('HH:mm')
  if (date.isSame(reference, 'year')) return date.format('MM-DD')
  return date.format('YYYY-MM-DD')
}
