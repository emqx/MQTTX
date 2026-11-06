import type { CloudIssue } from '../types/cloud'

export class CloudError extends Error implements CloudIssue {
  constructor(public readonly code: string, public readonly params: CloudIssue['params'] = {}) {
    super(code)
    this.name = 'CloudError'
  }
}

export function cloudIssue(error: unknown, fallback = 'OPERATION_FAILED'): CloudIssue {
  if (error && typeof error === 'object' && 'code' in error) {
    const { code, params } = error as Partial<CloudIssue>
    if (typeof code === 'string' && /^[A-Z][A-Z_]{0,63}$/.test(code)) {
      return {
        code,
        params: Object.fromEntries(
          Object.entries(params && typeof params === 'object' ? params : {}).filter(
            ([, value]) => typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)),
          ),
        ),
      }
    }
  }
  return { code: fallback, params: {} }
}

export function cloudError(error: unknown, fallback = 'OPERATION_FAILED'): CloudError {
  const issue = cloudIssue(error, fallback)
  return new CloudError(issue.code, issue.params)
}
