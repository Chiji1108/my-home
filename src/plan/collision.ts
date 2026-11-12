// Collision for walking through the plan, in plan coordinates. The body is
// a circle, and everything it can bump into is a box derived from the same
// walls, solids and furniture that are drawn.

import { type Furniture, type FurnitureKind, furniture, widthAxis } from './furniture'
import {
  besideWall,
  clearWay,
  floorLevelAt,
  type FittingsOpen,
  type Opening,
  panelWidth,
  solids,
  spansBetween,
  type Vec2,
  type Wall,
  wallAxis,
  wallLength,
  walls,
} from './plan'

/** A rectangle lying along `axis`, a unit vector. */
export type Box = {
  centre: Vec2
  axis: Vec2
  half: readonly [along: number, across: number]
}

// Pieces that lie flat on the floor or hang from the ceiling.
const passable: ReadonlySet<FurnitureKind> = new Set(['rug', 'pendant', 'downlight'])

/**
 * The stretch of an opening that can be walked through once it stands
 * open, as offsets along the wall, or null if it leads nowhere. A door, or
 * a window with its sash slid open, is a way through only where there is
 * floor on both sides of it, and a window only where that floor comes up
 * to its sill. An open sliding wall is blocked only where its panels are
 * stacked. The leaf of a door swung open is not in the way.
 */
export function wayThrough(opening: Opening, wall: Wall): [number, number] | null {
  if (opening.kind === 'window') return null
  const whole: [number, number] = [opening.offset, opening.offset + opening.width]
  // The floor levels either side of the middle of a stretch, if there is floor on both.
  const floors = ([from, to]: [number, number]) => {
    const [left, right] = besideWall(wall, (from + to) / 2).map(floorLevelAt)
    return left === undefined || right === undefined ? null : [left, right]
  }
  switch (opening.kind) {
    case 'slidingWindow': {
      const way = clearWay(opening)
      const levels = floors(way)
      return levels && Math.max(...levels) >= opening.sill ? way : null
    }
    case 'slidingWall':
      return [opening.offset + panelWidth(opening), whole[1]]
    case 'door':
    case 'slidingDoor':
      return floors(whole) ? whole : null
  }
}

/** The wall's own thickness over a stretch of it, given as offsets along the wall. */
function stretch(wall: Wall, [start, end]: readonly [number, number]): Box {
  const axis = wallAxis(wall)
  const middle = (start + end) / 2
  return {
    centre: [wall.from[0] + axis[0] * middle, wall.from[1] + axis[1] * middle],
    axis,
    half: [(end - start) / 2, wall.thickness / 2],
  }
}

/** The whole of an opening, which is what a fitting fills when it is shut. */
export const openingBox = (wall: Wall, opening: Opening) =>
  stretch(wall, [opening.offset, opening.offset + opening.width])

// A wall is solid except where a fitting that stands open leaves a way through.
function wallBoxes(wall: Wall, open: FittingsOpen): Box[] {
  const gaps = wall.openings
    .map((opening) => (opening.kind !== 'window' && open[opening.id] ? wayThrough(opening, wall) : null))
    .filter((found) => found !== null)
  return spansBetween(gaps, 0, wallLength(wall)).map((span) => stretch(wall, span))
}

export function footprint(item: Furniture): Box {
  return { centre: item.position, axis: widthAxis(item), half: [item.size[0] / 2, item.size[1] / 2] }
}

export function obstacles(open: FittingsOpen): Box[] {
  return [
    ...walls.flatMap((wall) => wallBoxes(wall, open)),
    ...solids.map(
      ({ rect }): Box => ({
        centre: [(rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2],
        axis: [1, 0],
        half: [(rect.x1 - rect.x0) / 2, (rect.y1 - rect.y0) / 2],
      }),
    ),
    ...furniture.filter((item) => !passable.has(item.kind)).map(footprint),
  ]
}

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value))

/** A vector in the box's own frame: along its axis, and across it. */
const inFrame = ({ axis }: Box, [x, y]: Vec2): Vec2 => [x * axis[0] + y * axis[1], y * axis[0] - x * axis[1]]

