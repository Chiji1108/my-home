import { materials } from '../materials'
import { Block, Cyl, Soft } from '../parts'
import type { PieceProps } from './types'

// Seats face +z; backrests are at -z.

export function WorkChair({ size: [w, d, h] }: PieceProps) {
  const seat = 0.46
  return (
    <group>
      {[0, 1, 2, 3, 4].map((spoke) => (
        <Block
          key={spoke}
          size={[0.04, 0.025, w / 2]}
          position={[Math.sin((spoke * Math.PI * 2) / 5) * (w / 4), 0.05, Math.cos((spoke * Math.PI * 2) / 5) * (w / 4)]}
          rotation={[0, (spoke * Math.PI * 2) / 5, 0]}
          material={materials.steel}
        />
      ))}
      <Cyl radius={0.025} height={seat - 0.1} position={[0, (seat - 0.1) / 2 + 0.05, 0]} material={materials.steel} />
      <Soft size={[w - 0.12, 0.08, d - 0.14]} position={[0, seat, 0.02]} material={materials.charcoal} radius={0.035} />
      <Soft size={[w - 0.16, h - seat - 0.12, 0.05]} position={[0, (h + seat) / 2 + 0.04, -d / 2 + 0.08]} rotation={[-0.1, 0, 0]} material={materials.charcoal} radius={0.022} />
      <Block size={[0.05, 0.2, 0.02]} position={[0, seat + 0.1, -d / 2 + 0.07]} material={materials.steel} />
    </group>
  )
}

export function Sofa({ size: [w, d, h] }: PieceProps) {
  const arm = 0.16
  const seatWidth = (w - arm * 2) / 2
  const seatTop = 0.4
  return (
    <group>
      <Block size={[w - 0.12, 0.08, d - 0.12]} position={[0, 0.04, 0]} material={materials.oak} />
      <Soft size={[w, 0.2, d]} position={[0, 0.18, 0]} material={materials.linen} radius={0.05} />
      <Soft size={[w, h - 0.1, 0.2]} position={[0, 0.1 + (h - 0.1) / 2, -d / 2 + 0.1]} material={materials.linen} radius={0.07} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Soft size={[arm, 0.46, d]} position={[side * (w / 2 - arm / 2), 0.31, 0]} material={materials.linen} radius={0.06} />
          <Soft size={[seatWidth - 0.01, 0.14, d - 0.24]} position={[(side * seatWidth) / 2, seatTop - 0.07 + 0.02, 0.1]} material={materials.linen} radius={0.05} />
          <Soft size={[seatWidth - 0.04, 0.3, 0.14]} position={[(side * seatWidth) / 2, seatTop + 0.17, -d / 2 + 0.27]} rotation={[-0.18, 0, 0]} material={materials.cotton} radius={0.06} />
        </group>
      ))}
      <Soft size={[0.4, 0.4, 0.12]} position={[-w / 2 + arm + 0.22, seatTop + 0.2, -0.02]} rotation={[-0.35, 0.3, 0]} material={materials.terracotta} radius={0.05} />
      <Soft size={[0.36, 0.36, 0.11]} position={[w / 2 - arm - 0.2, seatTop + 0.19, 0]} rotation={[-0.35, -0.25, 0]} material={materials.olive} radius={0.05} />
    </group>
  )
}

export function DiningChair({ size: [w, d, h] }: PieceProps) {
  const seat = 0.45
  const leg = 0.016
  return (
    <group>
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <Cyl radius={leg} height={seat} position={[sx * (w / 2 - 0.05), seat / 2, d / 2 - 0.06]} material={materials.oak} />
          <Cyl radius={leg} height={h} position={[sx * (w / 2 - 0.05), h / 2, -d / 2 + 0.05]} material={materials.oak} />
        </group>
      ))}
      <Soft size={[w, 0.035, d - 0.04]} position={[0, seat, 0.02]} material={materials.oak} radius={0.015} />
      <Soft size={[w - 0.06, 0.025, d - 0.1]} position={[0, seat + 0.025, 0.03]} material={materials.linen} radius={0.011} />
      <Soft size={[w, 0.11, 0.022]} position={[0, h - 0.07, -d / 2 + 0.05]} material={materials.oak} radius={0.01} />
    </group>
  )
}
