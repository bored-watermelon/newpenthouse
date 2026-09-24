// Little scenes for the timeline cards, one per chapter. Drawn in the same loose ink line as the frog doodle on
// the resume (2px, round ends, flat pastel fills), so they read as sketches rather than icons. Each scene has
// one element that drifts gently (.tl-art__bob), which is the only motion.
const INK = '#1d1d1b'
const line = { stroke: INK, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function Sparkle({ x, y, s = 1, fill = INK }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -7C1 -2 2 -1 7 0C2 1 1 2 0 7C-1 2 -2 1 -7 0C-2 -1 -1 -2 0 -7Z"
      fill={fill}
    />
  )
}

function School() {
  return (
    <>
      {/* a kid's drawing on a sheet of paper */}
      <g transform="rotate(-5 168 90)">
        <rect x="96" y="36" width="150" height="104" rx="4" fill="#fff" {...line} />
        <circle cx="126" cy="62" r="9" fill="#fce68d" {...line} />
        <path d="M126 45v-4M126 83v-4M109 62h-4M147 62h-4M114 50l-3-3M141 77l-3-3M138 50l3-3M111 77l3-3" {...line} />
        <path d="M160 86v30h44V86" fill="#fff" {...line} />
        <path d="M154 88l28-26 28 26" fill="#f7b6c8" {...line} />
        <path d="M176 116v-16h12v16" {...line} />
        <path d="M106 126c6-5 11-5 16 0s11 5 16 0 11-5 16 0 11 5 16 0 11-5 16 0 11 5 16 0 11-5 16 0" {...line} />
      </g>
      {/* glue bottle */}
      <g className="tl-art__bob">
        <rect x="38" y="98" width="36" height="48" rx="9" fill="#fff" {...line} />
        <path d="M47 98l4-16h12l4 16" fill="#fff" {...line} />
        <path d="M57 82v-9" {...line} />
        <rect x="45" y="113" width="22" height="16" rx="3" fill="#d5ebf7" {...line} />
      </g>
      {/* pencil */}
      <g transform="translate(270 128) rotate(-28)">
        <rect x="-62" y="-8" width="10" height="16" rx="3" fill="#f4a8cf" {...line} />
        <rect x="-52" y="-8" width="8" height="16" fill="#e7e4df" {...line} />
        <rect x="-44" y="-8" width="62" height="16" fill="#ffd66b" {...line} />
        <path d="M18 -8L38 0L18 8Z" fill="#f5e1c5" {...line} />
        <path d="M31 -2.8L38 0L31 2.8Z" fill={INK} />
      </g>
      <Sparkle x={292} y={42} />
      <Sparkle x={70} y={46} s={0.7} />
    </>
  )
}

function College() {
  return (
    <>
      {/* a mortarboard, mid-toss */}
      <g className="tl-art__bob" transform="rotate(-10 116 70)">
        <path d="M88 72v20c16 10 36 10 52 0V72" fill="#2a2926" {...line} />
        <path d="M58 62l58-22 56 22-56 22z" fill="#2a2926" {...line} />
        <path d="M116 62l36 4v24" stroke="#fce68d" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M148 90l4 12 4-12z" fill="#fce68d" stroke="#fce68d" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M78 124c8 4 18 5 28 3M92 138c8 2 16 2 24 0" {...line} fill="none" />
      {/* a paint palette and brush, for the fine arts years */}
      <path
        d="M204 110c0-28 36-42 66-38s42 24 36 44c-6 20-26 16-36 24-12 10-48 6-60-8-4-6-6-14-6-22z"
        fill="#fff"
        {...line}
      />
      <circle cx="230" cy="122" r="7" fill="#d4ecc9" {...line} />
      <circle cx="238" cy="92" r="7" fill="#b9a6f7" {...line} />
      <circle cx="264" cy="86" r="7" fill="#f4a8cf" {...line} />
      <circle cx="287" cy="99" r="7" fill="#fce68d" {...line} />
      <circle cx="283" cy="121" r="7" fill="#9fd0f0" {...line} />
      <g transform="translate(300 56) rotate(38)">
        <rect x="-4" y="0" width="8" height="54" rx="4" fill="#ffd66b" {...line} />
        <rect x="-5" y="54" width="10" height="10" fill="#e7e4df" {...line} />
        <path d="M-5 64c0 10 3 16 5 20 2-4 5-10 5-20z" fill="#b9a6f7" {...line} />
      </g>
      <Sparkle x={182} y={44} />
      <Sparkle x={40} y={100} s={0.7} />
    </>
  )
}

