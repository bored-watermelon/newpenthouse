import { marked } from 'marked'
import { projectSlug } from './parse'

// A case study is a "case study.md" inside its project folder in /work (see work/_TEMPLATE for the format),
// so a project keeps its tile details, images and write-up in one place. The slug — and so the URL — comes
// from the folder name, not the file name. This module turns the Markdown into rendered HTML plus a left-nav
// table of contents (one entry per "##" section), so CaseStudy.tsx just has to display it.
const mdFiles = import.meta.glob(['../../work/*/*.md', '!../../work/*/_*.md', '!../../work/_*/*.md'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

// [IMAGE: name] / [VIDEO: name | caption] tags reference files in the project's own media folder. Images and
// videos get their own globs (only images go through vite-imagetools' resize/webp pipeline).
const imgFiles = import.meta.glob('../../work/*/media/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif,gif,GIF}', {
  query: { w: 2000, format: 'webp', quality: 84 },
  import: 'default',
  eager: true,
}) as Record<string, string>
const vidFiles = import.meta.glob('../../work/*/media/**/*.{mp4,MP4,webm,WEBM,mov,MOV}', { query: '?url', import: 'default', eager: true }) as Record<string, string>

const base = (path: string) => path.split('/').pop()!
const stem = (name: string) => name.replace(/\.[^.]+$/, '')

/** The /work subfolder a file sits in, e.g. ".../work/01_buyer support/media/x.png" -> "01_buyer support". */
const folderOf = (path: string) => path.split('/work/')[1]!.split('/')[0]

/**
 * { slug -> { "name.ext" | "name" | "sub/name.ext" -> url } }, so a tag can reference a file with or without
 * its extension, and reach into a subfolder of media/ if the project keeps its images grouped.
 */
function indexBySlug(files: Record<string, string>) {
  const bySlug = new Map<string, Map<string, string>>()
  for (const [path, url] of Object.entries(files)) {
    const slug = projectSlug(folderOf(path))
    const rel = path.split('/media/')[1]!
    const file = base(rel)
    const m = bySlug.get(slug) ?? bySlug.set(slug, new Map()).get(slug)!
    m.set(rel.toLowerCase(), url)
    m.set(stem(rel).toLowerCase(), url)
    m.set(file.toLowerCase(), url)
    m.set(stem(file).toLowerCase(), url)
  }
  return bySlug
}
const imagesBySlug = indexBySlug(imgFiles)
const videosBySlug = indexBySlug(vidFiles)

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, '&quot;')

/** Frontmatter is flat "key: value" lines between a leading pair of "---" lines, same spirit as parseWork. */
function splitFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^\s*([A-Za-z][\w -]*)\s*:\s*(.*)$/)
    if (kv) meta[kv[1].trim().toLowerCase()] = kv[2].trim()
  }
  return { meta, body: raw.slice(m[0].length) }
}

// A block-level "[IMAGE: name]" / "[VIDEO: name | caption]" / "[QUOTE: text]" tag, alone on its own line.
const TAG_RE = /^\[(IMAGE|VIDEO):\s*([^|\]]+?)\s*(?:\|\s*(.+?))?\s*\]$/gim
const QUOTE_RE = /^\[QUOTE:\s*(.+?)\s*\]$/gim

function figure(slug: string, kind: 'IMAGE' | 'VIDEO', name: string, caption?: string) {
  const key = name.trim().toLowerCase()
  const primary = kind === 'IMAGE' ? imagesBySlug : videosBySlug
  const fallback = kind === 'IMAGE' ? videosBySlug : imagesBySlug
  const src = primary.get(slug)?.get(key) ?? fallback.get(slug)?.get(key)
  const cap = caption?.trim()
  const figcaption = cap ? `<figcaption>${escapeHtml(cap)}</figcaption>` : ''
  if (!src) {
    console.warn(`[${slug}] ${kind.toLowerCase()} "${name}" not found in that project's work/.../media folder`)
    // The dashed "missing" box is a note to self while writing; visitors never see it.
    if (!import.meta.env.DEV) return ''
    return `<figure class="cs-figure cs-figure--missing"><div class="cs-figure__missing">missing ${kind.toLowerCase()}: ${escapeHtml(name.trim())}</div>${figcaption}</figure>`
  }
  const media = kind === 'IMAGE' ? `<img src="${src}" alt="${escapeAttr(cap ?? '')}" loading="lazy" />` : `<video src="${src}" controls playsInline preload="metadata"></video>`
  return `<figure class="cs-figure">${media}${figcaption}</figure>`
}

