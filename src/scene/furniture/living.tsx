import { useState } from 'react'
import { Object3D } from 'three'
import { light } from '../../plan/palette'
import { CEILING } from '../../plan/plan'
import { materials } from '../materials'
import { Block, Cyl, Soft, WashiShade } from '../parts'
import { useSceneState } from '../SceneState'
import type { PieceProps } from './types'

export function CoffeeTable({ size: [w, d, h] }: PieceProps) {
  const slab = 0.045
  return (
    <group>
      <Soft size={[w, slab, d]} position={[0, h - slab / 2, 0]} material={materials.oak} radius={0.012} />
      {[-1, 1].map((side) => (
        <Block key={side} size={[0.05, h - slab, d - 0.12]} position={[side * (w / 2 - 0.14), (h - slab) / 2, 0]} material={materials.oak} />
      ))}
      <Block size={[0.26, 0.025, 0.19]} position={[-0.2, h + 0.0125, 0.02]} rotation={[0, 0.15, 0]} material={materials.linen} />
      <Cyl radius={0.06} height={0.1} topRadius={0.045} position={[0.25, h + 0.05, -0.03]} material={materials.terracotta} />
    </group>
  )
}

export function DiningTable({ size: [w, , h] }: PieceProps) {
  const top = 0.035
  return (
    <group>
      <Cyl radius={w / 2} height={top} position={[0, h - top / 2, 0]} material={materials.oak} />
      <Cyl radius={0.055} height={h - top} position={[0, (h - top) / 2, 0]} material={materials.steel} />
      <Cyl radius={w * 0.28} height={0.02} position={[0, 0.01, 0]} material={materials.steel} />
      <Cyl radius={0.11} height={0.07} topRadius={0.15} position={[0, h + 0.035, 0]} material={materials.porcelain} />
    </group>
  )
}

/** Height of the shade's underside above the floor. */
const PENDANT_CLEARANCE = 1.5

export function Pendant({ size }: PieceProps) {
  const shadeTop = PENDANT_CLEARANCE + size[2]
  const cord = CEILING - shadeTop
  return (
    <group>
      <Cyl radius={0.004} height={cord} position={[0, shadeTop + cord / 2, 0]} material={materials.steel} />
      <Cyl radius={0.05} height={0.02} position={[0, CEILING - 0.01, 0]} material={materials.steel} />
      <WashiShade size={[size[0], size[2], size[1]]} position={[0, PENDANT_CLEARANCE + size[2] / 2, 0]} power={7} castShadow />
    </group>
  )
}

/** A recessed ceiling light: no visible fixture, only a cone of light in the evening. */
export function Downlight({ size }: PieceProps) {
  const { night } = useSceneState()
  const [target] = useState(() => new Object3D())
  if (!night) return null
  return (
    <>
      <primitive object={target} />
      <spotLight
        castShadow
        position={[0, size[2], 0]}
        target={target}
        color={light.lamp}
        intensity={8}
        angle={1.1}
        penumbra={1}
        distance={6}
        decay={2}
        shadow-mapSize={[1024, 1024]}
        // The tops of the walls are nearer than the default near plane.
        shadow-camera-near={0.1}
        shadow-bias={-0.0005}
      />
    </>
  )
}

// Fiddle-leaf fig: large upright leaves spiralling up a bare trunk.
export function Plant({ size: [w, , h] }: PieceProps) {
  const pot = Math.min(0.42, h * 0.25)
  const leaves = 16
  return (
    <group>
      <Cyl radius={w * 0.3} topRadius={w * 0.4} height={pot} position={[0, pot / 2, 0]} material={materials.terracotta} />
      <Cyl radius={w * 0.37} height={0.02} position={[0, pot - 0.02, 0]} material={materials.walnut} />
      <Cyl radius={0.018} height={h - pot - 0.2} position={[0, pot + (h - pot - 0.2) / 2, 0]} material={materials.walnut} />
      {Array.from({ length: leaves }, (_, i) => {
        const along = i / (leaves - 1)
        const turn = i * 2.4
        const y = pot + (h - pot) * (0.35 + along * 0.62)
        const reach = w * (0.42 - along * 0.2)
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.sin(turn) * reach, y, Math.cos(turn) * reach]}
            rotation={[0.9 - along * 0.5, turn, 0, 'YXZ']}
            scale={[w * 0.22, 0.012, w * 0.34]}
            material={materials.leaf}
          >
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        )
      })}
    </group>
  )
}
