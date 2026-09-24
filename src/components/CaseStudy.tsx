import { useEffect, useRef, useState } from 'react'
import { caseStudies } from '../lib/caseStudy'
import { navigate } from '../lib/router'
import { projects } from '../content'
import { frogDoodle } from '../lib/about'

const EMAIL = 'heyiamsnehajain@gmail.com'

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="cs__back" onClick={onClick}>
      <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
        <path d="M12 5 6 10l6 5M6.5 10H15a3 3 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      back
    </button>
  )
}

// Renders /case-studies/<slug>.md (see lib/caseStudy.ts). The left nav is built from the doc's own "##"
// headings — not hand-maintained — and highlights whichever section is currently in view.
export default function CaseStudy({ slug }: { slug: string }) {
  const doc = caseStudies[slug]
  const [active, setActive] = useState<string | null>(null)
  const [progress, setProgress] = useState(0) // 0..1, how far through the write-up the reader is
  const [copied, setCopied] = useState(false)
  const article = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = doc ? `${doc.title} — Sneha Jain` : 'Case study — Sneha Jain'
    window.scrollTo(0, 0)
  }, [doc])

  useEffect(() => {
    if (!doc || !article.current) return
    const headings = [...article.current.querySelectorAll('h2[id]')] as HTMLElement[]
    if (!headings.length) return
    setActive(headings[0].id)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )
    headings.forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [doc])

  // reading progress, drawn as a thin line across the top of the page
  useEffect(() => {
    if (!doc) return
    let raf = 0
    const update = () => {
      raf = 0
      const el = article.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - innerHeight * 0.6
      setProgress(Math.min(1, Math.max(0, -r.top / Math.max(1, total))))
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
  }, [doc])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${EMAIL}`
    }
  }

  const goHome = () => {
    navigate('/')
    requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView({ block: 'start' }))
  }
  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  if (!doc)
    return (
      <div className="cs cs--empty">
        {frogDoodle && <img className="cs__empty-art" src={frogDoodle} alt="" />}
        <p className="cs__empty-title">this one isn’t written up yet.</p>
        <p className="cs__empty-sub">the frog is guarding it until it is. the finished ones are back on the home page.</p>
        <BackButton onClick={goHome} />
      </div>
    )

  // the next written case study, in the same order as the cards (wrapping round to the first)
  const written = projects.filter((p) => p.caseStudy?.startsWith('/case-studies/'))
  const here = written.findIndex((p) => p.slug === slug)
  const next = written.length > 1 ? written[(here + 1) % written.length] : undefined

  const stats = [
    { label: 'Timeline', value: doc.timeline },
    { label: 'Contributors', value: doc.contributors },
    { label: 'My Contribution', value: doc.contribution },
  ].filter((s) => s.value.length > 0)

  return (
    <div className="cs">
      <div className="cs__layout">
        {/* back button + section index ride together in the left rail, sticky as one unit */}
        <div className="cs__rail">
          <BackButton onClick={goHome} />
          {doc.toc.length > 0 && (
            <nav className="cs__nav" aria-label="Sections">
              <ul>
                {doc.toc.map((t) => (
                  <li key={t.id}>
                    <button type="button" className={t.id === active ? 'is-on' : ''} onClick={() => jump(t.id)}>
                      {t.text}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        <div className="cs__main">
          <header className="cs__head">
            <p className="cs__kicker">
              case study · {doc.minutes} min read
            </p>
            <h1>{doc.title}</h1>
            {stats.length > 0 && (
              <div className="cs__stats">
                {stats.map((s) => (
                  <div key={s.label}>
                    <span className="cs__stats-label">{s.label}</span>
                    {s.value.map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </header>
          {/* doc.html comes from case-studies/*.md, content Sneha writes herself — not visitor input — so
              rendering it as raw HTML (rather than sanitizing/escaping) is safe here. */}
          <article className="cs__article" ref={article} dangerouslySetInnerHTML={{ __html: doc.html }} />

          {/* the end of the page says what to do next: another case study, or getting in touch */}
          <footer className="cs__end">
            <p className="cs__thanks">thanks for reading ✿</p>
            <div className="cs__end-actions">
              <button type="button" className="cs__end-btn cs__end-btn--primary" onClick={copyEmail}>
                {copied ? 'email copied ✓' : 'say hi → ' + EMAIL}
              </button>
              <a className="cs__end-btn" href="/Sneha%20Jain%20Resume.pdf" download="Sneha Jain Resume.pdf">
                resume ↓
              </a>
            </div>
            {next && (
              <a
                className="cs__next"
                href={next.caseStudy}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(next.caseStudy!)
                }}
              >
                <span className="cs__next-label">next case study →</span>
                <span className="cs__next-title">{next.title}</span>
                {next.thumbnail && <img className="cs__next-thumb" src={next.thumbnail} alt="" />}
              </a>
            )}
          </footer>
        </div>
      </div>
      <div className="cs__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />
    </div>
  )
}
