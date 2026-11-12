// Single source of truth for the floor plan. Metres; origin is the north-west
// corner of the unit, x runs east and y runs south. Coordinates are wall
// centrelines, as on the drawing's dimension lines.

export type Vec2 = readonly [x: number, y: number]
export type Rect = { x0: number; y0: number; x1: number; y1: number }

export type FloorFinish = 'oak' | 'tile' | 'bathTile' | 'balcony'
export type WallFinish = 'plaster' | 'concrete' | 'glass'
type Side = 'left' | 'right'
type End = 'start' | 'end'

export type RoomId =
  | 'bedroom'
  | 'entrance'
  | 'corridor'
  | 'hobby'
  | 'wicNorth'
  | 'toilet'
  | 'bath'
  | 'washroom'
  | 'wicSouth'
  | 'kitchen'
  | 'passage'
  | 'ld'
  | 'workroom'
  | 'balcony'

export type Room = {
  id: RoomId
  name: string
  /** Floor area. An L-shaped room is made of more than one rectangle. */
  rects: Rect[]
  floor: FloorFinish
  /** Height of the floor surface relative to the main floor. */
  level: number
  /** null means open to the sky. */
  ceilingHeight: number | null
}

export type FittingId =
  | 'entranceDoor'
  | 'bedroomDoor'
  | 'toiletDoor'
  | 'washroomDoor'
  | 'slidingWall'
  | 'hobbyDoor'
  | 'ldDoor'
  | 'wicNorthDoor'
  | 'bathDoor'
  | 'wicSouthDoor'
  | 'workroomWindow'
  | 'ldWindow'

type Span = { offset: number; width: number; height: number }
/** What makes an opening a fitting, one that can be opened and shut. `open` is how it stands to begin with. */
type Movable = { id: FittingId; open: boolean }

// `offset` runs from the wall's `from` end. `side` is seen while walking
// from `from` to `to`.
export type Opening =
  /** `ajar` is the angle the leaf stands at when open, in degrees. */
  | (Span & Movable & { kind: 'door'; hinge: End; swingsTo: Side; ajar: number; leaf: 'oak' | 'steel' })
  | (Span & Movable & { kind: 'slidingDoor'; leafSide: Side; slidesTo: End })
  | (Span & Movable & { kind: 'slidingWall'; panels: number })
  /** A pair of sashes. The one at the `sash` end is the one that slides open, behind the other. */
  | (Span & Movable & { kind: 'slidingWindow'; sill: number; sash: End })
  | (Span & { kind: 'window'; sill: number; glass: 'clear' | 'frosted' })

export type Fitting = Extract<Opening, Movable>
/** Which of the fittings stand open. */
export type FittingsOpen = Readonly<Record<FittingId, boolean>>

export type Wall = {
  from: Vec2
  to: Vec2
  thickness: number
  height: number
  finish: WallFinish
  openings: Opening[]
}

export const wallLength = (wall: Wall) => Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1])

/** The stretches between `start` and `end` that are left once the gaps are taken out. */
export function spansBetween(gaps: readonly (readonly [number, number])[], start: number, end: number) {
  const spans: [number, number][] = []
  let cursor = start
  for (const [from, to] of gaps.toSorted((a, b) => a[0] - b[0])) {
    spans.push([cursor, from])
    cursor = to
  }
  spans.push([cursor, end])
  return spans.filter(([from, to]) => to - from > 1e-6)
}

/** Unit vector along the wall, from `from` to `to`. */
export function wallAxis(wall: Wall): Vec2 {
  const length = wallLength(wall)
  return [(wall.to[0] - wall.from[0]) / length, (wall.to[1] - wall.from[1]) / length]
}

/** The points just clear of the wall's left and right faces, `along` it from its `from` end. */
export function besideWall(wall: Wall, along: number): [left: Vec2, right: Vec2] {
  const axis = wallAxis(wall)
  const reach = wall.thickness / 2 + 0.05
  const beside = (side: -1 | 1): Vec2 => [
    wall.from[0] + axis[0] * along - side * axis[1] * reach,
    wall.from[1] + axis[1] * along + side * axis[0] * reach,
  ]
  return [beside(-1), beside(1)]
}

/** Width of the members of a window's frame, and of the stiles of its sashes. */
export const WINDOW_FRAME = 0.04

type SlidingWindow = Extract<Opening, { kind: 'slidingWindow' }>

