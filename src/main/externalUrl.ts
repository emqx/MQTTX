const ALLOWED_DOMAINS = ['mqttx.app', 'github.com', 'emqx.io', 'emqx.com']

/**
 * Checks a URL before it is handed to the OS or opened outside the app window.
 *
 * Only web links on the project domains pass: the renderer has Node access, so
 * custom schemes and lookalike hosts must never reach `shell.openExternal`.
 */
export function isAllowedExternalUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false
    }
    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch (error) {
    return false
  }
}
