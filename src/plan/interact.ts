// What someone walking through the plan can open or shut from where they
// stand: the fittings in the walls, and the furniture that has doors. In
// plan coordinates, like the collision.

import { type Furniture, type FurnitureId, frontOf, furniture, furnitureId, hasDoors } from './furniture'
import { type FittingId, fittings, type PlacedFitting, type Vec2, walls } from './plan'

export type OperableId = FittingId | FurnitureId
/** Which of the things that open stand open. */
export type OpenState = Readonly<Record<OperableId, boolean>>

const cabinets = furniture.filter(hasDoors)

export const initiallyOpen: OpenState = Object.fromEntries([
  ...fittings.map(({ opening }) => [opening.id, opening.open]),
  ...cabinets.map((item) => [furnitureId(item), false]),
])

/** How far away something can be worked from, in metres. */
const REACH = 1.5

/** Where a gaze crosses the stretch between two points: how far off, and how far along the stretch. */
function crossing(position: Vec2, heading: Vec2, from: Vec2, to: Vec2) {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const axis: Vec2 = [(to[0] - from[0]) / length, (to[1] - from[1]) / length]
  const turn = heading[0] * axis[1] - heading[1] * axis[0]
  if (Math.abs(turn) < 1e-9) return null
  const dx = from[0] - position[0]
  const dy = from[1] - position[1]
  const distance = (dx * axis[1] - dy * axis[0]) / turn
  const along = (dx * heading[1] - dy * heading[0]) / turn
  return distance < 0 || along < 0 || along > length ? null : { distance, along }
}

export type Operable = { id: FittingId; fitting: PlacedFitting } | { id: FurnitureId; piece: Furniture }

/**
 * What is being looked at, within reach: the fitting where the gaze first
 * crosses a wall, or the front of a piece with doors if the gaze meets
 * that first, from in front. `heading` is a unit vector.
 */
export function facing(position: Vec2, heading: Vec2): Operable | null {
  let nearest = REACH
  let found: Operable | null = null
  for (const wall of walls) {
    const hit = crossing(position, heading, wall.from, wall.to)
    if (!hit || hit.distance > nearest) continue
    nearest = hit.distance
    const fitting = fittings.find(
      ({ wall: its, opening }) =>
        its === wall && hit.along >= opening.offset && hit.along <= opening.offset + opening.width,
    )
    found = fitting ? { id: fitting.opening.id, fitting } : null
  }
  for (const piece of cabinets) {
    const { from, to, out } = frontOf(piece)
    if (heading[0] * out[0] + heading[1] * out[1] >= 0) continue
    const hit = crossing(position, heading, from, to)
    if (!hit || hit.distance > nearest) continue
    nearest = hit.distance
    found = { id: furnitureId(piece), piece }
  }
  return found
}

/** Whether a body of the given radius stands in the opening, where the fitting would shut on it. */
export function standsIn(position: Vec2, radius: number, { wall, opening }: PlacedFitting) {
  const [from, to] = [wall.from, wall.to]
  const length = Math.hypot(to[0] - from[0], to[1] - from[1])
  const axis: Vec2 = [(to[0] - from[0]) / length, (to[1] - from[1]) / length]
  const dx = position[0] - from[0]
  const dy = position[1] - from[1]
  const along = dx * axis[0] + dy * axis[1]
  const across = dy * axis[0] - dx * axis[1]
  const outside = Math.max(opening.offset - along, along - opening.offset - opening.width, 0)
  return Math.hypot(outside, Math.max(Math.abs(across) - wall.thickness / 2, 0)) < radius
}

/** What can be worked from here: the thing faced, unless it is an open fitting with the body standing in it. */
export function operable(position: Vec2, heading: Vec2, radius: number, open: OpenState): Operable | null {
  const found = facing(position, heading)
  const shutsOnBody = found && 'fitting' in found && open[found.id] && standsIn(position, radius, found.fitting)
  return shutsOnBody ? null : found
}
