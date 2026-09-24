import { useRef, useState } from 'react'
import Chat from './components/Chat'
import About from './components/About'
import CaseStudy from './components/CaseStudy'
import Divider from './components/Divider'
import Work from './components/Work'
import Experiments from './components/Experiments'
import Timeline from './components/Timeline'
import AboutMe from './components/AboutMe'
import Footer from './components/Footer'
import Dock from './components/Dock'
import { useRoute } from './lib/router'
import { useReveal } from './lib/reveal'

// The landing photo is whichever file in media/backgrounds starts with "landing". Turned 180° and resized at build time.
const landing = import.meta.glob('../media/backgrounds/landing*.{jpg,JPG,jpeg,png,webp}', {
  query: { w: 2400, rotate: 180, format: 'webp', quality: 80 },
  import: 'default',
  eager: true,
}) as Record<string, string>
const bg = Object.values(landing)[0]

export default function App() {
  const stage = useRef<HTMLDivElement>(null)
  const [chatWidth, setChatWidth] = useState<number | null>(null) // null = default proportions
  const path = useRoute()
  const caseStudySlug = path.match(/^\/case-studies\/([^/]+)\/?$/)?.[1]
  useReveal([path])

  const style = {
    ...(bg && { backgroundImage: `url(${bg})` }),
    ...(chatWidth !== null && { '--chat-w': `${chatWidth}px` }),
  } as React.CSSProperties

  if (caseStudySlug) return <CaseStudy slug={caseStudySlug} />

  return (
    <>
      <div className="sheet">
        <div className="stage" ref={stage} style={style}>
          <Chat />
          <Divider stage={stage} onChange={setChatWidth} />
          <About />
        </div>
        <Work />
        <Experiments />
        <Timeline />
        <AboutMe />
      </div>
      <Footer />
      <Dock />
    </>
  )
}
