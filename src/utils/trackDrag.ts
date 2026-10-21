/** Calls `onMove` with the pointer offset from `event` until the button is released. Returns a function that stops early. */
export function trackDrag(event: MouseEvent, onMove: (dx: number, dy: number) => void, onEnd?: () => void): () => void {
  const startX = event.clientX
  const startY = event.clientY

  const handleMove = (moveEvent: MouseEvent) => {
    onMove(moveEvent.clientX - startX, moveEvent.clientY - startY)
  }

  const removeListeners = () => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
    document.body.classList.remove('select-none')
  }

  const handleUp = () => {
    removeListeners()
    onEnd?.()
  }

  document.body.classList.add('select-none')
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)

  return removeListeners
}
