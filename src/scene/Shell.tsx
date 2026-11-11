import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BoxGeometry, type Group, MathUtils, type Material } from 'three'
import {
  type FloorFinish,
  type Opening,
  type Rect,
  type Room,
  rooms,
  solids,
  type Vec2,
  type Wall,
  type WallFinish,
  walls,
} from '../plan/plan'
import { materials, oakFloor } from './materials'
import { Block } from './parts'
import { useSceneState } from './SceneState'
import { PLANK_TILE } from './textures'

const FLOOR_THICKNESS = 0.2
const CEILING_THICKNESS = 0.1
const FRAME = 0.04

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

function Floor({ room }: { room: Room }) {
  const geometry = useMemo(() => slabGeometry(room.rect, FLOOR_THICKNESS), [room])
  const [cx, cy] = rectCentre(room.rect)
  return (
    <mesh
      receiveShadow
      geometry={geometry}
      material={floorMaterial[room.floor]}
      position={[cx, room.level - FLOOR_THICKNESS / 2, cy]}
    />
  )
}

function Ceiling({ room, height }: { room: Room; height: number }) {
  const [width, depth] = rectSize(room.rect)
  const [cx, cy] = rectCentre(room.rect)
  return (
    <Block
      size={[width, CEILING_THICKNESS, depth]}
      position={[cx, height + CEILING_THICKNESS / 2, cy]}
      material={materials.ceiling}
    />
  )
}

const length = (wall: Wall) => Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1])
const sillOf = (opening: Opening) => (opening.kind === 'window' ? opening.sill : 0)

function isOn(point: Vec2, wall: Wall) {
  const [ax, ay] = wall.from
  const [bx, by] = wall.to
  const along = ((point[0] - ax) * (bx - ax) + (point[1] - ay) * (by - ay)) / length(wall) ** 2
  const off = (point[0] - ax) * (by - ay) - (point[1] - ay) * (bx - ax)
  return Math.abs(off) < 1e-6 && along > -1e-6 && along < 1 + 1e-6
}

const isParallel = (a: Wall, b: Wall) =>
  Math.abs((a.to[0] - a.from[0]) * (b.to[1] - b.from[1]) - (a.to[1] - a.from[1]) * (b.to[0] - b.from[0])) < 1e-6

// A wall end that meets a crossing wall runs on to that wall's far face, so
// corners close. Ends that butt a wall in line with them stop at the joint.
const meetsCrossingWall = (point: Vec2, wall: Wall) =>
  walls.some((other) => other !== wall && !isParallel(other, wall) && isOn(point, other))

type Piece = { x0: number; x1: number; y0: number; y1: number }

function solidPieces(wall: Wall): Piece[] {
  const overrun = wall.thickness / 2
  const start = meetsCrossingWall(wall.from, wall) ? -overrun : 0
  const end = length(wall) + (meetsCrossingWall(wall.to, wall) ? overrun : 0)
  const pieces: Piece[] = []
  let cursor = start
  for (const opening of wall.openings.toSorted((a, b) => a.offset - b.offset)) {
    const right = opening.offset + opening.width
    const sill = sillOf(opening)
    const head = sill + opening.height
    pieces.push({ x0: cursor, x1: opening.offset, y0: 0, y1: wall.height })
    pieces.push({ x0: opening.offset, x1: right, y0: 0, y1: sill })
    pieces.push({ x0: opening.offset, x1: right, y0: head, y1: wall.height })
    cursor = right
  }
  pieces.push({ x0: cursor, x1: end, y0: 0, y1: wall.height })
  return pieces.filter((piece) => piece.x1 - piece.x0 > 1e-6 && piece.y1 - piece.y0 > 1e-6)
}

// Everything below is drawn in the wall's own frame: x runs along the wall
// from `from`, y is up, and +z is the wall's right-hand side.
const sideSign = (side: 'left' | 'right') => (side === 'right' ? 1 : -1)

