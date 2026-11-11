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
  | 'study'
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
  rect: Rect
  floor: FloorFinish
  /** Height of the floor surface relative to the main floor. */
  level: number
  /** null means open to the sky. */
  ceilingHeight: number | null
}

type Span = { offset: number; width: number; height: number }

// `offset` runs from the wall's `from` end. `side` is seen while walking
// from `from` to `to`.
export type Opening =
  | (Span & { kind: 'door'; hinge: End; swingsTo: Side; ajar: number; leaf: 'oak' | 'steel' })
  | (Span & { kind: 'slidingDoor'; leafSide: Side; slidesTo: End })
  | (Span & { kind: 'window'; sill: number; glass: 'clear' | 'frosted' })
  | (Span & { kind: 'slidingWall'; panels: number })

export type Wall = {
  from: Vec2
  to: Vec2
  thickness: number
  height: number
  finish: WallFinish
  openings: Opening[]
}

export type Solid = { rect: Rect; height: number; finish: WallFinish }

export const CEILING = 2.4
const DOOR = 2.0
const OUTER = 0.18
const INNER = 0.1

const rect = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 })

const room = (
  id: RoomId,
  name: string,
  r: Rect,
  floor: FloorFinish = 'oak',
  level = 0,
  ceilingHeight: number | null = CEILING,
): Room => ({ id, name, rect: r, floor, level, ceilingHeight })

export const rooms: Room[] = [
  room('bedroom', '洋室(1)', rect(0, 0, 2.67, 3.65)),
  room('entrance', '玄関', rect(2.67, 0, 3.78, 1.0), 'tile', -0.08),
  room('corridor', '廊下', rect(2.67, 1.0, 3.78, 4.4)),
  room('study', '洋室(3)', rect(3.78, 0, 6, 3.65)),
  room('wicNorth', 'ウォークインクロゼット', rect(0, 3.65, 1.7, 4.55)),
  room('toilet', 'トイレ', rect(1.7, 3.65, 2.67, 4.9), 'tile'),
  room('bath', '浴室', rect(0, 4.55, 1.7, 6.5), 'bathTile'),
  room('washroom', '洗面室', rect(1.7, 4.9, 2.67, 7.3), 'tile'),
  room('wicSouth', 'ウォークインクロゼット', rect(0, 6.5, 1.7, 7.3)),
  room('kitchen', 'キッチン', rect(3.78, 3.65, 6, 6.0)),
  room('passage', '廊下', rect(2.67, 4.4, 3.78, 6.0)),
  room('ld', 'リビング・ダイニング', rect(2.67, 6.0, 6, 10.95)),
  room('workroom', '洋室(2)', rect(0, 7.3, 2.67, 10.95)),
  room('balcony', 'バルコニー', rect(0, 10.95, 6, 12.7), 'balcony', -0.1, null),
]

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

const balconyWindow = (offset: number, width: number): Opening => ({
  kind: 'window',
  offset,
  width,
  height: DOOR,
  sill: 0,
  glass: 'clear',
})

export const walls: Wall[] = [
  // Perimeter
  wall(
    [0, 0],
    [6, 0],
    [
      northWindow(1.1),
      { kind: 'door', offset: 2.9, width: 0.8, height: DOOR, hinge: 'start', swingsTo: 'left', ajar: 0, leaf: 'steel' },
      northWindow(4.3),
    ],
    OUTER,
  ),
  wall([6, 0], [6, 6.0], [], OUTER),
  wall([6, 6.0], [6, 10.95], [], OUTER, 'concrete'),
  wall([0, 10.95], [6, 10.95], [balconyWindow(0.4, 2.0), balconyWindow(3.0, 2.6)], OUTER),
  wall([0, 0], [0, 10.95], [], OUTER),

  // The x = 2.67 spine: bedroom, toilet, washroom, then the sliding wall
  // between the workroom and the LD.
  wall(
    [2.67, 0],
    [2.67, 10.95],
    [
      { kind: 'door', offset: 2.7, width: 0.8, height: DOOR, hinge: 'end', swingsTo: 'right', ajar: 80, leaf: 'oak' },
      { kind: 'door', offset: 3.72, width: 0.62, height: DOOR, hinge: 'start', swingsTo: 'left', ajar: 0, leaf: 'oak' },
      { kind: 'slidingDoor', offset: 5.9, width: 0.7, height: DOOR, leafSide: 'right', slidesTo: 'end' },
      { kind: 'slidingWall', offset: 8.0, width: 2.7, height: 2.25, panels: 3 },
    ],
  ),

  // Study, with the shoe-cabinet notch taken out of its north-west corner
  wall([4.2, 0], [4.2, 1.1]),
  wall([3.78, 1.1], [4.2, 1.1]),
  wall(
    [3.78, 1.1],
    [3.78, 4.4],
    [{ kind: 'slidingDoor', offset: 0.4, width: 0.8, height: DOOR, leafSide: 'right', slidesTo: 'end' }],
  ),
  wall([3.78, 3.65], [6, 3.65]),

  // Door between the corridor and the LDK
  wall(
    [2.67, 4.4],
    [3.78, 4.4],
    [{ kind: 'door', offset: 0.16, width: 0.8, height: DOOR, hinge: 'end', swingsTo: 'left', ajar: 82, leaf: 'oak' }],
  ),

  // Closets and wet rooms on the west side
  wall(
    [0, 3.65],
    [2.67, 3.65],
    [{ kind: 'slidingDoor', offset: 0.7, width: 0.75, height: DOOR, leafSide: 'right', slidesTo: 'start' }],
  ),
  wall([0, 4.55], [1.7, 4.55]),
  wall(
    [1.7, 3.65],
    [1.7, 7.3],
    [{ kind: 'door', offset: 2.1, width: 0.65, height: DOOR, hinge: 'start', swingsTo: 'right', ajar: 0, leaf: 'oak' }],
  ),
  wall([1.7, 4.9], [2.67, 4.9]),
  wall([0, 6.5], [1.7, 6.5]),
  wall(
    [0, 7.3],
    [2.67, 7.3],
    [{ kind: 'slidingDoor', offset: 0.8, width: 0.75, height: DOOR, leafSide: 'left', slidesTo: 'start' }],
  ),

  // Balcony: glass handrail and the partitions to the neighbours
  wall([0, 12.7], [6, 12.7], [], 0.02, 'glass', 1.1),
  wall([0, 10.95], [0, 12.7], [], 0.05, 'plaster', 1.8),
  wall([6, 10.95], [6, 12.7], [], 0.05, 'plaster', 1.8),
]

// Rects stop at the inner wall faces so their tops never share a plane
// with a wall of another finish.
export const solids: Solid[] = [
  { rect: rect(0.09, 0.09, 0.5, 0.75), height: CEILING, finish: 'concrete' },
  { rect: rect(5.45, 5.85, 5.91, 6.2), height: CEILING, finish: 'plaster' },
]

export const bounds = { x0: 0, y0: 0, x1: 6, y1: 12.7, height: CEILING }
