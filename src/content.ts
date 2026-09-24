import { parsePlayName, parseWork, projectSlug, type WorkMeta } from './lib/parse'
import { caseStudies } from './lib/caseStudy'

// A project is a folder in /work holding everything it needs: a "tile details.txt", a "thumbnail.*", a
// "bg.*", and (optionally) a "case study.md" with its own /media folder. Dropping a new folder in is all it
// takes to add a project — no code changes, and nothing to keep in sync by file name.
const workText = import.meta.glob(['../work/*/*.txt', '!../work/_*/*.txt'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
// Resized and converted to WebP at build time, so the big originals in the folders are fine to keep.
const thumbFiles = import.meta.glob(['../work/*/thumbnail.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif}', '!../work/_*/thumbnail.*'], { query: { w: 1600, format: 'webp', quality: 82 }, import: 'default', eager: true }) as Record<string, string>
const bgFiles = import.meta.glob(['../work/*/bg.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif}', '!../work/_*/bg.*'], { query: { w: 2000, format: 'webp', quality: 80 }, import: 'default', eager: true }) as Record<string, string>
// Play images go through the same resize → WebP pipeline as everything else (the originals include a 14MB PNG):
// a small copy for the grid, with its size so the masonry never reflows as images arrive, and a large one for
// the lightbox. GIFs, SVGs and videos are served as they are.
type Meta = { src: string; width: number; height: number }
const playThumbs = import.meta.glob('../play/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif}', { query: { w: 720, format: 'webp', quality: 80, as: 'metadata' }, import: 'default', eager: true }) as Record<string, Meta>
const playFull = import.meta.glob('../play/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,avif}', { query: { w: 2000, format: 'webp', quality: 84 }, import: 'default', eager: true }) as Record<string, string>
const playRaw = import.meta.glob('../play/*.{gif,svg,mp4,webm,mov}', { query: '?url', import: 'default', eager: true }) as Record<string, string>

const base = (path: string) => path.split('/').pop()!
const stem = (name: string) => name.replace(/\.[^.]+$/, '')
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

/** The /work subfolder a file sits in, e.g. "../work/01_buyer support/bg.jpg" -> "01_buyer support". */
export const workFolder = (path: string) => path.split('/work/')[1]!.split('/')[0]

/** { folder -> url }, for the one-per-folder images (thumbnail, bg). */
const byFolder = (files: Record<string, string>) => new Map(Object.entries(files).map(([path, url]) => [workFolder(path), url]))
const thumbs = byFolder(thumbFiles)
const backgrounds = byFolder(bgFiles)

export type Project = Omit<WorkMeta, 'caseStudy'> & { id: string; slug: string; thumbnail?: string; background?: string; caseStudy?: string }

export const projects: Project[] = Object.entries(workText)
  // folders starting with "_" (like _TEMPLATE) are ignored, as is any stray .txt that isn't the tile details
  .filter(([path]) => !workFolder(path).startsWith('_') && /tile details/i.test(base(path)))
  .sort(([a], [b]) => byName(workFolder(a), workFolder(b)))
  .map(([path, text]) => {
    const folder = workFolder(path)
    const slug = projectSlug(folder)
    if (!thumbs.has(folder)) console.warn(`[work] "${folder}" has no thumbnail.* image`)
    if (!backgrounds.has(folder)) console.warn(`[work] "${folder}" has no bg.* image`)
    const { caseStudy, ...meta } = parseWork(text)
    return {
      id: folder,
      slug,
      ...meta,
      thumbnail: thumbs.get(folder),
      background: backgrounds.get(folder),
      // normally the folder's own "case study.md"; a "Case Study:" line in the .txt overrides it, which is
      // how a project points at a write-up hosted somewhere else
      caseStudy: caseStudy || (caseStudies[slug] ? `/case-studies/${slug}` : undefined),
    }
  })

export type PlayItem = { id: string; src: string; thumb?: string; width?: number; height?: number; video: boolean; tags: string[]; caption: string }

export const playItems: PlayItem[] = [...Object.keys(playFull), ...Object.keys(playRaw)]
  .sort((a, b) => byName(base(a), base(b)))
  .map((path) => {
    const name = base(path)
    const t = playThumbs[path]
    return {
      id: name,
      src: playFull[path] ?? playRaw[path],
      thumb: t?.src,
      width: t?.width,
      height: t?.height,
      video: /\.(mp4|webm|mov)$/i.test(name),
      ...parsePlayName(stem(name)),
    }
  })
