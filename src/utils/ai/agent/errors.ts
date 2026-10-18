/**
 * Describes a failed reply for the user. A provider error can have an empty message (for example a
 * 401 with a plain-text body), which would leave only its name, so the status code and body are used.
 */
export const describeAgentError = (error: unknown): string => {
  if (!(error instanceof Error)) return String(error)
  const { statusCode, responseBody } = error as Error & { statusCode?: number; responseBody?: string }
  const detail = error.message.trim() || responseBody?.trim().slice(0, 300) || error.name
  return statusCode ? `${statusCode}: ${detail}` : detail
}
