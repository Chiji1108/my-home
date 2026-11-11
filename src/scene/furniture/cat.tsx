import { materials } from '../materials'
import { Block, Cyl, Soft } from '../parts'
import type { PieceProps } from './types'

const QUARTER = Math.PI / 2

/** A round opening on a face that looks along +z. */
function Entry({ radius, position }: { radius: number; position: readonly [number, number, number] }) {
  return (
    <group position={[position[0], position[1], position[2]]}>
      <Cyl radius={radius + 0.02} height={0.012} position={[0, 0, 0]} rotation={[QUARTER, 0, 0]} material={materials.linen} />
      <Cyl radius={radius} height={0.014} position={[0, 0, 0]} rotation={[QUARTER, 0, 0]} material={materials.charcoal} />
    </group>
  )
}

// Hooded litter box; the entry is at the front (+z).
export function CatLitter({ size: [w, d, h] }: PieceProps) {
  const tray = 0.16
  return (
    <group>
      <Soft size={[w, tray, d]} position={[0, tray / 2, 0]} material={materials.linen} radius={0.04} />
      <Soft size={[w - 0.02, h - tray + 0.04, d - 0.02]} position={[0, (h + tray) / 2 - 0.02, 0]} material={materials.cotton} radius={0.08} />
      <Entry radius={0.1} position={[0, tray + 0.12, d / 2 - 0.012]} />
      <Soft size={[0.14, 0.02, 0.04]} position={[0, h + 0.005, 0]} material={materials.linen} radius={0.008} />
    </group>
  )
}

export function CatFood({ size: [w, d, h] }: PieceProps) {
  const board = 0.02
  const bowl = 0.045
  return (
    <group>
      <Soft size={[w, board, d]} position={[0, h - board / 2, 0]} material={materials.oak} radius={0.008} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block size={[0.03, h - board, d - 0.04]} position={[side * (w / 2 - 0.06), (h - board) / 2, 0]} material={materials.oak} />
          <Cyl radius={0.05} topRadius={0.07} height={bowl} position={[side * 0.12, h + bowl / 2, 0]} material={materials.porcelain} />
          <Cyl
            radius={0.06}
            height={0.004}
            position={[side * 0.12, h + bowl, 0]}
            material={side < 0 ? materials.walnut : materials.water}
          />
        </group>
      ))}
    </group>
  )
}

function SittingCat({ position }: { position: readonly [number, number, number] }) {
  const fur = materials.charcoal
  return (
    <group position={[position[0], position[1], position[2]]}>
      <mesh castShadow position={[0, 0.1, 0]} scale={[0.08, 0.11, 0.1]} material={fur}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      <mesh castShadow position={[0, 0.235, 0.05]} scale={0.058} material={fur}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 0.034, 0.295, 0.045]} material={fur}>
          <coneGeometry args={[0.02, 0.045, 4]} />
        </mesh>
      ))}
      <Cyl radius={0.014} height={0.2} position={[0.07, 0.016, -0.03]} rotation={[QUARTER, 0, 0.5]} material={fur} />
    </group>
  )
}

// Cat tree: a hideout and three felt platforms that step up around the base.
export function CatTower({ size: [w, d, h] }: PieceProps) {
  const base = 0.05
  const felt = 0.035
  const post = 0.045
  const hideout = 0.32
  const corner = w / 2 - 0.13
  const platform = (x: number, z: number, top: number) => (
    <Soft size={[0.34, felt, 0.34]} position={[x, top - felt / 2, z]} material={materials.cotton} radius={0.015} />
  )
  const low = 0.75
  const mid = 1.1
  return (
    <group>
      <Soft size={[w, base, d]} position={[0, base / 2, 0]} material={materials.cotton} radius={0.02} />

      <Soft size={[hideout, hideout, hideout]} position={[-corner, base + hideout / 2, -corner]} material={materials.linen} radius={0.03} />
      <Entry radius={0.09} position={[-corner, base + hideout / 2, -corner + hideout / 2 - 0.004]} />

      <Cyl radius={post} height={low - felt - base} position={[corner, (low - felt + base) / 2, corner]} material={materials.wool} />
      {platform(corner - 0.04, corner - 0.04, low)}

      <Cyl radius={post} height={mid - felt - base - hideout} position={[-corner, (mid - felt + base + hideout) / 2, -corner]} material={materials.oak} />
      {platform(-corner + 0.04, -corner + 0.04, mid)}

      <Cyl radius={post} height={h - felt - base} position={[corner, (h - felt + base) / 2, -corner]} material={materials.oak} />
      {platform(corner - 0.04, -corner + 0.04, h)}

      <SittingCat position={[corner - 0.04, h, -corner + 0.04]} />
    </group>
  )
}
