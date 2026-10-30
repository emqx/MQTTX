import { expect } from 'chai'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

// jsdom-global does not copy DOMParser onto the Node global that mocha runs with.
if (typeof globalThis.DOMParser === 'undefined') {
  globalThis.DOMParser = window.DOMParser
}

describe('sanitizeHtml utility function', () => {
  it('should keep allowlisted changelog markup and https links', () => {
    const html =
      '<h1>Release Note</h1><p><strong>MQTTX Agent</strong> released</p>' +
      '<ul><li>fixed <code>payload</code> parsing</li></ul>' +
      '<p><a href="https://mqttx.app/changelogs">Changelog</a></p>'
    const result = sanitizeHtml(html)

    expect(result).to.include('<h1>Release Note</h1>')
    expect(result).to.include('<p><strong>MQTTX Agent</strong> released</p>')
    expect(result).to.include('<li>fixed <code>payload</code> parsing</li>')
    expect(result).to.include('<a href="https://mqttx.app/changelogs">Changelog</a>')
  })

  it('should remove executable elements and event or style attributes', () => {
    const html =
      '<p>safe</p><img src="x" onerror="require(\'child_process\').exec(\'id\')">' +
      "<script>require('fs').rmSync('/')</script><iframe src=\"https://evil.test\"></iframe>" +
      '<svg onload="alert(1)"><circle /></svg><p onclick="alert(1)" style="color:red">text</p>'
    const result = sanitizeHtml(html)

    expect(result).to.include('<p>safe</p>')
    expect(result).to.include('<p>text</p>')
    expect(result).to.not.include('script')
    expect(result).to.not.include('iframe')
    expect(result).to.not.include('svg')
    expect(result).to.not.include('circle')
    expect(result).to.not.include('img')
    expect(result).to.not.include('onerror')
    expect(result).to.not.include('onload')
    expect(result).to.not.include('onclick')
    expect(result).to.not.include('style=')
    expect(result).to.not.include('alert(1)')
  })

  it('should drop javascript: hrefs but keep the link text', () => {
    const result = sanitizeHtml(
      '<p><a href="javascript:alert(1)">click me</a></p>' +
        '<a href="data:text/html,<script>alert(1)</script>">data</a>',
    )

    expect(result).to.include('<p><a>click me</a></p>')
    expect(result).to.include('<a>data</a>')
    expect(result).to.not.include('javascript:')
    expect(result).to.not.include('data:text/html')
  })

  it('should preserve a realistic changelog response in meaning', () => {
    const html =
      '<h1>Release Note 🎉</h1>\n<p>🤖 <strong>MQTTX Agent v1.9.0 is now available.</strong></p>\n' +
      "<h3>What's New</h3>\n<ul>\n<li><strong>Agent</strong> supports custom skills</li>\n" +
      '<li>Improved <em>performance</em> of the connection list</li>\n</ul>\n' +
      '<h3>Fixed</h3>\n<ul>\n<li>Fixed a crash when <code>payload</code> is empty</li>\n' +
      '<li>See <a href="https://mqttx.app/changelogs">the changelog</a> for details</li>\n</ul>'
    const result = sanitizeHtml(html)

    expect(result).to.include('Release Note 🎉')
    expect(result).to.include('<strong>MQTTX Agent v1.9.0 is now available.</strong>')
    expect(result).to.include("<h3>What's New</h3>")
    expect(result).to.include('<li><strong>Agent</strong> supports custom skills</li>')
    expect(result).to.include('<em>performance</em>')
    expect(result).to.include('<code>payload</code>')
    expect(result).to.include('<a href="https://mqttx.app/changelogs">the changelog</a>')
  })
})
