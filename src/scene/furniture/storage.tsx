import type { ReactNode } from 'react'
import type { Material } from 'three'
import { materials } from '../materials'
import { Block, Cyl } from '../parts'
import type { PieceProps } from './types'

const BOARD = 0.022

// Open shelving. `fill` draws what stands on each board, given the board's
// top height and the clear height above it.
function Shelving({
  size: [w, d, h],
  levels,
  fill,
}: PieceProps & { levels: number; fill: (level: number, top: number, clear: number) => ReactNode }) {
  const pitch = (h - BOARD) / levels
  return (
    <group>
      {[-1, 1].map((side) => (
        <Block key={side} size={[BOARD, h, d]} position={[side * (w / 2 - BOARD / 2), h / 2, 0]} material={materials.oak} />
      ))}
      {Array.from({ length: levels + 1 }, (_, level) => (
        <group key={level}>
          <Block size={[w - BOARD * 2, BOARD, d]} position={[0, level * pitch + BOARD / 2, 0]} material={materials.oak} />
          {level < levels && fill(level, level * pitch + BOARD, pitch - BOARD)}
        </group>
      ))}
    </group>
  )
}

const spines = [materials.linen, materials.olive, materials.charcoal, materials.terracotta, materials.cotton, materials.walnut]

function BookRow({ width, top, clear, depth, seed }: { width: number; top: number; clear: number; depth: number; seed: number }) {
  const books: ReactNode[] = []
  let x = -width / 2
  for (let i = 0; x < width / 2 - 0.05; i++) {
    const pick = (i * 7 + seed * 13) % 11
    const thickness = 0.022 + (pick % 4) * 0.008
    const height = clear * (0.62 + (pick % 5) * 0.06)
    // Leave a gap now and then so the row does not read as a solid block.
    if (pick !== 3) {
      books.push(
        <Block
          key={i}
          size={[thickness - 0.002, height, depth * 0.72]}
          position={[x + thickness / 2, top + height / 2, 0]}
          material={spines[pick % spines.length]!}
        />,
      )
    }
    x += pick === 3 ? 0.12 : thickness
  }
  return <>{books}</>
}

export function DisplayShelf({ size }: PieceProps) {
  const [w, d] = size
  const displays: ReactNode[] = [
    <BookRow key="books" width={w * 0.5} top={0} clear={0.26} depth={d} seed={2} />,
    <>
      <Cyl radius={0.07} height={0.2} topRadius={0.04} position={[-w / 4, 0.1, 0]} material={materials.terracotta} />
      <Block size={[0.24, 0.04, 0.18]} position={[w / 5, 0.02, 0]} material={materials.linen} />
      <Block size={[0.2, 0.035, 0.16]} position={[w / 5, 0.058, 0]} material={materials.olive} />
    </>,
    <>
      <Block size={[0.3, 0.22, 0.02]} position={[-w / 6, 0.11, -d / 2 + 0.04]} rotation={[-0.12, 0, 0]} material={materials.walnut} />
      <Cyl radius={0.05} height={0.12} position={[w / 4, 0.06, 0]} material={materials.porcelain} />
    </>,
    <>
      <Cyl radius={0.06} height={0.1} position={[0, 0.05, 0]} material={materials.steel} />
      <mesh position={[0, 0.2, 0]} scale={[0.11, 0.13, 0.11]} material={materials.leaf} castShadow>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
    </>,
  ]
  return (
    <Shelving
      size={size}
      levels={4}
      fill={(level, top) => <group position={[0, top, 0]}>{displays[level]}</group>}
    />
  )
}

// A closed cabinet with a pair of doors on the front (+z).
function Cabinet({ size: [w, d, h], doors }: PieceProps & { doors: Material }) {
  return (
    <group>
      <Block size={[w, h, d - 0.02]} position={[0, h / 2, -0.01]} material={materials.panel} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block size={[w / 2, h - 0.012, 0.02]} position={[(side * w) / 4, h / 2, d / 2 - 0.01]} material={doors} />
          <Block size={[0.012, Math.min(0.3, h * 0.3), 0.012]} position={[side * 0.04, Math.min(1.0, h * 0.72), d / 2 + 0.006]} material={materials.steel} />
        </group>
      ))}
    </group>
  )
}

export const Closet = ({ size }: PieceProps) => <Cabinet size={size} doors={materials.panel} />
export const ShoeCabinet = ({ size }: PieceProps) => <Cabinet size={size} doors={materials.oak} />

export function Sideboard({ size }: PieceProps) {
  const [w, , h] = size
  return (
    <group>
      <Cabinet size={size} doors={materials.walnut} />
      <Cyl radius={0.09} height={0.06} position={[-w / 4, h + 0.03, 0]} material={materials.porcelain} />
      <Cyl radius={0.05} height={0.22} topRadius={0.03} position={[w / 4, h + 0.11, 0]} material={materials.terracotta} />
    </group>
  )
}
