import { materials } from '../materials'
import { Block, Cyl, Soft, WashiShade } from '../parts'
import type { PieceProps } from './types'

const TOP = 0.03

// The user sits at the front (+z); the back edge goes against a wall.
function DeskBase({ size: [w, d, h] }: PieceProps) {
  const leg = 0.035
  return (
    <group>
      <Soft size={[w, TOP, d]} position={[0, h - TOP / 2, 0]} material={materials.oak} radius={0.008} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block
            key={`${sx}${sz}`}
            size={[leg, h - TOP, leg]}
            position={[sx * (w / 2 - 0.06), (h - TOP) / 2, sz * (d / 2 - 0.06)]}
            material={materials.steel}
          />
        )),
      )}
    </group>
  )
}

// 27-inch display: a thin aluminium slab on a tilting stand.
function StudioDisplay({ position }: { position: readonly [number, number, number] }) {
  const [width, height, depth] = [0.623, 0.362, 0.018]
  const centre = 0.11 + height / 2
  return (
    <group position={[position[0], position[1], position[2]]}>
      <Soft size={[0.18, 0.008, 0.16]} position={[0, 0.004, 0]} material={materials.aluminium} radius={0.003} />
      <Block size={[0.11, centre, 0.012]} position={[0, centre / 2, -0.05]} material={materials.aluminium} />
      <Soft size={[width, height, depth]} position={[0, centre, -0.03]} material={materials.aluminium} radius={0.006} />
      <Block size={[width - 0.02, height - 0.02, 0.002]} position={[0, centre, -0.03 + depth / 2]} material={materials.screen} />
    </group>
  )
}

export function WorkDesk({ size }: PieceProps) {
  const [w, d, h] = size
  return (
    <group>
      <DeskBase size={size} />
      <StudioDisplay position={[0, h, -d / 2 + 0.2]} />
      <Soft size={[0.127, 0.05, 0.127]} position={[w / 2 - 0.3, h - TOP - 0.03, -0.12]} material={materials.aluminium} radius={0.012} />
      <Soft size={[0.28, 0.008, 0.115]} position={[-0.08, h + 0.004, 0.12]} material={materials.aluminium} radius={0.003} />
      <Block size={[0.265, 0.003, 0.1]} position={[-0.08, h + 0.009, 0.12]} material={materials.porcelain} />
      <Soft size={[0.16, 0.006, 0.115]} position={[0.17, h + 0.003, 0.12]} material={materials.porcelain} radius={0.002} />
      <Cyl radius={0.04} height={0.09} position={[-w / 2 + 0.2, h + 0.045, 0.05]} material={materials.terracotta} />
      <Block size={[0.22, 0.03, 0.3]} position={[-w / 2 + 0.25, h + 0.015, -0.2]} material={materials.olive} rotation={[0, 0.2, 0]} />
    </group>
  )
}

export function StudyDesk({ size }: PieceProps) {
  const [w, d, h] = size
  return (
    <group>
      <DeskBase size={size} />
      <Block size={[0.31, 0.012, 0.215]} position={[0, h + 0.006, 0.05]} material={materials.aluminium} />
      <Block size={[0.31, 0.215, 0.008]} position={[0, h + 0.11, -0.085]} rotation={[-0.3, 0, 0]} material={materials.aluminium} />
      <Block size={[0.22, 0.05, 0.16]} position={[-w / 2 + 0.2, h + 0.025, -0.05]} material={materials.terracotta} />
      <Block size={[0.2, 0.03, 0.15]} position={[-w / 2 + 0.2, h + 0.065, -0.05]} material={materials.linen} rotation={[0, 0.25, 0]} />
      <Cyl radius={0.06} height={0.015} position={[w / 2 - 0.16, h + 0.008, -d / 2 + 0.16]} material={materials.steel} />
      <Cyl radius={0.007} height={0.22} position={[w / 2 - 0.16, h + 0.12, -d / 2 + 0.16]} material={materials.steel} />
      <WashiShade size={[0.2, 0.16, 0.2]} position={[w / 2 - 0.16, h + 0.3, -d / 2 + 0.16]} power={1.4} />
    </group>
  )
}
