// The lever toggle, redrawn as SVG from the work/play artboards so the stick can actually move.
// Coordinates follow the original 766×628 "work" artboard: the slot spans x 210–578, and the lever pivots
// where the stick meets the slot's bottom edge (x 289 when leaning left, x 503 when leaning right).
export default function PinSwitchArt() {
  return (
    <svg className="pin-art" viewBox="0 0 766 628" aria-hidden focusable="false">
      <defs>
        <filter id="pin-shadow" x="-20%" y="-40%" width="140%" height="240%">
          <feDropShadow dx="0" dy="22" stdDeviation="22" floodColor="#000" floodOpacity="0.12" />
        </filter>
        <linearGradient id="pin-slot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a4a4a4" />
          <stop offset="0.2" stopColor="#8f8f8f" />
          <stop offset="1" stopColor="#8a8a8a" />
        </linearGradient>
        <linearGradient id="pin-slot-on" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7cb56e" />
          <stop offset="0.2" stopColor="#66a558" />
          <stop offset="1" stopColor="#619f55" />
        </linearGradient>
        <linearGradient id="pin-rod" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5e5e5e" />
          <stop offset="0.45" stopColor="#f2f2f2" />
          <stop offset="0.75" stopColor="#a9a9a9" />
          <stop offset="1" stopColor="#6a6a6a" />
        </linearGradient>
        <radialGradient id="pin-ball" cx="0.4" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#d9524a" />
          <stop offset="0.55" stopColor="#c3413a" />
          <stop offset="1" stopColor="#95271f" />
        </radialGradient>
        <radialGradient id="pin-glint" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {/* everything below the slot's bottom edge is hidden, so the stick appears to go down into the slot */}
        <clipPath id="pin-clip">
          <rect x="0" y="0" width="766" height="460" />
        </clipPath>
      </defs>

      <rect x="180" y="358" width="428" height="134" rx="67" fill="#e8e8e8" filter="url(#pin-shadow)" />
      <rect x="210" y="387" width="368" height="73" rx="36.5" fill="url(#pin-slot)" />
      <rect className="pin-art__on" x="210" y="387" width="368" height="73" rx="36.5" fill="url(#pin-slot-on)" />
      <rect x="210" y="387" width="368" height="73" rx="36.5" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />

      <g clipPath="url(#pin-clip)">
        <g className="pin-art__lever">
          <rect x="-30" y="-232" width="60" height="252" fill="url(#pin-rod)" />
          <g className="pin-art__ball">
            <circle cx="0" cy="-232" r="108" fill="url(#pin-ball)" />
            <ellipse cx="-30" cy="-268" rx="26" ry="24" fill="url(#pin-glint)" />
          </g>
        </g>
      </g>
    </svg>
  )
}
