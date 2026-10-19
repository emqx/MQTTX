import { expect } from 'chai'
import {
  ConnectionMention,
  connectionEndpoint,
  filterConnections,
  findMentionQuery,
  highlightMention,
  mentionMatches,
  renderConnectionPrompt,
} from '@/utils/ai/agent/mentions'

const connection = (overrides: Partial<ConnectionMention> = {}): ConnectionMention => ({
  id: 'id',
  name: 'Name',
  host: 'broker.example.com',
  port: 1883,
  connected: false,
  ...overrides,
})

describe('agent connection mentions', () => {
  describe('findMentionQuery', () => {
    it('should open at the start of the text', () => {
      expect(findMentionQuery('@br', 3)).to.deep.equal({ start: 0, end: 3, query: 'br' })
    })

    it('should open after whitespace', () => {
      expect(findMentionQuery('connect to @pro', 15)).to.deep.equal({ start: 11, end: 15, query: 'pro' })
      expect(findMentionQuery('a\n@x', 4)).to.deep.equal({ start: 2, end: 4, query: 'x' })
    })

    it('should open on a bare @ so the whole list shows', () => {
      expect(findMentionQuery('@', 1)).to.deep.equal({ start: 0, end: 1, query: '' })
    })

    it('should not trigger inside a word, like an email address', () => {
      expect(findMentionQuery('a@b.com', 7)).to.equal(null)
      expect(findMentionQuery('user@host', 9)).to.equal(null)
    })

    it('should close once the query contains a space', () => {
      expect(findMentionQuery('@broker and', 11)).to.equal(null)
    })

    it('should use the word before the caret, not the whole text', () => {
      expect(findMentionQuery('@first then', 4)).to.deep.equal({ start: 0, end: 4, query: 'fir' })
      expect(findMentionQuery('@first then', 11)).to.equal(null)
      expect(findMentionQuery('@first @sec', 11)).to.deep.equal({ start: 7, end: 11, query: 'sec' })
    })

    it('should return nothing without an @ or with an out of range caret', () => {
      expect(findMentionQuery('hello', 5)).to.equal(null)
      expect(findMentionQuery('@ab', 99)).to.deep.equal({ start: 0, end: 3, query: 'ab' })
      expect(findMentionQuery('@ab', -1)).to.equal(null)
    })
  })

  describe('mentionMatches', () => {
    it('should match case-insensitively and accept everything for an empty query', () => {
      expect(mentionMatches('Local Broker', 'broker')).to.equal(true)
      expect(mentionMatches('Local Broker', 'LOCAL')).to.equal(true)
      expect(mentionMatches('Local Broker', '')).to.equal(true)
      expect(mentionMatches('Local Broker', 'prod')).to.equal(false)
    })
  })

  describe('highlightMention', () => {
    it('should highlight only the first match', () => {
      expect(highlightMention('my broker-broker', 'BROKER')).to.deep.equal([
        { text: 'my ', hit: false },
        { text: 'broker', hit: true },
        { text: '-broker', hit: false },
      ])
    })

    it('should return one plain piece without a query', () => {
      expect(highlightMention('broker', '')).to.deep.equal([{ text: 'broker', hit: false }])
      expect(highlightMention('', 'x')).to.deep.equal([{ text: '', hit: false }])
    })
  })

  describe('filterConnections', () => {
    const current = connection({ id: 'current', name: 'Zeta', host: 'z.example.com' })
    const alpha = connection({ id: 'a', name: 'Alpha', host: 'a.example.com', port: 8883 })
    const beta = connection({ id: 'b', name: 'Beta', host: 'broker.example.com' })

    it('should match on the name, the host and the port', () => {
      expect(filterConnections('alp', [alpha, beta]).map((c) => c.id)).to.deep.equal(['a'])
      expect(filterConnections('broker.example', [alpha, beta]).map((c) => c.id)).to.deep.equal(['b'])
      expect(filterConnections('8883', [alpha, beta]).map((c) => c.id)).to.deep.equal(['a'])
    })

    it('should match case-insensitively', () => {
      expect(filterConnections('BETA', [alpha, beta]).map((c) => c.id)).to.deep.equal(['b'])
    })

    it('should list the current connection first and sort the rest by name', () => {
      expect(filterConnections('', [beta, current, alpha], 'current').map((c) => c.id)).to.deep.equal([
        'current',
        'a',
        'b',
      ])
      expect(filterConnections('', [beta, current, alpha]).map((c) => c.id)).to.deep.equal(['a', 'b', 'current'])
    })

    it('should keep the current connection first while filtering', () => {
      const other = connection({ id: 'other', name: 'Zebra', host: 'z2.example.com' })
      expect(filterConnections('z', [current, other], 'current').map((c) => c.id)).to.deep.equal(['current', 'other'])
    })

    it('should return nothing when no connection matches', () => {
      expect(filterConnections('nope', [alpha, beta])).to.deep.equal([])
    })

    it('should show every connection for an empty query', () => {
      expect(filterConnections('', [alpha, beta])).to.have.length(2)
    })
  })

  describe('connectionEndpoint', () => {
    it('should join the host and the port', () => {
      expect(connectionEndpoint(connection({ host: 'broker.emqx.io', port: 8883 }))).to.equal('broker.emqx.io:8883')
    })
  })

  describe('renderConnectionPrompt', () => {
    it('should list only the names and the ids', () => {
      const prompt = renderConnectionPrompt([
        { connectionId: 'c1', name: 'Local broker' },
        { connectionId: 'c2', name: 'Prod' },
      ])

      expect(prompt).to.equal(
        '[Connections mentioned by the user: "Local broker" (id: c1), "Prod" (id: c2)] ' +
          'Read them with get_connection before using them.',
      )
      expect(prompt).to.not.contain('password')
      expect(prompt).to.not.contain('username')
    })
  })
})
