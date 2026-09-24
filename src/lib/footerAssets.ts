import './fonts'

const stem = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '')

const stickerFiles = import.meta.glob('../../media/footer elements/*.{png,PNG,webp}', { query: { w: 700, format: 'webp', quality: 86 }, import: 'default', eager: true }) as Record<string, string>
const logoFiles = import.meta.glob('../../media/social media logos/*.{png,PNG,webp,svg}', { query: { w: 256, format: 'webp', quality: 90 }, import: 'default', eager: true }) as Record<string, string>
const videoFiles = import.meta.glob('../../media/backgrounds/footer video*.{mp4,webm}', { query: '?url', import: 'default', eager: true }) as Record<string, string>
const catFiles = import.meta.glob('../../media/backgrounds/footer cat*.{png,webp}', { query: { w: 900, format: 'webp', quality: 88 }, import: 'default', eager: true }) as Record<string, string>

export const footerVideo = Object.values(videoFiles)[0]
export const footerCat = Object.values(catFiles)[0]

/** Social links. The logo is whichever file in /media/social media logos has this name. */
const SOCIAL: { name: string; label: string; href: string }[] = [
  { name: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/bored._.melon' },
  { name: 'twitter', label: 'X', href: 'https://x.com/snehaxdesign' },
  { name: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/sneha-jain-02' },
  { name: 'goodreads', label: 'Goodreads', href: 'https://www.goodreads.com/user/show/158208044-sneha-jain' },
]
const logoByName = new Map(Object.entries(logoFiles).map(([p, url]) => [stem(p).toLowerCase(), url]))
export const socials = SOCIAL.flatMap((s) => {
  const src = logoByName.get(s.name) ?? logoByName.get(s.label.toLowerCase())
  return src ? [{ ...s, src, round: s.name === 'goodreads' }] : []
})

export type Crop = { x: number; y: number; w: number; h: number; W: number; H: number } // pixels of the original image
export type Sticker = { id: string; src: string; x: number; y: number; w: number; rot: number; crop?: Crop }

// Placement is relative to the "i was created / [to] create" text block:
// x / y = centre as a % of its width / height, w = sticker width as a % of the block's width.
// Arranged to frame the words rather than sit on them: every letter of "i was created [to] create" stays readable.
const PLACED: { match: string; x: number; y: number; w: number; rot: number; crop?: Crop }[] = [
  { match: '_ (20) 1', x: -10, y: 26, w: 13, rot: -10, crop: { x: 290, y: 670, w: 780, h: 500, W: 1456, H: 1192 } }, // goldfish, swimming up to the "i"
  { match: '_ (25) 1', x: 17, y: 52, w: 10, rot: -6 }, // DVD, tucked between the lines
  { match: '@geminis_gang', x: 70, y: -16, w: 14, rot: 6 }, // smiley sticky note, stuck on top of "created"
  { match: '_ (24) 1', x: 107, y: 56, w: 10, rot: 0 }, // pencil shavings, after "create"
  { match: '_ (26) 1', x: 104, y: 14, w: 17, rot: 8 }, // camera, past the end of "created"
  { match: 'journaling sticker', x: 97, y: 100, w: 7, rot: 10 }, // green star, at the corner of "create"
  { match: 'archive 1', x: -8, y: 80, w: 10, rot: 0 }, // CD, before "[to]"
  { match: '_ (21) 1', x: 33, y: 90, w: 5.4, rot: 0, crop: { x: 770, y: 495, w: 440, h: 460, W: 1470, H: 1778 } }, // blue heart
  { match: '_ (23) 1', x: 40, y: 82, w: 9, rot: 0 }, // arrows, pointing at "create"
  { match: '_ (22) 1', x: 108, y: 150, w: 7, rot: -8 }, // End key
]

// Files with no entry above are scattered below the text so new stickers still show up and can be dragged.
const rand = (i: number) => (Math.sin(i * 12.9898) * 43758.5453) % 1
export const stickers: Sticker[] = Object.entries(stickerFiles)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src], i) => {
    const name = stem(path)
    const p = PLACED.find((s) => name.toLowerCase().startsWith(s.match.toLowerCase()))
    return p
      ? { id: name, src, x: p.x, y: p.y, w: p.w, rot: p.rot, crop: p.crop }
      : { id: name, src, x: 10 + Math.abs(rand(i)) * 80, y: 130 + Math.abs(rand(i + 7)) * 30, w: 9, rot: (rand(i + 3) - 0.5) * 30 }
  })
