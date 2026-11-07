import messages from '../lang/cloud'
import type { CloudIssue } from '../types/cloud'

// The browser callback is rendered in the main process, outside Vue's i18n instance.
export function cloudCallbackText(code: string, locale: string): string {
  const key = code as keyof typeof messages.errors
  const values = Object.prototype.hasOwnProperty.call(messages.errors, code)
    ? messages.errors[key]
    : messages.errors.OPERATION_FAILED
  return Object.prototype.hasOwnProperty.call(values, locale) ? values[locale as keyof typeof values] : values.en
}

export function cloudErrorKey(issue: CloudIssue): string {
  return `cloud.errors.${
    Object.prototype.hasOwnProperty.call(messages.errors, issue.code) ? issue.code : 'OPERATION_FAILED'
  }`
}
