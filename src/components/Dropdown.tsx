import { useEffect, useRef, useState } from 'react'

type Props = { label: string; value: string; options: string[]; onChange: (v: string) => void }

/** A pill-shaped dropdown. `value` of "" means "All". */
export default function Dropdown({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="dd" ref={root}>
      <button type="button" className={`dd__btn${value ? ' is-on' : ''}${open ? ' is-open' : ''}`} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="dd__label">{label}:</span> {value || 'All'}
        <svg className="dd__chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="dd__menu" role="listbox" aria-label={label}>
          {['', ...options].map((o) => (
            <li key={o || 'all'} role="option" aria-selected={o === value}>
              <button type="button" className={o === value ? 'is-picked' : ''} onClick={() => pick(o)}>
                {o || 'All'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
