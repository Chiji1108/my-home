import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BoxGeometry, type Group, MathUtils, type Material } from 'three'
import {
  besideWall,
  bounds,
  floorLevelAt,
  type FloorFinish,
  type Opening,
  panelWidth,
  type Rect,
  type Room,
  rooms,
  sashes,
  solids,
  spansBetween,
  type Vec2,
  type Wall,
  type WallFinish,
  WINDOW_FRAME,
  wallLength,
  walls,
} from '../plan/plan'
import { materials, oakFloor } from './materials'
import { Block } from './parts'
import { useShadowsDirty } from './shadows'
import { PLANK_TILE } from './textures'
import { useTravel } from './useTravel'

const FLOOR_THICKNESS = 0.2
const CEILING_THICKNESS = 0.1
const FRAME = WINDOW_FRAME
/** Depth of a sash, and the distance between the two tracks that a pair of sashes runs on. */
const SASH_DEPTH = 0.02
const SASH_TRACKS = 0.026
/** Width of the oak stile on the leading edge of a sliding wall panel. */
const STILE = 0.02

const floorMaterial: Record<FloorFinish, Material> = {
  oak: oakFloor,
  tile: materials.tile,
  bathTile: materials.bathTile,
  balcony: materials.balcony,
}

const wallMaterial: Record<WallFinish, Material> = {
  plaster: materials.plaster,
  concrete: materials.concrete,
  glass: materials.glass,
}

const rectSize = (r: Rect) => [r.x1 - r.x0, r.y1 - r.y0] as const
const rectCentre = (r: Rect) => [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2] as const

// UVs follow world position so planks line up across room boundaries.
function slabGeometry(rect: Rect, thickness: number) {
  const [width, depth] = rectSize(rect)
  const [cx, cy] = rectCentre(rect)
  const geometry = new BoxGeometry(width, thickness, depth)
  const { position, uv } = geometry.attributes
  if (!position || !uv) throw new Error('BoxGeometry is missing attributes')
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (position.getX(i) + cx) / PLANK_TILE, -(position.getZ(i) + cy) / PLANK_TILE)
  }
  return geometry
}

function Floor({ room, rect }: { room: Room; rect: Rect }) {
  const geometry = useMemo(() => slabGeometry(rect, FLOOR_THICKNESS), [rect])
  const [cx, cy] = rectCentre(rect)
  return (
    <mesh
      receiveShadow
      geometry={geometry}
      material={floorMaterial[room.floor]}
      position={[cx, room.level - FLOOR_THICKNESS / 2, cy]}
    />
  )
}

function Ceiling({ rect, height }: { rect: Rect; height: number }) {
  const [width, depth] = rectSize(rect)
  const [cx, cy] = rectCentre(rect)
  return (
    <Block
      size={[width, CEILING_THICKNESS, depth]}
      position={[cx, height + CEILING_THICKNESS / 2, cy]}
      material={materials.ceiling}
    />
  )
}

const sillOf = (opening: Opening) => ('sill' in opening ? opening.sill : 0)

function isOn(point: Vec2, wall: Wall) {
  const [ax, ay] = wall.from
  const [bx, by] = wall.to
  const along = ((point[0] - ax) * (bx - ax) + (point[1] - ay) * (by - ay)) / wallLength(wall) ** 2
  const off = (point[0] - ax) * (by - ay) - (point[1] - ay) * (bx - ax)
  return Math.abs(off) < 1e-6 && along > -1e-6 && along < 1 + 1e-6
}

const isParallel = (a: Wall, b: Wall) =>
  Math.abs((a.to[0] - a.from[0]) * (b.to[1] - b.from[1]) - (a.to[1] - a.from[1]) * (b.to[0] - b.from[0])) < 1e-6

const isEndOf = (point: Vec2, wall: Wall) =>
  [wall.from, wall.to].some((end) => Math.hypot(end[0] - point[0], end[1] - point[1]) < 1e-6)

// How far a wall end is moved outwards so that it joins the wall crossing it
// without the two overlapping. Where two walls end in a corner, the one
// listed first runs on to the other's outer face. Every other end stops at
// the near face of the wall it meets. Ends that butt a wall in line with
// them stay at the joint.
function extension(point: Vec2, wall: Wall) {
  const other = walls.find((candidate) => candidate !== wall && !isParallel(candidate, wall) && isOn(point, candidate))
  if (!other) return 0
  const ownsCorner = isEndOf(point, other) && walls.indexOf(wall) < walls.indexOf(other)
  return ((ownsCorner ? 1 : -1) * other.thickness) / 2
}

// Walls start at the lowest floor, so none is left hanging over a room
// that sits below the main floor.
const WALL_BASE = Math.min(...rooms.map((room) => room.level))

/** Whether there is a floor at the point that is level with `height` or above it. */
const reaches = (point: Vec2, height: number) => (floorLevelAt(point) ?? -Infinity) >= height

/** A box of wall in the wall's own frame, as laid out below. */
type Piece = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }

