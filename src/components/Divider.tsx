import { useRef } from 'react'

const PAD = 20 // matches the stage's edge padding
const MIN_CHAT = 280
const MIN_ABOUT = 460
const STEP = 24

type Props = { stage: React.RefObject<HTMLDivElement | null>; onChange: (chatWidth: number | null) => void }

export default function Divider({ stage, onChange }: Props) {
  const handle = useRef<HTMLDivElement>(null)

  const clamp = (w: number) => {
    const total = stage.current?.clientWidth ?? 0
    const max = Math.max(MIN_CHAT, total - PAD * 2 - 20 - MIN_ABOUT)
    return Math.min(max, Math.max(MIN_CHAT, w))
  }
  const currentWidth = () => stage.current?.querySelector('.chat')?.getBoundingClientRect().width ?? MIN_CHAT

  const down = (e: React.PointerEvent) => {
    handle.current?.setPointerCapture(e.pointerId)
    handle.current?.classList.add('is-dragging')
    document.body.style.userSelect = 'none'
  }
  const move = (e: React.PointerEvent) => {
    if (!handle.current?.hasPointerCapture(e.pointerId)) return
    const left = stage.current!.getBoundingClientRect().left
    onChange(clamp(e.clientX - left - PAD - 10)) // 10 = half the handle, so it stays under the cursor
  }
  const up = (e: React.PointerEvent) => {
    handle.current?.releasePointerCapture(e.pointerId)
    handle.current?.classList.remove('is-dragging')
    document.body.style.userSelect = ''
  }
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') onChange(clamp(currentWidth() - STEP))
    else if (e.key === 'ArrowRight') onChange(clamp(currentWidth() + STEP))
    else if (e.key === 'Home' || e.key === 'Escape') onChange(null)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={handle}
      className="divider"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize chat and profile panels"
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={() => onChange(null)}
      onKeyDown={key}
    >
      <span className="divider__grip" />
    </div>
  )
}
