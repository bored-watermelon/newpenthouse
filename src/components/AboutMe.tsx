import { useEffect, useMemo, useRef, useState } from 'react'
import { cards, type Card } from '../lib/about'
import Lightbox from './Lightbox'

type Rect = { x: number; y: number; w: number; h: number }
const GAP = 12

/** Places cards in order into the first free slot of a column grid; returns pixel rects and total height. */
function pack(order: Card[], cols: number, cell: { w: number; h: number }) {
  const used: boolean[][] = []
  const free = (r: number, c: number, w: number, h: number) => {
    for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) if (used[i]?.[j]) return false
    return true
  }
  const rects: Record<string, Rect> = {}
  let rows = 0
  for (const card of order) {
    const w = Math.min(card.w, cols)
    const h = card.h
    let placed = false
    for (let r = 0; !placed; r++) {
      for (let c = 0; c + w <= cols && !placed; c++) {
        if (!free(r, c, w, h)) continue
        for (let i = r; i < r + h; i++) for (let j = c; j < c + w; j++) (used[i] ??= [])[j] = true
        rects[card.id] = { x: c * (cell.w + GAP), y: r * (cell.h + GAP), w: w * cell.w + (w - 1) * GAP, h: h * cell.h + (h - 1) * GAP }
        rows = Math.max(rows, r + h)
        placed = true
      }
    }
  }
  return { rects, height: rows * cell.h + Math.max(0, rows - 1) * GAP }
}

/**
 * Corner radii that make neighbouring cards look like they interlock: a corner that touches another card is
 * tight, a corner that faces open space is round. Recomputed after every re-pack, and CSS animates the change.
 */
function radii(id: string, rects: Record<string, Rect>) {
  const me = rects[id]
  const big = Math.min(56, Math.min(me.w, me.h) * 0.45)
  const small = 8
  const hit = (px: number, py: number) => Object.entries(rects).some(([k, r]) => k !== id && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h)
  const e = 3
  const g = GAP + 2
  const tl = hit(me.x - g, me.y + e) || hit(me.x + e, me.y - g)
  const tr = hit(me.x + me.w + g, me.y + e) || hit(me.x + me.w - e, me.y - g)
  const br = hit(me.x + me.w + g, me.y + me.h - e) || hit(me.x + me.w - e, me.y + me.h + g)
  const bl = hit(me.x - g, me.y + me.h - e) || hit(me.x + e, me.y + me.h + g)
  return [tl, tr, br, bl].map((t) => `${t ? small : big}px`).join(' ')
}

