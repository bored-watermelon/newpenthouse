import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import resumePreview from '../assets/resume-preview.png'

const EMAIL = 'heyiamsnehajain@gmail.com'
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
// The visitor's own local time, in their region's format (e.g. 3:07 PM or 15:07).
const clock = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

const RESUME_PATH = '/Sneha%20Jain%20Resume.pdf'
const SUBJECT = 'Hello from your portfolio'
const FORWARD_SUBJECT = 'Amazing design find'
// No browser lets a page attach a file to an email it didn't compose itself, so the draft carries a direct
// link to the PDF instead — the recipient gets the resume either way, and the copy that downloads alongside
// is there for the sender to drag in if they'd rather send a real attachment.
const forwardBody = () =>
  `hey I am forwarding you the resume of this amazing designer Sneha\n\n${location.origin}${RESUME_PATH}`

// Opens a Gmail compose window with a message prefilled. Browsers can't attach a file to a mailto/compose
// link, so forwarding also triggers a direct download of the resume alongside it (see forwardResume below).
function openGmail(body: string, subject: string = SUBJECT) {
  const q = (o: Record<string, string>) => new URLSearchParams(o).toString().replace(/\+/g, '%20')
  const ua = navigator.userAgent
  const mailto = `mailto:${EMAIL}?${q({ subject, body })}`

  if (/iPhone|iPad|iPod/i.test(ua)) {
    // Gmail app deep link; fall back to the default mail app if Gmail isn't installed.
    window.location.href = `googlegmail:///co?${q({ to: EMAIL, subject, body })}`
    window.setTimeout(() => {
      if (!document.hidden) window.location.href = mailto
    }, 1200)
  } else if (/Android/i.test(ua)) {
    window.location.href = mailto // Android's mail chooser offers the Gmail app
  } else {
    window.open(`https://mail.google.com/mail/?${q({ view: 'cm', fs: '1', to: EMAIL, su: subject, body })}`, '_blank', 'noopener')
  }
}

// Downloads the resume (so it's on hand to attach) and opens Gmail with a forward-style draft that links to it.
function forwardResume() {
  const a = document.createElement('a')
  a.href = RESUME_PATH
  a.download = 'Sneha Jain Resume.pdf'
  a.click()
  openGmail(forwardBody(), FORWARD_SUBJECT)
}

type Msg =
  | { id: number; time: string; from: 'me' | 'you'; kind: 'text'; text: string }
  | { id: number; time: string; from: 'you'; kind: 'resume' }
  | { id: number; time: string; from: 'you'; kind: 'email' }

// Scripted opening. `delay` is ms after the previous message.
type Draft = Msg extends infer M ? (M extends Msg ? Omit<M, 'id' | 'time'> : never) : never

