const ALLOWED_DOMAINS = ['mqttx.app', 'github.com', 'emqx.io', 'emqx.com']

/** Whether a URL is an http(s) link on a project domain, the only kind passed to `shell.openExternal` */
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
