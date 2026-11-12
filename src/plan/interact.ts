// Which fitting someone walking through the plan can open or shut from
// where they stand. In plan coordinates, like the collision.

import { fittings, type OpenState, type PlacedFitting, type Vec2, wallAxis, wallLength, walls } from './plan'

/** How far away a fitting can be worked from, in metres. */
const REACH = 1.5

/**
 * The fitting being looked at: the one in the first wall that the gaze
 * crosses, where it crosses within reach. `heading` is a unit vector.
 */
export function facing(position: Vec2, heading: Vec2): PlacedFitting | null {
  let nearest = REACH
  let found: PlacedFitting | null = null
  for (const wall of walls) {
    const axis = wallAxis(wall)
    const turn = heading[0] * axis[1] - heading[1] * axis[0]
    if (Math.abs(turn) < 1e-9) continue
    const dx = wall.from[0] - position[0]
    const dy = wall.from[1] - position[1]
    const distance = (dx * axis[1] - dy * axis[0]) / turn
    const along = (dx * heading[1] - dy * heading[0]) / turn
    if (distance < 0 || distance > nearest || along < 0 || along > wallLength(wall)) continue
    nearest = distance
    found =
      fittings.find(
        ({ wall: its, opening }) => its === wall && along >= opening.offset && along <= opening.offset + opening.width,
      ) ?? null
  }
  return found
}

/** Whether a body of the given radius stands in the opening, where the fitting would shut on it. */
export function standsIn(position: Vec2, radius: number, { wall, opening }: PlacedFitting) {
  const axis = wallAxis(wall)
  const dx = position[0] - wall.from[0]
  const dy = position[1] - wall.from[1]
  const along = dx * axis[0] + dy * axis[1]
  const across = dy * axis[0] - dx * axis[1]
  const outside = Math.max(opening.offset - along, along - opening.offset - opening.width, 0)
  return Math.hypot(outside, Math.max(Math.abs(across) - wall.thickness / 2, 0)) < radius
}

/** The fitting that can be worked from here: the one faced, unless it is open with the body standing in it. */
export function operable(position: Vec2, heading: Vec2, radius: number, open: OpenState): PlacedFitting | null {
  const found = facing(position, heading)
  return found && !(open[found.opening.id] && standsIn(position, radius, found)) ? found : null
}
