import type { Vec2 } from './plan'

export type Viewpoint =
  | {
      id: string
      label: string
      kind: 'dollhouse'
      /** Radians. Azimuth 0 looks north from the balcony side; polar 0 is straight down. */
      azimuth: number
      polar: number
    }
  | {
      id: string
      label: string
      kind: 'eye'
      /** Where the viewer stands, in plan coordinates. */
      position: Vec2
      lookAt: Vec2
      /** Height of the point being looked at. */
      lookAtHeight: number
    }

export const EYE_HEIGHT = 1.5

export const viewpoints = [
  { id: 'overview', label: '俯瞰', kind: 'dollhouse', azimuth: 0.4, polar: 0.62 },
  { id: 'ld', label: 'LD', kind: 'eye', position: [3.2, 5.4], lookAt: [4.6, 9.5], lookAtHeight: 0.9 },
  { id: 'kitchen', label: 'キッチン', kind: 'eye', position: [2.95, 4.8], lookAt: [5.6, 4.9], lookAtHeight: 1.0 },
  { id: 'workroom', label: '仕事部屋', kind: 'eye', position: [2.3, 7.75], lookAt: [0.7, 9.7], lookAtHeight: 0.9 },
  { id: 'bedroom', label: '寝室', kind: 'eye', position: [2.4, 3.42], lookAt: [0.6, 1.4], lookAtHeight: 0.6 },
  { id: 'study', label: '書斎', kind: 'eye', position: [4.15, 2.4], lookAt: [5.3, 0.4], lookAtHeight: 0.9 },
  { id: 'entrance', label: '玄関', kind: 'eye', position: [3.05, 0.35], lookAt: [3.45, 4.4], lookAtHeight: 1.1 },
] as const satisfies readonly Viewpoint[]