export default function AboutMe() {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)
  const [order, setOrder] = useState<string[]>(() => cards.map((c) => c.id))
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [gallery, setGallery] = useState<{ card: Card; i: number } | null>(null)
  const grab = useRef({ dx: 0, dy: 0, sx: 0, sy: 0, moved: false, lastSwap: 0 })

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])

  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [])
  const cols = width >= 1000 ? 4 : width >= 640 ? 3 : 2
  const cell = { w: (width - GAP * (cols - 1)) / cols, h: ((width - GAP * (cols - 1)) / cols) * 0.8 }
  const list = order.map((id) => byId.get(id)!)
  const { rects, height } = useMemo(() => pack(list, cols, cell), [order, cols, width]) // eslint-disable-line react-hooks/exhaustive-deps

  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e: React.PointerEvent, id: string) => {
    if (e.pointerType === 'touch' || e.button !== 0) return // touch keeps scrolling the page
    const p = local(e)
    const r = rects[id]
    grab.current = { dx: p.x - r.x, dy: p.y - r.y, sx: p.x, sy: p.y, moved: false, lastSwap: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ id, x: r.x, y: r.y })
  }
  const move = (e: React.PointerEvent) => {
    if (!drag) return
    const p = local(e)
    const g = grab.current
    if (Math.hypot(p.x - g.sx, p.y - g.sy) > 5) g.moved = true
    setDrag({ id: drag.id, x: p.x - g.dx, y: p.y - g.dy })
    // dropping onto another card moves the dragged one into its place and everything else re-packs around it
    if (g.moved && performance.now() - g.lastSwap > 220) {
      const target = Object.entries(rects).find(([k, r]) => k !== drag.id && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)
      if (target) {
        g.lastSwap = performance.now()
        setOrder((o) => {
          const next = o.filter((x) => x !== drag.id)
          next.splice(o.indexOf(target[0]), 0, drag.id)
          return next
        })
      }
    }
  }
  const up = () => {
    if (!drag) return
    const card = byId.get(drag.id)!
    if (!grab.current.moved) activate(card)
    setDrag(null)
  }

  const activate = (card: Card) => {
    if (card.kind === 'gallery') card.images.length && setGallery({ card, i: 0 }) // nothing to show until photos are added
    else if (card.kind === 'link' && card.link) window.open(card.link, '_blank', 'noopener')
  }

  return (
    <section className="me" id="about-me">
      <div className="work__inner">
        <p className="work__intro" data-reveal>
          and now, the stuff between the lines of my resume. <span className="hl hl--purple">poke around, drag things about.</span>
        </p>

        <div className="amap" ref={box} style={{ height }}>
          {list.map((c) => {
            const r = rects[c.id]
            if (!r) return null
            const dragging = drag?.id === c.id
            const clickable = (c.kind === 'gallery' && c.images.length > 0) || (c.kind === 'link' && !!c.link)
            return (
              <div
                key={c.id}
                className={`acard acard--${c.kind}${c.color === '#ffffff' ? ' acard--light' : ''}${dragging ? ' is-dragging' : ''}`}
                style={{
                  width: r.w,
                  height: r.h,
                  transform: `translate(${dragging ? drag.x : r.x}px, ${dragging ? drag.y : r.y}px)${dragging ? ' scale(1.03) rotate(-0.6deg)' : ''}`,
                  borderRadius: radii(c.id, rects),
                  background: c.color,
                  color: c.color === '#1d1d1b' ? '#fff' : '#161616',
                  zIndex: dragging ? 20 : 1,
                }}
                onPointerDown={(e) => down(e, c.id)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                {...(clickable ? { role: 'button', tabIndex: 0, onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && activate(c) } : {})}
              >
                <CardBody c={c} />
              </div>
            )
          })}
        </div>
      </div>

      {gallery && (
        <Lightbox
          items={gallery.card.images.map((src, i) => ({ id: `${gallery.card.id}-${i}`, src, video: false, tags: [], caption: gallery.card.title }))}
          index={gallery.i}
          onIndex={(i) => setGallery({ card: gallery.card, i })}
          onClose={() => setGallery(null)}
        />
      )}
    </section>
  )
}

