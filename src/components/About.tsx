import Ticker from './Ticker'
import LocalTime from './LocalTime'
import { findLogo } from '../lib/logos'

/** A place in the "rudrapur → roorkee → mumbai" line, with a small note that appears on hover or focus. */
function Place({ children, note, past = false }: { children: React.ReactNode; note: string; past?: boolean }) {
  const Tag = past ? 's' : 'span'
  return (
    <span className="place" tabIndex={0} aria-label={note}>
      <Tag>{children}</Tag>
      <span className="place__note" aria-hidden>
        {note}
      </span>
    </span>
  )
}

export default function About() {
  const juspay = findLogo('Juspay')
  return (
    <section className="about">
      <LocalTime />
      <p className="about__note">
        do not question my design decisions.
        <br />i did not question them myself.
      </p>

      <div className="about__copy">
        <p data-reveal>
          i am <span className="chip">sneha</span>, a product designer from
          <br />
          <Place past note="where it all started">
            rudrapur 🍼
          </Place>{' '}
          →{' '}
          <Place past note="IIT Roorkee, B.Tech ’23">
            roorkee 🎓
          </Place>{' '}
          →{' '}
          <Place note="home, for now">mumbai 💼</Place>
        </p>
        <p data-reveal>
          before i was a designer, i was a kid frantically following along to{' '}
          <a className="purple" href="https://youtu.be/YDi9-uXXRfc?si=Izbf_ubp6q1wHw8t" target="_blank" rel="noreferrer">
            Art Attack
          </a>{' '}
          and devouring the tutorials on{' '}
          <a className="pink" href="https://www.arvindguptatoys.com/toys.html" target="_blank" rel="noreferrer">
            arvindguptatoys.com
          </a>
          .
        </p>
        <p data-reveal>
          these days, i’m getting my hands dirty in the world of payments at{' '}
          {juspay ? <img className="inline-logo" src={juspay.src} alt="Juspay" /> : 'Juspay'}.
        </p>
      </div>

      <footer className="worked">
        <span className="worked__label">worked with</span>
        <Ticker />
      </footer>
    </section>
  )
}