/** From the nearest point of the box to the point, in the box's frame. Zero inside the box. */
function offBox(point: Vec2, box: Box): Vec2 {
  const [along, across] = inFrame(box, [point[0] - box.centre[0], point[1] - box.centre[1]])
  return [along - clamp(along, box.half[0]), across - clamp(across, box.half[1])]
}

/** Whether the point is in the box. */
export const within = (point: Vec2, box: Box) => Math.hypot(...offBox(point, box)) === 0

/** Whether a circle overlaps the box. */
export const touches = (point: Vec2, radius: number, box: Box) => Math.hypot(...offBox(point, box)) < radius - 1e-9

/**
 * Where a gaze from `from` along the unit vector `heading` meets the box:
 * how far off, and through which of the faces that lie along its axis, +1
 * or -1, or 0 for an end. Null if the gaze misses or begins inside.
 */
export function meets(from: Vec2, heading: Vec2, box: Box): { distance: number; face: -1 | 0 | 1 } | null {
  const origin = inFrame(box, [from[0] - box.centre[0], from[1] - box.centre[1]])
  const turn = inFrame(box, heading)
  let enter = -Infinity
  let leave = Infinity
  let face: -1 | 0 | 1 = 0
  for (const i of [0, 1] as const) {
    if (Math.abs(turn[i]) < 1e-12) {
      if (Math.abs(origin[i]) > box.half[i]) return null
      continue
    }
    const side = turn[i] > 0 ? -1 : 1
    const near = (side * box.half[i] - origin[i]) / turn[i]
    const far = (-side * box.half[i] - origin[i]) / turn[i]
    if (near > enter) {
      enter = near
      face = i === 1 ? side : 0
    }
    leave = Math.min(leave, far)
  }
  return enter < 0 || enter > leave ? null : { distance: enter, face }
}

// Moves a circle that overlaps the box out by the shortest way.
function pushOut(point: Vec2, radius: number, box: Box): Vec2 {
  const { centre, axis, half } = box
  let [offAlong, offAcross] = offBox(point, box)
  let distance = Math.hypot(offAlong, offAcross)
  if (distance >= radius - 1e-9) return point

  if (distance < 1e-9) {
    // The centre is inside the box: leave through the nearest face.
    const [along, across] = inFrame(box, [point[0] - centre[0], point[1] - centre[1]])
    const toAlong = half[0] - Math.abs(along)
    const toAcross = half[1] - Math.abs(across)
    offAlong = toAlong < toAcross ? Math.sign(along) || 1 : 0
    offAcross = toAlong < toAcross ? 0 : Math.sign(across) || 1
    distance = -Math.min(toAlong, toAcross)
  } else {
    offAlong /= distance
    offAcross /= distance
  }
  const push = radius - distance
  return [
    point[0] + (offAlong * axis[0] - offAcross * axis[1]) * push,
    point[1] + (offAlong * axis[1] + offAcross * axis[0]) * push,
  ]
}

/**
 * A free position near `point` for a circle of the given radius, or null
 * where the boxes around it leave no room, as in a gap narrower than the body.
 */
export function settle(point: Vec2, radius: number, boxes: readonly Box[]): Vec2 | null {
  // Pushing out of one box can push into its neighbour, so go round again
  // until a pass moves nothing.
  for (let pass = 0; pass < 5; pass++) {
    const before = point
    for (const box of boxes) point = pushOut(point, radius, box)
    if (point === before) return point
  }
  return null
}

/**
 * Where a circle at `from` ends up after trying to move by `step`. Being
 * pushed out of a wall square to its face is what makes the body slide.
 */
export function move(from: Vec2, step: Vec2, radius: number, boxes: readonly Box[]): Vec2 {
  // Short strides, so that no stride can carry the centre across a wall.
  const strides = Math.max(1, Math.ceil(Math.hypot(step[0], step[1]) / (radius / 2)))
  let point = from
  for (let i = 0; i < strides; i++) {
    const next = settle([point[0] + step[0] / strides, point[1] + step[1] / strides], radius, boxes)
    if (!next) break
    point = next
  }
  return point
}
