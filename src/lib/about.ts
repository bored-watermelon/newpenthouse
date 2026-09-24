// Cards for the "about me" board. Each /about/*.txt file is one card (see about/_TEMPLATE.txt); pictures live in /media/about.
import { playItems } from '../content'

const texts = import.meta.glob('../../about/*.txt', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const images = import.meta.glob('../../media/about/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif}', {
  query: { w: 1400, format: 'webp', quality: 82 },
  import: 'default',
  eager: true,
}) as Record<string, string>

export type Kind = 'photo' | 'friends' | 'quote' | 'list' | 'text' | 'gallery' | 'link' | 'doodle' | 'journey'
export type Card = {
  id: string
  kind: Kind
  title: string
  body: string
  items: string[]
  people: { name: string; photo?: string }[]
  image?: string
  images: string[]
  thumbs: string[] // small versions of `images`, for anything drawn on the card itself
  caption: string
  link: string
  doodle: string // one of the built-in doodles in AboutMe.tsx (brush, star, plane), drawn in a corner of the card
  color: string
  w: number
  h: number
}

const base = (p: string) => p.split('/').pop()!
const stem = (n: string) => n.replace(/\.[^.]+$/, '')

const files = new Map<string, string>()
for (const [p, url] of Object.entries(images)) {
  files.set(base(p).toLowerCase(), url)
  files.set(stem(base(p)).toLowerCase(), url)
}
const pic = (name: string) => {
  const n = name.trim()
  if (!n) return undefined
  const url = files.get(base(n.replace(/\\/g, '/')).toLowerCase())
  if (!url) console.warn(`[about] image "${n}" not found in media/about`)
  return url
}

const KEYS = new Set(['type', 'title', 'content', 'image', 'images', 'caption', 'link', 'color', 'size', 'doodle'])
const KINDS: Record<string, Kind> = {
  photo: 'photo', picture: 'photo', friends: 'friends', people: 'friends', quote: 'quote', list: 'list',
  text: 'text', anecdote: 'text', note: 'text', gallery: 'gallery', camera: 'gallery', overlay: 'gallery', link: 'link',
  doodle: 'doodle', drawing: 'doodle', journey: 'journey', route: 'journey', map: 'journey',
}
const SIZES: Record<Kind, [number, number]> = { photo: [2, 2], friends: [2, 1], quote: [2, 1], list: [1, 2], text: [2, 1], gallery: [1, 1], link: [1, 1], doodle: [2, 2], journey: [2, 1] }
const COLORS: Record<string, string> = { blue: '#d5ebf7', pink: '#fbd3dc', purple: '#e6dcfb', yellow: '#fce68d', green: '#d4ecc9', dark: '#1d1d1b', white: '#ffffff' }
const DEFAULT_COLOR: Record<Kind, string> = { photo: '#e9eaee', friends: COLORS.purple, quote: COLORS.blue, list: COLORS.yellow, text: COLORS.pink, gallery: COLORS.dark, link: COLORS.green, doodle: COLORS.white, journey: COLORS.blue }

function parseFields(text: string) {
  const out: Record<string, string> = {}
  let cur = ''
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s?(.*)$/)
    if (m && KEYS.has(m[1].toLowerCase())) {
      cur = m[1].toLowerCase()
      out[cur] = m[2]
    } else if (cur) out[cur] += '\n' + line
  }
  for (const k of Object.keys(out)) out[k] = out[k].trim()
  return out
}

/**
 * "Images:" is a list of files from media/about, or "play/<Tag>" to borrow every piece with that tag from the
 * play folder, so a sketchbook card can open the same art the play tab shows without copying files around.
 */
function gallery(value: string): { images: string[]; thumbs: string[] } {
  const fromPlay = value.trim().match(/^play\s*\/\s*(.+)$/i)
  if (fromPlay) {
    const tag = fromPlay[1].trim().toLowerCase()
    const picked = playItems.filter((p) => !p.video && p.tags.some((t) => t.toLowerCase() === tag))
    return { images: picked.map((p) => p.src), thumbs: picked.map((p) => p.thumb ?? p.src) }
  }
  const urls = value.split(/[,\n]/).map((s) => pic(s)).filter((u): u is string => !!u)
  return { images: urls, thumbs: urls }
}

function toCard(id: string, text: string): Card | null {
  const f = parseFields(text)
  const kind = KINDS[(f.type ?? '').toLowerCase()]
  if (!kind) {
    console.warn(`[about] ${id}: unknown Type "${f.type ?? ''}"`)
    return null
  }
  const lines = (f.content ?? '').split('\n').map((l) => l.trim()).filter(Boolean)
  const [dw, dh] = SIZES[kind]
  const size = (f.size ?? '').match(/(\d+)\s*[x×]\s*(\d+)/i)
  const color = (f.color ?? '').toLowerCase()
  return {
    id,
    kind,
    title: f.title ?? '',
    body: (f.content ?? '').trim(),
    items: lines.map((l) => l.replace(/^([-*•]|\d+[.)])\s*/, '')),
    people: kind === 'friends' ? lines.map((l) => {
      const [name, photo] = l.split('|').map((s) => s.trim())
      return { name, photo: photo ? pic(photo) : undefined }
    }) : [],
    image: f.image ? pic(f.image) : undefined,
    ...gallery(f.images ?? ''),
    caption: f.caption ?? '',
    link: f.link ?? '',
    doodle: (f.doodle ?? '').toLowerCase(),
    color: COLORS[color] ?? (color.startsWith('#') ? color : DEFAULT_COLOR[kind]),
    w: size ? Math.max(1, +size[1]) : dw,
    h: size ? Math.max(1, +size[2]) : dh,
  }
}

const fromFiles = Object.entries(texts)
  .filter(([p]) => !base(p).startsWith('_'))
  .sort(([a], [b]) => base(a).localeCompare(base(b), undefined, { numeric: true }))
  .flatMap(([p, t]) => toCard(base(p), t) ?? [])

// Shown until the first real card is added to /about, so the board isn't empty.
const blank = { body: '', items: [], people: [], images: [], thumbs: [], caption: '', link: '', doodle: '', w: 1, h: 1 }
const samples: Card[] = [
  { ...blank, id: 's1', kind: 'photo', title: '', color: DEFAULT_COLOR.photo, w: 2, h: 2, caption: 'a cherished photo' },
  { ...blank, id: 's2', kind: 'friends', title: 'close friends', color: DEFAULT_COLOR.friends, w: 2, h: 1, people: ['Leo', 'Haru', 'Vian', 'Naz'].map((name) => ({ name })) },
  { ...blank, id: 's3', kind: 'quote', title: 'someone wise', color: DEFAULT_COLOR.quote, w: 2, h: 1, body: "Everybody's falling in love, and I'm falling behind." },
  { ...blank, id: 's4', kind: 'list', title: 'things i can’t live without', color: DEFAULT_COLOR.list, w: 1, h: 2, items: ['filter coffee', 'a good playlist', 'sketchbooks', 'long walks'] },
  { ...blank, id: 's5', kind: 'gallery', title: 'camera roll', color: DEFAULT_COLOR.gallery },
  { ...blank, id: 's6', kind: 'text', title: 'a random anecdote', color: DEFAULT_COLOR.text, w: 2, h: 1, body: 'Add cards to the about folder and they show up here. Drag any of them around.' },
]

export const cards: Card[] = fromFiles.length ? fromFiles : samples
export const usingSamples = fromFiles.length === 0

/** The frog from the resume, reused wherever the site needs a friendly face (the case study 404, for one). */
export const frogDoodle = files.get('frog-doodle')
