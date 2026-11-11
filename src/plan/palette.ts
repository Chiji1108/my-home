// Surface definitions for the whole room. Colours are sRGB hex; the other
// fields map onto MeshStandardMaterial.

export type Surface = {
  color: string
  roughness: number
  metalness?: number
  opacity?: number
}

export const palette = {
  oak: { color: '#c09a6b', roughness: 0.62 },
  walnut: { color: '#5a4233', roughness: 0.55 },
  plaster: { color: '#d9ccb6', roughness: 0.96 },
  ceiling: { color: '#efe9dd', roughness: 1 },
  concrete: { color: '#a3a19b', roughness: 0.88 },
  panel: { color: '#e9e4d9', roughness: 0.8 },
  linen: { color: '#e4dccb', roughness: 1 },
  cotton: { color: '#f1ede4', roughness: 1 },
  wool: { color: '#cdc3b0', roughness: 1 },
  charcoal: { color: '#3b3a38', roughness: 0.9 },
  steel: { color: '#1f1e1d', roughness: 0.45, metalness: 0.5 },
  aluminium: { color: '#c8cacc', roughness: 0.32, metalness: 0.9 },
  stainless: { color: '#b4b6b6', roughness: 0.3, metalness: 0.85 },
  screen: { color: '#0b0c0e', roughness: 0.15 },
  washi: { color: '#f3e8d2', roughness: 1 },
  terracotta: { color: '#b5674a', roughness: 0.85 },
  olive: { color: '#6f7350', roughness: 0.95 },
  leaf: { color: '#4d6540', roughness: 0.7 },
  porcelain: { color: '#f2f1ed', roughness: 0.25 },
  stone: { color: '#d3cec5', roughness: 0.5 },
  tile: { color: '#b9b4aa', roughness: 0.7 },
  bathTile: { color: '#c9cdcc', roughness: 0.45 },
  balcony: { color: '#9a9892', roughness: 0.95 },
  water: { color: '#b7cfd3', roughness: 0.1 },
  glass: { color: '#dfeaea', roughness: 0.05, opacity: 0.16 },
  frostedGlass: { color: '#eef1ef', roughness: 0.7, opacity: 0.82 },
  mirror: { color: '#dfe3e3', roughness: 0.04, metalness: 1 },
} as const satisfies Record<string, Surface>

export type SurfaceName = keyof typeof palette

export const light = {
  /** 2700 K */
  lamp: '#ffc188',
  sun: '#fff0dc',
  daySky: '#e8e3da',
  nightSky: '#141b29',
}
