import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// Deterministic so the planks look the same on every load.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas is unavailable')
  draw(ctx)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

/** Side length in metres of the square that one plank texture covers. */
export const PLANK_TILE = 1.8

// Planks run north-south, as hatched on the drawing. The texture is a
// multiplier over the oak colour, so it stays near white.
export function plankTexture() {
  const size = 1024
  const planks = 16
  const random = seeded(7)
  return canvasTexture(size, (ctx) => {
    const width = size / planks
    for (let i = 0; i < planks; i++) {
      const joint = random() * size
      for (const [start, length] of [
        [joint - size, size * 0.5],
        [joint - size * 0.5, size * 0.5],
        [joint, size * 0.5],
        [joint + size * 0.5, size * 0.5],
      ] as const) {
        const shade = 218 + random() * 37
        ctx.fillStyle = `rgb(${shade}, ${shade - 3}, ${shade - 8})`
        ctx.fillRect(i * width, start, width, length)
        ctx.fillStyle = 'rgba(90, 60, 30, 0.35)'
        ctx.fillRect(i * width, start, width, 1.5)
      }
      ctx.fillStyle = 'rgba(90, 60, 30, 0.4)'
      ctx.fillRect(i * width, 0, 1.5, size)
    }
  })
}

export function concreteTexture() {
  const size = 512
  const random = seeded(11)
  return canvasTexture(size, (ctx) => {
    ctx.fillStyle = 'rgb(236, 236, 234)'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 900; i++) {
      const shade = 205 + random() * 50
      const radius = 6 + random() * 40
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.08)`
      ctx.beginPath()
      ctx.arc(random() * size, random() * size, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}