function solidPieces(wall: Wall): Piece[] {
  const start = -extension(wall.from, wall)
  const end = wallLength(wall) + extension(wall.to, wall)
  const half = wall.thickness / 2
  const gaps = wall.openings.map((opening) => [opening.offset, opening.offset + opening.width] as const)
  const pieces: Piece[] = spansBetween(gaps, start, end).map(([x0, x1]) => ({
    x0,
    x1,
    y0: WALL_BASE,
    y1: wall.height,
    z0: -half,
    z1: half,
  }))
  for (const opening of wall.openings) {
    const x0 = opening.offset
    const x1 = opening.offset + opening.width
    const sill = sillOf(opening)
    // A floor that is level with the sill runs in under the opening as far
    // as the wall's centreline, so the wall below the sill is left out on
    // that side: its top would lie in the plane of the floor.
    const [left, right] = besideWall(wall, (x0 + x1) / 2)
    pieces.push({ x0, x1, y0: WALL_BASE, y1: sill, z0: reaches(left, sill) ? 0 : -half, z1: reaches(right, sill) ? 0 : half })
    pieces.push({ x0, x1, y0: sill + opening.height, y1: wall.height, z0: -half, z1: half })
  }
  return pieces.filter((piece) => piece.y1 - piece.y0 > 1e-6 && piece.z1 - piece.z0 > 1e-6)
}

// Everything below is drawn in the wall's own frame: x runs along the wall
// from `from`, y is up, and +z is the wall's right-hand side.
const sideSign = (side: 'left' | 'right') => (side === 'right' ? 1 : -1)

// A sash: two stiles, two rails and the pane they hold, about the middle of its track.
function Sash({ z, width, height }: { z: number; width: number; height: number }) {
  const pane = [width - FRAME * 2, height - FRAME * 2] as const
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            size={[FRAME, height, SASH_DEPTH]}
            position={[(side * (width - FRAME)) / 2, 0, 0]}
            material={materials.steel}
          />
          <Block
            size={[pane[0], FRAME, SASH_DEPTH]}
            position={[0, (side * (height - FRAME)) / 2, 0]}
            material={materials.steel}
          />
        </group>
      ))}
      <mesh material={materials.glass}>
        <boxGeometry args={[pane[0], pane[1], 0.01]} />
      </mesh>
    </group>
  )
}

type WindowOpening = Extract<Opening, { kind: 'window' | 'slidingWindow' }>

// Each sash runs on its own track, so the one that opens can stand behind the other.
function Sashes({ opening }: { opening: Extract<Opening, { kind: 'slidingWindow' }> }) {
  const pair = sashes(opening)
  const group = useTravel<Group>(opening.id, (sashes, travel) => {
    sashes.children.forEach((sash, track) => {
      sash.position.x = (pair.shut[track] ?? 0) + (pair.travel[track] ?? 0) * travel + pair.width / 2
    })
  })
  return (
    <group ref={group} position={[0, opening.sill + opening.height / 2, 0]}>
      {pair.shut.map((x, track) => (
        <Sash key={x} z={(track - 0.5) * SASH_TRACKS} width={pair.width} height={opening.height - FRAME * 2} />
      ))}
    </group>
  )
}

function Window({ opening, thickness }: { opening: WindowOpening; thickness: number }) {
  const { width, height, sill } = opening
  const depth = Math.min(0.07, thickness)
  const midY = sill + height / 2
  const inside = [width - FRAME * 2, height - FRAME * 2] as const
  return (
    <group position={[opening.offset, 0, 0]}>
      {[sill + FRAME / 2, sill + height - FRAME / 2].map((y) => (
        <Block key={y} size={[width, FRAME, depth]} position={[width / 2, y, 0]} material={materials.steel} />
      ))}
      {[FRAME / 2, width - FRAME / 2].map((x) => (
        <Block key={x} size={[FRAME, inside[1], depth]} position={[x, midY, 0]} material={materials.steel} />
      ))}
      {opening.kind === 'slidingWindow' ? (
        <Sashes opening={opening} />
      ) : (
        <mesh
          position={[width / 2, midY, 0]}
          material={opening.glass === 'frosted' ? materials.frostedGlass : materials.glass}
        >
          <boxGeometry args={[inside[0], inside[1], 0.01]} />
        </mesh>
      )}
    </group>
  )
}

// The leaf turns about its hinge, on the wall's centreline at the jamb.
function Door({ opening }: { opening: Extract<Opening, { kind: 'door' }> }) {
  const { width, height, hinge, swingsTo, ajar, leaf } = opening
  const reach = hinge === 'start' ? 1 : -1
  const angle = MathUtils.degToRad(ajar) * -reach * sideSign(swingsTo)
  const hingeX = opening.offset + (hinge === 'start' ? 0 : width)
  const group = useTravel<Group>(opening.id, (door, travel) => {
    door.rotation.y = angle * travel
  })
  return (
    <group ref={group} position={[hingeX, 0, 0]}>
      <Block
        size={[width - 0.01, height - 0.01, 0.035]}
        position={[(reach * width) / 2, height / 2, 0]}
        material={leaf === 'steel' ? materials.steel : materials.oak}
      />
      <Block
        size={[0.12, 0.02, 0.09]}
        position={[reach * (width - 0.1), 1.0, 0]}
        material={leaf === 'steel' ? materials.aluminium : materials.steel}
      />
    </group>
  )
}

