// Videos live in /media/videos (a root-level /videos folder works too). Captions go in any .txt file in that folder,
// one per line:   file name : caption      (the extension is optional; lines starting with # are ignored)
const files = import.meta.glob(
  ['../../media/videos/*.{mp4,MP4,webm,mov,MOV,m4v}', '../../videos/*.{mp4,MP4,webm,mov,MOV,m4v}'],
  { query: '?url', import: 'default', eager: true },
) as Record<string, string>
const texts = import.meta.glob(['../../media/videos/*.txt', '../../videos/*.txt'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const base = (p: string) => p.split('/').pop()!
const stem = (n: string) => n.replace(/\.[^.]+$/, '')

const captions = new Map<string, string>()
for (const text of Object.values(texts)) {
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const m = line.match(/^\s*(.+?)\s*[:|]\s*(.*?)\s*$/)
    if (!m) continue
    captions.set(m[1].toLowerCase(), m[2])
    captions.set(stem(m[1]).toLowerCase(), m[2])
  }
}

export type VideoItem = { id: string; src: string; caption: string }

export const videos: VideoItem[] = Object.entries(files)
  .sort(([a], [b]) => base(a).localeCompare(base(b), undefined, { numeric: true }))
  .map(([path, src]) => {
    const name = base(path)
    return { id: name, src, caption: captions.get(name.toLowerCase()) ?? captions.get(stem(name).toLowerCase()) ?? '' }
  })
