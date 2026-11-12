import { type Box, meets, settle } from './collision'
import { floorLevelAt, type Vec2 } from './plan'

/** The angle the unit is first seen from. Radians: azimuth 0 looks north from the balcony side; polar 0 is straight down. */
export const overview = { azimuth: 0.4, polar: 0.62 }

/** Where a walk stands and which way it looks. Radians: yaw 0 looks north and grows turning left; pitch 0 is level. */
export type Standing = {
  /** In plan coordinates. */
  position: Vec2
  yaw: number
  pitch: number
}

/** Where a walk begins that has not been anywhere yet: in the LD, looking down its length at the balcony. */
export const start: Standing = { position: [3.2, 5.4], yaw: -2.81, pitch: -0.14 }

export const BODY_RADIUS = 0.2
const EYE_HEIGHT = 1.5

/** Height of the eye of someone standing at the point, or undefined where there is no floor to stand on. */
export function eyeHeightAt(point: Vec2) {
  const level = floorLevelAt(point)
  return level === undefined ? undefined : level + EYE_HEIGHT
}

/**
 * Where a body asked to stand at the point does: there, or as near as
 * what is around it leaves room. Null where there is no room on its side
 * of whatever is in the way, or no floor to stand on.
 */
export function standingNear(point: Vec2, boxes: readonly Box[]): Vec2 | null {
  const spot = settle(point, BODY_RADIUS, boxes)
  if (!spot || floorLevelAt(spot) === undefined) return null
  const aside: Vec2 = [spot[0] - point[0], spot[1] - point[1]]
  const reach = Math.hypot(...aside)
  const heading: Vec2 = [aside[0] / reach, aside[1] / reach]
  // Moved aside past a wall or a piece of furniture, it would be standing beyond it.
  const beyond = reach > 0 && boxes.some((box) => (meets(point, heading, box)?.distance ?? Infinity) < reach)
  return beyond ? null : spot
}
