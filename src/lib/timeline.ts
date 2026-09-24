// Placeholder content for the life timeline. Later this can be read from a folder like the other sections.
export type Period = {
  id: string
  from: number // first year this chapter covers
  to: number // last year this chapter covers
  dates: string // shown as the small tag on the card
  title: string
  text: string
  image?: string // picture or illustration for the card; a soft gradient is used when missing
  link?: string
  tint: [string, string] // gradient for the card's picture area when there is no image
}

export const START = 2002
export const END = 2026
// Where the chapters begin; the timeline draws each part between two of these at the same width.
export const PARTS = [2002, 2019, 2023, 2025, 2026]
export const years = Array.from({ length: END - START + 1 }, (_, i) => START + i)

export const periods: Period[] = [
  {
    id: 'school',
    from: 2002,
    to: 2018,
    dates: '2002 – 2019',
    title: 'Rudrapur',
    text: 'Growing up: school, glue sticks, and a very serious Art Attack habit.',
    tint: ['#dbe9fb', '#eef4ff'],
  },
  {
    id: 'college',
    from: 2019,
    to: 2022,
    dates: '2019 – 2023',
    title: 'IIT Roorkee',
    text: 'B.Tech in E&CE. Ran the fine arts section, curated ‘Darpan’ twice, and found product design through four internships.',
    tint: ['#d4ecc9', '#f1faec'],
  },
  {
    id: 'vi',
    from: 2023,
    to: 2024,
    dates: 'Jul ’23 – Dec ’24',
    title: 'Vodafone Idea',
    text: 'Assistant General Manager. Planned network changes, and helped test and improve the design of an analytics automation tool.',
    tint: ['#fbd3dc', '#fdeef1'],
  },
  {
    id: 'juspay',
    from: 2025,
    to: 2026,
    dates: 'Apr ’25 – now',
    title: 'Juspay',
    text: 'Product designer, working with people who actually get me. A handful of 0 → 1 products in, and life is good again.',
    tint: ['#e6dcfb', '#f4effe'],
  },
]

export const periodFor = (year: number) => periods.find((p) => year >= p.from && year <= p.to) ?? periods[periods.length - 1]
