// The clouds in the experiments section: the knobs that describe the sky, and the generator that turns them
// into individual puffs. Change a number here and the whole sky follows.

export type Direction = 'left' | 'right'

export type SkySettings = {
  count: number // how many clouds
  variation: number // 0 = all clouds identical, 1 = wildly different sizes, heights and speeds
  speed: number // multiplier — 1 is the reference drift, 2 is twice as fast
  direction: Direction
}

export const SKY: SkySettings = {
  count: 14,
  variation: 0.5,
  speed: 1,
  direction: 'left',
}

export type Cloud = {
  top: number // % down the sky
  width: number // % of the section's width
  ratio: number // height as a fraction of width
  opacity: number
  duration: number // seconds for one crossing
  delay: number // negative, so the sky starts out already populated
}

/** Deterministic PRNG, so the same settings always produce the same sky (no reshuffle on every render). */
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const mix = (base: number, spread: number, r: number, v: number) => base + spread * v * (r * 2 - 1)

export function makeClouds({ count, variation, speed }: SkySettings): Cloud[] {
  const rand = rng(1337)
  return Array.from({ length: Math.max(0, Math.round(count)) }, () => {
    // depth drives everything else: a near cloud is bigger, more opaque and crosses faster
    const depth = rand()
    const width = mix(10 + depth * 22, 8, rand(), variation)
    return {
      top: mix(8 + depth * 62, 18, rand(), variation),
      width: Math.max(4, width),
      ratio: mix(0.34, 0.14, rand(), variation),
      opacity: Math.min(0.85, Math.max(0.16, mix(0.3 + depth * 0.35, 0.16, rand(), variation))),
      duration: Math.max(8, mix(230 - depth * 130, 60, rand(), variation) / Math.max(0.05, speed)),
      delay: -rand() * 260,
    }
  })
}
