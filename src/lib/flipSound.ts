// The flip sound is whichever file in media starts with "flip". Drop one in to replace the built-in synthesized flip.
const files = import.meta.glob('../../media/flip*.{mp3,wav,ogg,m4a,aac}', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>
const src = Object.values(files)[0]

let audio: HTMLAudioElement | undefined
let ctx: AudioContext | undefined

// A short filtered noise burst with a quick pitch drop, like a flipped switch or card.
function synth() {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  const t = ctx.currentTime
  const len = Math.floor(ctx.sampleRate * 0.12)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(3200, t)
  filter.frequency.exponentialRampToValueAtTime(900, t + 0.1)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.5, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
  noise.connect(filter).connect(gain).connect(ctx.destination)
  noise.start(t)
}

export function playFlip() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  try {
    if (src) {
      audio ??= new Audio(src)
      audio.currentTime = 0
      audio.play().catch(() => {})
    } else synth()
  } catch {
    // sound is a nicety; never break the toggle
  }
}
