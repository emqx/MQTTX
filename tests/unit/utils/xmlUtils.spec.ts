import { expect } from 'chai'
import { isXML, escapeXmlForHtml } from '@/utils/xmlUtils'

describe('xmlUtils', () => {
  describe('isXML', () => {
    it('should return true for valid XML with declaration', () => {
      const xml = '<?xml version="1.0" encoding="UTF-8"?><root><child>content</child></root>'
      expect(isXML(xml)).to.be.true
    })

    it('should return true for valid simple XML', () => {
      const xml = '<root><child>content</child></root>'
      expect(isXML(xml)).to.be.true
    })

    it('should return true for self-closing XML tags', () => {
      const xml = '<element/>'
      expect(isXML(xml)).to.be.true
    })

    it('should return true for XML with attributes', () => {
      const xml = '<root attr="value"><child id="1">content</child></root>'
      expect(isXML(xml)).to.be.true
    })

    it('should return true for XML with namespace', () => {
      const xml = '<ns:root xmlns:ns="http://example.com"><ns:child>content</ns:child></ns:root>'
      expect(isXML(xml)).to.be.true
    })

    it('should return true for XML with multiple levels', () => {
      const xml = `
        <root>
          <level1>
            <level2>
              <level3>deep content</level3>
            </level2>
          </level1>
        </root>
      `
      expect(isXML(xml)).to.be.true
    })

    it('should return true for XML with CDATA', () => {
      const xml = '<root><![CDATA[Some <text> with special characters]]></root>'
      expect(isXML(xml)).to.be.true
    })

    it('should return false for empty string', () => {
      expect(isXML('')).to.be.false
    })

    it('should return false for null', () => {
      expect(isXML(null as any)).to.be.false
    })

    it('should return false for undefined', () => {
      expect(isXML(undefined as any)).to.be.false
    })

    it('should return false for non-string types', () => {
      expect(isXML(123 as any)).to.be.false
      expect(isXML({} as any)).to.be.false
      expect(isXML([] as any)).to.be.false
    })

    it('should return false for plain text', () => {
      expect(isXML('This is plain text')).to.be.false
    })

    it('should return false for JSON string', () => {
      const json = '{"key": "value", "number": 123}'
      expect(isXML(json)).to.be.false
    })

    it('should return false for malformed XML', () => {
      const malformed = '<root><child>content</child>'
      expect(isXML(malformed)).to.be.false
    })

    it('should return false for unclosed tags', () => {
      const unclosed = '<root><child>content'
      expect(isXML(unclosed)).to.be.false
    })

    it('should return false for HTML-like content without proper XML structure', () => {
      const html = '<div>Hello World'
      expect(isXML(html)).to.be.false
    })

    it('should handle XML with comments', () => {
      const xml = '<!-- comment --><root>content</root>'
      expect(isXML(xml)).to.be.true
    })

    it('should handle whitespace properly', () => {
      const xmlWithSpace = '   <root>content</root>   '
      expect(isXML(xmlWithSpace)).to.be.true
    })

    it('should return false for string starting with < but not ending with >', () => {
      expect(isXML('<root>content')).to.be.false
    })

    it('should return false for string ending with > but not starting with <', () => {
      expect(isXML('content</root>')).to.be.false
    })
  })

  describe('escapeXmlForHtml', () => {
    it('should escape basic XML entities', () => {
      const xml = '<root attr="value">content & more</root>'
      const expected = '&lt;root attr=&quot;value&quot;&gt;content &amp; more&lt;/root&gt;'
      expect(escapeXmlForHtml(xml)).to.equal(expected)
    })

    it('should escape single quotes', () => {
      const xml = "<root attr='value'>content</root>"
      const expected = '&lt;root attr=&#39;value&#39;&gt;content&lt;/root&gt;'
      expect(escapeXmlForHtml(xml)).to.equal(expected)
    })

    it('should handle empty string', () => {
      expect(escapeXmlForHtml('')).to.equal('')
    })

    it('should handle null input', () => {
      expect(escapeXmlForHtml(null as any)).to.equal(null)
    })

    it('should handle undefined input', () => {
      expect(escapeXmlForHtml(undefined as any)).to.equal(undefined)
    })

    it('should handle non-string input', () => {
      expect(escapeXmlForHtml(123 as any)).to.equal(123)
      expect(escapeXmlForHtml({} as any)).to.deep.equal({})
    })

    it('should escape all XML entities in complex content', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <element attr="value" attr2='value2'>
    Content with & ampersand, < less than, > greater than
    <nested>More "content" & 'text'</nested>
  </element>
</root>`

      const result = escapeXmlForHtml(xml)
      expect(result).to.include('&lt;?xml')
      expect(result).to.include('&lt;root&gt;')
      expect(result).to.include('attr=&quot;value&quot;')
      expect(result).to.include('attr2=&#39;value2&#39;')
      expect(result).to.include('&amp; ampersand')
      expect(result).to.include('&lt; less than')
      expect(result).to.include('&gt; greater than')
      expect(result).to.include('&lt;nested&gt;')
      expect(result).to.include('&quot;content&quot;')
      expect(result).to.include('&#39;text&#39;')
    })

    it('should handle text without XML characters', () => {
      const text = 'This is plain text without XML characters'
      expect(escapeXmlForHtml(text)).to.equal(text)
    })

    it('should handle mixed content', () => {
      const mixed = 'Before XML <tag>content</tag> after XML & ampersand'
      const expected = 'Before XML &lt;tag&gt;content&lt;/tag&gt; after XML &amp; ampersand'
      expect(escapeXmlForHtml(mixed)).to.equal(expected)
    })
  })
})
