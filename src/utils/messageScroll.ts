interface MessageScroll {
  readonly pending: boolean
  request: () => void
  dispose: () => void
}

export function createMessageScroll(scroll: () => void, isFollowingBottom: () => boolean): MessageScroll {
  let frame: number | undefined
  let pending = false

  const request = () => {
    pending = true
    if (document.hidden || frame !== undefined) return
    frame = window.requestAnimationFrame(() => {
      frame = undefined
      if (document.hidden) return
      pending = false
      scroll()
    })
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      pending = pending || isFollowingBottom()
    } else if (pending) {
      if (isFollowingBottom()) request()
      else pending = false
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return {
    get pending() {
      return pending
    },
    request,
    dispose: () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    },
  }
}