/**
 * A pair of sliding sashes inside the frame: how wide each is, where each
 * begins when shut, measured from the start of the opening, and how far the
 * one that opens slides to stand behind the other. Shut, they overlap by a
 * stile where they meet.
 */
export function sashes({ width, sash }: SlidingWindow) {
  const each = (width - WINDOW_FRAME) / 2
  const near = WINDOW_FRAME
  const far = width - WINDOW_FRAME - each
  return {
    width: each,
    shut: [near, far] as const,
    travel: [sash === 'start' ? far - near : 0, sash === 'end' ? near - far : 0] as const,
  }
}

/** The stretch of a window that its sash, slid open, leaves clear inside the frame, as offsets along the wall. */
export function clearWay(window: SlidingWindow): [number, number] {
  const { offset, width, sash } = window
  const taken = sashes(window).width
  return sash === 'start'
    ? [offset + WINDOW_FRAME, offset + width - WINDOW_FRAME - taken]
    : [offset + WINDOW_FRAME + taken, offset + width - WINDOW_FRAME]
}

/** Opened, the panels of a sliding wall stack where the first one stands, at the `from` end. */
export const panelWidth = (opening: Extract<Opening, { kind: 'slidingWall' }>) => opening.width / opening.panels

export type Solid = { rect: Rect; height: number; finish: WallFinish }

export const CEILING = 2.4
const DOOR = 2.0
const OUTER = 0.18
const INNER = 0.1

const rect = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 })

const room = (
  id: RoomId,
  name: string,
  rects: Rect[],
  floor: FloorFinish = 'oak',
  level = 0,
  ceilingHeight: number | null = CEILING,
): Room => ({ id, name, rects, floor, level, ceilingHeight })

export const rooms: Room[] = [
  room('bedroom', '洋室(1)', [rect(0, 0, 2.67, 3.65)]),
  // The entrance includes the shoe-cabinet notch on its east side.
  room('entrance', '玄関', [rect(2.67, 0, 3.78, 1.0), rect(3.78, 0, 4.2, 1.1)], 'tile', -0.08),
  room('corridor', '廊下', [rect(2.67, 1.0, 3.78, 4.4)]),
  room('hobby', '洋室(3)', [rect(4.2, 0, 6, 3.65), rect(3.78, 1.1, 4.2, 3.65)]),
  room('wicNorth', 'ウォークインクロゼット', [rect(0, 3.65, 1.7, 4.55)]),
  room('toilet', 'トイレ', [rect(1.7, 3.65, 2.67, 4.9)], 'tile'),
  room('bath', '浴室', [rect(0, 4.55, 1.7, 6.5)], 'bathTile'),
  room('washroom', '洗面室', [rect(1.7, 4.9, 2.67, 7.3)], 'tile'),
  room('wicSouth', 'ウォークインクロゼット', [rect(0, 6.5, 1.7, 7.3)]),
  room('kitchen', 'キッチン', [rect(3.78, 3.65, 6, 6.0)]),
  room('passage', '廊下', [rect(2.67, 4.4, 3.78, 6.0)]),
  room('ld', 'リビング・ダイニング', [rect(2.67, 6.0, 6, 10.95)]),
  room('workroom', '洋室(2)', [rect(0, 7.3, 2.67, 10.95)]),
  room('balcony', 'バルコニー', [rect(0, 10.95, 6, 12.7)], 'balcony', -0.1, null),
]

/**
 * Level of the floor under a point, or undefined where there is none. A
 * rectangle owns its north and west edges, so a point on the seam between
 * two rooms is on exactly one of them.
 */
export const floorLevelAt = ([x, y]: Vec2) =>
  rooms.find((room) => room.rects.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1))?.level

const wall = (
  from: Vec2,
  to: Vec2,
  openings: Opening[] = [],
  thickness = INNER,
  finish: WallFinish = 'plaster',
  height = CEILING,
): Wall => ({ from, to, thickness, height, finish, openings })

const northWindow = (offset: number): Opening => ({
  kind: 'window',
  offset,
  width: 1.2,
  height: 1.1,
  sill: 0.9,
  glass: 'frosted',
})

const balconyWindow = (id: FittingId, offset: number, width: number, sash: End, open: boolean): Opening => ({
  kind: 'slidingWindow',
  id,
  open,
  offset,
  width,
  height: DOOR,
  sill: 0,
  sash,
})

