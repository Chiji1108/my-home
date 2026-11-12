// Collision for walking through the plan, in plan coordinates. The body is
// a circle, and everything it can bump into is a box derived from the same
// walls, solids and furniture that are drawn.

import { type Furniture, type FurnitureKind, furniture } from './furniture'
import {
  besideWall,
  clearWay,
  floorLevelAt,
  type Opening,
  type OpenState,
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

// The stretch of an opening that can be walked through, as offsets along
// the wall. Only a fitting that stands open has one. A door, or a window
// with its sash slid open, is a way through only where there is floor on
// both sides of it, and a window only where that floor comes up to its
// sill. An open sliding wall is blocked only where its panels are stacked.
// The leaf of a door swung open is not in the way.
function gap(opening: Opening, wall: Wall, open: OpenState): [number, number] | null {
  if (opening.kind === 'window' || !open[opening.id]) return null
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

function wallBoxes(wall: Wall, open: OpenState): Box[] {
  const axis = wallAxis(wall)
  const gaps = wall.openings.map((opening) => gap(opening, wall, open)).filter((found) => found !== null)
  return spansBetween(gaps, 0, wallLength(wall)).map(([start, end]) => {
    const middle = (start + end) / 2
    return {
      centre: [wall.from[0] + axis[0] * middle, wall.from[1] + axis[1] * middle],
      axis,
      half: [(end - start) / 2, wall.thickness / 2],
    }
  })
}

// A piece's width runs along its local x, which the scene turns about the
// vertical by `rotation`.
function footprint({ position, rotation, size }: Furniture): Box {
  const angle = (rotation * Math.PI) / 180
  return { centre: position, axis: [Math.cos(angle), -Math.sin(angle)], half: [size[0] / 2, size[1] / 2] }
}

export function obstacles(open: OpenState): Box[] {
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

// Moves a circle that overlaps the box out by the shortest way.
function pushOut(point: Vec2, radius: number, { centre, axis, half }: Box): Vec2 {
  const dx = point[0] - centre[0]
  const dy = point[1] - centre[1]
  const along = dx * axis[0] + dy * axis[1]
  const across = dy * axis[0] - dx * axis[1]
  // From the nearest point of the box to the circle's centre, in the box's frame.
  let offAlong = along - clamp(along, half[0])
  let offAcross = across - clamp(across, half[1])
  let distance = Math.hypot(offAlong, offAcross)
  if (distance >= radius - 1e-9) return point

  if (distance < 1e-9) {
    // The centre is inside the box: leave through the nearest face.
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

// A free position near `point` for a circle of the given radius, or null
// where the boxes around it leave no room, as in a gap narrower than the body.
function settle(point: Vec2, radius: number, boxes: readonly Box[]): Vec2 | null {
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
