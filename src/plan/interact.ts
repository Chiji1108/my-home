// What someone walking through the plan can open or shut from where they
// stand: the fittings in the walls, and the furniture that has doors. In
// plan coordinates, and in the same boxes as the collision.

import { type Box, footprint, meets, openingBox, touches, wayThrough } from './collision'
import { type FurnitureId, furniture, furnitureId, hasDoors } from './furniture'
import { type FittingId, fittings, type Vec2 } from './plan'

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

/**
 * Something that can be worked, as the box that is looked at to work it.
 * `frontOnly` is for a piece of furniture, which is worked from its front;
 * `shuts` is for a fitting, which shuts across the place its box takes up.
 */
type Operable = { id: OperableId; box: Box; frontOnly: boolean; shuts: boolean }

// A fitting that would lead nowhere if it were opened is left alone.
const operables: Operable[] = [
  ...fittings
    .filter(({ wall, opening }) => wayThrough(opening, wall))
    .map(({ wall, opening }) => ({ id: opening.id, box: openingBox(wall, opening), frontOnly: false, shuts: true })),
  // The front of a piece is the face on the positive side of its footprint.
  ...cabinets.map((item) => ({ id: furnitureId(item), box: footprint(item), frontOnly: true, shuts: false })),
]

/** Whether the thing is one that can be worked at all. */
export const works = (id: OperableId) => operables.some((candidate) => candidate.id === id)

/**
 * What is being looked at, within reach: the nearest of the things that
 * can be worked whose face the gaze meets before it meets anything else
 * among `boxes`, the obstacles as they stand. `heading` is a unit vector.
 */
export function facing(position: Vec2, heading: Vec2, boxes: readonly Box[]): Operable | null {
  // A shut fitting is itself among the obstacles, in the same plane as its own box.
  const sight =
    Math.min(REACH, ...boxes.map((box) => meets(position, heading, box)?.distance ?? Infinity)) + 1e-6
  let nearest = sight
  let found: Operable | null = null
  for (const candidate of operables) {
    const met = meets(position, heading, candidate.box)
    if (!met || met.distance > nearest || met.face === 0 || (candidate.frontOnly && met.face < 0)) continue
    nearest = met.distance
    found = candidate
  }
  return found
}

/**
 * What can be worked from here: the thing faced, unless it is an open
 * fitting that would shut on a body of the given radius.
 */
export function operable(
  position: Vec2,
  heading: Vec2,
  radius: number,
  open: OpenState,
  boxes: readonly Box[],
): OperableId | null {
  const found = facing(position, heading, boxes)
  if (!found) return null
  return found.shuts && open[found.id] && touches(position, radius, found.box) ? null : found.id
}