type Door = Extract<Opening, { kind: 'door' }>
const door = (
  id: FittingId,
  open: boolean,
  offset: number,
  width: number,
  hinge: End,
  swingsTo: Side,
  ajar = 80,
  leaf: Door['leaf'] = 'oak',
): Opening => ({ kind: 'door', id, open, offset, width, height: DOOR, hinge, swingsTo, ajar, leaf })

const slidingDoor = (id: FittingId, offset: number, width: number, leafSide: Side, slidesTo: End): Opening => ({
  kind: 'slidingDoor',
  id,
  open: true,
  offset,
  width,
  height: DOOR,
  leafSide,
  slidesTo,
})

export const walls: Wall[] = [
  // Perimeter
  wall(
    [0, 0],
    [6, 0],
    [northWindow(1.1), door('entranceDoor', false, 2.9, 0.8, 'start', 'left', 0, 'steel'), northWindow(4.3)],
    OUTER,
  ),
  wall([6, 0], [6, 6.0], [], OUTER),
  wall([6, 6.0], [6, 10.95], [], OUTER, 'concrete'),
  wall([0, 10.95], [6, 10.95], [balconyWindow('workroomWindow', 0.4, 2.0, 'start', false), balconyWindow('ldWindow', 3.0, 2.6, 'start', true)], OUTER),
  wall([0, 0], [0, 10.95], [], OUTER),

  // The x = 2.67 spine: bedroom, toilet, washroom, then the sliding wall
  // that is the whole of the boundary between the workroom and the LD.
  wall(
    [2.67, 0],
    [2.67, 10.95],
    [
      door('bedroomDoor', true, 2.7, 0.8, 'end', 'right'),
      door('toiletDoor', false, 3.72, 0.62, 'start', 'left'),
      slidingDoor('washroomDoor', 5.9, 0.7, 'right', 'end'),
      // From the face of the closet wall to the inner face of the balcony wall.
      {
        kind: 'slidingWall',
        id: 'slidingWall',
        open: false,
        offset: 7.3 + INNER / 2,
        width: 10.95 - OUTER / 2 - (7.3 + INNER / 2),
        height: 2.25,
        panels: 4,
      },
    ],
  ),

  // Hobby room, with the shoe-cabinet notch taken out of its north-west corner
  wall([4.2, 0], [4.2, 1.1]),
  wall([3.78, 1.1], [4.2, 1.1]),
  wall([3.78, 1.1], [3.78, 4.4], [slidingDoor('hobbyDoor', 0.4, 0.8, 'right', 'end')]),
  wall([3.78, 3.65], [6, 3.65]),

  // Door between the corridor and the LDK
  wall([2.67, 4.4], [3.78, 4.4], [door('ldDoor', true, 0.16, 0.8, 'end', 'left', 82)]),

  // Closets and wet rooms on the west side
  wall([0, 3.65], [2.67, 3.65], [slidingDoor('wicNorthDoor', 0.7, 0.75, 'right', 'start')]),
  wall([0, 4.55], [1.7, 4.55]),
  wall([1.7, 3.65], [1.7, 7.3], [door('bathDoor', false, 2.1, 0.65, 'start', 'right')]),
  wall([1.7, 4.9], [2.67, 4.9]),
  wall([0, 6.5], [1.7, 6.5]),
  wall([0, 7.3], [2.67, 7.3], [slidingDoor('wicSouthDoor', 0.8, 0.75, 'left', 'start')]),

  // Balcony: glass handrail and the partitions to the neighbours
  wall([0, 12.7], [6, 12.7], [], 0.02, 'glass', 1.1),
  wall([0, 10.95], [0, 12.7], [], 0.05, 'plaster', 1.8),
  wall([6, 10.95], [6, 12.7], [], 0.05, 'plaster', 1.8),
]

/** Every fitting, with the wall it is in. */
export const fittings = walls.flatMap((wall) =>
  wall.openings.flatMap((opening) => ('id' in opening ? [{ wall, opening }] : [])),
)
export type PlacedFitting = (typeof fittings)[number]

// Rects stop at the inner wall faces so their tops never share a plane
// with a wall of another finish.
export const solids: Solid[] = [
  { rect: rect(0.09, 0.09, 0.5, 0.75), height: CEILING, finish: 'concrete' },
  { rect: rect(5.45, 5.85, 5.91, 6.2), height: CEILING, finish: 'plaster' },
]

export const bounds = { x0: 0, y0: 0, x1: 6, y1: 12.7, height: CEILING }
