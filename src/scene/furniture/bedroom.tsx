import { materials } from '../materials'
import { Block, Cyl, Soft, WashiShade } from '../parts'
import type { PieceProps } from './types'

// The headboard is at the back (-z); the foot of the bed is the front.
export function Bed({ size: [w, d, h] }: PieceProps) {
  const head = -d / 2
  const mattress = d - 0.04
  return (
    <group>
      <Block size={[w + 0.06, h, 0.04]} position={[0, h / 2, head + 0.02]} material={materials.oak} />
      <Block size={[w + 0.06, 0.2, mattress]} position={[0, 0.16, 0.02]} material={materials.oak} />
      <Soft size={[w, 0.22, mattress - 0.04]} position={[0, 0.37, 0.02]} material={materials.cotton} radius={0.06} />
      <Soft size={[w + 0.03, 0.1, mattress * 0.66]} position={[0, 0.5, d * 0.16]} material={materials.linen} radius={0.045} />
      {[-0.4, 0.4].map((x) => (
        <Soft key={x} size={[0.66, 0.13, 0.42]} position={[x, 0.54, head + 0.32]} material={materials.cotton} radius={0.06} />
      ))}
      <Soft size={[w + 0.05, 0.03, 0.55]} position={[0, 0.565, d / 2 - 0.42]} material={materials.olive} radius={0.012} />
    </group>
  )
}

export function BedsideTable({ size: [w, d, h] }: PieceProps) {
  const leg = 0.025
  return (
    <group>
      <Block size={[w, 0.03, d]} position={[0, h - 0.015, 0]} material={materials.walnut} />
      <Block size={[w - 0.06, 0.02, d - 0.06]} position={[0, 0.16, 0]} material={materials.walnut} />
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Block
            key={`${sx}${sz}`}
            size={[leg, h - 0.03, leg]}
            position={[sx * (w / 2 - leg), (h - 0.03) / 2, sz * (d / 2 - leg)]}
            material={materials.steel}
          />
        )),
      )}
      <Cyl radius={0.05} height={0.02} position={[0, h + 0.01, 0]} material={materials.steel} />
      <Cyl radius={0.008} height={0.1} position={[0, h + 0.06, 0]} material={materials.steel} />
      <WashiShade size={[0.24, 0.26, 0.24]} position={[0, h + 0.22, 0]} power={1.6} />
    </group>
  )
}

export function Rug({ size: [w, d, h] }: PieceProps) {
  return <Soft size={[w, h, d]} position={[0, h / 2 + 0.001, 0]} material={materials.wool} radius={h * 0.45} />
}

export function ClothesRack({ size: [w, d, h] }: PieceProps) {
  const garments = [materials.linen, materials.charcoal, materials.olive, materials.cotton, materials.terracotta]
  const count = Math.floor((w - 0.2) / 0.11)
  return (
    <group>
      <Block size={[w, 0.025, d]} position={[0, h, 0]} material={materials.oak} />
      <Cyl radius={0.012} height={w} position={[0, h - 0.12, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.steel} />
      {Array.from({ length: count }, (_, i) => {
        const drop = 0.75 + ((i * 7) % 4) * 0.12
        return (
          <Soft
            key={i}
            size={[0.045, drop, d - 0.1]}
            position={[-w / 2 + 0.15 + i * 0.11, h - 0.16 - drop / 2, 0]}
            material={garments[i % garments.length]!}
            radius={0.02}
          />
        )
      })}
    </group>
  )
}