function Window({ opening, thickness }: { opening: Extract<Opening, { kind: 'window' }>; thickness: number }) {
  const { width, height, sill, glass } = opening
  const depth = Math.min(0.07, thickness)
  const midY = sill + height / 2
  const mullions = width > 1.5 ? [0, width / 2 - FRAME / 2, width - FRAME] : [0, width - FRAME]
  return (
    <group position={[opening.offset, 0, 0]}>
      <Block size={[width, FRAME, depth]} position={[width / 2, sill + FRAME / 2, 0]} material={materials.steel} />
      <Block
        size={[width, FRAME, depth]}
        position={[width / 2, sill + height - FRAME / 2, 0]}
        material={materials.steel}
      />
      {mullions.map((x) => (
        <Block
          key={x}
          size={[FRAME, height - FRAME * 2, depth]}
          position={[x + FRAME / 2, midY, 0]}
          material={materials.steel}
        />
      ))}
      <mesh position={[width / 2, midY, 0]} material={glass === 'frosted' ? materials.frostedGlass : materials.glass}>
        <boxGeometry args={[width - FRAME * 2, height - FRAME * 2, 0.01]} />
      </mesh>
    </group>
  )
}

function Door({ opening }: { opening: Extract<Opening, { kind: 'door' }> }) {
  const { width, height, hinge, swingsTo, ajar, leaf } = opening
  const reach = hinge === 'start' ? 1 : -1
  const angle = MathUtils.degToRad(ajar) * -reach * sideSign(swingsTo)
  const hingeX = opening.offset + (hinge === 'start' ? 0 : width)
  return (
    <group position={[hingeX, 0, 0]} rotation-y={angle}>
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

// Drawn slid open, resting against the wall face.
function SlidingDoor({
  opening,
  thickness,
}: {
  opening: Extract<Opening, { kind: 'slidingDoor' }>
  thickness: number
}) {
  const { offset, width, height, leafSide, slidesTo } = opening
  const travel = width * 0.9 * (slidesTo === 'end' ? 1 : -1)
  const z = sideSign(leafSide) * (thickness / 2 + 0.02)
  return (
    <Block
      size={[width + 0.04, height, 0.03]}
      position={[offset + width / 2 + travel, height / 2, z]}
      material={materials.oak}
    />
  )
}

// Each panel has its own track, so the panels can stack beside the fixed
// part of the wall at the `from` end of the opening.
function SlidingWall({ opening }: { opening: Extract<Opening, { kind: 'slidingWall' }> }) {
  const { wallOpen } = useSceneState()
  const group = useRef<Group>(null)
  const panelWidth = opening.width / opening.panels
  const trackGap = 0.032

  useFrame((_, delta) => {
    group.current?.children.forEach((panel, index) => {
      const target = wallOpen ? 0 : index * panelWidth
      panel.position.x = MathUtils.damp(panel.position.x, target, 5, delta)
    })
  })

  return (
    <group ref={group} position={[opening.offset + panelWidth / 2, opening.height / 2, 0]}>
      {Array.from({ length: opening.panels }, (_, index) => (
        <group key={index} position={[index * panelWidth, 0, (index - (opening.panels - 1) / 2) * trackGap]}>
          <Block size={[panelWidth, opening.height, 0.028]} position={[0, 0, 0]} material={materials.panel} />
          <Block
            size={[0.02, opening.height, 0.03]}
            position={[panelWidth / 2 - 0.01, 0, 0]}
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
      return <Window opening={opening} thickness={thickness} />
    case 'door':
      return <Door opening={opening} />
    case 'slidingDoor':
      return <SlidingDoor opening={opening} thickness={thickness} />
    case 'slidingWall':
      return <SlidingWall opening={opening} />
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
          position={[(piece.x0 + piece.x1) / 2, (piece.y0 + piece.y1) / 2, 0]}
          material={wallMaterial[wall.finish]}
        >
          <boxGeometry args={[piece.x1 - piece.x0, piece.y1 - piece.y0, wall.thickness]} />
        </mesh>
      ))}
      {wall.openings.map((opening) => (
        <OpeningView key={opening.offset} opening={opening} thickness={wall.thickness} />
      ))}
    </group>
  )
}

export function Shell({ showCeilings }: { showCeilings: boolean }) {
  return (
    <group>
      {rooms.map((room) => (
        <Floor key={room.id} room={room} />
      ))}
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
      <group visible={showCeilings}>
        {rooms.map(
          (room) =>
            room.ceilingHeight !== null && <Ceiling key={room.id} room={room} height={room.ceilingHeight} />,
        )}
      </group>
    </group>
  )
}
