import { useEffect, useState } from 'react'

const fmt = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true })

/** "● 11:42 pm in mumbai": a live clock in the corner of the hero, so anyone in another timezone knows when a reply is likely. */
export default function LocalTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    // tick on the minute, not every second
    let t = window.setTimeout(function tick() {
      setNow(new Date())
      t = window.setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }, 60_000 - (Date.now() % 60_000))
    return () => window.clearTimeout(t)
  }, [])
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric' }).format(now))
  const awake = hour >= 9 && hour < 23
  return (
    <p className="localtime" title={awake ? 'probably awake' : 'probably asleep'}>
      <span className={`localtime__dot${awake ? ' is-awake' : ''}`} aria-hidden />
      {fmt.format(now).toLowerCase()} in mumbai
    </p>
  )
}
