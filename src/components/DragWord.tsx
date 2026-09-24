import { useDrag } from '../lib/useDrag'

/** A word of the footer headline that can be picked up and moved anywhere. */
export default function DragWord({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const { pos, z, dragging, handlers } = useDrag()
  return (
    <span
      className={`dword ${className}${dragging ? ' is-dragging' : ''}`}
      style={{ zIndex: z, transform: `translate(${pos.x}px, ${pos.y}px) rotate(${dragging ? -2 : 0}deg) scale(${dragging ? 1.04 : 1})` }}
      {...handlers}
    >
      {children}
    </span>
  )
}
