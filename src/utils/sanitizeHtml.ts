const ALLOWED_TAGS = new Set(
  'h1 h2 h3 h4 h5 h6 p br hr ul ol li strong b em i code pre blockquote a table thead tbody tr th td del s span'.split(
    ' ',
  ),
)

// These elements are dropped together with everything inside them.
const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg'])

const isHttpUrl = (href: string): boolean => {
  try {
    const { protocol } = new URL(href)
    return protocol === 'http:' || protocol === 'https:'
  } catch (e) {
    return false
  }
}

/**
 * Rebuilds untrusted HTML (e.g. the remote changelog) using only allowlisted
 * elements and http(s) links. DOMParser gives an inert document, so nothing in
 * the input loads or runs; only attributes we copy survive.
 */
export const sanitizeHtml = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const output = doc.createElement('div')

  const copyChildren = (source: Element, target: Element) => {
    for (const node of Array.from(source.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        target.appendChild(doc.createTextNode(node.textContent || ''))
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tag = element.tagName.toLowerCase()
        if (DROPPED_TAGS.has(tag)) continue
        if (!ALLOWED_TAGS.has(tag)) {
          copyChildren(element, target)
          continue
        }
        const copy = doc.createElement(tag)
        const href = element.getAttribute('href')
        if (tag === 'a' && href && isHttpUrl(href)) copy.setAttribute('href', href)
        copyChildren(element, copy)
        target.appendChild(copy)
      }
    }
  }

  copyChildren(doc.body, output)
  return output.innerHTML
}
