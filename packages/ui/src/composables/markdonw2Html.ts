import md from 'markdown-it'

const markdown = md({
  linkify: true,
  html: true,
}).use((md) => {
  const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }

  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const hrefIndex = tokens[idx].attrIndex('href')
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs?.[hrefIndex][1] ?? ''
      if (href.startsWith('http')) {
        tokens[idx].attrPush(['target', '_blank'])
        tokens[idx].attrPush(['rel', 'noopener noreferrer'])
      }
    }
    return defaultRender(tokens, idx, options, env, self)
  }
})

export function markdown2Html(markdownStr: string): string {
  return markdown.render(markdownStr)
}
