/**
 * `@` connection mentions in the composer.
 *
 * Everything here is pure so the composer, the message renderer and the tests share one definition of
 * what a mention is: which `@word` the caret sits in, which connections match it, and the single line
 * of text the model gets for a message. The model only ever receives the connection name and id —
 * never any other field of the record (no password, no certificate paths).
 */
export interface ConnectionMention {
  id: string
  name: string
  host: string
  port: number
  /** Whether this connection has a live client, as shown by the dot in the menu */
  connected: boolean
}

/** The `@word` before the caret that opened the menu */
export interface MentionQuery {
  /** Index of the `@` */
  start: number
  /** Caret position: exclusive end of the query */
  end: number
  /** Text typed after the `@`, without whitespace */
  query: string
}

/** `host:port`, the secondary text of a menu row */
export const connectionEndpoint = (connection: Pick<ConnectionMention, 'host' | 'port'>): string =>
  `${connection.host}:${connection.port}`

const isSpace = (character: string): boolean => /\s/.test(character)

/**
 * Finds the mention the caret is inside, or null when there is none.
 *
 * The `@` must start the text or follow whitespace (`a@b.com` is an email, not a mention), and the
 * text between it and the caret must not contain whitespace, so typing a space closes the menu.
 */
export const findMentionQuery = (text: string, caret: number): MentionQuery | null => {
  const limit = Math.max(0, Math.min(caret, text.length))
  const before = text.slice(0, limit)
  const start = before.lastIndexOf('@')
  if (start === -1) return null

  const query = before.slice(start + 1)
  if (query.split('').some(isSpace)) return null

  const previous = start > 0 ? before[start - 1] : ''
  if (previous && !isSpace(previous)) return null

  return { start, end: limit, query }
}

/** Case-insensitive substring match, the rule shared by filtering and highlighting */
export const mentionMatches = (text: string, query: string): boolean =>
  query ? text.toLowerCase().includes(query.toLowerCase()) : true

/** Splits text around the first match of the query, so only one span per row is highlighted */
export const highlightMention = (text: string, query: string): Array<{ text: string; hit: boolean }> => {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1
  if (at === -1) return [{ text, hit: false }]

  const end = at + query.length
  return [
    { text: text.slice(0, at), hit: false },
    { text: text.slice(at, end), hit: true },
    { text: text.slice(end), hit: false },
  ].filter((piece) => piece.text)
}

const byNameThenId = (a: ConnectionMention, b: ConnectionMention): number => {
  const left = a.name.toLowerCase()
  const right = b.name.toLowerCase()
  if (left !== right) return left < right ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * The rows of the mention menu: connections whose name or `host:port` contains the query,
 * with the connection the user is looking at first and the rest sorted by name.
 */
export const filterConnections = (
  query: string,
  connections: ConnectionMention[],
  currentId = '',
): ConnectionMention[] =>
  connections
    .filter(
      (connection) => mentionMatches(connection.name, query) || mentionMatches(connectionEndpoint(connection), query),
    )
    .sort((a, b) => {
      if (a.id === b.id) return 0
      if (a.id === currentId) return -1
      if (b.id === currentId) return 1
      return byNameThenId(a, b)
    })

/** One line telling the model which connections the user mentioned; name and id only */
export const renderConnectionPrompt = (mentions: Array<{ connectionId: string; name: string }>): string => {
  const list = mentions.map((mention) => `"${mention.name}" (id: ${mention.connectionId})`).join(', ')
  return `[Connections mentioned by the user: ${list}] Read them with get_connection before using them.`
}
