import { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { socials } from '../lib/footerAssets'

const { Engine, Bodies, Body, Composite, Constraint } = Matter

/** The social icons fall in from behind the page, pile up under gravity, collide, and can be grabbed and thrown. */
export default function SocialPhysics({ active }: { active: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const els = useRef<(HTMLAnchorElement | null)[]>([])
  const api = useRef<{ start: () => void; stop: () => void } | null>(null)

  useEffect(() => {
    const host = box.current!
    const engine = Engine.create({ gravity: { x: 0, y: 1.2 } })
    const world = engine.world
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const bodies: Matter.Body[] = []
    const timers: number[] = []
    let walls: Matter.Body[] = []
    let solids: Matter.Body[] = []
    let W = host.clientWidth
    let H = host.clientHeight
    let size = 76
    let spawned = false
    let raf = 0
    let running = false
    let last = 0
    let dragging: { i: number; c: Matter.Constraint; sx: number; sy: number; moved: boolean } | null = null

    const buildWalls = () => {
      walls.forEach((b) => Composite.remove(world, b))
      const t = 200
      walls = [
        Bodies.rectangle(W / 2, H + t / 2, W * 3, t, { isStatic: true }), // floor
        Bodies.rectangle(-t / 2, H / 2, t, H * 6, { isStatic: true }), // left
        Bodies.rectangle(W + t / 2, H / 2, t, H * 6, { isStatic: true }), // right
        Bodies.rectangle(W / 2, -600 - t / 2, W * 3, t, { isStatic: true }), // ceiling, well above the screen so things can be tossed up and still come back
      ]
      Composite.add(world, walls)
    }

    // Anything in the footer marked data-solid (the email pill, the credit line) is an obstacle, so the icons pile
    // up around it instead of landing on top and hiding it.
    const buildSolids = () => {
      solids.forEach((b) => Composite.remove(world, b))
      const box = host.getBoundingClientRect()
      solids = [...(host.parentElement?.querySelectorAll<HTMLElement>('[data-solid]') ?? [])].map((el) => {
        const r = el.getBoundingClientRect()
        const pad = 4
        return Bodies.rectangle(r.left - box.left + r.width / 2, r.top - box.top + r.height / 2, r.width + pad * 2, r.height + pad * 2, {
          isStatic: true,
          chamfer: { radius: Math.min(r.height / 2, 24) },
        })
      })
      Composite.add(world, solids)
    }

    const measure = () => {
      W = host.clientWidth
      H = host.clientHeight
      size = Math.max(56, Math.min(84, W * 0.045))
      buildWalls()
      buildSolids()
      bodies.forEach((b) => {
        Body.setPosition(b, { x: Math.min(W - size / 2, Math.max(size / 2, b.position.x)), y: Math.min(H - size / 2, b.position.y) })
      })
      els.current.forEach((el) => el && (el.style.width = el.style.height = `${size}px`))
    }

    const spawn = () => {
      socials.forEach((s, i) => {
        const x = W / 2 + (i - (socials.length - 1) / 2) * size * 1.25 + (Math.random() - 0.5) * 30
        const y = reduced ? H - size / 2 - 2 : -size * 1.5 - i * size * 0.4
        const opts = { restitution: 0.45, friction: 0.35, frictionAir: 0.008, density: 0.002 }
        const b = s.round ? Bodies.circle(x, y, size / 2, opts) : Bodies.rectangle(x, y, size, size, { ...opts, chamfer: { radius: size * 0.22 } })
        if (!reduced) Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15)
        b.label = String(i)
        bodies[i] = b
        // staggered, so they drop one after another
        timers.push(window.setTimeout(() => Composite.add(world, b), reduced ? 0 : i * 220))
        const el = els.current[i]
        if (el) el.style.visibility = 'visible'
      })
    }

    const paint = () => {
      bodies.forEach((b, i) => {
        const el = els.current[i]
        if (el) el.style.transform = `translate(${b.position.x - size / 2}px, ${b.position.y - size / 2}px) rotate(${b.angle}rad)`
      })
    }

    const tick = (now: number) => {
      if (!running) return
      const dt = Math.min(now - last, 32)
      last = now
      Engine.update(engine, dt)
      paint()
      raf = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(measure)
    ro.observe(host)
    measure()

    api.current = {
      start: () => {
        if (!spawned) {
          spawned = true
          measure()
          spawn()
        }
        if (running) return
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      },
      stop: () => {
        running = false
        cancelAnimationFrame(raf)
      },
    }

    // ----- grab & throw -----
    const local = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onDown = (e: PointerEvent) => {
      const i = els.current.findIndex((el) => el === (e.currentTarget as HTMLElement))
      const body = bodies[i]
      if (!body || !body.parent) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      const p = local(e)
      const c = Constraint.create({
        pointA: p,
        bodyB: body,
        pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
        stiffness: 0.25,
        damping: 0.12,
        length: 0,
      })
      Composite.add(world, c)
      dragging = { i, c, sx: p.x, sy: p.y, moved: false }
    }
    const onMove = (e: PointerEvent) => {
      const d = dragging
      if (!d) return
      const p = local(e)
      d.c.pointA = p
      if (Math.hypot(p.x - d.sx, p.y - d.sy) > 6) d.moved = true
    }
    const onUp = (e: PointerEvent) => {
      const d = dragging
      if (!d) return
      Composite.remove(world, d.c)
      const el = els.current[d.i]
      if (el) el.dataset.dragged = d.moved ? '1' : ''
      dragging = null
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    }

    els.current.forEach((el) => {
      el?.addEventListener('pointerdown', onDown)
      el?.addEventListener('pointermove', onMove)
      el?.addEventListener('pointerup', onUp)
      el?.addEventListener('pointercancel', onUp)
    })

    return () => {
      api.current?.stop()
      timers.forEach(clearTimeout)
      ro.disconnect()
      els.current.forEach((el) => {
        el?.removeEventListener('pointerdown', onDown)
        el?.removeEventListener('pointermove', onMove)
        el?.removeEventListener('pointerup', onUp)
        el?.removeEventListener('pointercancel', onUp)
      })
      Composite.clear(world, false)
      Engine.clear(engine)
    }
  }, [])

  useEffect(() => {
    if (active) api.current?.start()
    else api.current?.stop()
  }, [active])

  return (
    <div className="social" ref={box}>
      {socials.map((s, i) => (
        <a
          key={s.name}
          ref={(el) => {
            els.current[i] = el
          }}
          className={`social__icon${s.round ? ' is-round' : ''}`}
          href={s.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={s.label}
          draggable={false}
          // a drag that ends on the icon shouldn't also open the link
          onClick={(e) => {
            const el = e.currentTarget
            if (el.dataset.dragged) {
              e.preventDefault()
              el.dataset.dragged = ''
            }
          }}
          style={{ visibility: 'hidden' }}
        >
          <img src={s.src} alt="" draggable={false} />
        </a>
      ))}
    </div>
  )
}
