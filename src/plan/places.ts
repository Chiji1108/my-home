import { floorLevelAt, type Vec2 } from './plan'

/** The angle the unit is first seen from. Radians: azimuth 0 looks north from the balcony side; polar 0 is straight down. */
export const overview = { azimuth: 0.4, polar: 0.62 }

/** Somewhere a walk can be taken up: where to stand, and what to look at. */
export type Place = {
  id: string
  label: string
  /** In plan coordinates. */
  position: Vec2
  lookAt: Vec2
  /** Height of the point being looked at. */
  lookAtHeight: number
}

const EYE_HEIGHT = 1.5

/** Height of the eye of someone standing at the point, or undefined where there is no floor to stand on. */
export function eyeHeightAt(point: Vec2) {
  const level = floorLevelAt(point)
  return level === undefined ? undefined : level + EYE_HEIGHT
}

/** Height of the eye at a place, which has to be somewhere one can stand. */
export function eyeHeightOf(place: Place) {
  const height = eyeHeightAt(place.position)
  if (height === undefined) throw new Error(`Place ${place.id} stands on no floor`)
  return height
}

export const places = [
  { id: 'ld', label: 'LD', position: [3.2, 5.4], lookAt: [4.6, 9.5], lookAtHeight: 0.9 },
  { id: 'kitchen', label: 'キッチン', position: [2.95, 4.8], lookAt: [5.6, 4.9], lookAtHeight: 1.0 },
  { id: 'workroom', label: '仕事部屋', position: [1.8, 7.7], lookAt: [0.7, 9.9], lookAtHeight: 0.9 },
  { id: 'bedroom', label: '寝室', position: [2.45, 3.0], lookAt: [0.6, 1.4], lookAtHeight: 0.6 },
  { id: 'hobby', label: '趣味部屋', position: [4.1, 2.4], lookAt: [5.5, 1.4], lookAtHeight: 0.8 },
  { id: 'entrance', label: '玄関', position: [3.05, 0.35], lookAt: [3.45, 4.4], lookAtHeight: 1.1 },
] as const satisfies readonly Place[]
