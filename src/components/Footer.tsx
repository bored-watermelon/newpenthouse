import { useEffect, useRef, useState } from 'react'
import SocialPhysics from './SocialPhysics'
import StickerItem from './StickerItem'
import DragWord from './DragWord'
import { useDrag } from '../lib/useDrag'
import { footerCat, footerVideo, stickers } from '../lib/footerAssets'

const EMAIL = 'heyiamsnehajain@gmail.com'

/**
 * The footer sits fixed behind the page ("sheet"). The invisible spacer after the sheet gives the page
 * enough scroll length to slide the sheet up and uncover it.
 */
export default function Footer() {
  const spacer = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const eyes = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(false)
  const [copied, setCopied] = useState(false)
  const pill = useDrag()

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(spacer.current!)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (active) v.play().catch(() => {})
    else v.pause()
  }, [active])

  // the googly eyes on the resume sticker look at the cursor
  useEffect(() => {
    if (!active) return
    const look = (e: PointerEvent) => {
      eyes.current?.querySelectorAll<HTMLElement>('.eye').forEach((eye) => {
        const r = eye.getBoundingClientRect()
        const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2))
        eye.style.setProperty('--px', `${Math.cos(a) * 7}px`)
        eye.style.setProperty('--py', `${Math.sin(a) * 7}px`)
      })
    }
    window.addEventListener('pointermove', look)
    return () => window.removeEventListener('pointermove', look)
  }, [active])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <footer className={`foot${active ? ' is-active' : ''}`} aria-label="Contact">
        {footerVideo && <video ref={video} className="foot__video" src={footerVideo} muted loop playsInline preload="auto" />}

        <div className="foot__center">
          <div className="foot__text">
            <a
              className={`resume-pill${pill.dragging ? ' is-dragging' : ''}`}
              href="/Sneha%20Jain%20Resume.pdf"
              download="Sneha Jain Resume.pdf"
              draggable={false}
              style={{ zIndex: pill.z, transform: `translate(${pill.pos.x}px, ${pill.pos.y}px) rotate(${pill.dragging ? -4 : -8}deg)` }}
              {...pill.handlers}
              // a drag that ends on the pill shouldn't also download the file
              onClick={(e) => pill.moved.current && e.preventDefault()}
            >
              Download resume
              <span className="eyes" ref={eyes} aria-hidden>
                <span className="eye" />
                <span className="eye" />
              </span>
            </a>

            <p className="foot__l1">
              <DragWord>i</DragWord> <DragWord>was</DragWord>{' '}
              <DragWord className="sel">
                created<i className="sel__h sel__h--l" aria-hidden />
                <i className="sel__h sel__h--r" aria-hidden />
              </DragWord>
            </p>
            <p className="foot__l2">
              <DragWord className="foot__to">[to]</DragWord> <DragWord className="foot__create">create</DragWord>
            </p>

            {stickers.map((s) => (
              <StickerItem key={s.id} s={s} />
            ))}
          </div>
        </div>

        {footerCat && <img className="foot__cat" src={footerCat} alt="" draggable={false} />}

        <button type="button" className="foot__copy" onClick={copy} data-solid>
          {copied ? 'copied ✓' : `copy → ${EMAIL}`}
        </button>

        <SocialPhysics active={active} />

        <small className="foot__credit" data-solid>
          © {new Date().getFullYear()} sneha jain · video by sire khattar (@artandwizardry)
        </small>
      </footer>
      <div className="foot-spacer" ref={spacer} aria-hidden />
    </>
  )
}
