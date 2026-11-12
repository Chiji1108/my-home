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

export type EyeViewpoint = Extract<Viewpoint, { kind: 'eye' }>

export const EYE_HEIGHT = 1.5

const ld = { id: 'ld', label: 'LD', kind: 'eye', position: [3.2, 5.4], lookAt: [4.6, 9.5], lookAtHeight: 0.9 } as const

export const viewpoints = [
  { id: 'overview', label: '俯瞰', kind: 'dollhouse', azimuth: 0.4, polar: 0.62 },
  ld,
  { id: 'kitchen', label: 'キッチン', kind: 'eye', position: [2.95, 4.8], lookAt: [5.6, 4.9], lookAtHeight: 1.0 },
  { id: 'workroom', label: '仕事部屋', kind: 'eye', position: [1.85, 7.7], lookAt: [0.7, 9.9], lookAtHeight: 0.9 },
  { id: 'bedroom', label: '寝室', kind: 'eye', position: [2.45, 3.0], lookAt: [0.6, 1.4], lookAtHeight: 0.6 },
  { id: 'hobby', label: '趣味部屋', kind: 'eye', position: [3.95, 2.45], lookAt: [5.5, 1.4], lookAtHeight: 0.8 },
  { id: 'entrance', label: '玄関', kind: 'eye', position: [3.05, 0.35], lookAt: [3.45, 4.4], lookAtHeight: 1.1 },
] as const satisfies readonly Viewpoint[]

/** Where a walk begins when it is started from the given viewpoint. */
export const walkStart = (view: Viewpoint): EyeViewpoint => (view.kind === 'eye' ? view : ld)