function CardBody({ c }: { c: Card }) {
  switch (c.kind) {
    case 'photo':
      return (
        <>
          {c.image ? <img className="acard__photo" src={c.image} alt={c.caption} draggable={false} /> : <div className="acard__ph" />}
          {c.caption && <span className="acard__chip">{c.caption}</span>}
        </>
      )
    case 'friends':
      return (
        <div className="acard__pad">
          <h4>{c.title}</h4>
          <div className="friends">
            {c.people.map((p) => (
              <figure key={p.name}>
                {p.photo ? <img src={p.photo} alt="" draggable={false} /> : <span className="friends__ph">{p.name.slice(0, 1)}</span>}
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )
    case 'quote':
      return (
        <div className="acard__pad acard__pad--center">
          <blockquote>{c.body}</blockquote>
          {c.title && <cite>{c.title}</cite>}
        </div>
      )
    case 'list':
      return (
        <div className="acard__pad">
          <h4>{c.title}</h4>
          <ol>
            {c.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ol>
          {c.doodle && <Doodle name={c.doodle} />}
        </div>
      )
    case 'gallery':
      // a small fanned stack of the first few pictures; clicking opens them all in the lightbox
      return c.thumbs.length >= 3 ? (
        <div className="acard__pad acard__gal acard__gal--stack">
          <div className="fan" aria-hidden>
            {c.thumbs.slice(0, 3).map((src, i) => (
              <img key={src} src={src} alt="" draggable={false} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className="acard__gal-text">
            <h4>{c.title}</h4>
            <small>
              {c.images.length} pages · tap to flip through
            </small>
          </div>
        </div>
      ) : (
        <div className="acard__pad acard__pad--center acard__gal">
          {c.image ? <img src={c.image} alt="" draggable={false} /> : <CameraIcon />}
          <h4>{c.title}</h4>
          {c.images.length > 0 && <small>click to open</small>}
        </div>
      )
    case 'link':
      return (
        <div className="acard__pad acard__link">
          <span className="acard__link-arrow" aria-hidden>
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {c.image && <img className="acard__peek" src={c.image} alt="" draggable={false} />}
          <p className="acard__link-title">{c.title}</p>
          <small className="acard__link-host">{linkLabel(c.link)}</small>
        </div>
      )
    case 'doodle':
      return (
        <figure className="acard__doodle">
          {c.image && <img src={c.image} alt={c.caption || 'A doodle'} draggable={false} />}
          {c.caption && <figcaption>{c.caption}</figcaption>}
        </figure>
      )
    case 'journey':
      return <Journey title={c.title} stops={c.items} />
    default:
      return (
        <div className="acard__pad acard__text">
          <h4>{c.title}</h4>
          <p>{emphasise(c.body)}</p>
          {c.doodle && <Doodle name={c.doodle} />}
        </div>
      )
  }
}

/** Sets figures ("16%", "65+", "0 → 1") a weight heavier, so the number in a sentence is what the eye lands on. */
function emphasise(text: string) {
  return text.split(/(\d+(?:\.\d+)?%|\d+\+|0 → 1)/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

/** Small built-in doodles a card can ask for with "Doodle: brush" — same pencil line as the rest. */
function Doodle({ name }: { name: string }) {
  const line = { stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  if (name === 'brush')
    return (
      <svg className="acard__doodle-mark" viewBox="0 0 120 120" aria-hidden>
        <path d="M18 98c10-4 20-2 26 6-10 8-26 10-34 6 4-2 6-8 8-12z" fill="#b9a6f7" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M44 92L94 26c4-6 12-2 9 5L58 102z" {...line} fill="#fff" />
        <path d="M44 92l14 10" {...line} />
        <path d="M86 36l9 7" {...line} />
        <path d="M70 108c6 2 12 2 18-1M84 96c4 1 8 1 12-1" {...line} />
      </svg>
    )
  if (name === 'star')
    return (
      <svg className="acard__doodle-mark" viewBox="0 0 120 120" aria-hidden>
        <path d="M60 14l12 30 32 3-24 21 8 32-28-17-28 17 8-32-24-21 32-3z" {...line} fill="#fce68d" />
      </svg>
    )
  return null
}

/** "goodreads.com" for a link, "pdf" for a file, so each link card says where it goes. */
function linkLabel(link: string) {
  if (/\.pdf($|[?#])/i.test(link)) return 'pdf · opens in a new tab'
  try {
    return new URL(link, location.href).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * A hand-drawn route between places: "name | note" per line of the card's Content. The path is a smooth curve
 * through the stops, dashed like a map; the last stop (where she is now) gets the filled pin.
 */
function Journey({ title, stops }: { title: string; stops: string[] }) {
  const parsed = stops.map((l) => {
    const [name, note = ''] = l.split('|').map((x) => x.trim())
    return { name, note }
  })
  const W = 600
  const H = 240
  const pad = 70
  const pts = parsed.map((_, i) => {
    const t = parsed.length === 1 ? 0.5 : i / (parsed.length - 1)
    return { x: pad + t * (W - pad * 2), y: 132 + Math.sin(i * 2.2) * 26 }
  })
  // one arcing cubic Bézier per leg of the trip
  let d = pts.length ? `M${pts[0].x} ${pts[0].y}` : ''
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]
    const p2 = pts[i + 1]
    // both handles sit above their ends, so each leg arcs over the gap and meets the next pin from above,
    // never running through the names below the pins
    const dx = (p2.x - p1.x) / 3
    const c1 = { x: p1.x + dx, y: Math.min(p1.y, p2.y) - 46 }
    const c2 = { x: p2.x - dx, y: Math.min(p1.y, p2.y) - 46 }
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`
  }
  return (
    <div className="acard__pad journey">
      <h4>{title}</h4>
      <svg className="journey__map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path className="journey__path" d={d} fill="none" stroke="#1d1d1b" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="2 10" />
        {pts.map((pt, i) => {
          const now = i === pts.length - 1
          return (
            <g key={i} transform={`translate(${pt.x} ${pt.y})`}>
              <path
                d="M0 0C-4 -9 -14 -14 -14 -26A14 14 0 1 1 14 -26C14 -14 4 -9 0 0Z"
                fill={now ? '#e5507e' : '#fff'}
                stroke="#1d1d1b"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cy="-26" r="5" fill={now ? '#fff' : '#1d1d1b'} />
              <text className="journey__name" y="32" textAnchor="middle">
                {parsed[i].name}
              </text>
              <text className="journey__note" y="56" textAnchor="middle">
                {parsed[i].note}
              </text>
            </g>
          )
        })}
      </svg>
      <ol className="sr-only">
        {parsed.map((p) => (
          <li key={p.name}>
            {p.name}
            {p.note && ` — ${p.note}`}
          </li>
        ))}
      </ol>
    </div>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 64 56" width="56%" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="12" width="58" height="40" rx="9" />
      <path d="M22 12l4-8h12l4 8" />
      <circle cx="32" cy="32" r="10" />
    </svg>
  )
}
