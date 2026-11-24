import messages from '../lang/cloud'
import type { CloudIssue } from '../types/cloud'

// Inline the shared logo so the callback page does not need a separate asset request.
const MQTTX_LOGO_DATA_URI = require('!!url-loader?limit=true!../assets/images/app-logo.png') as string

type CallbackLocale = keyof typeof messages.errors.OPERATION_FAILED
type CallbackStatus = 'success' | 'warning' | 'error'

function resolveLocale(locale: string): CallbackLocale {
  return Object.prototype.hasOwnProperty.call(messages.errors.OPERATION_FAILED, locale)
    ? (locale as CallbackLocale)
    : 'en'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function callbackStatus(code: string): {
  kind: CallbackStatus
  titleKey: keyof typeof messages.callbackPage
  iconSvg: string
} {
  if (code === 'AUTH_COMPLETE') {
    return {
      kind: 'success',
      titleKey: 'successTitle',
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    }
  }
  if (code === 'AUTH_CANCELLED' || code === 'AUTH_CALLBACK_HANDLED') {
    return {
      kind: 'warning',
      titleKey: code === 'AUTH_CANCELLED' ? 'cancelledTitle' : 'handledTitle',
      iconSvg:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v6"/><path d="M12 17h.01"/></svg>',
    }
  }
  return {
    kind: 'error',
    titleKey: 'errorTitle',
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8l-8 8"/><path d="M8 8l8 8"/></svg>',
  }
}

// The browser callback is rendered in the main process, outside Vue's i18n instance.
export function cloudCallbackText(code: string, locale: string): string {
  const key = code as keyof typeof messages.errors
  const values = Object.prototype.hasOwnProperty.call(messages.errors, code)
    ? messages.errors[key]
    : messages.errors.OPERATION_FAILED
  return values[resolveLocale(locale)]
}

export function cloudCallbackHtml(code: string, locale: string): string {
  const lang = resolveLocale(locale)
  const { kind, titleKey, iconSvg } = callbackStatus(code)
  const title = escapeHtml(messages.callbackPage[titleKey][lang])
  const detail = escapeHtml(cloudCallbackText(code, lang))
  const supportLink =
    kind === 'error'
      ? `<a class="support-link" href="mailto:cloud-support@emqx.io">${escapeHtml(
          messages.callbackPage.contactSupport[lang],
        )}</a>`
      : ''

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - MQTTX</title>
  <link rel="icon" type="image/png" href="${MQTTX_LOGO_DATA_URI}">
  <style>
    :root {
      --bg: #f6f8fa;
      --dot: #e2e8f0;
      --card-bg: #ffffff;
      --card-border: #e6ebf1;
      --tile-bg: #ffffff;
      --tile-border: #e6ebf1;
      --tile-shadow: 0 6px 18px -6px rgba(15, 23, 42, 0.12);
      --shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 16px 40px -16px rgba(15, 23, 42, 0.12);
      --text-title: #181c24;
      --text-body: #5b6575;
      --text-muted: #8c96a6;
      --link: #006b56;
      --success-bg: #18866a;
      --warning-bg: #d97706;
      --error-bg: #dc2626;
      --badge-fg: #ffffff;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14171c;
        --dot: #232831;
        --card-bg: #1c2027;
        --card-border: #2b313c;
        --tile-bg: #232832;
        --tile-border: #323946;
        --tile-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.45);
        --shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 20px 44px -16px rgba(0, 0, 0, 0.55);
        --text-title: #f1f5f9;
        --text-body: #a6b0c0;
        --text-muted: #6e788a;
        --link: #73d9ba;
        --success-bg: #22a07e;
        --warning-bg: #d97706;
        --error-bg: #ef4444;
        --badge-fg: #ffffff;
      }
    }
    * {
      box-sizing: border-box;
    }
    html,
    body {
      margin: 0;
      height: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: var(--text-title);
      background-color: var(--bg);
      background-image: radial-gradient(var(--dot) 1.2px, transparent 1.2px);
      background-size: 24px 24px;
      background-position: center;
      -webkit-font-smoothing: antialiased;
    }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 24px 8vh;
    }
    .card {
      width: 100%;
      max-width: 420px;
      padding: 48px 40px 44px;
      border: 1px solid var(--card-border);
      border-radius: 16px;
      background: var(--card-bg);
      box-shadow: var(--shadow);
      text-align: center;
    }
    .emblem {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      margin: 0 auto 28px;
      border: 1px solid var(--tile-border);
      border-radius: 18px;
      background: var(--tile-bg);
      box-shadow: var(--tile-shadow);
    }
    .emblem img {
      width: 44px;
      height: 44px;
      display: block;
    }
    .status-badge {
      position: absolute;
      right: -7px;
      bottom: -7px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border: 3px solid var(--card-bg);
      border-radius: 50%;
      color: var(--badge-fg);
    }
    .status-badge svg {
      width: 13px;
      height: 13px;
    }
    .status-badge.is-success {
      background: var(--success-bg);
    }
    .status-badge.is-warning {
      background: var(--warning-bg);
    }
    .status-badge.is-error {
      background: var(--error-bg);
    }
    h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 500;
      line-height: 1.4;
      letter-spacing: -0.01em;
      color: var(--text-title);
    }
    .detail {
      max-width: 320px;
      margin: 10px auto 0;
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-body);
      text-wrap: balance;
    }
    .support-link {
      display: inline-block;
      margin-top: 16px;
      color: var(--link);
      font-size: 14px;
      line-height: 1.5;
      text-underline-offset: 3px;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: var(--text-muted);
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <main class="card" role="status">
    <div class="emblem">
      <img src="${MQTTX_LOGO_DATA_URI}" alt="MQTTX">
      <span class="status-badge is-${kind}">${iconSvg}</span>
    </div>
    <h1>${title}</h1>
    <p class="detail">${detail}</p>
    ${supportLink}
  </main>
  <footer class="footer">MQTTX &middot; EMQX Cloud</footer>
</body>
</html>`
}

export function cloudErrorKey(issue: CloudIssue): string {
  return `cloud.errors.${
    Object.prototype.hasOwnProperty.call(messages.errors, issue.code) ? issue.code : 'OPERATION_FAILED'
  }`
}
