import { useRef, useState } from 'react'

let top = 10 // whichever draggable was touched last sits on top

/** Pointer-drag for any element: returns the offset, drag state, z-index and the handlers to spread on it. */
export function useDrag() {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [z, setZ] = useState(1)
  const [dragging, setDragging] = useState(false)
  const start = useRef({ px: 0, py: 0, x: 0, y: 0 })
  const moved = useRef(false) // true once the pointer travelled far enough that this was a drag, not a click

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y }
      moved.current = false
      setZ(++top)
      setDragging(true)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragging) return
      if (Math.hypot(e.clientX - start.current.px, e.clientY - start.current.py) > 5) moved.current = true
      setPos({ x: start.current.x + e.clientX - start.current.px, y: start.current.y + e.clientY - start.current.py })
    },
    onPointerUp: () => setDragging(false),
    onPointerCancel: () => setDragging(false),
  }
  return { pos, z, dragging, moved, handlers }
}
