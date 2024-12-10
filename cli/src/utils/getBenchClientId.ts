/**
 * Generate a unique client ID for benchmarking purposes
 * @param clientId - Base client ID string that may contain '%i' placeholder
 * @param index - Index number to replace placeholder or append to client ID
 * @param count - Total count of clients being generated
 * @returns Modified client ID string with index incorporated
 *
 * If clientId contains '%i', replaces all instances with index.
 * If count > 1 and no '%i' placeholder exists, appends '_index' to clientId.
 * Otherwise returns clientId unchanged.
 */
const getBenchClientId = (clientId: string, index: number, count: number) => {
  const hasPlaceholder = clientId.includes('%i')
  const baseClientId = hasPlaceholder ? clientId.replaceAll('%i', index.toString()) : clientId
  return count > 1 && !hasPlaceholder ? `${baseClientId}_${index}` : baseClientId
}

export default getBenchClientId