function Vi() {
  return (
    <>
      {/* a signal tower */}
      <path d="M92 150L118 46l26 104" fill="none" {...line} />
      <path d="M100 118h36M105 98h26M110 78h16M96 134l44-16M100 118l31-20M105 98l21-20M140 134l-44-16" fill="none" {...line} />
      <circle cx="118" cy="40" r="5" fill="#f4a8cf" {...line} />
      <g className="tl-art__bob">
        <path d="M100 28c-6 7-6 17 0 24M88 20c-11 12-11 28 0 40M136 28c6 7 6 17 0 24M148 20c11 12 11 28 0 40" fill="none" {...line} />
      </g>
      {/* the analytics dashboard it fed */}
      <rect x="180" y="44" width="126" height="94" rx="10" fill="#fff" {...line} />
      <path d="M196 62h46M196 72h26" stroke="#c7c3bd" strokeWidth="2" strokeLinecap="round" />
      <rect x="198" y="104" width="14" height="22" rx="2" fill="#fbd3dc" {...line} />
      <rect x="222" y="94" width="14" height="32" rx="2" fill="#fbd3dc" {...line} />
      <rect x="246" y="100" width="14" height="26" rx="2" fill="#fbd3dc" {...line} />
      <rect x="270" y="84" width="14" height="42" rx="2" fill="#f4a8cf" {...line} />
      <path d="M203 94l24-12 24 6 28-18" fill="none" {...line} />
      <circle cx="279" cy="70" r="3.5" fill={INK} />
      <Sparkle x={316} y={34} s={0.8} />
      <Sparkle x={52} y={60} s={0.7} />
    </>
  )
}

function Juspay() {
  return (
    <>
      {/* a virtual card */}
      <g transform="rotate(-8 124 98)">
        <rect x="58" y="56" width="132" height="84" rx="11" fill="#ece6fd" {...line} />
        <rect x="74" y="78" width="22" height="17" rx="3" fill="#fce68d" {...line} />
        <path d="M106 80c3 3 3 9 0 12M112 76c5 5 5 15 0 20" fill="none" {...line} />
        <path d="M74 118h8M88 118h8M102 118h8M116 118h8" {...line} />
        <circle cx="160" cy="118" r="8" fill="#f4a8cf" {...line} />
        <circle cx="172" cy="118" r="8" fill="#fce68d" fillOpacity="0.85" {...line} />
      </g>
      {/* ...and the payment going through */}
      <g className="tl-art__bob">
        <rect x="214" y="28" width="76" height="124" rx="14" fill="#fff" {...line} />
        <path d="M240 38h24" {...line} />
        <circle cx="252" cy="80" r="20" fill="#e2f8cd" {...line} />
        <path d="M242 80l7 7 13-14" fill="none" {...line} />
        <path d="M232 114h40M238 125h28" stroke="#c7c3bd" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="196" cy="146" r="11" fill="#fce68d" {...line} />
      <circle cx="196" cy="146" r="5" fill="none" {...line} />
      <Sparkle x={306} y={40} />
      <Sparkle x={204} y={30} s={0.6} />
    </>
  )
}

const SCENES: Record<string, () => React.JSX.Element> = { school: School, college: College, vi: Vi, juspay: Juspay }

export default function TimelineArt({ id }: { id: string }) {
  const Scene = SCENES[id]
  if (!Scene) return null
  return (
    <svg className="tl-art" viewBox="0 0 340 170" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden>
      <Scene />
    </svg>
  )
}