const decodeEntities = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const stripTags = (s: string) => s.replace(/<[^>]+>/g, '')
/** Must match the rule documented in _TEMPLATE.md, since a hand-written TOC link has to land on the same id. */
export const slugify = (s: string) =>
  decodeEntities(stripTags(s)).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Gives every h2/h3 a stable id (marked doesn't do this itself) and collects the h2s into a left-nav TOC. */
function addHeadingIds(html: string) {
  const toc: { id: string; text: string }[] = []
  const seen = new Map<string, number>()
  const withIds = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    let id = slugify(inner)
    const n = (seen.get(id) ?? 0) + 1
    seen.set(id, n)
    if (n > 1) id = `${id}-${n}` // keep ids unique if two headings share text
    if (level === '2') toc.push({ id, text: decodeEntities(stripTags(inner)) })
    return `<h${level} id="${id}">${inner}</h${level}>`
  })
  return { html: withIds, toc }
}

/**
 * Wraps each "##" section into <section class="cs-section"> — heading block, then body — so the design's
 * spacing (22px inside a section, 120px between them) is structural rather than a pile of margins. An
 * "*eyebrow*" line written under the heading in the Markdown is lifted ABOVE it, which is where it sits in
 * the design; writing it underneath just keeps the Markdown readable.
 */
function groupSections(html: string) {
  const parts = html.split(/(?=<h2 id=)/)
  return parts
    .map((part) => {
      const h = part.match(/^(<h2 id="[^"]*">[\s\S]*?<\/h2>)\s*/)
      if (!h) return part // anything before the first heading stays as it is
      let rest = part.slice(h[0].length)
      const eyebrow = rest.match(/^<p><em>([^<]*)<\/em><\/p>\s*/)
      if (eyebrow) rest = rest.slice(eyebrow[0].length)
      const label = eyebrow ? `<p class="cs-section__eyebrow">${eyebrow[1]}</p>` : ''
      return `<section class="cs-section"><div class="cs-section__head">${label}${h[1]}</div><div class="cs-section__body">${rest}</div></section>`
    })
    .join('')
}

// A stat's value can list several lines separated by commas (e.g. "1 Product Designer(Me), 1 Product
// Manager, 3 Developers"), each shown on its own line in the header.
const lines = (v?: string) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])

export type CaseStudyDoc = {
  slug: string
  title: string
  minutes: number // estimated reading time
  timeline: string[]
  contributors: string[]
  contribution: string[]
  html: string
  toc: { id: string; text: string }[]
}

export const caseStudies: Record<string, CaseStudyDoc> = Object.fromEntries(
  Object.entries(mdFiles)
    // work/_TEMPLATE isn't a real project, and a "_case study.md" is a write-up that isn't ready yet — its
    // tile shows the Coming Soon cursor until the underscore is dropped from the file name
    .filter(([path]) => !folderOf(path).startsWith('_') && !base(path).startsWith('_'))
    .map(([path, raw]) => {
      const slug = projectSlug(folderOf(path))
      const { meta, body } = splitFrontmatter(raw)
      const withMedia = body
        .replace(TAG_RE, (_m, kind: 'IMAGE' | 'VIDEO', name: string, caption?: string) => figure(slug, kind, name, caption))
        .replace(QUOTE_RE, (_m, text: string) => `<p class="cs-quote">${escapeHtml(text)}</p>`)
      const rawHtml = marked.parse(withMedia, { gfm: true, async: false }) as string
      const { html, toc } = addHeadingIds(rawHtml)
      // ~220 words a minute, plus a few seconds per picture or video, the way long-form reading time is usually counted
      const words = stripTags(rawHtml).split(/\s+/).filter(Boolean).length
      const figures = (body.match(TAG_RE) ?? []).length
      const minutes = Math.max(1, Math.round(words / 220 + figures * 0.15))
      const grouped = groupSections(html)
      return [
        slug,
        {
          slug,
          title: meta.title || slug,
          minutes,
          timeline: lines(meta.timeline),
          contributors: lines(meta.contributors),
          contribution: lines(meta.contribution),
          html: grouped,
          toc,
        },
      ]
    }),
)
