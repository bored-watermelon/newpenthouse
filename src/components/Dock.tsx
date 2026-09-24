import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const EMAIL = 'heyiamsnehajain@gmail.com'
type Item = 'work' | 'play' | 'timeline' | 'about'

/**
 * A small floating dock: the sections, plus the two things a recruiter is actually after (the resume and a way
 * to reach her), one tap away from anywhere. It stays out of the way on the hero, where the chat already offers
 * both, and over the footer, which has its own.
 */
export default function Dock() {
  const [shown, setShown] = useState(false)
  const [active, setActive] = useState<Item | null>(null)
  const [mode, setMode] = useState<'work' | 'play'>('work')
  const [copied, setCopied] = useState(false)
  const bar = useRef<HTMLElement>(null)
  const pill = useRef<HTMLSpanElement>(null)

  // Work tells everyone which tab it's on; the dock lights up "work" or "play" to match.
  useEffect(() => {
    const on = (e: Event) => setMode((e as CustomEvent<'work' | 'play'>).detail)
    window.addEventListener('work:mode', on)
    return () => window.removeEventListener('work:mode', on)
  }, [])

  // Visible between the hero and the footer; the active item is whichever section crosses 40% of the screen.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const stage = document.querySelector('.stage')
      const spacer = document.querySelector('.foot-spacer')
      const pastHero = stage ? stage.getBoundingClientRect().bottom < innerHeight * 0.35 : true
      const beforeFooter = spacer ? spacer.getBoundingClientRect().top > innerHeight * 0.85 : true
      setShown(pastHero && beforeFooter)
      const line = innerHeight * 0.4
      const hit = (sel: string) => {
        const r = document.querySelector(sel)?.getBoundingClientRect()
        return !!r && r.top <= line && r.bottom > line
      }
      setActive(hit('#work') ? 'work' : hit('#timeline') ? 'timeline' : hit('#about-me') ? 'about' : null)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    update()
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const current: Item | null = active === 'work' ? mode : active

  // the ink pill slides to whichever item is current
  useLayoutEffect(() => {
    const el = current && bar.current?.querySelector<HTMLElement>(`[data-item="${current}"]`)
    const p = pill.current
    if (!p) return
    if (!el) {
      p.style.opacity = '0'
      return
    }
    p.style.opacity = '1'
    p.style.width = `${el.offsetWidth}px`
    p.style.transform = `translateX(${el.offsetLeft}px)`
  }, [current, shown])

  const go = (item: Item) => {
    if (item === 'work' || item === 'play') window.dispatchEvent(new CustomEvent('work:show', { detail: item }))
    else document.getElementById(item === 'about' ? 'about-me' : 'timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  const items: { id: Item; label: string; wide?: boolean }[] = [
    { id: 'work', label: 'work' },
    { id: 'play', label: 'play' },
    { id: 'timeline', label: 'timeline', wide: true },
    { id: 'about', label: 'about' },
  ]

  return (
    <nav className={`dock${shown ? ' is-shown' : ''}`} aria-label="Sections" ref={bar} inert={!shown}>
      <span className="dock__pill" ref={pill} aria-hidden />
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          data-item={it.id}
          className={`dock__item${current === it.id ? ' is-on' : ''}${it.wide ? ' dock__item--wide' : ''}`}
          aria-current={current === it.id ? 'true' : undefined}
          onClick={() => go(it.id)}
        >
          {it.label}
        </button>
      ))}
      <span className="dock__sep" aria-hidden />
      <a className="dock__item dock__item--cta" href="/Sneha%20Jain%20Resume.pdf" download="Sneha Jain Resume.pdf">
        resume
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
          <path d="M8 2.5v9m0 0-3.5-3.5M8 11.5l3.5-3.5M3 14h10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <button type="button" className={`dock__item dock__item--mail${copied ? ' is-copied' : ''}`} onClick={copy} aria-label={copied ? 'Email copied' : `Copy email address, ${EMAIL}`}>
        {copied ? (
          'copied ✓'
        ) : (
          <>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <rect x="2.5" y="4.5" width="15" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3.5 6l6.5 5 6.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="dock__mail-label">say hi</span>
          </>
        )}
      </button>
    </nav>
  )
}
