import type { Options } from 'electron-context-menu'
import type { Lang } from 'mqttx'
import Store from 'electron-store'
import contextMenuLabels from './contextMenuLabels'

// FIXME: https://github.com/sindresorhus/electron-store/issues/276
const store = new Store() as any

export function getContextMenuLabels(lang: Lang) {
  const labels: Options['labels'] = {}
  Object.keys(contextMenuLabels).forEach((key) => {
    labels[key] = contextMenuLabels[key][lang]
  })
  return labels
}

export const contextMenuConfig: Options = {
  showCopyImage: false,
  labels: getContextMenuLabels('en'),
  shouldShowMenu: (_event, parameters) => {
    // @ts-expect-error To support i18n, we need to set labels dynamically
    contextMenuConfig.labels = getContextMenuLabels(store.get('currentLang') || 'en')

    // Doesn't show the menu if the link is the internal link
    const { linkURL, pageURL } = parameters
    const linkURLPrefix = linkURL?.split('#')[0]
    const pageURLPrefix = pageURL?.split('#')[0]
    if (linkURLPrefix === pageURLPrefix) {
      return false
    }
    return true
  },
}