const SCRIPT: (Draft & { delay: number })[] = [
  { from: 'me', kind: 'text', text: 'wyd', delay: 500 },
  { from: 'you', kind: 'text', text: 'making a complicated workflow feel less complicated', delay: 900 },
  { from: 'me', kind: 'text', text: 'wow!\ni could use someone like that.', delay: 1100 },
  { from: 'you', kind: 'resume', delay: 1000 },
  { from: 'you', kind: 'email', delay: 900 },
]

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M21 21H27V5H11V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 11H5V27H21V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopiedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M2 16.2862L6.8 21L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.745 18L18.8 21L30 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false) // "sneha is typing…" dots, shown just before each of her replies
  const [draft, setDraft] = useState('')
  const [copied, setCopied] = useState(false)
  const [reactions, setReactions] = useState<Record<number, string>>({})
  // x/y/h describe the react button's box relative to `.chat`, so the picker (portalled onto `.chat`, see
  // below) can float above everything instead of being clipped by the scrolling message list.
  const [picker, setPicker] = useState<{ id: number; x: number; y: number; h: number; below: boolean } | null>(null)
  // The portal target (`.chat`) as state, not just a ref: reading ref.current during render is unsafe, since
  // it isn't attached yet on the very first render.
  const [chatEl, setChatEl] = useState<HTMLElement | null>(null)
  const chat = useRef<HTMLElement | null>(null)
  const setChatRef = (el: HTMLElement | null) => {
    chat.current = el
    setChatEl(el)
  }
  const scroller = useRef<HTMLDivElement>(null)
  const pressTimer = useRef(0)
  const end = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const anchor = useRef<HTMLElement | null>(null)

  const push = (m: Draft) => setMsgs((prev) => [...prev, { ...m, id: nextId.current++, time: clock() } as Msg])

  useEffect(() => {
    const timers: number[] = []
    let t = 0
    SCRIPT.forEach(({ delay, ...m }) => {
      t += delay
      // her side "types" for a beat before each message lands, the way a real chat does
      if (m.from === 'you') timers.push(window.setTimeout(() => setTyping(true), t - Math.min(650, delay - 150)))
      timers.push(
        window.setTimeout(() => {
          push(m)
          if (m.from === 'you') setTyping(false)
        }, t),
      )
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // Scroll the message list itself rather than calling scrollIntoView on the end marker: scrollIntoView walks
  // up and scrolls every ancestor, so each scripted message that landed while the chat was still playing out
  // was yanking the whole page back to the hero. scrollTo on the element only ever moves that element.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [msgs, typing])

  useEffect(() => {
    if (!picker) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as Element).closest('.picker, .react-btn, .forward-btn')) setPicker(null)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [picker])

  // Positions the picker against the currently-remembered anchor (the message's react button), relative to
  // `.chat` — recomputed on open and again on scroll, since the anchor moves inside the scrolling list.
  const positionPicker = (id: number) => {
    const btn = anchor.current
    if (!btn || !chat.current || !scroller.current) return
    const chatBox = chat.current.getBoundingClientRect()
    const scrollBox = scroller.current.getBoundingClientRect()
    const r = btn.getBoundingClientRect()
    const below = r.top - scrollBox.top < 64
    setPicker({ id, x: r.left + r.width / 2 - chatBox.left, y: r.top - chatBox.top, h: r.height, below })
  }
  // Opens the reaction bar above the message's react button, or below it if there's no room in the scroll area.
  const openPicker = (id: number, fromEl: HTMLElement) => {
    const btn = fromEl.matches('.react-btn') ? fromEl : fromEl.closest('.msg')?.querySelector<HTMLButtonElement>('.react-btn')
    if (!btn) return
    anchor.current = btn
    positionPicker(id)
  }

  // Keep the (portalled) picker glued to its anchor while the message list scrolls under it.
  useEffect(() => {
    if (!picker) return
    const el = scroller.current
    let raf = 0
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; positionPicker(picker.id) })
    }
    el?.addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      el?.removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [picker?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const react = (id: number, emoji: string) => {
    setReactions((r) => {
      const next = { ...r }
      if (next[id] === emoji) delete next[id] // tapping the same reaction removes it
      else next[id] = emoji
      return next
    })
    setPicker(null)
  }
  const startPress = (e: React.PointerEvent, id: number) => {
    if (e.pointerType === 'mouse') return
    const el = e.currentTarget as HTMLElement
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => openPicker(id, el), 450)
  }
  const cancelPress = () => window.clearTimeout(pressTimer.current)

  const reply = (text: string) => {
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      push({ from: 'you', kind: 'text', text })
    }, 1100)
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    push({ from: 'me', kind: 'text', text })
    setDraft('')
    openGmail(text) // must run synchronously in the click so popup blockers allow it
    window.setTimeout(() => reply('opening gmail with your message. hit send there and i’ll get back to you soon ✌️'), 400)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  // WhatsApp-style receipts: a message turns blue-ticked once she has replied after it
  const lastReply = msgs.reduce((last, m, i) => (m.from === 'you' ? i : last), -1)

  const body = (m: Msg, i: number) => {
    if (m.kind === 'text')
      return (
        <>
          {m.text}
          <time className="time time--inline">
            {m.time}
            {m.from === 'me' && (
              <svg className={`ticks${i < lastReply ? ' is-read' : ''}`} viewBox="0 0 16 11" width="16" height="11" aria-label={i < lastReply ? 'Read' : 'Delivered'}>
                <path d="M1 5.5 4.4 9 11 1.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 5.5 8.4 9 15 1.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </time>
        </>
      )
    if (m.kind === 'resume')
      return (
        <>
          <a className="file" href="/Sneha%20Jain%20Resume.pdf" download="Sneha Jain Resume.pdf">
            <img className="file__preview" src={resumePreview} alt="Resume preview" />
            <div className="file__meta">
              <div className="file__info">
                <strong>Sneha Jain Resume.pdf</strong>
                <small>1 page · 1.2 MB · PDF</small>
              </div>
              <span className="file__dl" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path d="M12 4v12m0 0-5-5m5 5 5-5M5 20.5h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </a>
          <p>
            yes, here you go!
            <time className="time time--inline">{m.time}</time>
          </p>
        </>
      )
    return (
      <>
        <p>
          or email me at
          <br />
          {EMAIL}
          <time className="time time--inline">{m.time}</time>
        </p>
        <button type="button" onClick={copy}>
          {copied ? <CopiedIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy email'}
        </button>
      </>
    )
  }

  return (
    <aside className="chat" aria-label="Chat with Sneha" ref={setChatRef}>
      <div className="chat__scroll" ref={scroller}>
        {msgs.map((m, i) => {
          const card = m.kind !== 'text'
          const cls = `bubble bubble--${m.from}${card ? ' bubble--card' : ''}${m.kind === 'email' ? ' bubble--email' : ''}`
          const open = picker?.id === m.id
          return (
            <div key={m.id} className={`msg msg--${m.from}${reactions[m.id] ? ' has-reaction' : ''}${open ? ' is-open' : ''}`}>
              <div className={`msg__wrap${card ? ' msg__wrap--card' : ''}`}>
                <div
                  className={cls}
                  onPointerDown={(e) => startPress(e, m.id)}
                  onPointerUp={cancelPress}
                  onPointerMove={cancelPress}
                  onPointerCancel={cancelPress}
                  onContextMenu={(e) => matchMedia('(hover: none)').matches && e.preventDefault()}
                >
                  {body(m, i)}
                </div>
                {reactions[m.id] && (
                  <button type="button" className="reaction" aria-label="Change reaction" onClick={(e) => openPicker(m.id, e.currentTarget.closest('.msg') as HTMLElement)}>
                    {reactions[m.id]}
                  </button>
                )}
              </div>
              <div className="msg__actions">
                {m.kind === 'resume' && (
                  <button type="button" className="forward-btn" aria-label="Forward resume by email" onClick={forwardResume}>
                    <svg viewBox="0 0 24 24" height="16" width="16" aria-hidden fill="currentColor">
                      <path d="M19.18 11 15.3 7.12a.97.97 0 0 1-.3-.7c0-.28.1-.52.3-.72.2-.18.44-.28.71-.28.28 0 .5.1.69.28l4.6 4.6c.1.1.17.2.21.32a1.2 1.2 0 0 1 0 .76.88.88 0 0 1-.21.32l-4.6 4.6a.9.9 0 0 1-.7.29c-.27-.01-.5-.1-.7-.29a1 1 0 0 1-.31-.7.87.87 0 0 1 .29-.7l3.9-3.9Zm-6 1H7c-.83 0-1.54.3-2.13.88A2.9 2.9 0 0 0 4 15v3c0 .28-.1.52-.29.71A.94.94 0 0 1 3 19a.97.97 0 0 1-.71-.29A.97.97 0 0 1 2 18v-3c0-1.38.49-2.56 1.46-3.54A4.82 4.82 0 0 1 7 10h6.18L10.3 7.12a.97.97 0 0 1-.3-.7c0-.28.1-.52.3-.72.2-.18.44-.28.71-.28.28 0 .5.1.69.28l4.6 4.6c.1.1.17.2.21.32a1.2 1.2 0 0 1 0 .76.88.88 0 0 1-.21.32l-4.6 4.6a.9.9 0 0 1-.7.29c-.27-.01-.5-.1-.7-.29a1 1 0 0 1-.31-.7.87.87 0 0 1 .29-.7l2.9-2.9Z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  className="react-btn"
                  aria-label="React to message"
                  onClick={(e) => (open ? setPicker(null) : openPicker(m.id, e.currentTarget.closest('.msg') as HTMLElement))}
                >
                  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
                    <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    <circle cx="7" cy="8.5" r="1" fill="currentColor" />
                    <circle cx="13" cy="8.5" r="1" fill="currentColor" />
                    <path d="M6.5 12c1 1.3 2.2 2 3.5 2s2.5-0.7 3.5-2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="msg msg--you" aria-live="polite">
            <div className="msg__wrap">
              <div className="bubble bubble--you bubble--typing" aria-label="Sneha is typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      {/* Portalled onto `.chat` (not the scrolling list) so it can float above the About panel instead of
          being clipped at the column edge; positioned via picker.x/y/h, see positionPicker above. */}
      {picker &&
        chatEl &&
        createPortal(
          <div className="picker-anchor" style={{ left: picker.x, top: picker.y, height: picker.h }}>
            <div className={`picker${picker.below ? ' picker--below' : ''}`} role="menu" aria-label="React to message">
              {REACTIONS.map((emoji) => (
                <button key={emoji} type="button" role="menuitem" className={reactions[picker.id] === emoji ? 'is-picked' : ''} onClick={() => react(picker.id, emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>,
          chatEl,
        )}

      <form className="composer" onSubmit={send}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say hi, it opens as an email"
          aria-label="Type a message to Sneha"
        />
        <button type="submit" className="composer__send" aria-label="Send" disabled={!draft.trim()}>
          <svg viewBox="0 0 24 24" height="22" width="22" aria-hidden fill="none">
            <path
              fill="currentColor"
              d="M5.4 19.43a.99.99 0 0 1-.95-.1.93.93 0 0 1-.45-.83V14l8-2-8-2V5.5c0-.37.15-.65.45-.84a1 1 0 0 1 .95-.09l15.4 6.5c.42.19.63.5.63.93 0 .43-.21.74-.63.93l-15.4 6.5Z"
            />
          </svg>
        </button>
      </form>
    </aside>
  )
}
