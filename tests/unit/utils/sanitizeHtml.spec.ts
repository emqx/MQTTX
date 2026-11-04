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

    expect(result).to.not.include('<script')
    expect(result).to.not.include('<iframe')
    expect(result).to.not.include('<img')
    expect(result).to.not.include('onclick')
    expect(result).to.not.include('style=')
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

  it('should keep details and summary collapsed without attributes', () => {
    const result = sanitizeHtml('<details open ontoggle="alert(1)"><summary>简体中文</summary>text</details>')

    expect(result).to.equal('<details><summary>简体中文</summary>text</details>')
  })

  it('should keep GitHub attachment images with only src and alt attributes', () => {
    const result = sanitizeHtml(
      '<img width="1499" height="982" alt="image" src="https://github.com/user-attachments/assets/abc" onerror="alert(1)">',
    )

    expect(result).to.include('<img')
    expect(result).to.include('src="https://github.com/user-attachments/assets/abc"')
    expect(result).to.include('alt="image"')
    expect(result).to.not.include('width')
    expect(result).to.not.include('height')
    expect(result).to.not.include('onerror')
  })

  const rejectedImageSources = [
    'http://github.com/user-attachments/assets/a',
    'https://github.com.evil.test/user-attachments/a',
    'https://evil.test/user-attachments/a',
    'https://github.com/emqx/MQTTX/raw/main/a.png',
    'data:image/png;base64,AAAA',
    '/user-attachments/a',
    null,
  ]

  rejectedImageSources.forEach((src) => {
    it(`should drop images with ${src === null ? 'no src' : src}`, () => {
      const html = src === null ? '<img alt="image">' : `<img alt="image" src="${src}">`

      expect(sanitizeHtml(html)).to.equal('')
    })
  })
})
