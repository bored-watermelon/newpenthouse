export type PlayMeta = { tags: string[]; caption: string }

/**
 * Play files are named:  Tags-[Tag1, Tag2, Tag3];Text-caption.ext
 * "-", ":" and "/" are all accepted after "Tags" / "Text", and the caption may optionally be quoted.
 * Tags can be one bracket with commas, or several brackets: [Tag1],[Tag2].
 */
export function parsePlayName(base: string): PlayMeta {
  const m = base.match(/^\s*tags\s*[-:/]\s*(.*?)\s*;\s*text\s*[-:/]\s*(.*?)\s*$/i)
  if (!m) return { tags: [], caption: '' }
  const bracketed = [...m[1].matchAll(/\[([^\]]*)\]/g)].flatMap((x) => x[1].split(','))
  const tags = (bracketed.length ? bracketed : m[1].split(',')).map((t) => t.trim()).filter(Boolean)
  const caption = m[2]
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .replace(/^["“”]\s*/, '')
    .replace(/\s*["“”]$/, '')
    .trim()
  return { tags, caption }
}

export type WorkMeta = {
  title: string
  description: string
  interfaces: string[]
  distribution: string[]
  domain: string[]
  clients: string[]
  caseStudy: string
}

const KEYS: Record<string, keyof WorkMeta> = {
  'project title': 'title',
  title: 'title',
  'project description': 'description',
  description: 'description',
  interface: 'interfaces',
  interfaces: 'interfaces',
  distribution: 'distribution',
  domain: 'domain',
  client: 'clients',
  clients: 'clients',
  'case study': 'caseStudy',
}

const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean)

/** Work files are "Key: value" lines; lines without a key continue the previous value. */
export function parseWork(text: string): WorkMeta {
  const raw: Partial<Record<keyof WorkMeta, string>> = {}
  let current: keyof WorkMeta | null = null
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue // comment
    const m = line.match(/^\s*([A-Za-z ]+?)\s*:\s*(.*)$/)
    const key = m && KEYS[m[1].toLowerCase()]
    if (key) {
      current = key
      raw[key] = m![2].trim()
    } else if (current && line.trim()) {
      raw[current] = `${raw[current]} ${line.trim()}`
    }
  }
  return {
    title: raw.title ?? '',
    description: raw.description ?? '',
    interfaces: list(raw.interfaces ?? ''),
    distribution: list(raw.distribution ?? ''),
    domain: list(raw.domain ?? ''),
    clients: list(raw.clients ?? ''),
    caseStudy: raw.caseStudy ?? '',
  }
}

/**
 * A project is a folder in /work, e.g. "01_buyer support". The leading "NN_" only sets the display order,
 * so the slug — which is also the case study's URL — is the rest of the name: "buyer-support".
 */
export const projectSlug = (folder: string) =>
  folder
    .replace(/^\d+\s*[_-]\s*/, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
