import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PlayItem } from '../content'

type Props = { items: PlayItem[]; index: number; onIndex: (i: number) => void; onClose: () => void }

export default function Lightbox({ items, index, onIndex, onClose }: Props) {
  const item = items[index]
  const [dir, setDir] = useState<'open' | 'next' | 'prev'>('open')
  const [leaving, setLeaving] = useState(false)
  const swipe = useRef<number | null>(null)
  const swiped = useRef(false) // a drag ends in a click on the backdrop, which shouldn't close the viewer

  const go = (step: 1 | -1) => {
    const next = index + step
    if (next < 0 || next >= items.length) return
    setDir(step === 1 ? 'next' : 'prev')
    onIndex(next)
  }
  const stop = (e: React.MouseEvent) => e.stopPropagation() // clicks on the media itself don't close the viewer
  const close = () => {
    setLeaving(true)
    window.setTimeout(onClose, 220)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden' // lock page scroll behind the viewer
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  })

  if (!item) return null

  return createPortal(
    <div
      className={`lightbox${leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={item.caption || 'Preview'}
      onClick={() => (swiped.current ? (swiped.current = false) : close())}
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current === null) return
        const dx = e.clientX - swipe.current
        swipe.current = null
        if (Math.abs(dx) > 60) {
          swiped.current = true
          go(dx < 0 ? 1 : -1)
        }
      }}
    >
      {index > 0 && (
        <button type="button" className="lightbox__arrow lightbox__arrow--prev" aria-label="Previous" onClick={(e) => (e.stopPropagation(), go(-1))}>
          ←
        </button>
      )}
      {index < items.length - 1 && (
        <button type="button" className="lightbox__arrow lightbox__arrow--next" aria-label="Next" onClick={(e) => (e.stopPropagation(), go(1))}>
          →
        </button>
      )}

      <figure key={item.id} className={`lightbox__figure lightbox__figure--${dir}`}>
        {item.video ? <video src={item.src} autoPlay muted loop playsInline controls onClick={stop} /> : <img src={item.src} alt={item.caption} draggable={false} onClick={stop} />}
        {(item.caption || item.tags.length > 0) && (
          <figcaption>
            {item.caption && <span className="lightbox__caption">{item.caption}</span>}
            {item.tags.length > 0 && <span className="lightbox__tags"> • {item.tags.join(', ')}</span>}
          </figcaption>
        )}
      </figure>
    </div>,
    document.body,
  )
}
