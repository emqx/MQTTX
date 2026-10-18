export interface FloatRect {
  x: number
  y: number
  width: number
  height: number
}

export interface Viewport {
  width: number
  height: number
}

export type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export const FLOAT_MIN_WIDTH = 360
export const FLOAT_MIN_HEIGHT = 420
// The float window never covers the left bar (76px) and keeps at least 8px from the window edges
export const FLOAT_LEFT_INSET = 76
export const FLOAT_MARGIN = 8

const availableArea = (viewport: Viewport) => {
  const left = FLOAT_LEFT_INSET + FLOAT_MARGIN
  const top = FLOAT_MARGIN
  const right = viewport.width - FLOAT_MARGIN
  const bottom = viewport.height - FLOAT_MARGIN
  return { left, top, right, bottom, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Defaults to the bottom right corner with 16px to the right and bottom */
export function defaultFloatRect(viewport: Viewport): FloatRect {
  const width = Math.min(560, availableArea(viewport).width)
  const height = Math.min(720, viewport.height - 32)
  return { x: viewport.width - 16 - width, y: viewport.height - 16 - height, width, height }
}

/** Keeps the whole window inside the available area, never below the minimum size and never negative */
export function clampFloatRect(rect: FloatRect, viewport: Viewport): FloatRect {
  const area = availableArea(viewport)
  const width = Math.min(Math.max(FLOAT_MIN_WIDTH, rect.width), area.width)
  const height = Math.min(Math.max(FLOAT_MIN_HEIGHT, rect.height), area.height)
  const x = clamp(rect.x, area.left, Math.max(area.left, area.right - width))
  const y = clamp(rect.y, area.top, Math.max(area.top, area.bottom - height))
  return { x, y, width, height }
}

export function moveFloatRect(start: FloatRect, dx: number, dy: number, viewport: Viewport): FloatRect {
  return clampFloatRect({ ...start, x: start.x + dx, y: start.y + dy }, viewport)
}

/** Resizes by the dragged edge or corner; the opposite edge stays put once the minimum size is reached */
export function resizeFloatRect(
  start: FloatRect,
  edge: ResizeEdge,
  dx: number,
  dy: number,
  viewport: Viewport,
): FloatRect {
  const area = availableArea(viewport)
  const right = start.x + start.width
  const bottom = start.y + start.height
  let { x, y, width, height } = start

  // Each size is also capped at the area edge it grows toward, so clamping never pushes the opposite edge
  if (edge.includes('e')) width = clamp(start.width + dx, FLOAT_MIN_WIDTH, area.right - start.x)
  if (edge.includes('s')) height = clamp(start.height + dy, FLOAT_MIN_HEIGHT, area.bottom - start.y)
  if (edge.includes('w')) {
    width = clamp(start.width - dx, FLOAT_MIN_WIDTH, right - area.left)
    x = right - width
  }
  if (edge.includes('n')) {
    height = clamp(start.height - dy, FLOAT_MIN_HEIGHT, bottom - area.top)
    y = bottom - height
  }

  return clampFloatRect({ x, y, width, height }, viewport)
}
