import { useEffect, useRef, useState } from 'react'
import { END, PARTS, START, periodFor, years } from '../lib/timeline'
import TimelineArt from './TimelineArt'

const CARD_W = 360
const SVG_H = 250
const BASE = 165 // y of the flat line
const AMP = 100 // height of the bump
const SIGMA = 62 // how wide the bump is
const PAD = 36 // space left and right of the line

export default function Timeline() {
  const root = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const main = useRef<SVGPathElement>(null)
  const echo = useRef<SVGPathElement>(null)
  const stem = useRef<SVGLineElement>(null)
  const dot = useRef<SVGGElement>(null)
  const ticks = useRef<(SVGCircleElement | null)[]>([])
  const [width, setWidth] = useState(1200)
  const [active, setActive] = useState(END)
  const [touched, setTouched] = useState(false) // the "time-travel" hint goes away after the first scrub
  const raf = useRef(0)
  const cx = useRef<number | null>(null) // where the bump currently is (springs toward its target)
  const target = useRef(0)
  const leave = useRef(0)

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(root.current!)
    return () => ro.disconnect()
  }, [])

  // The line is split into equal-width parts (one per chapter), so short chapters get as much room as long ones.
  const parts = PARTS.length - 1
  const xOf = (year: number) => {
    const i = Math.min(parts - 1, PARTS.findLastIndex((b) => year >= b))
    const t = (i + (year - PARTS[i]) / (PARTS[i + 1] - PARTS[i])) / parts
    return PAD + t * (width - PAD * 2)
  }
  const bump = (x: number, c: number) => BASE - AMP * Math.exp(-((x - c) ** 2) / (2 * SIGMA * SIGMA))

  const paint = (c: number) => {
    let d = ''
    let d2 = ''
    for (let x = 0; x <= width; x += 3) {
      const y = bump(x, c)
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`
      d2 += `${x ? 'L' : 'M'}${x} ${(y + 9).toFixed(1)}`
    }
    main.current?.setAttribute('d', d)
    echo.current?.setAttribute('d', d2)
    const peak = bump(c, c)
    stem.current?.setAttribute('x1', String(c))
    stem.current?.setAttribute('x2', String(c))
    stem.current?.setAttribute('y2', String(peak - 16))
    dot.current?.setAttribute('transform', `translate(${c} ${peak})`)
    years.forEach((yr, i) => {
      const t = ticks.current[i]
      if (t) {
        const x = xOf(yr)
        t.setAttribute('cx', String(x))
        t.setAttribute('cy', String(bump(x, c)))
      }
    })
    // the card rides along with the bump but never leaves the section
    const left = Math.min(Math.max(c - CARD_W / 2, 0), Math.max(0, width - CARD_W))
    if (card.current) card.current.style.transform = `translateX(${left}px)`
  }

  const run = () => {
    cancelAnimationFrame(raf.current)
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      cx.current! += (target.current - cx.current!) * (1 - Math.exp(-dt * 11))
      paint(cx.current!)
      if (Math.abs(target.current - cx.current!) > 0.15) raf.current = requestAnimationFrame(step)
      else {
        cx.current = target.current
        paint(cx.current)
      }
    }
    raf.current = requestAnimationFrame(step)
  }

  const go = (year: number) => {
    const y = Math.min(END, Math.max(START, year))
    setActive(y)
    target.current = xOf(y)
    if (cx.current === null) cx.current = target.current
    run()
  }

  // start on the current year, and keep the bump on its year when the window resizes
  useEffect(() => {
    target.current = xOf(active)
    if (cx.current === null || reducedMotion()) cx.current = target.current
    else run()
    paint(cx.current)
    return () => cancelAnimationFrame(raf.current)
  }, [width]) // eslint-disable-line react-hooks/exhaustive-deps

  const nearest = (clientX: number) => {
    const r = root.current!.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left - PAD) / (width - PAD * 2))) * parts
    const i = Math.min(parts - 1, Math.floor(t))
    return Math.round(PARTS[i] + (t - i) * (PARTS[i + 1] - PARTS[i]))
  }
  // Anywhere on the board (the card area above the line included) scrubs the timeline. The card itself holds
  // still so its link can be reached.
  const onMove = (e: React.PointerEvent) => {
    window.clearTimeout(leave.current)
    if ((e.target as Element).closest('.tl__card')) return
    window.clearTimeout(leave.current)
    setTouched(true)
    go(nearest(e.clientX))
  }
  // a mouse drifting away returns to the present; touch stays where it was left
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    leave.current = window.setTimeout(() => go(END), 700)
  }

  const p = periodFor(active)

  return (
    <section className="tl" id="timeline">
      <div className="work__inner">
        <p className="work__intro" data-reveal>
          so, how did i get here? <span className="hl hl--purple">a quick tour, 2002 to now.</span>
        </p>

        <div className="tl__board" ref={root} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={onLeave}>
          <div className="tl__cardrow">
            <div className="tl__card" ref={card} style={{ width: CARD_W }}>
              <div className="tl__inner" key={p.id}>
                <div className="tl__pic" style={{ background: p.image ? `center / cover url(${p.image})` : `linear-gradient(135deg, ${p.tint[0]}, ${p.tint[1]})` }}>
                  {!p.image && <TimelineArt id={p.id} />}
                  <span className="tl__badge">{active}</span>
                </div>
                <div className="tl__body">
                  <span className="tl__dates">{p.dates}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                  {p.link && (
                    <a href={p.link} className="tl__more">
                      Explore chapter <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className={`tl__hint${touched ? ' is-gone' : ''}`} aria-hidden>
            <svg viewBox="0 0 64 20" width="52" height="16" fill="none">
              <path d="M4 10h56M11 3L4 10l7 7M53 3l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="for-mouse">hover</span>
            <span className="for-touch">drag</span>
            <span className="tl__hint-long"> along the line</span> to time-travel
          </p>

          <div className="tl__axis">
            <svg className="tl__svg" width={width} height={SVG_H} viewBox={`0 0 ${width} ${SVG_H}`} aria-hidden>
              <path ref={echo} fill="none" stroke="#e4e0f0" strokeWidth="2" />
              <path ref={main} fill="none" stroke="#1d1d1b" strokeWidth="2" />
              <line ref={stem} y1="0" stroke="#1d1d1b" strokeWidth="2" />
              {years.map((yr, i) => (
                <circle key={yr} ref={(el) => { ticks.current[i] = el }} r={yr === active ? 0 : 3} fill="#1d1d1b" />
              ))}
              <g ref={dot}>
                <circle r="19" fill="#fff" stroke="#e2e2e6" strokeWidth="2" />
                <circle r="8" fill="#1d1d1b" />
              </g>
            </svg>

            <ul className="tl__years">
              {years
                .filter((yr) => yr === active || (PARTS.includes(yr) && Math.abs(xOf(yr) - xOf(active)) > 64))
                .map((yr) => (
                <li key={yr} style={{ left: xOf(yr) }} className={yr === active ? 'is-on' : ''}>
                  <button type="button" onClick={() => go(yr)} onFocus={() => go(yr)} aria-label={`${yr}, ${periodFor(yr).title}`} aria-current={yr === active}>
                    {yr}
                  </button>
                  {yr === active && <small>{periodFor(yr).title}</small>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
