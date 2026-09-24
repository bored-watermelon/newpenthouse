// Any font file dropped into /media/fonts is registered under its file name:
//   Kobata.woff2 -> font-family "Kobata",  SF Pro.otf -> "SF Pro"
const files = import.meta.glob('../../media/fonts/*.{woff2,woff,ttf,otf}', { query: '?url', import: 'default', eager: true }) as Record<string, string>

for (const [path, url] of Object.entries(files)) {
  const family = path.split('/').pop()!.replace(/\.[^.]+$/, '')
  new FontFace(family, `url("${url}")`).load().then((f) => document.fonts.add(f)).catch(() => console.warn(`[fonts] could not load ${family}`))
}
