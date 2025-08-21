export const isXML = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false
  }

  const trimmed = str.trim()

  if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
    return false
  }

  if (trimmed.startsWith('<?xml')) {
    return true
  }

  // Matches: <!-- comment --><tag>...</tag>, <tag>...</tag>, or <tag/>
  const xmlPattern =
    /^(<!--[\s\S]*?-->)*<([^\/\s>!]+)(?:\s[^>]*)?>[\s\S]*?<\/\2>$|^(<!--[\s\S]*?-->)*<[^\/\s>!]+(?:\s[^>]*)?\/?>$/

  return xmlPattern.test(trimmed)
}

export const escapeXmlForHtml = (str: string): string => {
  if (!str || typeof str !== 'string') {
    return str
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