// The leaf hangs clear of the wall face and slides along it.
function SlidingDoor({
  opening,
  thickness,
}: {
  opening: Extract<Opening, { kind: 'slidingDoor' }>
  thickness: number
}) {
  const { offset, width, height, leafSide, slidesTo } = opening
  const run = width * 0.9 * (slidesTo === 'end' ? 1 : -1)
  const z = sideSign(leafSide) * (thickness / 2 + 0.02)
  const leaf = useTravel<Group>(opening.id, (leaf, travel) => {
    leaf.position.x = offset + width / 2 + run * travel
  })
  return (
    <group ref={leaf} position={[0, height / 2, z]}>
      <Block size={[width + 0.04, height, 0.03]} position={[0, 0, 0]} material={materials.oak} />
    </group>
  )
}

// Each panel has its own track, so the panels can stack at the `from` end
// of the opening. The tracks share out the wall's thickness, which keeps
// the stack within the wall's faces however many panels there are.
function SlidingWall({
  opening,
  thickness,
}: {
  opening: Extract<Opening, { kind: 'slidingWall' }>
  thickness: number
}) {
  const width = panelWidth(opening)
  const track = thickness / opening.panels
  const group = useTravel<Group>(opening.id, (panels, travel) => {
    panels.children.forEach((panel, index) => {
      panel.position.x = index * width * (1 - travel)
    })
  })

  return (
    <group ref={group} position={[opening.offset + width / 2, opening.height / 2, 0]}>
      {Array.from({ length: opening.panels }, (_, index) => (
        <group key={index} position={[0, 0, (index - (opening.panels - 1) / 2) * track]}>
          {/* The stile closes the panel's edge, so the two never share a face. */}
          <Block
            size={[width - STILE, opening.height, track * 0.8]}
            position={[-STILE / 2, 0, 0]}
            material={materials.panel}
          />
          <Block
            size={[STILE, opening.height, track * 0.88]}
            position={[(width - STILE) / 2, 0, 0]}
            material={materials.oak}
          />
        </group>
      ))}
    </group>
  )
}

function OpeningView({ opening, thickness }: { opening: Opening; thickness: number }) {
  switch (opening.kind) {
    case 'window':
    case 'slidingWindow':
      return <Window opening={opening} thickness={thickness} />
    case 'door':
      return <Door opening={opening} />
    case 'slidingDoor':
      return <SlidingDoor opening={opening} thickness={thickness} />
    case 'slidingWall':
      return <SlidingWall opening={opening} thickness={thickness} />
  }
}

function WallView({ wall }: { wall: Wall }) {
  const pieces = useMemo(() => solidPieces(wall), [wall])
  const angle = Math.atan2(-(wall.to[1] - wall.from[1]), wall.to[0] - wall.from[0])
  const opaque = wall.finish !== 'glass'
  return (
    <group position={[wall.from[0], 0, wall.from[1]]} rotation-y={angle}>
      {pieces.map((piece) => (
        <mesh
          key={`${piece.x0}:${piece.y0}`}
          castShadow={opaque}
          receiveShadow={opaque}
          position={[(piece.x0 + piece.x1) / 2, (piece.y0 + piece.y1) / 2, (piece.z0 + piece.z1) / 2]}
          material={wallMaterial[wall.finish]}
        >
          <boxGeometry args={[piece.x1 - piece.x0, piece.y1 - piece.y0, piece.z1 - piece.z0]} />
        </mesh>
      ))}
      {wall.openings.map((opening) => (
        <OpeningView key={opening.offset} opening={opening} thickness={wall.thickness} />
      ))}
    </group>
  )
}

export function Shell() {
  const ceilings = useRef<Group>(null)
  const shadowsDirty = useShadowsDirty()

  // Ceilings are lifted off while the camera is above them, so that it
  // can look down into the rooms.
  useFrame(({ camera }) => {
    const group = ceilings.current
    const visible = camera.position.y < bounds.height
    if (!group || group.visible === visible) return
    group.visible = visible
    shadowsDirty()
  })

  return (
    <group>
      {rooms.flatMap((room) =>
        room.rects.map((rect, index) => <Floor key={`${room.id}:${index}`} room={room} rect={rect} />),
      )}
      {walls.map((wall) => (
        <WallView key={`${wall.from}:${wall.to}`} wall={wall} />
      ))}
      {solids.map((solid) => {
        const [width, depth] = rectSize(solid.rect)
        const [cx, cy] = rectCentre(solid.rect)
        return (
          <Block
            key={`${cx}:${cy}`}
            size={[width, solid.height, depth]}
            position={[cx, solid.height / 2, cy]}
            material={wallMaterial[solid.finish]}
          />
        )
      })}
      <group ref={ceilings}>
        {rooms.flatMap(({ id, rects, ceilingHeight }) =>
          ceilingHeight === null
            ? []
            : rects.map((rect, index) => <Ceiling key={`${id}:${index}`} rect={rect} height={ceilingHeight} />),
        )}
      </group>
    </group>
  )
}
