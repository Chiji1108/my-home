import { materials } from '../materials'
import { Block, Cyl, Soft } from '../parts'
import type { PieceProps } from './types'

export function Fridge({ size: [w, d, h] }: PieceProps) {
  const split = h * 0.62
  return (
    <group>
      <Block size={[w, h, d - 0.04]} position={[0, h / 2, -0.02]} material={materials.charcoal} />
      <Soft size={[w - 0.01, split - 0.01, 0.04]} position={[0, split / 2, d / 2 - 0.02]} material={materials.stainless} radius={0.012} />
      <Soft size={[w - 0.01, h - split - 0.01, 0.04]} position={[0, (h + split) / 2, d / 2 - 0.02]} material={materials.stainless} radius={0.012} />
      <Block size={[0.02, 0.4, 0.02]} position={[-w / 2 + 0.06, split - 0.3, d / 2 + 0.01]} material={materials.steel} />
      <Block size={[0.02, 0.3, 0.02]} position={[-w / 2 + 0.06, split + 0.25, d / 2 + 0.01]} material={materials.steel} />
    </group>
  )
}

// The cook stands at the front (+z). The back carries a raised wall and
// serving ledge that screen the worktop from the dining side.
export function KitchenCounter({ size: [w, d, h] }: PieceProps) {
  const screen = 0.12
  const ledgeHeight = h + 0.2
  const body = d - screen
  const bodyZ = screen / 2
  const top = 0.04
  return (
    <group>
      <Block size={[w, h - top, body - 0.02]} position={[0, (h - top) / 2, bodyZ - 0.01]} material={materials.walnut} />
      <Block size={[w, top, body]} position={[0, h - top / 2, bodyZ]} material={materials.stone} />
      <Block size={[w, ledgeHeight, screen]} position={[0, ledgeHeight / 2, -d / 2 + screen / 2]} material={materials.plaster} />
      <Block size={[w, 0.035, 0.24]} position={[0, ledgeHeight + 0.0175, -d / 2 + 0.1]} material={materials.oak} />

      <Block size={[0.72, 0.004, 0.42]} position={[w / 2 - 0.56, h + 0.002, bodyZ]} material={materials.stainless} />
      <Block size={[0.62, 0.006, 0.32]} position={[w / 2 - 0.56, h + 0.003, bodyZ]} material={materials.steel} />
      <Cyl radius={0.012} height={0.26} position={[w / 2 - 0.56, h + 0.13, bodyZ - 0.19]} material={materials.stainless} />
      <Block size={[0.02, 0.02, 0.16]} position={[w / 2 - 0.56, h + 0.25, bodyZ - 0.12]} material={materials.stainless} />

      <Block size={[0.6, 0.006, 0.5]} position={[-w / 2 + 0.42, h + 0.003, bodyZ]} material={materials.screen} />
      {(
        [
          [-0.15, 0.1],
          [0.15, 0.1],
          [0, -0.13],
        ] as const
      ).map(([x, z]) => (
        <Cyl key={x} radius={0.075} height={0.014} position={[-w / 2 + 0.42 + x, h + 0.012, bodyZ + z]} material={materials.steel} />
      ))}
    </group>
  )
}
