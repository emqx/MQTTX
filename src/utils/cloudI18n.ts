import messages from '../lang/cloud'
import type { CloudIssue } from '../types/cloud'

type CallbackLocale = keyof typeof messages.errors.OPERATION_FAILED

export function resolveCloudLocale(locale: string): CallbackLocale {
  return Object.prototype.hasOwnProperty.call(messages.errors.OPERATION_FAILED, locale)
    ? (locale as CallbackLocale)
    : 'en'
}

// The browser callback is rendered in the main process, outside Vue's i18n instance.
export function cloudCallbackText(code: string, locale: string): string {
  const key = code as keyof typeof messages.errors
  const values = Object.prototype.hasOwnProperty.call(messages.errors, code)
    ? messages.errors[key]
    : messages.errors.OPERATION_FAILED
  return values[resolveCloudLocale(locale)]
}

export function cloudErrorKey(issue: CloudIssue): string {
  return `cloud.errors.${
    Object.prototype.hasOwnProperty.call(messages.errors, issue.code) ? issue.code : 'OPERATION_FAILED'
  }`
}
