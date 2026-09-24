import { useEffect, useRef, useState } from 'react'
import { videos, type VideoItem } from '../lib/videos'
import { SKY, makeClouds } from '../lib/sky'

// The sky never changes at runtime, so its clouds are generated once when the module loads.
const clouds = makeClouds(SKY)

export default function Experiments() {
  const section = useRef<HTMLElement>(null)
  const sky = useRef<HTMLDivElement>(null)

  // Parallax: the clouds drift at a fraction of the scroll speed.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = section.current!.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      sky.current!.style.transform = `translate3d(0, ${(-r.top * 0.3).toFixed(1)}px, 0)`
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

  const hasVideos = videos.length > 0

  // "exhibit a": flip the work section to play and take the reader there
  const showPlay = () => window.dispatchEvent(new CustomEvent('work:show', { detail: 'play' }))

  return (
    <section className={`exp${hasVideos ? '' : ' exp--interlude'}`} id="experiments" ref={section}>
      {/* The sky is drawn rather than photographed: a blue wash (in CSS) with individual clouds generated
          from lib/sky.ts, each crossing at its own speed. */}
      <div className="exp__sky" ref={sky} aria-hidden>
        {clouds.map((c, i) => (
          <div
            key={i}
            className={`exp__cloud exp__cloud--${SKY.direction}`}
            style={{
              top: `${c.top}%`,
              width: `${c.width}%`,
              height: `${c.width * c.ratio}%`,
              opacity: c.opacity,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="exp__fade exp__fade--top" aria-hidden />
      <div className="exp__fade exp__fade--bottom" aria-hidden />

      <div className="work__inner exp__inner">
        <p className="work__intro exp__statement" data-reveal>
          i may not have 8 years of experience, but give me a weekend and an ominous deadline and{' '}
          <span className="hl hl--pink">i can lowkey learn anything.</span>
          {hasVideos && ' here’s what a few of those weekends turned into.'}
        </p>

        {hasVideos ? (
          <div className="exp__list">
            {videos.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        ) : (
          // Until there are videos in media/videos, this is a breather between work and the timeline rather
          // than an empty player: the line on its own, a paper plane, and a pointer to the proof.
          <div className="exp__proof" data-reveal>
            <PaperPlane />
            <button type="button" className="exp__proof-link" onClick={showPlay}>
              exhibit a: the play tab
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
                <path d="M10 16V4M5 9l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** A paper plane on a looping dashed trail, in the same wobbly pencil line as the resume's frog. */
function PaperPlane() {
  return (
    <svg className="plane" viewBox="0 0 320 120" fill="none" aria-hidden>
      <path
        className="plane__trail"
        d="M6 96C44 104 78 98 104 82C128 67 124 42 106 42C88 42 90 70 116 78C150 88 196 66 226 46"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2 9"
      />
      <g className="plane__body" transform="translate(238 22) rotate(-14)">
        <path d="M0 26L62 0L40 44L27 30Z" fill="#fff" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M62 0L27 30L24 45L33.5 35.5" fill="#eaf3fc" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

function VideoCard({ v }: { v: VideoItem }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)

  // pause when scrolled out of view
  useEffect(() => {
    const el = ref.current!
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && el.pause(), { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const toggle = () => {
    const el = ref.current!
    if (el.paused) {
      // one video at a time
      document.querySelectorAll<HTMLVideoElement>('.exp video').forEach((o) => o !== el && o.pause())
      el.play().catch(() => {})
    } else el.pause()
  }

  return (
    <figure className="vid">
      <div className={`vid__frame${playing ? ' is-playing' : ''}`}>
        {/* #t=0.1 makes the browser show a frame instead of a black box before play */}
        <video
          ref={ref}
          src={`${v.src}#t=0.1`}
          playsInline
          preload="metadata"
          controls={started}
          onClick={(e) => started && e.preventDefault()}
          onPlay={() => (setPlaying(true), setStarted(true))}
          onPause={() => setPlaying(false)}
        />
        <button type="button" className="vid__play" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        </button>
      </div>
      {v.caption && <figcaption>{v.caption}</figcaption>}
    </figure>
  )
}
