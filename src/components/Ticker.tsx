import { useEffect, useRef } from 'react'

import { logos } from '../lib/logos'

const BASE_SPEED = 45 // px/s, the resting scroll speed
const FRICTION = 2.2 // higher = momentum fades back to BASE_SPEED faster

export default function Ticker() {
  const viewport = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const vp = viewport.current!
    const tr = track.current!
    let x = 0
    let velocity = BASE_SPEED // current px/s (may exceed base after a flick)
    let dragging = false
    let lastX = 0
    let lastT = 0
    let last = performance.now()
    let raf = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches


    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!dragging) {
        // ease velocity back to the resting speed (exponential decay)
        const target = reduced ? 0 : BASE_SPEED
        velocity = target + (velocity - target) * Math.exp(-FRICTION * dt)
        x -= velocity * dt
      }
      const w = tr.scrollWidth / COPIES
      if (w > 0) x = ((x % w) - w) % w // keep in (-w, 0] so the loop is seamless
      tr.style.transform = `translate3d(${x}px,0,0)`
      raf = requestAnimationFrame(frame)
    }

    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastT = performance.now()
      velocity = 0
      vp.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const now = performance.now()
      const dx = e.clientX - lastX
      x += dx
      const dt = (now - lastT) / 1000
      if (dt > 0) {
        // smoothed release velocity, signed so dragging left = moving left (like the auto-scroll)
        velocity = velocity * 0.6 + (-dx / dt) * 0.4
      }
      lastX = e.clientX
      lastT = now
    }
    const up = () => {
      if (!dragging) return
      dragging = false
      // if the pointer was held still before release, don't inherit stale momentum
      if (performance.now() - lastT > 80) velocity = BASE_SPEED
      velocity = Math.max(-4000, Math.min(4000, velocity))
    }

    vp.addEventListener('pointerdown', down)
    vp.addEventListener('pointermove', move)
    vp.addEventListener('pointerup', up)
    vp.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      vp.removeEventListener('pointerdown', down)
      vp.removeEventListener('pointermove', move)
      vp.removeEventListener('pointerup', up)
      vp.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div className="ticker" ref={viewport} aria-label="Companies I have worked with">
      <div className="ticker__track" ref={track}>
        {Array.from({ length: COPIES }).flatMap((_, i) =>
          logos.map((l) => (
            <img key={`${i}-${l.name}`} className="ticker__logo" src={l.src} alt={i === 0 ? l.name : ''} draggable={false} />
          )),
        )}
      </div>
    </div>
  )
}

const COPIES = 4
