import type { RoomId, Vec2 } from './plan'

export type FurnitureKind =
  | 'bed'
  | 'bedsideTable'
  | 'rug'
  | 'workDesk'
  | 'studyDesk'
  | 'workChair'
  | 'displayShelf'
  | 'bookshelf'
  | 'closet'
  | 'shoeCabinet'
  | 'sideboard'
  | 'sofa'
  | 'coffeeTable'
  | 'diningTable'
  | 'diningChair'
  | 'pendant'
  | 'plant'
  | 'floorLamp'
  | 'fridge'
  | 'kitchenCounter'
  | 'bathtub'
  | 'toilet'
  | 'vanity'
  | 'washingMachine'
  | 'clothesRack'
  | 'downlight'
  | 'catLitter'
  | 'catFood'
  | 'catTower'

export type Furniture = {
  kind: FurnitureKind
  room: RoomId
  /** Centre of the footprint, in plan coordinates. */
  position: Vec2
  /** Degrees. The piece's front faces south at 0, east at 90, north at 180, west at 270. */
  rotation: number
  size: readonly [width: number, depth: number, height: number]
}

const item = (
  kind: FurnitureKind,
  room: RoomId,
  position: Vec2,
  rotation: number,
  size: Furniture['size'],
): Furniture => ({ kind, room, position, rotation, size })

const SOUTH = 0
const EAST = 90
const NORTH = 180
const WEST = 270

const dining: Vec2 = [4.55, 7.0]
// Far enough under the table that the seat's front edge is tucked in.
const CHAIR_REACH = 0.55
const diningChair = (side: -1 | 1) =>
  item('diningChair', 'ld', [dining[0] + side * CHAIR_REACH, dining[1]], side < 0 ? EAST : WEST, [0.44, 0.46, 0.78])

export const furniture: Furniture[] = [
  // 洋室(1): bedroom
  item('bed', 'bedroom', [1.12, 1.95], EAST, [1.6, 2.04, 0.85]),
  item('bedsideTable', 'bedroom', [0.31, 0.95], EAST, [0.36, 0.4, 0.45]),
  item('bedsideTable', 'bedroom', [0.31, 2.97], EAST, [0.36, 0.4, 0.45]),
  item('clothesRack', 'wicNorth', [0.87, 4.3], NORTH, [1.5, 0.38, 1.8]),

  // 洋室(3): study
  item('studyDesk', 'study', [5.0, 0.41], SOUTH, [1.2, 0.6, 0.72]),
  item('workChair', 'study', [5.0, 1.0], NORTH, [0.6, 0.6, 0.92]),
  item('bookshelf', 'study', [5.75, 2.5], WEST, [1.4, 0.3, 1.8]),
  item('closet', 'study', [4.29, 3.12], NORTH, [0.92, 0.95, 2.4]),
  item('downlight', 'study', [4.9, 1.8], SOUTH, [0.1, 0.1, 2.3]),

  // Entrance and corridor
  item('shoeCabinet', 'entrance', [3.99, 0.6], WEST, [1.0, 0.4, 2.2]),
  item('downlight', 'entrance', [3.22, 0.6], SOUTH, [0.1, 0.1, 2.3]),
  item('downlight', 'corridor', [3.22, 2.6], SOUTH, [0.1, 0.1, 2.3]),

  // Wet rooms
  item('toilet', 'toilet', [2.18, 4.48], NORTH, [0.4, 0.7, 0.85]),
  item('bathtub', 'bath', [0.87, 5.0], SOUTH, [1.5, 0.78, 0.55]),
  item('vanity', 'washroom', [2.185, 5.21], SOUTH, [0.85, 0.5, 0.85]),
  item('washingMachine', 'washroom', [2.18, 6.9], NORTH, [0.64, 0.64, 0.95]),
  item('clothesRack', 'wicSouth', [0.87, 6.76], SOUTH, [1.5, 0.36, 1.8]),
  item('downlight', 'washroom', [2.18, 6.1], SOUTH, [0.1, 0.1, 2.3]),

  // Kitchen
  item('fridge', 'kitchen', [4.22, 4.1], SOUTH, [0.7, 0.7, 1.8]),
  item('sideboard', 'kitchen', [5.3, 3.94], SOUTH, [1.2, 0.45, 0.9]),
  item('kitchenCounter', 'kitchen', [4.825, 5.495], NORTH, [2.15, 0.69, 0.85]),
  item('downlight', 'kitchen', [4.8, 4.7], SOUTH, [0.1, 0.1, 2.3]),
  item('downlight', 'passage', [3.22, 5.3], SOUTH, [0.1, 0.1, 2.3]),

  // LD: dining by the counter, lounge by the window
  item('diningTable', 'ld', dining, SOUTH, [1.0, 1.0, 0.72]),
  diningChair(-1),
  diningChair(1),
  item('pendant', 'ld', dining, SOUTH, [0.6, 0.6, 0.42]),
  item('rug', 'ld', [4.3, 9.1], SOUTH, [1.4, 2.0, 0.012]),
  item('sofa', 'ld', [5.45, 9.1], WEST, [1.8, 0.9, 0.66]),
  item('coffeeTable', 'ld', [4.3, 9.1], EAST, [1.0, 0.5, 0.32]),
  item('catFood', 'ld', [5.76, 7.85], WEST, [0.5, 0.3, 0.1]),
  item('floorLamp', 'ld', [5.6, 10.45], SOUTH, [0.34, 0.34, 1.5]),

  // 洋室(2): hobby and work room
  item('workDesk', 'workroom', [0.48, 9.4], EAST, [1.6, 0.75, 0.72]),
  item('workChair', 'workroom', [1.2, 9.4], WEST, [0.6, 0.6, 0.92]),
  item('displayShelf', 'workroom', [0.45, 7.51], SOUTH, [0.6, 0.3, 1.6]),
  item('plant', 'workroom', [0.4, 10.58], SOUTH, [0.4, 0.4, 1.2]),
  item('catLitter', 'workroom', [2.3, 7.68], SOUTH, [0.5, 0.6, 0.45]),
  item('catTower', 'workroom', [2.2, 10.45], NORTH, [0.6, 0.6, 1.5]),
]
