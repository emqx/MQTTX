import { expect } from 'chai'
import { escapeHtml, highlightSearchTerm } from '@/utils/highlightSearch'

describe('highlightSearch', () => {
  describe('escapeHtml', () => {
    it('should escape HTML tags in MQTT topic names', () => {
      const maliciousTopic = `poc/<img src=x onerror="alert('xss')">`
      const result = escapeHtml(maliciousTopic)
      expect(result).to.not.include('<img')
      expect(result).to.include('&lt;img')
    })

    it('should escape ampersands, quotes and angle brackets', () => {
      expect(escapeHtml(`a & b <c> "d"`)).to.equal('a &amp; b &lt;c&gt; "d"')
    })

    it('should leave normal topic names untouched', () => {
      expect(escapeHtml('sensor/+/temperature')).to.equal('sensor/+/temperature')
    })

    it('should handle empty string', () => {
      expect(escapeHtml('')).to.equal('')
    })
  })

  describe('highlightSearchTerm', () => {
    it('should escape HTML in text when highlighting', () => {
      const text = `poc/<img src=x onerror="alert('xss')">`
      const result = highlightSearchTerm(text, 'img', 'search-highlight')
      expect(result).to.not.include('<img')
      expect(result).to.include('&lt;')
      expect(result).to.include('<span class="search-highlight">img</span>')
    })

    it('should escape HTML in the matched search term itself', () => {
      const result = highlightSearchTerm('a<script>b</script>c', '<script>', 'search-highlight')
      expect(result).to.not.include('<script>')
      expect(result).to.include('<span class="search-highlight">&lt;script&gt;</span>')
    })

    it('should return the original text when search term is empty', () => {
      expect(highlightSearchTerm('topic/name', '', 'search-highlight')).to.equal('topic/name')
    })

    it('should highlight normal search terms', () => {
      const result = highlightSearchTerm('sensor/temperature', 'temp', 'search-highlight')
      expect(result).to.equal('sensor/<span class="search-highlight">temp</span>erature')
    })
  })
})
