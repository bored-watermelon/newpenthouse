export const logos = Object.entries(import.meta.glob('../../logos/*.{svg,png,PNG,jpg,jpeg,webp,avif}', { eager: true, import: 'default' }))
  .map(([path, src]) => ({ name: path.split('/').pop()!.replace(/\.\w+$/, ''), src: src as string }))
  .sort((a, b) => a.name.localeCompare(b.name))

/** Finds a logo by client name, ignoring case (e.g. "juspay" -> Juspay.svg). */
export const findLogo = (client: string) => logos.find((l) => l.name.toLowerCase() === client.trim().toLowerCase())
