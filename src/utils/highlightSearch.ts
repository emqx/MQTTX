/**
 * Highlights search terms in text while preserving HTML structure
 * @param text - The text to highlight
 * @param searchTerm - The term to search for
 * @param className - CSS class for highlighting
 * @returns HTML string with highlighted terms
 */
export function highlightSearchTerm(text: string, searchTerm: string, className: string = 'search-highlight'): string {
  if (!searchTerm || !text) {
    return escapeHtml(text)
  }

  const escapedText = escapeHtml(text)
  const escapedSearchTerm = escapeRegExp(searchTerm)
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')

  return escapedText.replace(regex, `<span class="${className}">$1</span>`)
}

/**
 * Highlights search terms in JSON-highlighted code
 * @param element - The DOM element containing Prism-highlighted code
 * @param searchTerm - The term to search for
 * @param className - CSS class for highlighting
 */
export function highlightInPrismCode(
  element: HTMLElement,
  searchTerm: string,
  className: string = 'search-highlight',
): void {
  if (!searchTerm || !element) return

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Node) => NodeFilter.FILTER_ACCEPT,
  })

  const textNodes: Text[] = []
  let node: Node | null

  while ((node = walker.nextNode())) {
    textNodes.push(node as Text)
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent || ''
    if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
      const highlightedHTML = highlightSearchTerm(text, searchTerm, className)
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = highlightedHTML

      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      textNode.parentNode?.replaceChild(fragment, textNode)
    }
  })
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
