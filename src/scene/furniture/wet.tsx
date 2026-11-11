import { materials } from '../materials'
import { Block, Cyl, Soft } from '../parts'
import type { PieceProps } from './types'

export function Bathtub({ size: [w, d, h] }: PieceProps) {
  return (
    <group>
      <Soft size={[w, h, d]} position={[0, h / 2, 0]} material={materials.porcelain} radius={0.05} />
      <Soft size={[w - 0.16, 0.02, d - 0.16]} position={[0, h - 0.008, 0]} material={materials.water} radius={0.008} />
    </group>
  )
}

// Faces +z; the tank is at the back.
export function Toilet({ size: [w, d, h] }: PieceProps) {
  const seat = 0.42
  return (
    <group>
      <Soft size={[w, h, 0.18]} position={[0, h / 2, -d / 2 + 0.09]} material={materials.porcelain} radius={0.03} />
      <Soft size={[w - 0.04, seat, d - 0.2]} position={[0, seat / 2, 0.08]} material={materials.porcelain} radius={0.08} />
      <Soft size={[w - 0.03, 0.03, d - 0.2]} position={[0, seat + 0.015, 0.08]} material={materials.porcelain} radius={0.012} />
    </group>
  )
}

export function Vanity({ size: [w, d, h] }: PieceProps) {
  const mirror = 0.8
  return (
    <group>
      <Block size={[w, h - 0.04, d - 0.02]} position={[0, (h - 0.04) / 2, -0.01]} material={materials.oak} />
      <Block size={[w, 0.04, d]} position={[0, h - 0.02, 0]} material={materials.porcelain} />
      <Cyl radius={0.17} height={0.006} position={[0, h + 0.003, 0.04]} material={materials.stone} />
      <Cyl radius={0.012} height={0.16} position={[0, h + 0.08, -d / 2 + 0.1]} material={materials.stainless} />
      <Block size={[0.02, 0.02, 0.12]} position={[0, h + 0.15, -d / 2 + 0.15]} material={materials.stainless} />
      <Block size={[w, mirror, 0.13]} position={[0, 1.1 + mirror / 2, -d / 2 + 0.065]} material={materials.panel} />
      <Block size={[w - 0.02, mirror - 0.02, 0.004]} position={[0, 1.1 + mirror / 2, -d / 2 + 0.132]} material={materials.mirror} />
    </group>
  )
}

// Front-loading drum on the waterproof pan.
export function WashingMachine({ size: [w, d, h] }: PieceProps) {
  const pan = 0.06
  return (
    <group>
      <Block size={[w + 0.06, pan, d + 0.04]} position={[0, pan / 2, 0]} material={materials.stone} />
      <Soft size={[w - 0.04, h - pan, d - 0.04]} position={[0, pan + (h - pan) / 2, 0]} material={materials.porcelain} radius={0.03} />
      <Cyl radius={0.19} height={0.03} position={[0, pan + (h - pan) * 0.48, d / 2 - 0.02]} rotation={[Math.PI / 2, 0, 0]} material={materials.charcoal} />
    </group>
  )
}
